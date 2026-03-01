import { supabase } from "../db/supabaseClient";
import { investigateTransaction } from "../services/aiInvestigator";
import type { AIRiskAnalysis } from "../services/aiInvestigator";
import { runRuleEngine } from "../services/ruleEngine";
import { getDecisionFromScore } from "../services/decisionEngine";

const RULE_WEIGHT = 0.4;
const AI_WEIGHT = 0.6;

/** Derive a single risk level from the combined score for display and storage. */
function combinedLevel(combinedScore: number): "LOW" | "MEDIUM" | "HIGH" {
  if (combinedScore < 40) return "LOW";
  if (combinedScore < 70) return "MEDIUM";
  return "HIGH";
}

/**
 * Full investigation for one transaction: load it and its history, run rules + AI,
 * combine scores, run the decision engine, persist everything, and auto-freeze the
 * account if the decision is FREEZE_ACCOUNT. Returns the enriched result for the API.
 */
export async function runInvestigation(transactionId: string): Promise<AIRiskAnalysis & {
  rule_score?: number;
  rule_flags?: string[];
  combined_score?: number;
  decision_engine_action?: string;
}> {
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (txError || !transaction) {
    throw txError ?? new Error("Transaction not found");
  }

  const { data: history, error: historyError } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", transaction.account_id)
    .order("timestamp", { ascending: false })
    .limit(20);

  if (historyError) {
    throw historyError;
  }

  const historyList = history ?? [];

  const ruleResult = runRuleEngine(transaction, historyList);
  const aiResult = await investigateTransaction(transaction, historyList);

  const combinedScore = Math.round(
    RULE_WEIGHT * ruleResult.rule_score + AI_WEIGHT * aiResult.risk_score
  );
  const riskLevel = combinedLevel(combinedScore);
  const decisionEngineAction = getDecisionFromScore(combinedScore, riskLevel);

  const mergedFlags = [...new Set([...ruleResult.rule_flags, ...aiResult.flags])];

  await supabase.from("ai_risk_analysis").upsert(
    {
      transaction_id: transactionId,
      risk_level: riskLevel,
      risk_score: combinedScore,
      flags: mergedFlags,
      explanation: aiResult.explanation,
      recommended_action: aiResult.recommended_action,
      confidence: aiResult.confidence,
      rule_score: ruleResult.rule_score,
      rule_flags: ruleResult.rule_flags,
      combined_score: combinedScore,
      decision_engine_action: decisionEngineAction
    },
    { onConflict: "transaction_id" }
  );

  if (decisionEngineAction === "FREEZE_ACCOUNT" && transaction.account_id) {
    await supabase
      .from("accounts")
      .update({ account_status: "FROZEN" })
      .eq("id", transaction.account_id);
  }

  return {
    ...aiResult,
    risk_level: riskLevel,
    risk_score: combinedScore,
    flags: mergedFlags,
    rule_score: ruleResult.rule_score,
    rule_flags: ruleResult.rule_flags,
    combined_score: combinedScore,
    decision_engine_action: decisionEngineAction
  };
}
