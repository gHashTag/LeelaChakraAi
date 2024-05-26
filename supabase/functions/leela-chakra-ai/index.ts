// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import {
  Context,
  GrammyError,
  HttpError,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import {
  handleUpdateLeelaChakra,
  leelaChakraBot,
} from "../_shared/telegram/bots.ts";
import { getAiFeedbackFromSupabase } from "../_shared/supabase/ai.ts";
import {
  getBiggest,
  getCorrects,
  getLastCallback,
  getQuestion,
  resetProgress,
  updateProgress,
  updateResult,
} from "../_shared/supabase/progress.ts";
import { createUser, getUid } from "../_shared/supabase/users.ts";
import { pathIncrement } from "../path-increment.ts";
import { gameStep, getLastStep } from "../_shared/supabase/game.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

console.log("Hello from LeelaChakra Ai!");
await leelaChakraBot.api.setMyCommands([
  {
    command: "/start",
    description: "Start chatting with LeelaChakra Ai",
  },
  {
    command: "/course",
    description: "Start test with LeelaChakra Ai",
  },
  // {
  //   command: "/room",
  //   description: "Create a room",
  // },
]);

leelaChakraBot.command("start", async (ctx: Context) => {
  console.log("start");
  if (!ctx.from) return;
  await ctx.replyWithChatAction("typing"); // Отправка действия набора сообщения в чате
  console.log("🥀create user:", ctx.from);
  await createUser({
    telegram_id: ctx.from.id,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
    username: ctx.from.username,
    is_bot: ctx.from.is_bot,
    language_code: ctx.from.language_code,
  });
  const isRu = ctx.from?.language_code === "ru";
  await ctx.reply(
    isRu
      ? `🔮 Добро пожаловать в игру самопознания "Лила Чакра", ${ctx.from?.first_name}! 🔮\n\n🌟 В этой увлекательной игре ты отправишься в захватывающее путешествие через чакры, открывая тайны и возможности, скрытые внутри тебя.\n\n💫 Готов ли ты погрузиться в мир духовного роста, встретить свое истинное "Я" и раскрыть потенциал своих энергетических центров? С "Лилой Чакра" ты сможешь узнать глубже себя, обрести гармонию и понимание своего внутреннего мира.\n\n🔮 Пусть каждое испытание в игре принесет тебе новое понимание, мудрость и вдохновение. Дерзай и открой двери своего подсознания, исследуя таинственные чакры и обретая внутреннюю гармонию!`
      : `🔮 Welcome to the Leela Chakra Self-Discovery Game, ${ctx.from?.first_name}! 🔮\n\n🌟 In this exciting game, you will embark on an exciting journey through the chakras, discovering the secrets and possibilities hidden within you.\n\n💫 Are you ready to dive into the world of spiritual growth, meet your true self and unlock the potential of your energy centers? With "Leela Chakra" you can learn more about yourself, find harmony and understanding of your inner world.\n\n🔮 May each challenge in the game bring you new insights, wisdom and inspiration. Dare to open the doors of your subconscious mind, exploring the mysterious chakras and finding inner harmony!`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {text: isRu ? "Начать тест" : "Start test", callback_data: "start_test"},
            {text: isRu ? "Начать игру" : "Start game", callback_data: "make_step"}
          ],
        ],
      },
    },
  );
});

leelaChakraBot.command("step", async (ctx) => {
  console.log("step");
  await ctx.replyWithChatAction("typing");
  const isRu = ctx.from?.language_code === "ru";
 
  ctx.reply(isRu ? "Чтобы сделать шаг, нажмите кнопку ниже!" : "To make a step, click the button below!", {
    reply_markup: {
      inline_keyboard: [
        [{text: isRu ? "Сделать шаг" : "Make a step", callback_data: "make_step"}]
      ]
    }
  })
});

