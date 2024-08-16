import OpenAI from 'https://deno.land/x/openai@v4.55.7/mod.ts'
import { supabase } from '../_shared/supabase/index.ts';

console.log("Инициализация функции create-images")

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

const openai = new OpenAI({ apiKey: openaiApiKey })

console.log("Клиенты Supabase и OpenAI инициализированы")

interface Row {
  id: number | string;
  [key: string]: any;
}

const bannedWords = ['sex', 'desire', 'karma', 'chakra', /* ... */];

function sanitizePrompt(prompt: string): string {
  const safeWords = prompt.split(' ')
    .filter(word => !bannedWords.includes(word.toLowerCase()))
    .join(' ');
  return `${safeWords}`;
}

Deno.serve(async (req) => {
  console.log("Получен новый запрос")
  
  try {
    const { tableName, columnName } = await req.json()
    console.log(`Получены параметры: tableName=${tableName}, columnName=${columnName}`)

    const { data: rows, error } = await supabase
      .from(tableName)
      .select("*")
    
    if (error) throw error
    console.log(`Получено ${rows?.length ?? 0} записей из таблицы ${tableName}`)

    if (!rows || !Array.isArray(rows)) {
      throw new Error("Неверный формат данных, полученных из базы данных")
    }

    for (const row of rows as Row[]) {
      if (typeof row !== 'object' || row === null || !('id' in row)) {
        console.log(`Пропущена некорректная запись: ${JSON.stringify(row)}`)
        continue
      }

      if (row.image) {
        console.log(`Пропущена запись с id=${row.id}: уже есть изображение`)
        continue
      }

      const id = row.id
      const prompt = sanitizePrompt(row[columnName])

      if (typeof prompt !== 'string') {
        console.log(`Пропущена запись с id=${id}: некорректный prompt`)
        continue
      }
      
      console.log(`Обработка записи с id=${id}`)
      console.log(`Генерация изображения для prompt: "${prompt}"`)

      let imageUrl: string | null = null;
      try {
        const response = await openai.images.generate({
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        imageUrl = response.data[0].url || null;
        console.log(`Получен URL изображения: ${imageUrl}`);
      } catch (error) {
        console.error(`Ошибка генерации изображения: ${error.message}`);
        imageUrl = null;
      }

      if (imageUrl) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ image: imageUrl })
          .eq('id', id)

        if (updateError) throw updateError
        console.log(`Обновлена запись с id=${id}`)
      }
    }

    console.log("Все записи успешно обработаны")
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(`Произошла ошибка: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

console.log("Функция create-images готова к обработке запросов")