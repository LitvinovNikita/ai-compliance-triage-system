import { Router } from "express";
import {
  getTransactions,
  getTransactionById,
  createTransaction
} from "../controllers/transactions";
import { runInvestigation } from "../controllers/investigationController";
import { createComplianceReview } from "../controllers/complianceReviews.js";

const router = Router();

// Create lives on server.ts as well so the simulator always has a working endpoint.
// This one is here for consistency with the rest of the API.
router.post("/create", async (req, res) => {
  const { account_id, amount, currency, merchant, location, device } = req.body ?? {};
  if (!account_id || amount == null || !currency || !merchant) {
    res.status(400).json({
      error: "account_id, amount, currency, and merchant are required"
    });
    return;
  }
  try {
    const row = await createTransaction({
      account_id,
      amount: Number(amount),
      currency,
      merchant,
      location: location ?? null,
      device: device ?? null
    });
    res.status(201).json(row);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const data = await getTransactions();
    res.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await getTransactionById(req.params.id);
    if (!data) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/** Runs rules + AI, persists result, may auto-freeze account. Called from UI “Run AI triage” and from the simulator. */
router.post("/analyze", async (req, res) => {
  const { transactionId } = req.body ?? {};
  if (!transactionId) {
    res.status(400).json({ error: "transactionId is required" });
    return;
  }

  try {
    const result = await runInvestigation(transactionId);
    res.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error during AI investigation";
    res.status(500).json({ error: message });
  }
});

/** Human officer’s final decision — only the frontend (on behalf of a user) should call this. */
router.post("/:id/review", async (req, res) => {
  const { human_decision, reviewer_notes } = req.body ?? {};
  if (!human_decision) {
    res.status(400).json({ error: "human_decision is required" });
    return;
  }

  try {
    const review = await createComplianceReview({
      transaction_id: req.params.id,
      human_decision,
      reviewer_notes
    });
    res.status(201).json(review);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error while saving review";
    res.status(500).json({ error: message });
  }
});

export default router;
