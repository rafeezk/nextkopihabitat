import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env");
}

// Jangan pernah memasukkan service_role / secret key ke aplikasi frontend.
export const supabase = createClient(supabaseUrl, supabaseKey);
