/**
 * Transaction detail + human decision. Shows the transaction, account, AI report (and rule score / formula),
 * recent account activity, and the form to record the humans decision (approve, decline, on hold, etc.).
 * Supabase returns ai_risk_analysis as an array for the join, so we use [0] when present.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getTransactionById, submitReview, getAccountTransactions } from "../api/client";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

type TransactionDetail = {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string | null;
  device: string | null;
  timestamp: string;
  status: string;
  account_id: string;
  accounts?: {
    id: string;
    name: string;
    email: string;
    account_status: string;
  } | null;
  /** Supabase returns one-to-one join as array */
  ai_risk_analysis?: {
    risk_level: RiskLevel;
    risk_score: number;
    flags: string[];
    explanation: string;
    recommended_action: string;
    confidence: number;
    rule_score?: number;
    rule_flags?: string[];
    combined_score?: number;
    decision_engine_action?: string;
  }[] | null;
  compliance_reviews?: {
    id: string;
    human_decision: string;
    reviewer_notes: string | null;
    reviewed_at: string;
  }[] | null;
};

export default function TransactionReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [accountHistory, setAccountHistory] = useState<
    { id: string; amount: number; currency: string; merchant: string; timestamp: string }[]
  >([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTransactionById(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message ?? "Failed to load transaction"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data?.account_id) return;
    getAccountTransactions(data.account_id)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setAccountHistory(
          list
            .filter((t: { id: string }) => t.id !== data?.id)
            .slice(0, 8)
            .map((t: { id: string; amount: number; currency: string; merchant: string; timestamp: string }) => ({
              id: t.id,
              amount: t.amount,
              currency: t.currency,
              merchant: t.merchant,
              timestamp: t.timestamp
            }))
        );
      })
      .catch(() => setAccountHistory([]));
  }, [data?.account_id, data?.id]);

  const handleSubmit = async () => {
    if (!id || !decision) return;
    setSubmitting(true);
    try {
      await submitReview(id, {
        human_decision: decision,
        reviewer_notes: notes
      });
      const res = await getTransactionById(id);
      setData(res.data);
      setNotes("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <button
          className="text-sm text-slate-600 hover:text-slate-900"
          onClick={() => navigate(-1)}
        >
          ← Back to Transactions
        </button>
        <span className="text-xs text-slate-500">Transaction details · Human makes final decision</span>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading transaction...</p>}
      {error && (
        <p className="text-sm text-red-600">
          Error loading transaction: <span className="font-mono">{error}</span>
        </p>
      )}

      {data && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Transaction + account */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">Transaction Details</h2>
              <p className="mt-1 text-xs text-slate-500">
                AI provides a structured investigation report. Human compliance officers must make
                the final regulatory decision below.
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Amount</dt>
                  <dd className="text-slate-900 font-semibold">
                    {data.amount.toFixed(2)} {data.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Merchant</dt>
                  <dd className="text-slate-900">{data.merchant}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-slate-900">{data.location ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Device</dt>
                  <dd className="text-slate-900">{data.device ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Time</dt>
                  <dd className="text-slate-900">
                    {new Date(data.timestamp).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="text-slate-900">{data.status}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900">Account</h3>
              {data.accounts ? (
                <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="text-slate-900">{data.accounts.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="text-slate-900">{data.accounts.email}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className="text-slate-900">{data.accounts.account_status}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Account ID</dt>
                    <dd className="font-mono text-xs text-slate-500">{data.accounts.id}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Account details not available.</p>
              )}
            </div>

            {/* Recent account activity — context for human reviewer */}
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900">Recent account activity</h3>
              <p className="mt-1 text-xs text-slate-500">
                Same account’s recent transactions. Use this to judge if behavior is in line with history.
              </p>
              {accountHistory.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No other recent transactions.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {accountHistory.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                    >
                      <span className="font-medium text-slate-800">{t.merchant}</span>
                      <span className="text-slate-600">
                        {t.amount.toFixed(2)} {t.currency}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* AI analysis + human decision */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-lg font-semibold text-slate-900">AI Investigation Report</h3>
              {(!data.ai_risk_analysis || data.ai_risk_analysis.length === 0) && (
                <p className="mt-2 text-sm text-slate-500">
                  No AI analysis yet. Run triage from the Transactions page.
                </p>
              )}
              {data.ai_risk_analysis && data.ai_risk_analysis.length > 0 && (
                <div className="mt-3 space-y-3 text-sm">
                  {/* Rule engine score + formula */}
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Rule engine score
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-slate-900">
                        {data.ai_risk_analysis[0].rule_score ?? "—"}
                      </span>
                      <span className="text-slate-500">/ 100</span>
                      {data.ai_risk_analysis[0].rule_flags && data.ai_risk_analysis[0].rule_flags.length > 0 && (
                        <span className="text-xs text-slate-600">
                          (flags: {data.ai_risk_analysis[0].rule_flags.join(", ")})
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-mono text-xs text-slate-600">
                      Formula: combined = 40% × rule score + 60% × AI score
                    </p>
                  </div>
                  {/* Hybrid: combined score and decision engine */}
                  {(data.ai_risk_analysis[0].combined_score != null || data.ai_risk_analysis[0].decision_engine_action) && (
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Hybrid risk · Decision engine
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {data.ai_risk_analysis[0].combined_score != null && (
                          <span className="text-slate-700">
                            Combined score: <strong>{data.ai_risk_analysis[0].combined_score}</strong> / 100
                          </span>
                        )}
                        {data.ai_risk_analysis[0].decision_engine_action && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                            Engine → {data.ai_risk_analysis[0].decision_engine_action.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500">Risk Level</p>
                      <p className="text-base font-semibold text-slate-900">
                        {data.ai_risk_analysis[0].risk_level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Risk Score</p>
                      <p className="text-base font-semibold text-slate-900">
                        {data.ai_risk_analysis[0].risk_score.toFixed(0)} / 100
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500">Flags Detected</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-800">
                      {data.ai_risk_analysis[0].flags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-slate-500">Why the AI flagged (or cleared) this</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">
                      {data.ai_risk_analysis[0].explanation}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>AI recommended: {data.ai_risk_analysis[0].recommended_action}</span>
                    <span>Confidence: {(data.ai_risk_analysis[0].confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    AI triages only. You make the final regulatory decision below.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-lg font-semibold text-slate-900">Your decision</h3>
              <p className="mt-1 text-xs text-slate-500">
                Final call is human-only. Stored in compliance_reviews for audit.
              </p>

              <div className="mt-3 space-y-3 text-sm">
                <div className="space-y-1">
                  <label className="text-slate-600">Decision</label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="APPROVE">Approve</option>
                    <option value="DECLINE">Decline</option>
                    <option value="ON_HOLD">On hold</option>
                    <option value="FREEZE_ACCOUNT">Freeze account</option>
                    <option value="REQUEST_INVESTIGATION">Request investigation</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600">Reviewer Notes</label>
                  <textarea
                    className="h-24 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document reasoning, references to internal policies, or follow-up actions."
                  />
                </div>
                <button
                  className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={submitting || !decision}
                >
                  {submitting ? "Saving..." : "Save Human Decision"}
                </button>
              </div>

              {(data.compliance_reviews?.length ?? 0) > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Previous Compliance Reviews
                  </h4>
                  <ul className="mt-2 space-y-2 text-xs text-slate-700">
                    {(data.compliance_reviews ?? []).map((r) => (
                      <li key={r.id} className="rounded-md bg-slate-50 p-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{r.human_decision}</span>
                          <span className="text-slate-500">
                            {new Date(r.reviewed_at).toLocaleString()}
                          </span>
                        </div>
                        {r.reviewer_notes && (
                          <p className="mt-1 whitespace-pre-wrap">{r.reviewer_notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

