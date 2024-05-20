// Import required libraries and modules
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { delay } from "https://deno.land/x/delay@v0.2.0/mod.ts";
import { supabase, supabaseLocal } from "../_shared/supabase/index.ts";
import { GameStep } from "../_shared/types/index.ts";

// // Test the creation and functionality of the Supabase client
const testClientCreation = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Invalid Supabase client: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Client Creation Test", testClientCreation);

const testGameStepFunction = async (roll: number, result: GameStep[]) => {
  const { data: func_data, error: func_error } = await supabaseLocal.functions
    .invoke(
      "game-step",
      {
        body: { roll, result },
      },
    );
  if (func_error) {
    throw new Error("Invalid response: " + func_error.message);
  }
  return func_data;
};

// // Register and run the tests

Deno.test("Test roll resulting in win 🕉", async () => {
  const result: GameStep[] = [
    {
      loka: 67,
      direction: "win 🕉",
      consecutive_sixes: 0,
      position_before_three_sixes: 0,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 67);
});

Deno.test("Test roll resulting in re-entry to game", async () => {
  const result: GameStep[] = [
    {
      loka: 68,
      previous_loka: 68,
      direction: "step 🚶🏼",
      consecutive_sixes: 0,
      position_before_three_sixes: 68,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(6, result);
  assertEquals(response.loka, 6);
  assertEquals(response.previous_loka, 68);
  assertEquals(response.direction, "step 🚶🏼");
  assertEquals(response.consecutive_sixes, 1);
  assertEquals(response.position_before_three_sixes, 68);
  assertEquals(response.is_finished, false);
});

Deno.test("Test roll 1 from start", async () => {
  const result: GameStep[] = [
    {
      loka: 68,
      direction: "step 🚶🏼",
      consecutive_sixes: 0,
      position_before_three_sixes: 68,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 68);
  assertEquals(response.previous_loka, 68);
  assertEquals(response.direction, "stop 🛑");
  assertEquals(response.consecutive_sixes, 0);
  assertEquals(response.position_before_three_sixes, 68);
  assertEquals(response.is_finished, true);
});

Deno.test("Test roll 2 from start", async () => {
  const result: GameStep[] = [
    {
      loka: 68,
      direction: "step 🚶🏼",
      consecutive_sixes: 0,
      position_before_three_sixes: 68,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(2, result);
  assertEquals(response.loka, 68);
  assertEquals(response.previous_loka, 68);
  assertEquals(response.direction, "stop 🛑");
  assertEquals(response.consecutive_sixes, 0);
  assertEquals(response.position_before_three_sixes, 68);
  assertEquals(response.is_finished, true);
});

Deno.test("Test roll 3 from start", async () => {
  const result: GameStep[] = [
    {
      loka: 68,
      direction: "step 🚶🏼",
      consecutive_sixes: 0,
      position_before_three_sixes: 68,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(3, result);
  assertEquals(response.loka, 68);
  assertEquals(response.previous_loka, 68);
  assertEquals(response.direction, "stop 🛑");
  assertEquals(response.consecutive_sixes, 0);
  assertEquals(response.position_before_three_sixes, 68);
  assertEquals(response.is_finished, true);
});

Deno.test("Test roll 4 from start", async () => {
  const result: GameStep[] = [
    {
      loka: 68,
      direction: "step 🚶🏼",
      consecutive_sixes: 0,
      position_before_three_sixes: 68,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(4, result);
  assertEquals(response.loka, 68);
  assertEquals(response.previous_loka, 68);
  assertEquals(response.direction, "stop 🛑");
  assertEquals(response.consecutive_sixes, 0);
  assertEquals(response.position_before_three_sixes, 68);
  assertEquals(response.is_finished, true);
});

Deno.test("Test roll 5 from start", async () => {
  const result: GameStep[] = [
    {
      loka: 68,
      direction: "step 🚶🏼",
      consecutive_sixes: 0,
      position_before_three_sixes: 68,
      is_finished: true,
    },
  ];
  const response = await testGameStepFunction(5, result);
  assertEquals(response.loka, 68);
  assertEquals(response.previous_loka, 68);
  assertEquals(response.direction, "stop 🛑");
  assertEquals(response.consecutive_sixes, 0);
  assertEquals(response.position_before_three_sixes, 68);
  assertEquals(response.is_finished, true);
});

// deno test --allow-all --env=supabase/functions/.env supabase/functions/tests/game-step-test.ts
