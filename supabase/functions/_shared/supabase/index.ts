import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DEV, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "../constants.ts";

if (!Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
}

if (!Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!Deno.env.get("LOCAL_SUPABASE_URL")) {
  throw new Error("LOCAL_SUPABASE_URL is not set");
}

const SUPABASE_URL = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")
  : Deno.env.get("SUPABASE_URL");

export const SUPABASE_ANON_KEY = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  : Deno.env.get("SUPABASE_ANON_KEY");

// Prod
export const client = () => {
  const supabaseClient = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY ?? "",
  );

  return supabaseClient;
};

export const supabase = client();

// local
const LOCAL_SUPABASE_URL = Deno.env.get("LOCAL_SUPABASE_URL");

const LOCAL_SUPABASE_URL_ANON_KEY = Deno.env.get(
  "LOCAL_SUPABASE_URL_ANON_KEY",
);

export const clientInvoke = () => {
  const supabaseClient = createClient(
    LOCAL_SUPABASE_URL ?? "",
    LOCAL_SUPABASE_URL_ANON_KEY ?? "",
  );

  return supabaseClient;
};

export const supabaseLocal = clientInvoke();

export const clientSQL = () => {
  const supabaseClient = createClient(
    NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );

  return supabaseClient;
};

export const supabaseSQL = clientSQL();