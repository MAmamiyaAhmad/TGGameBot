import { Keyboard, InlineKeyboard } from "grammy";
import { BotContext } from "./bot";
import { handleDeposit, handleWithdraw } from "./handlers/transactions";
import db from "./database";
import { banUser, unbanUser, addBalance, reduceBalance, handleAdminInput, handleAdminMenuSelection, getManageUsersInlineKeyboard, handleSearchUser } from "./adminActions";

// ----- MAIN MENU -----
export function getMainMenu(isAdmin: boolean = false) {
  const keyboard = new Keyboard()
    .text("🏠 Dashboard")
    .text("❇️ Earn by Task")
    .row()
    .text("🎊 Daily Bonus")
    .text("🎲 Games")
    .text("ℹ️ About Us")
    .row()
    .text("📞 Support")
    .text("👬 Referral")
    .text("📊 Stats")
    .row()
    .text("❄️ Extra Menu");
  if (isAdmin) {
    keyboard.row().text("🛠 Admin Panel");
  }
  return keyboard;
}

// ----- DASHBOARD MENU -----
export const dashboardMenu = new Keyboard()
  .text("💵 Balance")
  .row()
  .text("➕ Deposit")
  .text("📤 Withdraw")
  .row()
  .text("🔙 Back");

// ----- DEPOSIT INLINE KEYBOARD -----
export function getDepositInlineKeyboard() {
  return new InlineKeyboard()
    .text("₿ BTC", "BTC")
    .text("💵 USDT", "USDT")
    .text("💎 TON", "TON")
    .text("⧫ ETH", "ETH")
    .row()
    .text("🔆 LTC", "LTC")
    .text("🐕 DOGE", "DOGE")
    .text("💵 BCH", "BCH")
    .text("⚡ DASH", "DASH")
    .row()
    .text("🔺 TRX", "TRX")
    .text("💧 XRP", "XRP")
    .text("🔷 ADA", "ADA")
    .text("⭐ XLM", "XLM");
}

// ----- WITHDRAW INLINE KEYBOARD -----
export function getWithdrawInlineKeyboard() {
  return new InlineKeyboard()
    .text("₿ BTC", "BTC")
    .text("💵 USDT", "USDT")
    .text("💎 TON", "TON")
    .row()
    .text("⧫ ETH", "ETH")
    .text("🔆 LTC", "LTC")
    .text("🐕 DOGE", "DOGE")
    .row()
    .text("➕ More Currencies", "MORE_CURRENCIES");
}

// ----- SUPPORT INLINE KEYBOARD -----
export function getSupportInlineKeyboard() {
  return new InlineKeyboard()
    .text("Create New Ticket", "NEW_TICKET")
    .text("My Ticket History", "TICKET_HISTORY")
    .text("Check Ticket ID", "CHECK_TICKET")
    .row()
    .text("🔙 Back", "SUPPORT_BACK");
}

// ----- GAMES MENU -----
export const gamesMenu = new Keyboard()
  .text("🧲 Ticket Earner")
  .text("🔫 Instant Betting")
  .row()
  .text("🎱 The 6 Out Of 36 Lottery")
  .row()
  .text("🍀 Lucky Number")
  .text("🔴 Color Prediction")
  .row()
  .text("⚔️ PvP Battle")
  .text("🏂 Hi-lo Win")
  .text("🐻 Animal Bet")
  .row()
  .text("⬅️ Back");

// ----- EXTRA MENU -----
export const extraMenu = new Keyboard()
  .text("🆕 Updates")
  .text("💎 Redeem Code")
  .text("⚙ Setting")
  .row()
  .text("📝 Give A Review")
  .text("❓ Info & Faqs")
  .row()
  .text("🌐 Change Language")
  .row()
  .text("🔙 Back");

// ----- ADMIN PANEL MENU -----
// adminMenu dideklarasikan di sini satu kali
export const adminMenu = new Keyboard()
  .text("👥 Manage Users")
  .text("💰 Transaction Logs")
  .row()
  .text("🔙 Back");

