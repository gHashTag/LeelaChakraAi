import { GameStepResultT } from "../types/index.ts";
import { supabase, supabaseLocal } from "./index.ts";

export async function gameStep({ roll, response, telegram_id }: GameStepResultT) {
  // Найти user_id по telegram_id
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("user_id")
    .eq("telegram_id", telegram_id)
    .single();

  if (userError) {
    throw new Error(`35 35 35 35 35 ${userError.message}`);
  }

  const user_id = userData.user_id;

  const { data: stepData, error: stepError } = await supabase.functions.invoke("game-step", {
    body: JSON.stringify({
        "roll": roll,
        "result": [
            ...response
        ]
    }),
  });
  if (stepError) {
    throw stepError
  }

  console.log(stepData, "stepData")

  // Внести объект stepData в таблицу game
  const { data: gameInfo, error: gameError } = await supabase
    .from("game")
    .insert({
      user_id: user_id,
      roll: roll,
      loka: stepData.loka,
      previous_loka: stepData.previous_loka,
      direction: stepData.direction,
      consecutive_sixes: stepData.consecutive_sixes,
      position_before_three_sixes: stepData.position_before_three_sixes,
      is_finished: stepData.is_finished
    });

  if (gameError) {
    throw new Error(gameError.message);
  }

  console.log(stepData, "stepData");
  return stepData;
}

export async function getLastStep(user_id: string) {
  const { data: lastStepData, error: lastStepError } = await supabase
    .from("game")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastStepError) {
    throw new Error(lastStepError.message);
  }

  if (lastStepData.length === 0) {
    return {
      "loka": 1,
      "direction": "step 🚶🏼",
      "consecutive_sixes": 0,
      "position_before_three_sixes": 0,
      "is_finished": false
    }
  }

  return lastStepData;
}

