import { BotContext } from "./bot";
import db from "./database";
import { InlineKeyboard } from "grammy";
import { getMainMenu } from "./menus";
import { log } from "./logger";

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  balance: number;
  created_at: string;
  is_banned: number;
}

// Fungsi untuk ban user
export async function banUser(ctx: BotContext, userId: number) {
  db.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").run(userId);
  log(`Admin ${ctx.from!.id} membanned user ${userId}`);
  await ctx.reply(`User dengan ID ${userId} telah dibanned.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  try {
    await ctx.api.sendMessage(userId, "Anda telah diban dan tidak dapat menggunakan bot.");
    log(`Notifikasi ban dikirim ke user ${userId}`);
  } catch (e) {
    log(`Gagal mengirim notifikasi ban ke user ${userId}: ${e}`);
  }
}

// Fungsi untuk unban user
export async function unbanUser(ctx: BotContext, userId: number) {
  db.prepare("UPDATE users SET is_banned = 0 WHERE id = ?").run(userId);
  log(`Admin ${ctx.from!.id} mengunban user ${userId}`);
  await ctx.reply(`User dengan ID ${userId} telah diunban.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  try {
    await ctx.api.sendMessage(userId, "Anda telah diunban dan sekarang dapat menggunakan bot.");
    log(`Notifikasi unban dikirim ke user ${userId}`);
  } catch (e) {
    log(`Gagal mengirim notifikasi unban ke user ${userId}: ${e}`);
  }
}

// Fungsi untuk menambahkan balance (hanya menerima jumlah positif)
export async function addBalance(ctx: BotContext, userId: number, amount: number) {
  if (amount <= 0) {
    await ctx.reply("Masukkan jumlah positif untuk menambahkan saldo.");
    return;
  }
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined;
  if (user && typeof user.balance === "number") {
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, userId);
    log(`Admin ${ctx.from!.id} menambahkan ${amount} SundX ke user ${userId}`);
    await ctx.reply(`Balance ${amount} SundX telah ditambahkan untuk user ID ${userId}.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
    try {
      await ctx.api.sendMessage(userId, `Saldo Anda telah bertambah sebesar ${amount} SundX.`);
      log(`Notifikasi penambahan saldo dikirim ke user ${userId}`);
    } catch (e) {
      log(`Gagal mengirim notifikasi penambahan saldo ke user ${userId}: ${e}`);
    }
  } else {
    await ctx.reply(`User dengan ID ${userId} tidak ditemukan.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  }
}

// Fungsi untuk mengurangi balance (hanya menerima jumlah positif)
export async function reduceBalance(ctx: BotContext, userId: number, amount: number) {
  if (amount <= 0) {
    await ctx.reply("Masukkan jumlah positif untuk mengurangi saldo.");
    return;
  }
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined;
  if (user && typeof user.balance === "number") {
    if (user.balance >= amount) {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, userId);
      log(`Admin ${ctx.from!.id} mengurangi ${amount} SundX dari user ${userId}`);
      await ctx.reply(`Balance ${amount} SundX telah dikurangi dari user ID ${userId}.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
      try {
        await ctx.api.sendMessage(userId, `Saldo Anda telah berkurang sebesar ${amount} SundX.`);
        log(`Notifikasi pengurangan saldo dikirim ke user ${userId}`);
      } catch (e) {
        log(`Gagal mengirim notifikasi pengurangan saldo ke user ${userId}: ${e}`);
      }
    } else {
      await ctx.reply(`User ID ${userId} tidak memiliki saldo cukup untuk mengurangi ${amount} SundX.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
    }
  } else {
    await ctx.reply(`User dengan ID ${userId} tidak ditemukan.`, { reply_markup: getMainMenu(ctx.session.role === "admin" || ctx.session.role === "superadmin") });
  }
}

// Fungsi untuk menambahkan admin (hanya bisa dilakukan oleh super admin)
export async function addAdmin(ctx: BotContext, userId: number) {
  if (ctx.from!.id.toString() !== process.env.SUPER_ADMIN_ID) {
    await ctx.reply("Hanya super admin yang dapat melakukan tindakan ini.");
    return;
  }
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(userId);
  log(`Super admin ${ctx.from!.id} menambahkan admin: user ${userId}`);
  await ctx.reply(`User dengan ID ${userId} telah dijadikan admin.`, { reply_markup: getMainMenu(true) });
  try {
    await ctx.api.sendMessage(userId, "Anda telah ditetapkan sebagai admin. Selamat!");
    log(`Notifikasi add admin dikirim ke user ${userId}`);
  } catch (e) {
    log(`Gagal mengirim notifikasi add admin ke user ${userId}: ${e}`);
  }
}

// Fungsi untuk menghapus admin (hanya bisa dilakukan oleh super admin)
export async function removeAdmin(ctx: BotContext, userId: number) {
  if (ctx.from!.id.toString() !== process.env.SUPER_ADMIN_ID) {
    await ctx.reply("Hanya super admin yang dapat melakukan tindakan ini.");
    return;
  }
  db.prepare("UPDATE users SET is_admin = 0 WHERE id = ?").run(userId);
  log(`Super admin ${ctx.from!.id} menghapus admin: user ${userId}`);
  await ctx.reply(`Status admin user dengan ID ${userId} telah dicabut.`, { reply_markup: getMainMenu(true) });
  try {
    await ctx.api.sendMessage(userId, "Status admin Anda telah dicabut.");
    log(`Notifikasi remove admin dikirim ke user ${userId}`);
  } catch (e) {
    log(`Gagal mengirim notifikasi remove admin ke user ${userId}: ${e}`);
  }
}

// Fungsi untuk mencari user berdasarkan username atau user id
export async function handleSearchUser(ctx: BotContext, query: string) {
  let user: UserInfo | undefined;
  if (/^\d+$/.test(query)) {
    user = db.prepare("SELECT id, first_name, last_name, username, balance, created_at, is_banned FROM users WHERE id = ?")
      .get(parseInt(query)) as UserInfo | undefined;
  } else {
    user = db.prepare("SELECT id, first_name, last_name, username, balance, created_at, is_banned FROM users WHERE username LIKE ?")
      .get(`%${query}%`) as UserInfo | undefined;
  }
  
  if (!user) {
    await ctx.reply("User tidak ditemukan.");
    return;
  }
  
  const downline = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?")
    .get(user.id) as { count: number };
  
  const status = user.is_banned === 1 ? "🔴 Banned" : "🟢 Active";
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Tidak tersedia";
  const username = user.username ? `@${user.username}` : "Tidak tersedia";
  
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

// Handler untuk input admin (termasuk search, add/remove admin)
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
    case "awaiting_add_admin":
      await addAdmin(ctx, userId);
      break;
    case "awaiting_remove_admin":
      await removeAdmin(ctx, userId);
      break;
    case "awaiting_search_user":
      await handleSearchUser(ctx, ctx.message.text);
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
      case "👥 Manage Users": {
        const menuMessage = `
  <b>👥 User Management Tools</b>  
  •❂•─•─•❂•─•❂••❂•─•❂•─•─•❂•

  🔨 <b>Ban User</b> - Blokir akses pengguna
  ✅ <b>Unban User</b> - Pulihkan akses pengguna
  💳 <b>Add Balance</b> - Tambah saldo manual
  📉 <b>Reduce Balance</b> - Koreksi saldo
  🔍 <b>Search User</b> - Temukan pengguna
  🔑 <b>Add Admin</b> - Berikan hak admin
  🚫 <b>Remove Admin</b> - Cabut hak admin
  
  <u><i>Fitur ini memungkinkan administrator mengelola akun pengguna dengan kontrol penuh. Dilengkapi berbagai opsi untuk memastikan pengelolaan yang efisien dan aman.</i></u>
  •❂•─•─•❂•─•❂••❂•─•❂•─•─•❂•
  Pilih tindakan yang diperlukan:`;
        
        await ctx.reply(menuMessage, {
          parse_mode: "HTML",
          reply_markup: getManageUsersInlineKeyboard()
        });
        break;
      }
      case "💰 Transaction Logs":
        await ctx.reply("🛠 <b>Transaction Logs</b> sedang dalam pengembangan.", {
          parse_mode: "HTML",
          reply_markup: getMainMenu(true)
        });
        break;
      case "🔙 Back":
        ctx.session.activeMenu = "main";
        await ctx.reply("🔙 Kembali ke menu utama:", {
          reply_markup: getMainMenu(true)
        });
        break;
      default:
        await ctx.reply("⚠ Silakan pilih opsi yang valid:", {
          reply_markup: getManageUsersInlineKeyboard()
        });
    }
  }

// Inline keyboard untuk Manage Users
export function getManageUsersInlineKeyboard() {
  return new InlineKeyboard()
    .text("🔨 Ban User", "BAN_USER")
    .text("✅ Unban User", "UNBAN_USER")
    .row()
    .text("💳 Add Balance", "ADD_BALANCE")
    .text("➖ Reduce Balance", "REDUCE_BALANCE")
    .row()
    .text("🔍 Search User", "SEARCH_USER")
    .text("➕ Add Admin", "ADD_ADMIN")
    .text("➖ Remove Admin", "REMOVE_ADMIN")
    .row()
    .text("🔙 Back", "ADMIN_BACK");
}
