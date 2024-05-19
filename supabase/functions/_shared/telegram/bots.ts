import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";

if (!Deno.env.get("LEELA_CHAKRA_AI_BOT_TOKEN")) {
  throw new Error("LEELA_CHAKRA_AI_BOT_TOKEN is not set");
}

export const leelaChakraBot = new Bot(Deno.env.get("LEELA_CHAKRA_AI_BOT_TOKEN") || "");

export const handleUpdateLeelaChakra = webhookCallback(leelaChakraBot, "std/http");
