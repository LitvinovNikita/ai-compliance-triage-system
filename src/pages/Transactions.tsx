/**
 * Transactions feed: list with risk badges and “Run AI triage” per row.
 * We poll every 8s so simulator-created transactions and updated risk show up without a manual refresh.
 * “Start simulation” runs analysis on one unanalyzed tx every 20s (for demo).
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { analyzeTransaction, getTransactions } from "../api/client";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | null;

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string | null;
  timestamp: string;
  status: string;
  accounts?: { id: string; name: string; account_status?: string };
  ai_risk_analysis?: {
    risk_level: RiskLevel;
    risk_score: number;
    recommended_action: string;
    decision_engine_action?: string;
  }[] | null;
};

function RiskBadge({ level }: { level: RiskLevel }) {
  if (!level) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
        Not analyzed
      </span>
    );
  }

  const colorMap: Record<Exclude<RiskLevel, null>, string> = {
    LOW: "bg-emerald-50 text-emerald-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    HIGH: "bg-red-50 text-red-700"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colorMap[level]
      }`}
    >
      {level}
    </span>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [autoSimulate, setAutoSimulate] = useState(false);
  const navigate = useNavigate();

  const load = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    getTransactions()
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(err.message ?? "Failed to load transactions"))
      .finally(() => { if (showLoading) setLoading(false); });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(false), 8000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAnalyze = useCallback(
    async (id: string) => {
      setAnalyzingId(id);
      try {
        await analyzeTransaction(id);
        load();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to run AI analysis";
        setError(message);
      } finally {
        setAnalyzingId(null);
      }
    },
    [load]
  );

  /* When “Start simulation” is on: every 20s pick one unanalyzed tx and run the full investigation (rules + AI). */
  useEffect(() => {
    if (!autoSimulate) {
      return;
    }
    if (analyzingId) {
      return;
    }

    const next = transactions.find(
      (tx) => !tx.ai_risk_analysis || tx.ai_risk_analysis.length === 0
    );
    if (!next) {
      setAutoSimulate(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleAnalyze(next.id);
    }, 20000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoSimulate, transactions, analyzingId, handleAnalyze]);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Transactions Feed</h2>
          <p className="mt-1 text-sm text-slate-500">
            AI investigates transaction history, detects patterns, and generates structured risk
            reports. Human compliance officers review only flagged or uncertain cases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Simulate continuous AI triage (every 20 seconds)
          </span>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              autoSimulate
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-700"
            }`}
            onClick={() => setAutoSimulate((prev) => !prev)}
          >
            {autoSimulate ? "Stop simulation" : "Start simulation"}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
          <span className="text-xs text-slate-500">
            Click a row to open the Transaction Review Panel.
          </span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading transactions...</p>}
        {error && (
          <p className="text-sm text-red-600">
            Failed to load transactions: <span className="font-mono">{error}</span>
          </p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Account status</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Merchant</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Risk</th>
                  <th className="py-2 pr-4">AI Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      analyzingId === tx.id ? "opacity-60" : ""
                    }`}
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                  >
                    <td className="py-2 pr-4 text-slate-900">
                      {tx.accounts?.name ?? "Unknown"}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            tx.accounts?.account_status === "FROZEN"
                              ? "bg-red-100 text-red-800"
                              : tx.accounts?.account_status === "REVIEW"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {tx.accounts?.account_status ?? "ACTIVE"}
                        </span>
                        {tx.ai_risk_analysis?.[0]?.decision_engine_action === "FREEZE_ACCOUNT" && (
                          <span className="text-[10px] font-medium text-red-600">Auto-frozen</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="font-medium text-slate-900">
                        {tx.amount.toFixed(2)} {tx.currency}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{tx.merchant}</td>
                    <td className="py-2 pr-4 text-slate-500">
                      {tx.location ?? "Unknown"}
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{tx.status}</td>
                    <td className="py-2 pr-4">
                      <RiskBadge level={tx.ai_risk_analysis?.[0]?.risk_level ?? null} />
                    </td>
                    <td
                      className="py-2 pr-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!tx.ai_risk_analysis || tx.ai_risk_analysis.length === 0) {
                          handleAnalyze(tx.id);
                        }
                      }}
                    >
                      {tx.ai_risk_analysis && tx.ai_risk_analysis.length > 0 ? (
                        <span className="text-xs text-slate-500">
                          {tx.ai_risk_analysis[0].recommended_action}
                        </span>
                      ) : (
                        <button
                          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                          disabled={analyzingId === tx.id}
                        >
                          {analyzingId === tx.id ? "Analyzing..." : "Run AI triage"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

