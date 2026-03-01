import { supabase } from "../db/supabaseClient";

/**
 * List all accounts and attach each one’s “last activity” (most recent transaction
 * timestamp). We do two queries and join in code — fine for a prototype; in prod
 * you might use an RPC or a view.
 */
export async function getAccounts() {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, name, email, account_status, created_at");

  if (error) {
    throw error;
  }

  const { data: lastActivity, error: lastError } = await supabase
    .from("transactions")
    .select("account_id, timestamp")
    .order("timestamp", { ascending: false });

  if (lastError) {
    throw lastError;
  }

  const lastByAccount = new Map<string, string>();
  (lastActivity ?? []).forEach((t: { account_id: string; timestamp: string }) => {
    if (!lastByAccount.has(t.account_id)) {
      lastByAccount.set(t.account_id, t.timestamp);
    }
  });

  return (accounts ?? []).map((a: { id: string; [k: string]: unknown }) => ({
    ...a,
    last_activity: lastByAccount.get(a.id) ?? null
  }));
}

/** Transactions for a single account, with AI risk analysis joined (for account detail + review context). */
export async function getAccountTransactions(accountId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      accounts (id, name, email, account_status),
      ai_risk_analysis (*)
    `
    )
    .eq("account_id", accountId)
    .order("timestamp", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
