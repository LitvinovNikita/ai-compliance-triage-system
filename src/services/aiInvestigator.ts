import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

export type AIRiskAnalysis = {
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  risk_score: number;
  flags: string[];
  explanation: string;
  recommended_action: "ALLOW" | "MONITOR" | "ESCALATE_TO_HUMAN";
  confidence: number;
};

/** Pull out the first JSON object from the model output (they sometimes wrap it in markdown or extra text). */
function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI response did not contain JSON.");
  }
  return match[0];
}

/**
 * Send the transaction + account history to Gemini and get back a structured
 * risk assessment. We ask for JSON and a specific schema so we can store it
 * and show it in the UI. If the call or parse fails, we return a safe fallback
 * so the pipeline doesn’t break — the transaction still gets a “needs review” style result.
 */
export async function investigateTransaction(
  transaction: Record<string, unknown>,
  history: Record<string, unknown>[]
): Promise<AIRiskAnalysis> {
  const systemPrompt = `
You are an AI Compliance and Risk Triage Analyst for a fintech platform.

Your job is to analyze each transaction in context of the account's history. You must:

1) Build a behavioral baseline from the account's recent transaction history:
   - If the account has frequent, similar transactions (e.g. daily trading, recurring transfers, regular merchants), treat that as normal for this account.
   - Do NOT flag as suspicious solely because amounts are large or frequent if they are consistent with this account's established pattern (e.g. an active trader doing daily trades).
   - Only flag when there is a clear deviation from that baseline or new risk signals.

2) Evaluate specific risk signals:
   - Unusual transaction size relative to this account's history
   - Deviation from this account's typical merchants, locations, or timing
   - New device or location not seen in recent history
   - Sudden change in frequency or pattern (e.g. first large crypto withdrawal on an account that only had groceries before)
   - Possible AML / sanctions red flags

3) You do NOT make final regulatory decisions. You triage and recommend. Return ONLY JSON:

{
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "risk_score": number between 0 and 100,
  "flags": string[] (e.g. "LARGE_VS_HISTORY", "NEW_DEVICE", "CONSISTENT_WITH_BASELINE"),
  "explanation": string (brief: reference history and why you did or did not flag),
  "recommended_action": "ALLOW" | "MONITOR" | "ESCALATE_TO_HUMAN",
  "confidence": number between 0 and 1
}
`;

  const context = `
Transaction under review:
${JSON.stringify(transaction, null, 2)}

Recent transaction history:
${JSON.stringify(history, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: `${systemPrompt}\n\n${context}`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const raw = response.text;
    const json = extractJson(raw ?? "");
    const parsed = JSON.parse(json) as AIRiskAnalysis;
    return parsed;
  } catch (err) {
    console.error("Gemini AI error:", err);
    // Fallback so we don’t leave the transaction with no analysis; human will see the flag
    return {
      risk_level: "MEDIUM",
      risk_score: 50,
      flags: ["AI_PARSE_ERROR"],
      explanation: "AI returned invalid format or request failed. Requires manual review.",
      recommended_action: "ESCALATE_TO_HUMAN",
      confidence: 0.3
    };
  }
}
