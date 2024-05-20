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
// const testClientCreation = async () => {
//   // Test a simple query to the database
//   const { data: table_data, error: table_error } = await supabase
//     .from("users")
//     .select("*")
//     .limit(1);

//   if (table_error) {
//     throw new Error("Invalid Supabase client: " + table_error.message);
//   }
//   assert(table_data, "Data should be returned from the query.");
// };
// Deno.test("Client Creation Test", testClientCreation);

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

// // // Register and run the tests

// Deno.test("Test roll resulting in win 🕉", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 67,
//       direction: "win 🕉",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 0,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(1, result);
//   assertEquals(response.loka, 67);
// });

// Deno.test("Test roll resulting in re-entry to game", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 68,
//       previous_loka: 68,
//       direction: "step 🚶🏼",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 68,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(6, result);
//   assertEquals(response.loka, 6);
//   assertEquals(response.previous_loka, 68);
//   assertEquals(response.direction, "step 🚶🏼");
//   assertEquals(response.consecutive_sixes, 1);
//   assertEquals(response.position_before_three_sixes, 68);
//   assertEquals(response.is_finished, false);
// });

// Deno.test("Test roll 1 from start", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 68,
//       direction: "step 🚶🏼",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 68,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(1, result);
//   assertEquals(response.loka, 68);
//   assertEquals(response.previous_loka, 68);
//   assertEquals(response.direction, "stop 🛑");
//   assertEquals(response.consecutive_sixes, 0);
//   assertEquals(response.position_before_three_sixes, 68);
//   assertEquals(response.is_finished, true);
// });

// Deno.test("Test roll 2 from start", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 68,
//       direction: "step 🚶🏼",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 68,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(2, result);
//   assertEquals(response.loka, 68);
//   assertEquals(response.previous_loka, 68);
//   assertEquals(response.direction, "stop 🛑");
//   assertEquals(response.consecutive_sixes, 0);
//   assertEquals(response.position_before_three_sixes, 68);
//   assertEquals(response.is_finished, true);
// });

// Deno.test("Test roll 3 from start", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 68,
//       direction: "step 🚶🏼",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 68,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(3, result);
//   assertEquals(response.loka, 68);
//   assertEquals(response.previous_loka, 68);
//   assertEquals(response.direction, "stop 🛑");
//   assertEquals(response.consecutive_sixes, 0);
//   assertEquals(response.position_before_three_sixes, 68);
//   assertEquals(response.is_finished, true);
// });

// Deno.test("Test roll 4 from start", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 68,
//       direction: "step 🚶🏼",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 68,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(4, result);
//   assertEquals(response.loka, 68);
//   assertEquals(response.previous_loka, 68);
//   assertEquals(response.direction, "stop 🛑");
//   assertEquals(response.consecutive_sixes, 0);
//   assertEquals(response.position_before_three_sixes, 68);
//   assertEquals(response.is_finished, true);
// });

// Deno.test("Test roll 5 from start", async () => {
//   const result: GameStep[] = [
//     {
//       loka: 68,
//       direction: "step 🚶🏼",
//       consecutive_sixes: 0,
//       position_before_three_sixes: 68,
//       is_finished: true,
//     },
//   ];
//   const response = await testGameStepFunction(5, result);
//   assertEquals(response.loka, 68);
//   assertEquals(response.previous_loka, 68);
//   assertEquals(response.direction, "stop 🛑");
//   assertEquals(response.consecutive_sixes, 0);
//   assertEquals(response.position_before_three_sixes, 68);
//   assertEquals(response.is_finished, true);
// });

// Test cases for snakes
Deno.test("Test snake at 12", async () => {
  const result: GameStep[] = [{
    loka: 11,
    previous_loka: 10,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 8);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 16", async () => {
  const result: GameStep[] = [{
    loka: 15,
    previous_loka: 14,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 4);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 24", async () => {
  const result: GameStep[] = [{
    loka: 23,
    previous_loka: 22,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 7);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 29", async () => {
  const result: GameStep[] = [{
    loka: 28,
    previous_loka: 27,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 6);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 44", async () => {
  const result: GameStep[] = [{
    loka: 43,
    previous_loka: 42,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 9);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 52", async () => {
  const result: GameStep[] = [{
    loka: 51,
    previous_loka: 50,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 35);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 55", async () => {
  const result: GameStep[] = [{
    loka: 54,
    previous_loka: 53,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 3);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 61", async () => {
  const result: GameStep[] = [{
    loka: 60,
    previous_loka: 59,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 13);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 63", async () => {
  const result: GameStep[] = [{
    loka: 62,
    previous_loka: 61,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 2);
  assertEquals(response.direction, "snake 🐍");
});

Deno.test("Test snake at 72", async () => {
  const result: GameStep[] = [{
    loka: 71,
    previous_loka: 70,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 51);
  assertEquals(response.direction, "snake 🐍");
});

// Test cases for arrows
Deno.test("Test arrow at 10", async () => {
  const result: GameStep[] = [{
    loka: 9,
    previous_loka: 8,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 23);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 17", async () => {
  const result: GameStep[] = [{
    loka: 16,
    previous_loka: 15,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 69);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 20", async () => {
  const result: GameStep[] = [{
    loka: 19,
    previous_loka: 18,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 32);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 22", async () => {
  const result: GameStep[] = [{
    loka: 21,
    previous_loka: 20,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 60);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 27", async () => {
  const result: GameStep[] = [{
    loka: 26,
    previous_loka: 25,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 41);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 28", async () => {
  const result: GameStep[] = [{
    loka: 27,
    previous_loka: 26,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 50);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 37", async () => {
  const result: GameStep[] = [{
    loka: 36,
    previous_loka: 35,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 66);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 45", async () => {
  const result: GameStep[] = [{
    loka: 44,
    previous_loka: 43,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 67);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 46", async () => {
  const result: GameStep[] = [{
    loka: 45,
    previous_loka: 44,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 62);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test arrow at 54", async () => {
  const result: GameStep[] = [{
    loka: 53,
    previous_loka: 52,
    direction: "step 🚶🏼",
    consecutive_sixes: 0,
    position_before_three_sixes: 0,
    is_finished: false,
  }];
  const response = await testGameStepFunction(1, result);
  assertEquals(response.loka, 68);
  assertEquals(response.direction, "arrow 🏹");
});

Deno.test("Test rolling six three times", async () => {
  const result: GameStep[] = [
    {
      loka: 10,
      previous_loka: 16,
      direction: "step 🚶🏼",
      consecutive_sixes: 2,
      position_before_three_sixes: 4,
      is_finished: false,
    },
  ];
  const response = await testGameStepFunction(6, result);
  assertEquals(response.loka, 4);
  assertEquals(response.previous_loka, 16);
  assertEquals(response.direction, "snake 🐍");
  assertEquals(response.consecutive_sixes, 0);
  assertEquals(response.position_before_three_sixes, 4);
  assertEquals(response.is_finished, false);
});

// deno test --allow-all --env=supabase/functions/.env supabase/functions/tests/game-step-test.ts
