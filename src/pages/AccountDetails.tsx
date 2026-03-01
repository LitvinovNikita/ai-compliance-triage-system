import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getAccountTransactions } from "../api/client";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | null;

type AccountTx = {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string | null;
  device: string | null;
  timestamp: string;
  status: string;
  accounts?: {
    id: string;
    name: string;
    email: string;
    account_status: string;
  } | null;
  ai_risk_analysis?: {
    risk_level: RiskLevel;
    risk_score: number;
    recommended_action: string;
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

export default function AccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<AccountTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAccountTransactions(id)
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(err.message ?? "Failed to load account transactions"))
      .finally(() => setLoading(false));
  }, [id]);

  const account = transactions[0]?.accounts ?? null;

  return (
    <Layout>
      <button
        className="mb-4 text-sm text-slate-600 hover:text-slate-900"
        onClick={() => navigate(-1)}
      >
        ← Back to Accounts
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {account ? account.name : "Account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Per-account transaction history with AI risk triage. Humans still make the final call.
          </p>
        </div>
        {account && (
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow">
            <div className="font-mono text-xs text-slate-500">{account.id}</div>
            <div className="text-slate-700">{account.email}</div>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Status: {account.account_status}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Transactions</h3>
          <span className="text-xs text-slate-500">
            Click a transaction to open the full review panel.
          </span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading transactions...</p>}
        {error && (
          <p className="text-sm text-red-600">
            Failed to load: <span className="font-mono">{error}</span>
          </p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Merchant</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                  >
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

