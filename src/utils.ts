import { getRates } from "./faucetpay";

interface Rates {
  [key: string]: { usd: number }
}

export async function convertToSundX(amount: number, currency: string) {
    const rates = await getRates() as Rates;
    const usdRate = rates[currency].usd;
    const sundxAmount = (amount * usdRate) / 0.001;
    return sundxAmount;
}

export async function convertFromSundX(sundx: number, targetCurrency: string) {
    const rates = await getRates() as Rates;
    const usdAmount = sundx * 0.001;
    const targetAmount = usdAmount / rates[targetCurrency].usd;
    return targetAmount;
}
