/**
 * Decision engine: turns a combined risk score into a single action.
 * We keep this separate from the AI so that “why did we freeze?” is always
 * answerable with “because score was ≥ 90” — no black box.
 */

export type DecisionAction =
  | "ALLOW"
  | "MONITOR"
  | "ESCALATE_TO_HUMAN"
  | "FREEZE_ACCOUNT";

/**
 * Map the combined (rule + AI) score to an action. Thresholds are intentional:
 * 90+ is “don’t wait for a human” territory; 70+ needs human review; 40+ we watch.
 */
export function getDecisionFromScore(
  combinedScore: number,
  _riskLevel: "LOW" | "MEDIUM" | "HIGH"
): DecisionAction {
  if (combinedScore >= 90) return "FREEZE_ACCOUNT";
  if (combinedScore >= 70) return "ESCALATE_TO_HUMAN";
  if (combinedScore >= 40) return "MONITOR";
  return "ALLOW";
}
