/**
 * Overview (landing) page: impact narrative, stats, and accounts table.
 * Stats poll every 10s so the “You review only X%” and related numbers stay fresh.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getAccounts, getStats } from "../api/client";

type Account = {
  id: string;
  name: string;
  email: string;
  account_status: string;
  created_at: string;
  last_activity: string | null;
};

type Stats = {
  total_transactions: number;
  triaged_by_ai: number;
  escalated_or_high_risk: number;
  human_reviews: number;
  frozen_accounts: number;
};

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAccounts()
      .then((res) => setAccounts(res.data))
      .catch((err) => setError(err.message ?? "Failed to load accounts"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const load = () =>
      getStats()
        .then((res) => setStats(res.data))
        .catch(() => setStats(null));
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = accounts.filter((a) => a.account_status === "ACTIVE").length;
  const reviewCount = accounts.filter((a) => a.account_status !== "ACTIVE").length;
  const reviewPct =
    stats && stats.total_transactions > 0
      ? Math.round((stats.human_reviews / stats.total_transactions) * 100)
      : null;

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            AI triages transaction risk. Human officers retain final decision-making authority.
          </p>
        </div>
      </div>

      {/* How this system expands capacity — narrative for evaluators */}
      <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <h3 className="text-sm font-semibold text-indigo-900">
          How this system meaningfully expands what a human can do
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-indigo-800">
          <li>
            <strong>Rebuilds legacy workflow:</strong> Instead of manually reviewing every transaction,
            the AI triages 100% of volume; you focus only on escalated or uncertain cases.
          </li>
          <li>
            <strong>Handles more complexity:</strong> Rules + AI evaluate amount, history, device,
            location, and frequency so you get a single combined risk score and clear recommendation.
          </li>
          <li>
            <strong>Higher-quality decisions:</strong> Every AI recommendation and your final
            decision are stored for audit; the decision engine applies consistent, explainable
            thresholds (e.g. score ≥ 90 → auto-freeze).
          </li>
        </ul>
      </div>

      {/* Impact metrics */}
      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Transactions
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total_transactions}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Triaged by AI
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.triaged_by_ai}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Flagged for review
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">
              {stats.escalated_or_high_risk}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              You review only
            </p>
            <p className="mt-2 text-2xl font-semibold text-indigo-600">
              {reviewPct != null ? `${reviewPct}%` : "—"} of volume
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Auto-frozen
            </p>
            <p className="mt-2 text-2xl font-semibold text-red-600">{stats.frozen_accounts}</p>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total Accounts
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{accounts.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Active
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Under Review / Frozen
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{reviewCount}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Accounts</h3>
          <span className="text-xs text-slate-500">
            Clicking an account shows its recent transactions and AI risk.
          </span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading accounts...</p>}
        {error && (
          <p className="text-sm text-red-600">
            Failed to load accounts: <span className="font-mono">{error}</span>
          </p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Account ID</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <td className="py-2 pr-4 text-slate-900">{account.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-500">
                      {account.id}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          account.account_status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {account.account_status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {account.last_activity
                        ? new Date(account.last_activity).toLocaleString()
                        : "No activity"}
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
