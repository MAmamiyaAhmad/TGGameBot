import { BotContext } from "./bot";
import db from "./database";
import { InlineKeyboard } from "grammy";
import { getMainMenu } from "./menus";

// Definisikan tipe UserInfo untuk pencarian user
interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  balance: number;
  created_at: string;
  is_banned: number;
}

// Fungsi untuk mencari user berdasarkan username atau user id
export async function handleSearchUser(ctx: BotContext, query: string) {
  let user: UserInfo | undefined;
  if (/^\d+$/.test(query)) {
    user = db
      .prepare("SELECT id, first_name, last_name, username, balance, created_at, is_banned FROM users WHERE id = ?")
      .get(parseInt(query)) as UserInfo | undefined;
  } else {
    user = db
      .prepare("SELECT id, first_name, last_name, username, balance, created_at, is_banned FROM users WHERE username LIKE ?")
      .get(`%${query}%`) as UserInfo | undefined;
  }
  
  if (!user) {
    await ctx.reply("User tidak ditemukan.");
    return;
  }
  
  const downline = db
    .prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?")
    .get(user.id) as { count: number };
  
  const status = user.is_banned === 1 ? "🔴 Banned" : "🟢 Active";
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Tidak tersedia";
  const username = user.username ? `${user.username}` : "Tidak tersedia";
  
  const message = `
<b>User Information</b>
•❂•─•─•❂•─•❂••❂•─•❂•─•─•❂•

🆔 <b>Name:</b> ${fullName}
 ├ <b>🧑‍💻 Username:</b> @${username}
 ├ <b>🆔 User ID:</b> <code>${user.id}</code>
 ├ <b>💰 Balance:</b> ${user.balance} SundX
 ├ <b>🔑 Status:</b> ${status}
 ├ <b>🗓 Registered:</b> ${user.created_at}
 └ <b>👥 Downline:</b> ${downline.count}

•❂•─•─•❂•─•❂••❂•─•❂•─•─•❂•
`;

  
  await ctx.reply(message, { parse_mode: "HTML" });
}

// Fungsi-fungsi admin lainnya (ban, unban, addBalance, reduceBalance) tetap seperti sebelumnya

export async function banUser(ctx: BotContext, userId: number) {
  db.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").run(userId);
  await ctx.reply(`User dengan ID ${userId} telah dibanned.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  try {
    await ctx.api.sendMessage(userId, "Anda telah diban dan tidak dapat menggunakan bot.");
  } catch (e) {
    console.error("Gagal mengirim notifikasi ban ke user:", e);
  }
}

export async function unbanUser(ctx: BotContext, userId: number) {
  db.prepare("UPDATE users SET is_banned = 0 WHERE id = ?").run(userId);
  await ctx.reply(`User dengan ID ${userId} telah diunban.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  try {
    await ctx.api.sendMessage(userId, "Anda telah diunban dan sekarang dapat menggunakan bot.");
  } catch (e) {
    console.error("Gagal mengirim notifikasi unban ke user:", e);
  }
}

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
    case "awaiting_search_user":
      await handleSearchUser(ctx, ctx.message.text!);
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
    .text("🔍 Search User", "SEARCH_USER")
    .row()
    .text("🔨 Ban User", "BAN_USER")
    .text("✅ Unban User", "UNBAN_USER")
    .row()
    .text("💳 Add Balance", "ADD_BALANCE")
    .text("➖ Reduce Balance", "REDUCE_BALANCE")
    .row()
    .text("🔙 Back", "ADMIN_BACK");
}
