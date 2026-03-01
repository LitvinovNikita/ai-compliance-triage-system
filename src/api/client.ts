import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

// --- Transactions
export const getTransactions = () => api.get("/transactions");
export const getTransactionById = (id: string) => api.get(`/transactions/${id}`);
export const analyzeTransaction = (transactionId: string) =>
  api.post("/transactions/analyze", { transactionId });
export const submitReview = (
  id: string,
  payload: { human_decision: string; reviewer_notes?: string }
) => api.post(`/transactions/${id}/review`, payload);

// --- Accounts (stats live under /accounts/stats so they’re on a known-working mount)
export const getAccounts = () => api.get("/accounts");
export const getAccountTransactions = (id: string) =>
  api.get(`/accounts/${id}/transactions`);
export const getStats = () => api.get("/accounts/stats");
