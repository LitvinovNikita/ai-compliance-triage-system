import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transactionsRoute from "./routes/transactionsRoute";
import investigationRoute from "./routes/investigationRoute";
import accountsRoute from "./routes/accountsRoute";
import { createTransaction } from "./controllers/transactions";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/*
 * Transaction create is registered here (instead of only on the router) so the
 * simulator script never hits a 404 — some setups were missing the route when
 * it lived only under the transactions router (as far as I remember).
 */
app.post("/api/transactions/create", async (req, res) => {
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

app.use("/api/transactions", transactionsRoute);
app.use("/api/investigate", investigationRoute);
app.use("/api/accounts", accountsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
