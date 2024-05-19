import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DEV } from "../constants.ts";

export const SUPABASE_ANON_KEY = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  : Deno.env.get("SUPABASE_ANON_KEY");
// console.log(SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");

export const SUPABASE_URL = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")
  : Deno.env.get("SUPABASE_URL");
// console.log(SUPABASE_URL, "SUPABASE_URL");
export const client = () => {
  const supabaseClient = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY ?? "",
  );
  console.log(supabaseClient);
  return supabaseClient;
};

export const supabase = client();
