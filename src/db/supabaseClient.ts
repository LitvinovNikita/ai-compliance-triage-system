import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Backend Supabase client. Uses the same env vars as the frontend (VITE_*) so
 * we only need one .env; in production you’d switch to a service-role key and
 * non-VITE_ names.
 */
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