// ----- HANDLER MAIN MENU SELECTION -----
export async function handleMainMenuSelection(ctx: BotContext) {
  const text = ctx.message?.text;
  if (!text) return;
  
  switch (text) {
    case "🎊 Daily Bonus": {
      const lastBonus = db.prepare("SELECT created_at FROM transactions WHERE user_id = ? AND type = 'bonus' ORDER BY created_at DESC LIMIT 1")
        .get(ctx.from!.id) as { created_at: string } | undefined;
      if (lastBonus && (Date.now() - new Date(lastBonus.created_at).getTime()) < 86400000) {
        await ctx.reply("⏳ Anda sudah mengambil bonus hari ini, kembali dalam 24 jam!", { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
        return;
      }
      const bonusAmount = 100;
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(bonusAmount, ctx.from!.id);
      db.prepare("INSERT INTO transactions (user_id, type, amount) VALUES (?, 'bonus', ?)")
        .run(ctx.from!.id, bonusAmount);
      await ctx.reply(`🎉 Anda mendapatkan bonus harian 100 SundX!`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
      break;
    }
    case "🎲 Games": {
      await ctx.reply("🎮 Pilih permainan:", { reply_markup: gamesMenu });
      break;
    }
    case "👬 Referral": {
      const referralCode = `https://t.me/${ctx.me.username}?start=${ctx.from!.id}`;
      const referrals = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?")
        .get(ctx.from!.id) as { count: number };
      await ctx.reply(
        `📨 Referral Link:\n<code>${referralCode}</code>\n\n👥 Total Referral: ${referrals.count || 0}\n💰 Bonus per Referral: 500 SundX`,
        { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin"), parse_mode: "HTML" }
      );
      break;
    }
    case "📊 Stats": {
      const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
      const totalUsers24 = db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-1 day')").get() as { count: number };
      const userOnline = db.prepare("SELECT COUNT(*) as count FROM users WHERE last_seen >= datetime('now', '-10 minutes')").get() as { count: number };
      const launchDate = new Date("2023-07-23");
      const today = new Date();
      const onlineDay = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 3600 * 24)) + 1;
      
      await ctx.reply(
        `📈 System Status\n` +
        `•❂•─•─•❂•─•❂••❂•─•❂•─•─•❂•\n\n` +
        `📊 Stats:\n` +
        `├ 👥 <b>Total Users:</b> ${totalUsers.count}\n` +
        `├ 🕒 <b>Total Users (24h):</b> ${totalUsers24.count}\n` +
        `├ 💻 <b>User Online:</b> ${userOnline.count}\n` +
        `└ 📆 <b>Online Day:</b> ${onlineDay}\n\n` +
        `•❂•─•─•❂•─•❂••❂•─•❂•─•─•❂•\n` +
        `🟢 System Status: Operational`,
        { parse_mode: "HTML", reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") }
      );
      break;
    }
    case "❄️ Extra Menu": {
      await ctx.reply("⚙️ Fitur tambahan:", { reply_markup: extraMenu });
      break;
    }
    case "🏠 Dashboard": {
      ctx.session.activeMenu = "dashboard";
      await ctx.reply("📋 Selamat datang di My Dashboard!", { reply_markup: dashboardMenu });
      break;
    }
    case "📞 Support": {
      await ctx.reply("📞 Choose Option From Below Button.\n\n➡️ When Our Admins Come Online Then He'll Reply You Please Wait...", { reply_markup: getSupportInlineKeyboard() });
      break;
    }
    case "ℹ️ About Us": {
      await ctx.reply("ℹ️ About Us:\nKami adalah perusahaan yang berfokus pada pengembangan solusi digital inovatif untuk meningkatkan pengalaman pengguna. Terima kasih telah bergabung dengan kami!", { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
      break;
    }
    case "🛠 Admin Panel": {
      ctx.session.activeMenu = "admin";
      await ctx.reply("🛠 Admin Panel", { reply_markup: adminMenu });
      break;
    }
    default:
      await ctx.reply("Pilih salah satu opsi:", { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  }
}

// ----- HANDLER DASHBOARD MENU SELECTION -----
export async function handleDashboardSelection(ctx: BotContext) {
  const text = ctx.message?.text;
  if (!text) return;
  
  switch (text) {
    case "💵 Balance": {
      const user = db.prepare("SELECT balance FROM users WHERE id = ?")
        .get(ctx.from!.id) as { balance: number } | undefined;
      await ctx.reply(`💰 Current Balance: ${user?.balance || 0} SundX`, { reply_markup: dashboardMenu });
      break;
    }
    case "➕ Deposit": {
      await ctx.reply(
        "💳 Top-Up your Wallet using crypto!\n\nℹ️ All deposits will be converted to SundX at current market value.\n\n👇🏻 Press the buttons below to generate a unique deposit address:",
        { reply_markup: getDepositInlineKeyboard() }
      );
      ctx.session.step = "awaiting_deposit_currency";
      break;
    }
    case "📤 Withdraw": {
      await ctx.reply("Masukkan jumlah penarikan:", { reply_markup: dashboardMenu });
      ctx.session.step = "awaiting_withdraw_amount";
      break;
    }
    case "🔙 Back": {
      ctx.session.activeMenu = "main";
      await ctx.reply("Kembali ke menu utama:", { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
      break;
    }
    default:
      await ctx.reply("Pilih salah satu opsi:", { reply_markup: dashboardMenu });
  }
}

// ----- HANDLER INLINE CALLBACK -----
export async function handleInlineCallback(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;
  
  if (data === "MORE_CURRENCIES") {
    const moreCurrencies = new InlineKeyboard()
      .text("💵 BCH", "BCH")
      .text("⚡ DASH", "DASH")
      .text("🔺 TRX", "TRX")
      .row()
      .text("💧 XRP", "XRP")
      .text("🔷 ADA", "ADA")
      .text("⭐ XLM", "XLM")
      .row()
      .text("🔙 Back", "BACK");
    await ctx.editMessageText("🔄 Mata uang tambahan:", { reply_markup: moreCurrencies });
    return;
  }
  
  if (data === "BACK") {
    if (ctx.session.step === "awaiting_deposit_currency") {
      await ctx.editMessageText(
        "💳 Top-Up your Wallet using crypto!\n\nℹ️ All deposits will be converted to SundX at current market value.\n\n👇🏻 Press the buttons below to generate a unique deposit address:",
        { reply_markup: getDepositInlineKeyboard() }
      );
    } else if (ctx.session.step === "awaiting_withdraw_currency") {
      await ctx.editMessageText("📥 Pilih mata uang untuk penarikan:", { reply_markup: getWithdrawInlineKeyboard() });
    }
    return;
  }
  
  if (data === "SUPPORT_BACK") {
    await ctx.editMessageText(
      "📞 Choose Option From Below Button.\n\n➡️ When Our Admins Come Online Then He'll Reply You Please Wait...",
      { reply_markup: getSupportInlineKeyboard() }
    );
    return;
  }
  
  // Admin actions
  if (data === "BAN_USER") {
    ctx.session.step = "awaiting_ban_user_id";
    await ctx.reply("Masukkan ID User yang ingin dibanned:");
    return;
  }
  if (data === "UNBAN_USER") {
    ctx.session.step = "awaiting_unban_user_id";
    await ctx.reply("Masukkan ID User yang ingin diunban:");
    return;
  }
  if (data === "ADD_BALANCE") {
    ctx.session.step = "awaiting_add_balance";
    await ctx.reply("Masukkan ID User dan jumlah untuk menambahkan saldo (contoh: 12345 100):");
    return;
  }
  if (data === "REDUCE_BALANCE") {
    ctx.session.step = "awaiting_reduce_balance";
    await ctx.reply("Masukkan ID User dan jumlah untuk mengurangi saldo (contoh: 12345 50):");
    return;
  }
  if (data === "SEARCH_USER") {
    ctx.session.step = "awaiting_search_user";
    await ctx.reply("Masukkan username atau user ID untuk mencari:");
    return;
  }
  if (data === "ADD_ADMIN") {
    ctx.session.step = "awaiting_add_admin";
    await ctx.reply("Masukkan ID User yang akan dijadikan admin:");
    return;
  }
  if (data === "REMOVE_ADMIN") {
    ctx.session.step = "awaiting_remove_admin";
    await ctx.reply("Masukkan ID User yang status admin-nya akan dicabut:");
    return;
  }
  if (data === "SEARCH_USER") {
    ctx.session.step = "awaiting_search_user";
    await ctx.reply("Masukkan username atau user ID untuk mencari:");
    return;
  }  
  
  if (ctx.session.step === "awaiting_deposit_currency") {
    await handleDeposit(ctx, data);
    ctx.session.step = undefined;
    return;
  }
  
  if (ctx.session.step === "awaiting_withdraw_currency") {
    const amount = ctx.session.withdrawAmount;
    if (amount) {
      await handleWithdraw(ctx, data, amount);
    }
    ctx.session.withdrawAmount = undefined;
    ctx.session.step = undefined;
    return;
  }
  
  if (ctx.session.step === "awaiting_search_user") {
    const query = ctx.message!.text;
    if (!query) {
      await ctx.reply("Masukkan query yang valid untuk pencarian.");
      return;
    }
    await handleSearchUser(ctx, query);
    ctx.session.step = undefined;
    return;
  }  
}

// ----- EXPORT ADMIN ACTIONS -----
export { handleAdminInput, handleAdminMenuSelection, getManageUsersInlineKeyboard };
