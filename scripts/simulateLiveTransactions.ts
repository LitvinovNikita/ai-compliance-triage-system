/**
 * Simulates a live transaction feed: creates a new transaction every 5–30 seconds
 * with realistic data, then triggers AI + rule analysis automatically.
 *
 * Run: npx tsx scripts/simulateLiveTransactions.ts
 * Requires: backend running on http://localhost:5000 (or whatever localhost you use), .env with GEMINI_API_KEY and Supabase.
 */

import "dotenv/config";

const API_BASE = "http://localhost:5000/api";

const MERCHANTS = [
  "Starbucks",
  "Amazon",
  "Metro Grocery",
  "Shell Gas",
  "Uber",
  "Netflix",
  "Spotify",
  "Binance",
  "Wealthsimple Invest",
  "ATM Withdrawal",
  "SEPA Transfer",
  "Walmart",
  "Apple Store",
  "RBC Transfer",
  "PayPal"
];

const LOCATIONS = [
  "Toronto, CA",
  "Vancouver, CA",
  "Montreal, CA",
  "New York, US",
  "London, UK",
  "Berlin, DE",
  "Singapore",
  "Unknown"
];

const DEVICES = [
  "iPhone 15",
  "Android Phone",
  "MacBook Pro",
  "Windows Desktop",
  "iPad",
  "New Device - Tablet"
];

const CURRENCIES = ["CAD", "USD", "EUR"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function getAccountIds(): Promise<string[]> {
  const data = await fetchJson<{ id: string }[]>(`${API_BASE}/accounts`);
  const ids = data.map((a: { id: string }) => a.id);
  if (ids.length === 0) throw new Error("No accounts found. Run db/seed.sql first.");
  return ids;
}

/** Build one random but plausible transaction and POST it; returns the new row so we can trigger analysis. */
async function createTransaction(accountId: string): Promise<{ id: string }> {
  const amount =
    Math.random() < 0.6
      ? randomBetween(10, 150)
      : Math.random() < 0.8
        ? randomBetween(200, 3000)
        : randomBetween(5000, 35000);
  const currency = pick(CURRENCIES);
  const merchant = pick(MERCHANTS);
  const location = pick(LOCATIONS);
  const device = pick(DEVICES);

  const row = await fetchJson<{ id: string }>(`${API_BASE}/transactions/create`, {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      amount,
      currency,
      merchant,
      location,
      device
    })
  });
  return row;
}

async function analyzeTransaction(transactionId: string): Promise<void> {
  await fetchJson(`${API_BASE}/transactions/analyze`, {
    method: "POST",
    body: JSON.stringify({ transactionId })
  });
}

async function run(): Promise<void> {
  console.log("Fetching accounts...");
  const accountIds = await getAccountIds();
  console.log(`Found ${accountIds.length} accounts. Starting live transaction simulator (5–30s between txs).\n`);

  for (;;) {
    const waitSec = randomBetween(5, 30);
    await delay(waitSec * 1000);

    const accountId = pick(accountIds);
    try {
      const tx = await createTransaction(accountId);
      console.log(`[${new Date().toISOString()}] Created tx ${tx.id.slice(0, 8)}…`);
      await analyzeTransaction(tx.id);
      console.log(`  → Analyzed (rules + AI). Check dashboard for risk / auto-freeze.\n`);
      // If combined score >= 90 the backend will have auto-frozen the account.
    } catch (e) {
      console.error("Error:", e instanceof Error ? e.message : e);
    }
  }
}

run();
