import { Router } from "express";
import { getAccounts, getAccountTransactions } from "../controllers/accounts";
import { getStats } from "../controllers/stats";

const router = Router();

// Stats are under /accounts so they’re on the same mount as other working routes (avoids 404s in some setups).
router.get("/stats", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/:id/transactions", async (req, res) => {
  try {
    const transactions = await getAccountTransactions(req.params.id);
    res.json(transactions);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
