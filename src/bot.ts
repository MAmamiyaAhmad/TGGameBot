import { Bot, Context, session } from "grammy";
import dotenv from "dotenv";
import db from "./database";
import { 
  getMainMenu, 
  dashboardMenu, 
  getWithdrawInlineKeyboard, 
  handleMainMenuSelection, 
  handleDashboardSelection, 
  handleInlineCallback,
  adminMenu,
  handleAdminMenuSelection,
  handleAdminInput
} from "./menus";

dotenv.config();

interface SessionData {
  step?: string;
  withdrawAmount?: number;
  activeMenu?: string;
  role?: "user" | "admin" | "superadmin";
}

export type BotContext = Context & {
  session: SessionData;
};

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.use(session<SessionData, BotContext>({
  initial: (): SessionData => ({ step: undefined, activeMenu: "main", role: "user" })
}));

// /start command: proses referral, notifikasi, dan penentuan role
bot.command("start", async (ctx) => {
  const userId = ctx.from!.id;
  const messageText = ctx.message?.text || "";
  const parts = messageText.split(" ");
  const referrerId = parts.length > 1 ? parts[1] : undefined;
  
  const existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!existingUser) {
    db.prepare("INSERT INTO users (id, referred_by) VALUES (?, ?)").run(userId, referrerId || null);
    
    if (referrerId && referrerId !== userId.toString()) {
      db.prepare("INSERT INTO referrals (referrer_id, referred_id, earned) VALUES (?, ?, ?)").run(referrerId, userId, 500);
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(500, referrerId);
      
      try {
        await ctx.api.sendMessage(Number(referrerId), `📣 Ada referral baru! User ${userId} telah bergabung melalui referral link Anda. Bonus 500 SundX telah ditambahkan ke saldo Anda.`);
      } catch (error) {
        console.error("Gagal mengirim notifikasi ke upline:", error);
      }
      
      await ctx.reply("✅ Terima kasih telah menggunakan referral link! Upline Anda telah mendapatkan bonus referral.");
    }
  }
  
  // Tentukan role berdasarkan ADMIN_ID dan SUPER_ADMIN_ID
  const isAdmin = ctx.from!.id.toString() === process.env.ADMIN_ID || ctx.from!.id.toString() === process.env.SUPER_ADMIN_ID;
  ctx.session.role = isAdmin ? (ctx.from!.id.toString() === process.env.SUPER_ADMIN_ID ? "superadmin" : "admin") : "user";
  
  ctx.session.activeMenu = "main";
  await ctx.reply("Welcome to SundaraX Faucet Bot!", { reply_markup: getMainMenu(isAdmin) });
});

// Update last_seen setiap pesan
bot.on("message:text", async (ctx) => {
  db.prepare("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(ctx.from!.id);
  
  // Jika admin sedang memasukkan input (misalnya ban, add balance, dll)
  if ((ctx.session.role === "admin" || ctx.session.role === "superadmin") && ctx.session.step && ctx.session.step.startsWith("awaiting_")) {
    await handleAdminInput(ctx);
    return;
  }
  
  if (ctx.session.activeMenu === "dashboard") {
    if (ctx.session.step === "awaiting_withdraw_amount") {
      const amount = parseFloat(ctx.message.text);
      if (isNaN(amount)) {
        await ctx.reply("⚠️ Format salah. Masukkan angka untuk jumlah penarikan.", { reply_markup: dashboardMenu });
        ctx.session.step = undefined;
        return;
      }
      ctx.session.withdrawAmount = amount;
      await ctx.reply("📥 Pilih mata uang untuk penarikan:", { reply_markup: getWithdrawInlineKeyboard() });
      ctx.session.step = "awaiting_withdraw_currency";
      return;
    }
    await handleDashboardSelection(ctx);
    return;
  }
  
  if (ctx.session.activeMenu === "admin") {
    await handleAdminMenuSelection(ctx);
    return;
  }
  
  await handleMainMenuSelection(ctx);
});

// Callback untuk inline keyboard (deposit, withdraw, support, admin)
bot.on("callback_query:data", async (ctx) => {
  await handleInlineCallback(ctx);
  await ctx.answerCallbackQuery();
});

// /admin command: langsung masuk ke admin panel
bot.command("admin", async (ctx) => {
  if (ctx.from!.id.toString() === process.env.ADMIN_ID || ctx.from!.id.toString() === process.env.SUPER_ADMIN_ID) {
    ctx.session.activeMenu = "admin";
    await ctx.reply("🛠 Admin Panel", { reply_markup: adminMenu });
  }
});

bot.catch((err) => {
  console.error(`Error while handling update ${err.ctx.update.update_id}:`);
  console.error(err.error);
});

bot.start();
