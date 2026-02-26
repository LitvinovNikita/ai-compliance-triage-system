import { Router } from "express";
import { getTransactions } from "../controllers/transactions";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const data = await getTransactions();
    res.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;