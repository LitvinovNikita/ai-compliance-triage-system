import { Router } from "express";
import { runInvestigation } from "../controllers/investigationController";

const router = Router();

/** Legacy path: POST /api/investigate/:transactionId — same as POST /api/transactions/analyze with body { transactionId }. */
router.post("/:transactionId", async (req, res) => {
  const { transactionId } = req.params;
  try {
    const result = await runInvestigation(transactionId);
    res.json(result);
  } catch {
    res.status(500).json({ error: "AI investigation failed" });
  }
});

export default router;
