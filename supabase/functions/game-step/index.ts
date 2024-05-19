// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { GameStep } from "../_shared/types/index.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { supabase } from "../_shared/supabase/index.ts";
console.log("Hello from Functions!");

Deno.serve(async (req) => {
  const { roll, result }: { roll: number; result: GameStep[] } = await req
    .json();
  console.log(roll, "roll");
  console.log(result, "result");
  const TOTAL = 72;
  const WIN_LOKA = 68;
  const MAX_ROLL = 6;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*");

  console.log(userData, "userData");

  const {
    loka,
    previous_loka,
    is_finished,
    consecutive_sixes,
    position_before_three_sixes,
  }: GameStep = result[result.length - 1];

  let newLoka = loka + roll;
  console.log(newLoka, "newLoka");
  let direction: GameStep["direction"];
  let new_consecutive_sixes: number;
  let new_position_before_three_sixes = position_before_three_sixes;

  if (roll == MAX_ROLL) {
    new_position_before_three_sixes = loka;
    new_consecutive_sixes = consecutive_sixes + 1;
    console.log(
      new_position_before_three_sixes,
      "new_position_before_three_sixes",
    );
    if (consecutive_sixes == 2) {
      newLoka = position_before_three_sixes;
      new_consecutive_sixes = 0;
      direction = "snake 🐍";
      const output: GameStep = {
        loka: newLoka,
        previous_loka: loka,
        direction,
        consecutive_sixes: new_consecutive_sixes,
        position_before_three_sixes: new_position_before_three_sixes,
      };
      return new Response(
        JSON.stringify(output),
        { headers: { "Content-Type": "application/json" } },
      );
    }
  } else {
    new_consecutive_sixes = 0;
  }

  // Check for re-entry condition
  if (is_finished && roll === MAX_ROLL) {
    // Если игра завершена и выброшено 6, игрок возвращается в игру на позицию 6
    const output: GameStep = {
      loka: 6,
      previous_loka: loka,
      direction: "step 🚶🏼",
      consecutive_sixes: new_consecutive_sixes,
      position_before_three_sixes: new_position_before_three_sixes,
      is_finished: false, // Устанавливаем is_finished в false, так как игрок вернулся в игру
    };
    console.log(output, "output");
    return new Response(
      JSON.stringify(output),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Check for victory conditions
  if (!is_finished && newLoka === WIN_LOKA) {
    const output: GameStep = {
      loka: newLoka,
      previous_loka: loka,
      direction: "win 🕉",
      consecutive_sixes: new_consecutive_sixes,
      position_before_three_sixes: new_position_before_three_sixes,
      is_finished: true,
    };
    console.log(output, "output");
    return new Response(
      JSON.stringify(output),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Snakes that lead the player downwards
  if (newLoka == 12) {
    newLoka = 8;
    direction = "snake 🐍";
  } else if (newLoka == 16) {
    newLoka = 4;
    direction = "snake 🐍";
  } else if (newLoka == 24) {
    newLoka = 7;
    direction = "snake 🐍";
  } else if (newLoka == 29) {
    newLoka = 6;
    direction = "snake 🐍";
  } else if (newLoka == 44) {
    newLoka = 9;
    direction = "snake 🐍";
  } else if (newLoka == 52) {
    newLoka = 35;
    direction = "snake 🐍";
  } else if (newLoka == 55) {
    newLoka = 3;
    direction = "snake 🐍";
  } else if (newLoka == 61) {
    newLoka = 13;
    direction = "snake 🐍";
  } else if (newLoka == 63) {
    newLoka = 2;
    direction = "snake 🐍";
  } else if (newLoka == 72) {
    newLoka = 51;
    direction = "snake 🐍";
  } // Arrows that lead the player upwards
  else if (newLoka == 10) {
    newLoka = 23;
    direction = "arrow 🏹";
  } else if (newLoka == 17) {
    newLoka = 69;
    direction = "arrow 🏹";
  } else if (newLoka == 20) {
    newLoka = 32;
    direction = "arrow 🏹";
  } else if (newLoka == 22) {
    newLoka = 60;
    direction = "arrow 🏹";
  } else if (newLoka == 27) {
    newLoka = 41;
    direction = "arrow 🏹";
  } else if (newLoka == 28) {
    newLoka = 50;
    direction = "arrow 🏹";
  } else if (newLoka == 37) {
    newLoka = 66;
    direction = "arrow 🏹";
  } else if (newLoka == 45) {
    newLoka = 67;
    direction = "arrow 🏹";
  } else if (newLoka == 46) {
    newLoka = 62;
    direction = "arrow 🏹";
  } else if (newLoka == 54) {
    newLoka = 68;
    direction = "arrow 🏹";
  } else if (newLoka > TOTAL) {
    direction = "stop";
    // Player overshoots the goal, stays in place
    newLoka = loka;
  } else {
    direction = "step 🚶🏼";
  }

  // Update player position and other properties

  const output: GameStep = {
    loka: newLoka,
    previous_loka: loka,
    direction,
    consecutive_sixes: new_consecutive_sixes,
    position_before_three_sixes: new_position_before_three_sixes,
  };

  return new Response(
    JSON.stringify(output),
    { headers: { "Content-Type": "application/json" } },
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/game-step' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

//supabase functions serve --env-file supabase/functions/.env --no-verify-jwt
// supabase functions deploy game-step --no-verify-jwt
