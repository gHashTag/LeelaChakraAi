// Import required libraries and modules
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { delay } from "https://deno.land/x/delay@v0.2.0/mod.ts";
import { supabase } from "../_shared/supabase/index.ts";

// Test the creation and functionality of the Supabase client
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

// Register and run the tests
Deno.test("Client Creation Test", testClientCreation);
