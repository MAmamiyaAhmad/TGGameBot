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

// Middleware: Jika user diban, hentikan update dan beri notifikasi.
bot.use(async (ctx, next) => {
  if (ctx.from && ctx.from.id) {
    const user = db
      .prepare("SELECT is_banned FROM users WHERE id = ?")
      .get(ctx.from.id) as { is_banned: number } | undefined;
    if (user && user.is_banned === 1) {
      await ctx.reply("Anda telah diban dan tidak dapat menggunakan bot.");
      return;
    }
  }
  await next();
});

bot.command("start", async (ctx) => {
  const userId = ctx.from!.id;
  const messageText = ctx.message?.text || "";
  const parts = messageText.split(" ");
  const referrerId = parts.length > 1 ? parts[1] : undefined;
  
  let existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!existingUser) {
    // Save additional details (first_name, last_name, username)
    db.prepare(
      "INSERT INTO users (id, referred_by, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, referrerId || null, ctx.from!.first_name, ctx.from!.last_name, ctx.from!.username);
    
    existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    
    if (referrerId && referrerId !== userId.toString()) {
      db.prepare("INSERT INTO referrals (referrer_id, referred_id, earned) VALUES (?, ?, ?)")
        .run(referrerId, userId, 500);
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
        .run(500, referrerId);
      try {
        await ctx.api.sendMessage(Number(referrerId), `📣 A new referral! User ${userId} has joined using your referral link. Bonus 500 SundX has been added to your balance.`);
      } catch (error) {
        console.error("Failed to send referral notification:", error);
      }
      await ctx.reply("✅ Thank you for using the referral link! Your upline has received a referral bonus.");
    }
  }
  
  // Check admin status from the database
  const dbUser = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(userId) as { is_admin: number } | undefined;
  // A user is admin if their 'is_admin' flag is 1 or if they are the predefined admin/super admin
  const isAdmin = (dbUser && dbUser.is_admin === 1) ||
                  ctx.from!.id.toString() === process.env.ADMIN_ID ||
                  ctx.from!.id.toString() === process.env.SUPER_ADMIN_ID;
  ctx.session.role = isAdmin
    ? (ctx.from!.id.toString() === process.env.SUPER_ADMIN_ID ? "superadmin" : "admin")
    : "user";
  
  ctx.session.activeMenu = "main";
  await ctx.reply("Welcome to SundaraX Faucet Bot!", { reply_markup: getMainMenu(isAdmin) });
});

bot.on("message:text", async (ctx) => {
  db.prepare("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(ctx.from!.id);
  
  // Jika admin sedang memasukkan input untuk admin actions
  if ((ctx.session.role === "admin" || ctx.session.role === "superadmin") &&
      ctx.session.step && ctx.session.step.startsWith("awaiting_")) {
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

bot.on("callback_query:data", async (ctx) => {
  await handleInlineCallback(ctx);
  await ctx.answerCallbackQuery();
});

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
