import { BotContext } from "./bot";
import db from "./database";
import { InlineKeyboard } from "grammy";
import { getMainMenu } from "./menus";

// Fungsi untuk ban user
export async function banUser(ctx: BotContext, userId: number) {
  db.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").run(userId);
  await ctx.reply(`User dengan ID ${userId} telah dibanned.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
}

// Fungsi untuk unban user
export async function unbanUser(ctx: BotContext, userId: number) {
  db.prepare("UPDATE users SET is_banned = 0 WHERE id = ?").run(userId);
  await ctx.reply(`User dengan ID ${userId} telah diunban.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
}

// Fungsi untuk menambahkan balance
export async function addBalance(ctx: BotContext, userId: number, amount: number) {
  if (amount <= 0) {
    await ctx.reply("Masukkan jumlah positif untuk menambahkan saldo.");
    return;
  }
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined;
  if (user && typeof user.balance === "number") {
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, userId);
    await ctx.reply(`Balance ${amount} SundX telah ditambahkan untuk user ID ${userId}.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
    try {
      await ctx.api.sendMessage(userId, `Saldo Anda telah bertambah sebesar ${amount} SundX.`);
    } catch (e) {
      console.error("Gagal mengirim notifikasi ke user:", e);
    }
  } else {
    await ctx.reply(`User dengan ID ${userId} tidak ditemukan.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  }
}

// Fungsi untuk mengurangi balance
export async function reduceBalance(ctx: BotContext, userId: number, amount: number) {
  if (amount <= 0) {
    await ctx.reply("Masukkan jumlah positif untuk mengurangi saldo.");
    return;
  }
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined;
  if (user && typeof user.balance === "number") {
    if (user.balance >= amount) {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, userId);
      await ctx.reply(`Balance ${amount} SundX telah dikurangi dari user ID ${userId}.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
      try {
        await ctx.api.sendMessage(userId, `Saldo Anda telah berkurang sebesar ${amount} SundX.`);
      } catch (e) {
        console.error("Gagal mengirim notifikasi ke user:", e);
      }
    } else {
      await ctx.reply(`User ID ${userId} tidak memiliki saldo cukup untuk mengurangi ${amount} SundX.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
    }
  } else {
    await ctx.reply(`User dengan ID ${userId} tidak ditemukan.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  }
}

// Handler untuk input admin
export async function handleAdminInput(ctx: BotContext) {
  if (!ctx.message || !ctx.message.text) return;
  const input = ctx.message.text;
  const parts = input.split(" ");
  const userId = parseInt(parts[0]);
  const amount = parts.length > 1 ? parseFloat(parts[1]) : 0;
  
  switch (ctx.session.step) {
    case "awaiting_ban_user_id":
      await banUser(ctx, userId);
      break;
    case "awaiting_unban_user_id":
      await unbanUser(ctx, userId);
      break;
    case "awaiting_add_balance":
      await addBalance(ctx, userId, amount);
      break;
    case "awaiting_reduce_balance":
      await reduceBalance(ctx, userId, amount);
      break;
    default:
      break;
  }
  ctx.session.step = undefined;
}

// Handler untuk admin menu selection
export async function handleAdminMenuSelection(ctx: BotContext) {
  const text = ctx.message?.text;
  if (!text) return;
  switch (text) {
    case "👥 Manage Users":
      await ctx.reply("Pilih tindakan:", { reply_markup: getManageUsersInlineKeyboard() });
      break;
    case "💰 Transaction Logs":
      await ctx.reply("Transaction Logs feature is under development.", { reply_markup: getMainMenu(true) });
      break;
    case "🔙 Back":
      ctx.session.activeMenu = "main";
      await ctx.reply("Kembali ke main menu:", { reply_markup: getMainMenu(true) });
      break;
    default:
      await ctx.reply("Pilih salah satu opsi:", { reply_markup: getManageUsersInlineKeyboard() });
  }
}

// Inline keyboard untuk Manage Users
export function getManageUsersInlineKeyboard() {
  return new InlineKeyboard()
    .text("🔨 Ban User", "BAN_USER")
    .text("✅ Unban User", "UNBAN_USER")
    .text("💳 Add Balance", "ADD_BALANCE")
    .text("➖ Reduce Balance", "REDUCE_BALANCE")
    .row()
    .text("🔙 Back", "ADMIN_BACK");
}
