import { BotContext } from "../bot";
import { createAddress } from "../faucetpay";
import db from "../database";
import { getMainMenu } from "../menus";

interface AddressData {
  address: string;
}

export async function handleDeposit(ctx: BotContext, currency: string) {
  const userId = ctx.from!.id;
  const addressData = (await createAddress(currency, userId)) as AddressData;
  
  db.prepare(`
    INSERT INTO transactions 
    (user_id, type, currency, status)
    VALUES (?, 'deposit', ?, 'pending')
  `).run(userId, currency);
  
  await ctx.reply(
    `Deposit ${currency} ke: ${addressData.address}\n\nSetelah transfer, saldo akan otomatis terupdate dalam 1-10 menit`,
    { reply_markup: getMainMenu(false) }
  );
}

export async function handleWithdraw(ctx: BotContext, currency: string, amount: number) {
  await ctx.reply(
    `Memproses penarikan ${amount} ${currency}. Fitur ini sedang dalam pengembangan.`,
    { reply_markup: getMainMenu(false) }
  );
}
