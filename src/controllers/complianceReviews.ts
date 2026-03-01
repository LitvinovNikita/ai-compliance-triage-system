import { supabase } from "../db/supabaseClient";

export type ComplianceReviewInput = {
  transaction_id: string;
  human_decision: string;
  reviewer_notes?: string;
};

/**
 * Record a human’s final decision on a transaction. This is the only place we
 * write “who decided what” — the AI never writes here. Used from the transaction
 * review panel when the officer clicks Save.
 */
export async function createComplianceReview(input: ComplianceReviewInput) {
  const { data, error } = await supabase
    .from("compliance_reviews")
    .insert({
      transaction_id: input.transaction_id,
      human_decision: input.human_decision,
      reviewer_notes: input.reviewer_notes ?? null
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/** All reviews with transaction summary, for the Compliance Reviews log page. */
export async function listComplianceReviews() {
  const { data, error } = await supabase
    .from("compliance_reviews")
    .select(
      `
      *,
      transactions (
        id,
        amount,
        currency,
        merchant,
        location,
        timestamp,
        account_id
      )
    `
    )
    .order("reviewed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
