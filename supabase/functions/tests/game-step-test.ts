// Import required libraries and modules
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { delay } from "https://deno.land/x/delay@v0.2.0/mod.ts";
import { supabase } from "../_shared/supabase/index.ts";
import { GameStep } from "../_shared/types/index.ts";

const testGameStepFunction = async (roll: number, result: GameStep[]) => {
  const { data: func_data, error: func_error } = await supabase.functions
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
      "loka": 67,
      "previous_loka": 61,
      "direction": "step 🚶🏼",
      "consecutive_sixes": 0,
      "position_before_three_sixes": 0,
    },
  ];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 68);
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

// // Test the creation and functionality of the Supabase client
// const testClientCreation = async () => {
//   // Test a simple query to the database
//   const { data: table_data, error: table_error } = await supabase
//     .from("users")
//     .select("*")
//     .limit(1);
// console.log(table_data, "table_data");
//   if (table_error) {
//     throw new Error("Invalid Supabase client: " + table_error.message);
//   }
//   assert(table_data, "Data should be returned from the query.");
// };
// Deno.test("Client Creation Test", testClientCreation);
