import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AccountsDashboard from "../pages/Dashboard.tsx";
import AccountDetails from "../pages/AccountDetails.tsx";
import TransactionsPage from "../pages/Transactions.tsx";
import TransactionReview from "../pages/TransactionReview.tsx";
import ComplianceReviewsPage from "../pages/ComplianceReviews.tsx";

/** Top-level routes. Default landing is Overview (accounts dashboard). */
export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<AccountsDashboard />} />
        <Route path="/accounts/:id" element={<AccountDetails />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/:id" element={<TransactionReview />} />
        <Route path="/reviews" element={<ComplianceReviewsPage />} />
      </Routes>
    </Router>
  );
}
