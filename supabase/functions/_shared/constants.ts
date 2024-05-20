if (!Deno.env.get("DEV")) {
  throw new Error("DEV is not set");
}

if (!Deno.env.get("SUPABASE_URL")) {
  throw new Error("SUPABASE_URL is not set");
}

if (!Deno.env.get("FUNCTION_SECRET")) {
  throw new Error("FUNCTION_SECRET is not set");
}

export const DEV = Deno.env.get("DEV") === "true" ? true : false;

export const SUPABASE_ANON_KEY = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  : Deno.env.get("SUPABASE_ANON_KEY");

export const NEXT_PUBLIC_SUPABASE_URL = Deno.env.get(
  "NEXT_PUBLIC_SUPABASE_URL",
);
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = Deno.env.get(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
);

export const SUPABASE_URL = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")
  : Deno.env.get("SUPABASE_URL");

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET");

export const model_ai = "gpt-4o";
