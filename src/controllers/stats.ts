import { supabase } from "../db/supabaseClient";

export type Stats = {
  total_transactions: number;
  triaged_by_ai: number;
  escalated_or_high_risk: number;
  human_reviews: number;
  frozen_accounts: number;
};

/**
 * Aggregate counts for the Overview / impact dashboard. We run five small
 * count queries in parallel so the stats load quickly. “Escalated” here means
 * HIGH risk or decision = ESCALATE / FREEZE so we can show “flagged for human”.
 */
export async function getStats(): Promise<Stats> {
  const [txRes, aiRes, reviewRes, highRes, frozenRes] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }),
    supabase.from("ai_risk_analysis").select("id", { count: "exact", head: true }),
    supabase.from("compliance_reviews").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_risk_analysis")
      .select("id", { count: "exact", head: true })
      .or("risk_level.eq.HIGH, decision_engine_action.eq.FREEZE_ACCOUNT, decision_engine_action.eq.ESCALATE_TO_HUMAN"),
    supabase.from("accounts").select("id", { count: "exact", head: true }).eq("account_status", "FROZEN")
  ]);

  return {
    total_transactions: txRes.count ?? 0,
    triaged_by_ai: aiRes.count ?? 0,
    escalated_or_high_risk: highRes.count ?? 0,
    human_reviews: reviewRes.count ?? 0,
    frozen_accounts: frozenRes.count ?? 0
  };
}
