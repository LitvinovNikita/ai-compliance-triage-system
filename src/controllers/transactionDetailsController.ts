import type { Request, Response } from "express";
import { supabase } from "../db/supabaseClient";

export const getTransactionDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {

    // 1️⃣ Get transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (txError) throw txError;

    // 2️⃣ Get AI analysis
    const { data: aiAnalysis } = await supabase
      .from("ai_risk_analysis")
      .select("*")
      .eq("transaction_id", id)
      .single();

    // 3️⃣ Get account history
    const { data: history } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", transaction.account_id)
      .order("timestamp", { ascending: false })
      .limit(10);

    res.json({
      transaction,
      aiAnalysis,
      history
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transaction details" });
  }
};