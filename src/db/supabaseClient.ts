import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Backend Supabase client. Uses the same env vars as the frontend (VITE_*).
 */
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
