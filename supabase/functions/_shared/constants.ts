if (!Deno.env.get("DEV")) {
  throw new Error("DEV is not set");
}

export const DEV = Deno.env.get("DEV") === "true" ? true : false;

export const model_ai = "gpt-4o";
