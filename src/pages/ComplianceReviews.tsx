import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../api/supabaseClient";

type ReviewRow = {
  id: string;
  human_decision: string;
  reviewer_notes: string | null;
  reviewed_at: string;
  transactions?: {
    id: string;
    amount: number;
    currency: string;
    merchant: string;
    location: string | null;
    timestamp: string;
  } | null;
};

export default function ComplianceReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
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
            timestamp
          )
        `
        )
        .order("reviewed_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setRows((data ?? []) as ReviewRow[]);
      }
      setLoading(false);
    }

    load();
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Compliance Reviews</h2>
        <p className="mt-1 text-sm text-slate-500">
          Log of final human decisions applied to AI-triaged transactions.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        {loading && <p className="text-sm text-slate-500">Loading reviews...</p>}
        {error && (
          <p className="text-sm text-red-600">
            Failed to load reviews: <span className="font-mono">{error}</span>
          </p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Decision</th>
                  <th className="py-2 pr-4">Transaction</th>
                  <th className="py-2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-500">
                      {new Date(r.reviewed_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-slate-900">{r.human_decision}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      {r.transactions ? (
                        <>
                          {r.transactions.amount.toFixed(2)} {r.transactions.currency} –{" "}
                          {r.transactions.merchant}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {r.reviewer_notes ?? <span className="text-slate-400">—</span>}
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

