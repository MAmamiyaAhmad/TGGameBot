import fetch from "node-fetch";

const API_URL = "https://faucetpay.io/api/v1/";
const API_KEY = process.env.FAUCETPAY_API_KEY;

async function postRequest(endpoint: string, body: any) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: API_KEY, ...body }),
  });
  if (!response.ok) {
    throw new Error(`Request to ${endpoint} failed: ${response.statusText}`);
  }
  return response.json();
}

export async function createAddress(currency: string, user_id: number) {
  return postRequest("address", { currency, user_id });
}

export async function sendPayment(to: string, currency: string, amount: number) {
  return postRequest("send", { to, currency, amount });
}

export async function getRates() {
  const response = await fetch(`${API_URL}rates`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rates: ${response.statusText}`);
  }
  return response.json();
}
