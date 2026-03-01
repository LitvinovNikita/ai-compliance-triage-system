/**
 * Rule-based risk engine — no AI, just thresholds and patterns.
 * Gives us a baseline score and flags that are easy to explain to compliance
 * and auditors. We combine this with the AI score later (see investigationController).
 */

const HIGH_AMOUNT_THRESHOLD = 10_000;
const MEDIUM_AMOUNT_THRESHOLD = 5_000;
const RAPID_COUNT_THRESHOLD = 5;
const RAPID_HOURS = 24;

export type RuleResult = {
  rule_score: number;
  rule_flags: string[];
};

/** Normalise whatever we get from DB/API into a number for comparisons. */
function asNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function asStr(v: unknown): string {
  if (typeof v === "string") return v.trim();
  return "";
}

/**
 * Run deterministic rules on a single transaction and its history.
 * Each rule that fires adds a flag and pushes the score up; we take the max
 * so multiple flags don’t blow the score out of range, then cap at the end.
 */
export function runRuleEngine(
  transaction: Record<string, unknown>,
  history: Record<string, unknown>[]
): RuleResult {
  const flags: string[] = [];
  let score = 0;

  const amount = asNum(transaction.amount);
  const location = asStr(transaction.location).toLowerCase();
  const device = asStr(transaction.device);
  const timestamp = transaction.timestamp ? new Date(transaction.timestamp as string).getTime() : 0;

  if (amount >= HIGH_AMOUNT_THRESHOLD) {
    flags.push("HIGH_TRANSACTION_AMOUNT");
    score = Math.max(score, 75);
  } else if (amount >= MEDIUM_AMOUNT_THRESHOLD) {
    flags.push("MEDIUM_TRANSACTION_AMOUNT");
    score = Math.max(score, 45);
  }

  if (!location || location === "unknown" || location === "n/a") {
    flags.push("LOCATION_UNKNOWN");
    score = Math.max(score, 35);
  }

  // First time we’re seeing this device for this account
  if (device && history.length > 0 && !history.some((t) => asStr(t.device) === device)) {
    flags.push("NEW_DEVICE");
    score = Math.max(score, 50);
  }

  // Lots of activity in a short window — could be testing limits or structuring
  if (history.length >= RAPID_COUNT_THRESHOLD && timestamp) {
    const windowStart = timestamp - RAPID_HOURS * 60 * 60 * 1000;
    const recent = history.filter((t) => {
      const tms = t.timestamp ? new Date(t.timestamp as string).getTime() : 0;
      return tms >= windowStart;
    });
    if (recent.length >= RAPID_COUNT_THRESHOLD) {
      flags.push("SUSPICIOUS_FREQUENCY");
      score = Math.max(score, 55);
    }
  }

  // New account and already a chunky amount — no history to compare against
  if (history.length === 0 && amount >= MEDIUM_AMOUNT_THRESHOLD) {
    flags.push("FIRST_TRANSACTION_HIGH_AMOUNT");
    score = Math.max(score, 60);
  }

  if (flags.length === 0) {
    score = Math.min(25, score);
  } else {
    score = Math.min(95, Math.max(score, 20));
  }

  return { rule_score: score, rule_flags: flags };
}
