import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { client } from "../_shared/supabase/index.ts";
import { translateText } from "../_shared/translateText.ts";

const supabase = client();

serve(async (req: Request) => {
  const { table } = await req.json();
  const { data: dataToTranslate, error } = await supabase.from(table).select(
    "*",
  );

  if (error) {
    console.error("Error fetching data from Supabase:", error.message);
    return new Response("Error fetching data from Supabase", { status: 500 });
  }

  for (const row of dataToTranslate) {
    const {
      short_desc_en,
      short_desc_ru: defaultRu,
    } = row;
    if (defaultRu === null) {
      const short_desc_ru = await translateText(short_desc_en, "ru");

      console.log(short_desc_ru, `✅short: ${short_desc_ru}`);
      await supabase.from(table).update([
        { short_desc_ru },
      ]).match({ id: row.id });
    } else {
      console.log("❌short_desc_ru is not null: ", defaultRu);
    }
  }

  console.log("✅✨Translation and update completed successfully.");
  return new Response("Translation and update completed successfully", {
    status: 200,
  });
});
