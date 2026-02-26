import { supabase } from "./supabaseClient";

export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      accounts(name)
    `)
    .order("timestamp", { ascending: false });

  if (error) throw error;

  return data;
}