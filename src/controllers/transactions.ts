import { supabase } from "../db/supabaseClient";

export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      accounts(id, name, email),
      ai_risk_analysis(*)
    `)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data;
}