leelaChakraBot.command("course", async (ctx) => {
  console.log("course");
  await ctx.replyWithChatAction("typing");
  const isRu = ctx.from?.language_code === "ru";
  await ctx.reply(
    isRu
      ? `Чтобы начать тест, нажмите кнопку ниже!`
      : `To start the test, click the button below!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Start test!", callback_data: "start_test" }],
        ],
      },
    },
  );
  return
});

leelaChakraBot.on("message:text", async (ctx) => {
  try {
    await ctx.replyWithChatAction("typing");
    const query = ctx?.message?.text;

    const language_code = ctx.from.language_code || "en";

    if (query) {
      if (!ctx.from.username) {
        await ctx.reply("You are not registered yet. Please, register to use this bot.");
        throw new Error("User is not registered yet");
      }
      const { ai_content } = await getAiFeedbackFromSupabase({
        query,
        username: ctx.from.username,
        language_code,
      });
      console.log("💤content", ai_content)
      await ctx.reply(ai_content, { parse_mode: "Markdown" });
      return;
    }
  } catch (error) {
    console.log("🚀 error", error);
  }
});

leelaChakraBot.on("callback_query:data", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx);
  const callbackData = ctx.callbackQuery.data;
  const isHaveAnswer = callbackData.split("_").length === 4;
  const isRu = ctx.from?.language_code === "ru";

  if (callbackData.startsWith("make_step")){
    console.log("step...");
    await ctx.replyWithChatAction("typing");
  
    const roll = Math.floor(Math.random() * 6) + 1;
  
  if (ctx.from?.id) {
    const user_id = await getUid(ctx.from?.username || "");
    if (!user_id) throw new Error("User not found");
    const lastStep = await getLastStep(user_id.toString())
    const step = await gameStep({roll: roll, response: [lastStep], telegram_id: ctx.from?.id.toString()})
    console.log("step", step)
    await ctx.reply(`${step.direction} Your plan: ${step.loka}`)
    return
  }
  await ctx.reply("Не получается найти ваш telegram_id")
  return
  }
  if (callbackData.startsWith("leela_")) {
    await ctx.reply("🤖 bem bam hello from leela");
    return;
  }

  if (callbackData === "start_test") {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
      await resetProgress({
        username: ctx.callbackQuery.from.username || "",
        language: "leelachakra",
      });
      const questionContext = {
        lesson_number: 1,
        subtopic: 1,
      };

      const questions = await getQuestion({
        ctx: questionContext,
        language: "leelachakra",
      });
      if (questions.length > 0) {
        const {
          topic: ruTopic,
          image_lesson_url,
          topic_en: enTopic,
        } = questions[0];

        const user_id = await getUid(ctx.callbackQuery.from.username || "");
        if (!user_id) {
          await ctx.reply("Пользователь не найден.");
          return;
        }
        const topic = isRu ? ruTopic : enTopic;
        const allAnswers = await getCorrects({
          user_id: user_id.toString(),
          language: "all",
        });
        // Формируем сообщение
        const messageText =
          `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b>Total tokens: ${allAnswers} $LEELA</b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: "Перейти к вопросу",
            callback_data: `leelachakra_01_01`,
          }],
        ];

        if (image_lesson_url) {
          // Отправляем сообщение
          await ctx.replyWithPhoto(image_lesson_url || "", {
            caption: messageText,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard },
          });
          return;
        } else {
          await ctx.reply(messageText, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard },
          });
          return;
        }
      } else {
        await ctx.reply("Вопросы не найдены.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (!isHaveAnswer) {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
      const [language, lesson, subtopic] = callbackData.split("_");
      let questions;
      if (!isNaN(Number(lesson)) && !isNaN(Number(subtopic))) {
        // Значения корректны, вызываем функцию.
        const getQuestionContext = {
          lesson_number: Number(lesson),
          subtopic: Number(subtopic),
        };
        questions = await getQuestion({
          ctx: getQuestionContext,
          language,
        });
      } else {
        // Одно из значений некорректно, обрабатываем ошибку.
        console.error(
          "Одно из значений некорректно(96):",
          lesson,
          subtopic,
          callbackData,
        );
        await ctx.reply(
          isRu
            ? "Одно из значений некорректно. Пожалуйста, проверьте данные."
            : "One of the values is incorrect. Please check the data.",
        );
        return;
      }
      const {
        question: ruQuestion,
        variant_0: ruVariant_0,
        variant_1: ruVariant_1,
        variant_2: ruVariant_2,
        question_en: enQuestion,
        variant_0: enVariant_0,
        variant_1: enVariant_1,
        variant_2: enVariant_2,
        id,
        image_lesson_url,
      } = questions[0];

      const question = isRu ? ruQuestion : enQuestion;
      const variant_0 = isRu ? ruVariant_0 : enVariant_0;
      const variant_1 = isRu ? ruVariant_1 : enVariant_1;
      const variant_2 = isRu ? ruVariant_2 : enVariant_2;

      const user_id = await getUid(ctx.callbackQuery.from.username || "");
      if (!user_id) {
        await ctx.reply("Пользователь не найден.");
        return;
      }
      console.log(user_id);
      const allAnswers = await getCorrects({
        user_id: user_id.toString(),
        language: "all",
      });
      // Формируем сообщение
      const messageText =
        `<b>Вопрос №${id}</b>\n\n${question}\n\n<b> Total tokens: ${allAnswers} $LEELA</b>`;

      // Формируем кнопки
      const inlineKeyboard = [
        [{
          text: variant_0 || "Вариант 1",
          callback_data: `${callbackData}_0`,
        }],
        [{
          text: variant_1 || "Вариант 2",
          callback_data: `${callbackData}_1`,
        }],
        [{
          text: variant_2 || "Не знаю",
          callback_data: `${callbackData}_2`,
        }],
      ];

      if (image_lesson_url) {
        // Отправляем сообщение
        await ctx.editMessageCaption({
          reply_markup: { inline_keyboard: inlineKeyboard },
          caption: messageText,
          parse_mode: "HTML",
        });
      } else {
        await ctx.editMessageText(messageText, {
          reply_markup: { inline_keyboard: inlineKeyboard },
          parse_mode: "HTML",
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (isHaveAnswer) {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
      const [language, lesson_number, subtopic, answer] = callbackData.split(
        "_",
      );
      const questionContext = {
        lesson_number: Number(lesson_number),
        subtopic: Number(subtopic),
      };

      const questions = await getQuestion({ ctx: questionContext, language });
      if (questions.length > 0) {
        const {
          correct_option_id,
          id
        } = questions[0];

        const user_id = await getUid(ctx.callbackQuery.from.username || "");
        if (!user_id) {
          await ctx.reply("Пользователь не найден.");
          return;
        }

        const path = `${language}_${lesson_number}_${subtopic}`;
        const biggestSubtopic = await getBiggest({
          lesson_number: Number(lesson_number),
          language,
        });

        let isTrueAnswer = null;
        if (Number(correct_option_id) === Number(answer)) {
          isTrueAnswer = true;
          await ctx.reply("✅");
        } else {
          isTrueAnswer = false;
          await ctx.reply("❌");
        }
        await updateProgress({
          user_id: user_id.toString(),
          isTrue: isTrueAnswer,
          language,
        });
        const newPath = await pathIncrement({
          path,
          isSubtopic: Number(biggestSubtopic) === Number(subtopic) ? false : true,
        });
        const correctAnswers = await getCorrects({
          user_id: user_id.toString(),
          language,
        });
        const allAnswers = await getCorrects({
          user_id: user_id.toString(),
          language: "all",
        });

        const lastCallbackId = await getLastCallback(language);
        console.log(lastCallbackId);
        if (lastCallbackId) {
          if (questions[0].id === lastCallbackId) {
            const correctProcent = (correctAnswers / lastCallbackId) * 100;
            if (correctProcent >= 80) {
              await updateResult({
                user_id: user_id.toString(),
                language,
                value: true,
              });
              await ctx.reply(
                isRu
                  ? `<b>🥳 Поздравляем, вы прошли тест! </b>\n\n Total tokens: ${allAnswers} $LEELA`
                  : `<b>🥳 Congratulations, you passed the test!</b>\n\n Total tokens: ${allAnswers} $LEELA`,
                { parse_mode: "HTML" },
              );
            } else {
              await updateResult({
                user_id: user_id.toString(),
                language,
                value: false,
              });
              await ctx.reply(
                isRu
                  ? `<b>🥲 Вы не прошли тест, но это не помешает вам развиваться! </b>\n\n Total tokens: ${allAnswers} $LEELA`
                  : `<b>🥲 You didn't pass the test, but that won't stop you from developing!</b>\n\n Total tokens: ${allAnswers} $LEELA`,
                { parse_mode: "HTML" },
              );
            }
          }
          const [newLanguage, newLesson, newSubtopic] = newPath.split("_");
          const getQuestionContext = {
            lesson_number: Number(newLesson),
            subtopic: Number(newSubtopic),
          };
          const newQuestions = await getQuestion({
            ctx: getQuestionContext,
            language,
          });
          const { topic: ruTopic, image_lesson_url, topic_en: enTopic } =
            newQuestions[0];
          const topic = isRu ? ruTopic : enTopic;
          // Формируем сообщение
          const messageText =
            `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b> Total tokens: ${allAnswers} $LEELA</b>`;

          // Формируем кнопки
          const inlineKeyboard = [
            [{
              text: "Перейти к вопросу",
              callback_data: newPath,
            }],
          ];
          if (image_lesson_url) {
            // Отправляем сообщение
            await ctx.replyWithPhoto(image_lesson_url, {
              caption: messageText,
              parse_mode: "HTML",
              reply_markup: { inline_keyboard: inlineKeyboard },
            });
            return;
          } else {
            await ctx.reply(messageText, {
              parse_mode: "HTML",
              reply_markup: { inline_keyboard: inlineKeyboard },
            });
            return;
          }
        } else {
          await ctx.reply(isRu ? "Вопросы не найдены." : "No questions found.");
        }
      } else {
        console.error("Invalid callback(289)");
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }
});

leelaChakraBot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
    throw e;
  } else {
    console.error("Unknown error:", e);
    throw e;
  }
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      console.log("not allowed");
      return new Response("not allowed", { status: 405 });
    }

    console.log("req", req.body);
    return await handleUpdateLeelaChakra(req);
  } catch (err) {
    throw new Error("Error while handling request", { cause: err });
  }
});

// supabase functions deploy leela-chakra-ai --no-verify-jwt
