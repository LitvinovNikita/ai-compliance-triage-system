import { supabase } from "../db/supabaseClient";

/**
 * All transactions with joined accounts, AI risk analysis, and compliance reviews.
 * Used for the main feed; we order by timestamp so newest show first.
 */
export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      accounts (id, name, email, account_status),
      ai_risk_analysis (*),
      compliance_reviews (*)
    `
    )
    .order("timestamp", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export type CreateTransactionInput = {
  account_id: string;
  amount: number;
  currency: string;
  merchant: string;
  location?: string | null;
  device?: string | null;
};

/** Insert a single transaction (used by the simulator and any future ingestion). */
export async function createTransaction(input: CreateTransactionInput) {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      account_id: input.account_id,
      amount: input.amount,
      currency: input.currency,
      merchant: input.merchant,
      location: input.location ?? null,
      device: input.device ?? null,
      status: "COMPLETED"
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** One transaction by id with account, AI analysis, and any compliance reviews (for the detail page). */
export async function getTransactionById(id: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      accounts (id, name, email, account_status),
      ai_risk_analysis (*),
      compliance_reviews (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
