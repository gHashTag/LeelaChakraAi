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
  updateProgress,
  updateResult,
} from "../_shared/supabase/progress.ts";
import { createUser, getUid, updateUser, checkAndUpdate, getSupabaseUser, getLanguage, setLanguage } from "../_shared/supabase/users.ts";
import { pathIncrement } from "../path-increment.ts";
import { gameStep, getLastStep, updateHistory, getPlan, getPlanByUserId } from "../_shared/supabase/game.ts";
import { checkSubscriptionByTelegramId, sendPaymentInfo, isLimitAi } from "../_shared/supabase/payments.ts";
import { checkAndReturnUser } from "../_shared/supabase/users.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

console.log("Hello from LeelaChakra Ai!");

const isRu = async (ctx: Context) => {
	if (!ctx.from) throw new Error("User not found");
	const language = await getLanguage(ctx.from?.id.toString());
	if (!language) return ctx.from.language_code === "ru"
	return language === "ru";
}

await leelaChakraBot.api.setMyCommands([
  {
    command: "/start",
    description: "Start chatting with LeelaChakra Ai",
  },
  {
    command: "/course",
    description: "Start test with LeelaChakra Ai",
  },
  {
    command: "/step",
    description: "Make a step",
  },
  {
    command: "/buy",
    description: "Buy a plan",
  }
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
  const lang = await isRu(ctx)
  await createUser({
    telegram_id: ctx.from.id,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
    username: ctx.from.username,
    is_bot: ctx.from.is_bot,
    language_code: ctx.from.language_code,
  });
  await ctx.reply(
    await lang
      ? `🔮 Добро пожаловать в игру самопознания "Лила Чакра", ${ctx.from?.first_name}! 🔮\n\n🌟 В этой увлекательной игре ты отправишься в захватывающее путешествие через чакры, открывая тайны и возможности, скрытые внутри тебя.\n\n💫 Готов ли ты погрузиться в мир духовного роста, встретить свое истинное "Я" и раскрыть потенциал своих энергетических центров? С "Лилой Чакра" ты сможешь узнать глубже себя, обрести гармонию и понимание своего внутреннего мира.\n\n🔮 Пусть каждое испытание в игре принесет тебе новое понимание, мудрость и вдохновение. Дерзай и открой двери своего подсознания, исследуя таинственные чакры и обретая внутреннюю гармонию!`
      : `🔮 Welcome to the Leela Chakra Self-Discovery Game, ${ctx.from?.first_name}! 🔮\n\n🌟 In this exciting game, you will embark on an exciting journey through the chakras, discovering the secrets and possibilities hidden within you.\n\n💫 Are you ready to dive into the world of spiritual growth, meet your true self and unlock the potential of your energy centers? With "Leela Chakra" you can learn more about yourself, find harmony and understanding of your inner world.\n\n🔮 May each challenge in the game bring you new insights, wisdom and inspiration. Dare to open the doors of your subconscious mind, exploring the mysterious chakras and finding inner harmony!`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {text: lang ? "Начать тест" : "Start test", callback_data: "leelachakra_01_01"},
            {text: lang ? "Начать игру" : "Start game", callback_data: "make_step"}
          ],
        ],
      },
    },
  );
});

leelaChakraBot.command("step", async (ctx) => {
  console.log("step");
  await checkAndUpdate(ctx)
  await ctx.replyWithChatAction("typing");
  const lang = await isRu(ctx)
 
  await ctx.reply(lang ? "Чтобы сделать шаг, нажмите на кубик!" : "To make a move, click on the cube!", {
    reply_markup: {
      inline_keyboard: [
        [{text: "🎲", callback_data: "make_step"}
        ],
        [{text: "Gameboard", web_app: {url: `https://leela-chakra-nextjs.vercel.app/gameboard`}}
        ]
      ],
    }
  })
  return
});

leelaChakraBot.command("language", async (ctx) => {
	await checkAndUpdate(ctx)
	await ctx.replyWithChatAction("typing");
	if (!ctx.from) throw new Error("User not found");
	const { user } = await checkAndReturnUser(ctx.from?.id.toString());
	const lang = await isRu(ctx)
	user && await ctx.reply(lang ? "🌏 Выберите язык" : "🌏 Select language", {
		reply_markup: {
			inline_keyboard: [
				[{ text: lang ? "🇷🇺 Русский" : "🇷🇺 Russian", callback_data: "select_russian" }],
				[{ text: lang ? "🇬🇧 English" : "🇬🇧 English", callback_data: "select_english" }],
			],
		},
	})
});

leelaChakraBot.command("course", async (ctx) => {
  console.log("course");
  await checkAndUpdate(ctx)
  const theme = "leelachakra"
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  if (!theme) {
    await ctx.reply(lang ? "Тема не найдена." : "Theme not found.");
    return;
  }
    try {
      const questionContext = {
        lesson_number: 1,
        subtopic: 1,
      };

      console.log(questionContext, "questionContext")
      const questions = await getQuestion({
        ctx: questionContext,
        language: theme,
      });
      if (questions.length > 0) {
        const {
          topic: ruTopic,
          image_lesson_url,
          topic_en: enTopic,
          url
        } = questions[0];

        const user_id = await getUid(ctx.from?.username || "");
        if (!user_id) {
          ctx.reply(lang ? "Вы не зарегестрированы." : "You are not registered.");
          return;
        }
        const topic = lang ? ruTopic : enTopic;
        const allAnswers = await getCorrects({
          user_id: user_id.toString(),
          language: "all",
        });
        // Формируем сообщение
        const messageText =
          `${topic}\n\n<i><u>${lang ? "Теперь мы предлагаем вам закрепить полученные знания." : "Now we are offering you to reinforce the acquired knowledge."}</u></i>\n\n<b>${lang ? "Total: " : "Total: "}${allAnswers} $Leela Coin</b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: lang ? "Перейти к вопросу" : "Go to the question",
            callback_data: `${theme}_01_01`,
          }],
        ];

        if (url && lang) {
          console.log(url, "url");
          await ctx.replyWithVideoNote(url);
        }
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
        await ctx.reply(lang ? "Вопросы не найдены." : "No questions found.");
      }
    } catch (error) {
      console.error(error);
    }
});

leelaChakraBot.command("buy", async (ctx) => {
  await checkAndUpdate(ctx)
  const lang = await isRu(ctx)
  await ctx.reply(lang ? `<b>Ученик - 282⭐ в месяц</b>
   - Онлайн игра
   - Самостоятельное обучение в боте с доступом к обучающим материалам
   - ИИ гуру ассистент
   - Поддержка в чате

  <b>Эксперт - 1978⭐ в месяц</b>
   - Все, что в тарифе “Ученик“
   - Групповая онлайн игра с ведущим
   - Анализ индивидуального портрета

<b>Ментор - 19782⭐ в месяц</b>
   -Все, что в тарифе "Эксперт"
   - 4 индивидуальных игры с разбором целей
   - Личная поддержка в чате
   - Чек-лист и анализ игрока`
   : `<b>Student - 282⭐ per month</b>
   - Online game
   - Self-paced learning in the bot with access to educational materials
   - AI guru assistant
   - Chat support

  <b>Expert - 1978⭐ per month</b>
   - Everything in the "Student" plan
   - Group online game with a host
   - Individual portrait analysis

<b>Mentor - 19782⭐ per month</b>
   - Everything in the "Expert" plan
   - 4 individual games with goal analysis
   - Personal chat support
   - Checklist and player analysis`, {
    reply_markup: {
      inline_keyboard: [[{ text: lang ? "Ученик" : "Student", callback_data: "buy_student" }], [{ text: lang ? "Эксперт" : "Expert", callback_data: "buy_expert" }], [{ text: lang ? "Ментор" : "Mentor", callback_data: "buy_mentor" }]],
    },
    parse_mode: "HTML",
  })
  return;
});

leelaChakraBot.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true)
  return;
});

leelaChakraBot.on("message:successful_payment", async (ctx) => {
  await checkAndUpdate(ctx)
  const lang = await isRu(ctx)
  if (!ctx.from?.username) throw new Error("User not found")
  const textToPost = "🙏🏻 Namaste"
  await ctx.reply(lang ? "🤝 Спасибо за покупку!" : "🤝 Thank you for the purchase!");
  const user_id = await getUid(ctx.from?.username)
  if (!user_id) throw new Error("User not found")
  await sendPaymentInfo(user_id, ctx.message.successful_payment.invoice_payload)
  await ctx.api.sendMessage("-1002090264748", textToPost)
  return;
});

leelaChakraBot.on("message:text", async (ctx) => {
  await checkAndUpdate(ctx)
  console.log(ctx)
  try {
    await ctx.replyWithChatAction("typing");
    const query = `you need to fit the answer in 4096 characters. The answer to this question: ${ctx?.message?.text}`
    const lang = await isRu(ctx)
    const language_code = await getLanguage(ctx.from?.id.toString())

    if (!ctx.from) throw new Error("User not found");
    const subscription = await checkSubscriptionByTelegramId(ctx.from.id.toString())
    
    if (!language_code) throw new Error("Language code not found")

    if (query) {
      if (!ctx.from.username) {
        await ctx.reply(lang ? "Вы ещё не зарегистрированы. Зарегистрируйтесь, чтобы пользоваться этим ботом." : "You are not registered yet. Please, register to use this bot.");
        throw new Error("User is not registered yet");
      }
      
      if (ctx.message.reply_to_message) {
        const replyMessageText = ctx.message.reply_to_message.caption ? ctx.message.reply_to_message.caption : ctx.message.reply_to_message.text
        if (!replyMessageText) return
        if (replyMessageText.length < 100) {
          await ctx.reply(lang ? "Репорт должен быть <b>длиннее 100 символов</b>." : "Report must be <b>longer than 100 characters</b>.", {parse_mode: "HTML"})
          return
        }
        if (replyMessageText.includes("Ваш план") || replyMessageText.includes("Your plan"))
          {
            const isWrite = (await getSupabaseUser(ctx.from?.id.toString()))?.isWrite
            const step_callback = {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "🎲",
                  callback_data: `make_step`,
                },
              ],
               [{text: "Gameboard", web_app: {url: `https://leela-chakra-nextjs.vercel.app/gameboard`}}
        ]]
            }
          }
            if (!isWrite){
               await ctx.reply(lang ? "Вы уже ответили на этот план." : "You already answered on this plan.", step_callback) 
               return
          }
          if (!ctx.from.username) throw new Error("User not found")
          const user_id = await getUid(ctx.from.username)
          if (!user_id) throw new Error("User not found")
          const response = await updateHistory(user_id, ctx.from.username || "", language_code, query)
          await updateUser(ctx.from.id.toString(), {isWrite: false})
          await ctx.reply(response, {parse_mode: "Markdown", ...step_callback})
          return
        }
      }
      const user = await getSupabaseUser(ctx.from?.id.toString())
      if (!user) return
      if (subscription === "unsubscribed") {
        const isLimit = await isLimitAi(ctx.from.id.toString())
        if (isLimit) {
          await ctx.reply(lang ? "У вас закончились бесплатные ежедневные запросы на использование нейросети 🧠. Подписка неактивна. \n\n/buy - выбери уровень и оформляй подписку, чтобы получить неограниченный доступ к нейросети 🧠" : "🔒 You are not subscribed to any level. The subscription is inactive. \n\n/buy - select a level and subscribe, to get unlimited access to the neural network 🧠")
          return
        }
      }
      const plan = user.isWrite ? await getPlanByUserId(user.user_id, lang ? 'ru' : 'en') : ""
      console.log(user.isWrite, "user.isWrite")
      const answer = user.isWrite && plan ? `you need to prepare the text for the user: ${query} In addition, the user has not finished his turn yet and needs to be reminded and told about it and briefly write some wisdom from this text: ${plan.short_desc}` : query
      const { ai_content } = await getAiFeedbackFromSupabase({
        query: answer,
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
  await checkAndUpdate(ctx)
  const callbackData = ctx.callbackQuery.data;
  const isHaveAnswer = callbackData.split("_").length === 4;
  const lang = await isRu(ctx)

  const subscription = await checkSubscriptionByTelegramId(ctx.from?.id.toString())
  if (callbackData === "select_russian") {
		await setLanguage(ctx.from?.id.toString(), "ru");
		await ctx.reply("🇷🇺 Выбран русский");
	}
	if (callbackData === "select_english") {
		await setLanguage(ctx.from?.id.toString(), "en");
		await ctx.reply("🇬🇧 English selected");
	}

  if (callbackData.startsWith("make_step")){
    console.log("step...");
    const lang = await isRu(ctx)
    const roll = Math.floor(Math.random() * 6) + 1; // Получаем значение кубика от 1 до 6
    
    const user = await getSupabaseUser(ctx.from?.id.toString())
    if (subscription === "unsubscribed") {
      if (user?.first_request) {
      await ctx.reply(lang ? "🔒 Вы не подписаны на какой-либо уровень. Подписка неактивна. \n\n/buy - выбери уровень и оформляй подписку" : "🔒 You are not subscribed to any level. The subscription is inactive. \n\n/buy - select a level and subscribe")
      return
      }
    }
    if (!user) return
    if (user.isWrite) {
      console.log("user.isWrite 305", user.isWrite)
      const user_id = await getUid(ctx.from?.username || "")
      if (!user_id) throw new Error("User not found")
      const step = await getLastStep(user_id.toString())
      console.log("step", step)
      if (!step) return
      const plan = await getPlan(step.loka, lang ? "ru" : "en")
      const text = lang ? `${step.direction} Ваш план: ${step.loka}\n\n${plan.short_desc}\n\nОтветьте на сообщение, чтобы написать репорт.` : `${step.direction} Your plan: ${step.loka}\n\n${plan}\n\nReply to the message to write report.`
      const options = {reply_markup: {force_reply: true, inline_keyboard: [[{text: "Gameboard", web_app: {url: `https://leela-chakra-nextjs.vercel.app/gameboard`}}]]}}
      // if (plan.image) {
      //   await ctx.replyWithPhoto(plan.image, {caption: text, ...options})
      //   return
      // }
      await updateUser(ctx.from.id.toString(), {first_request: true})
      await ctx.reply(text, options)
      return
    }
    if (!ctx.from?.id) throw new Error("Telegram id not found")
    const user_id = await getUid(ctx.from?.username || "");
    if (!user_id) throw new Error("User not found");
    const lastStep = await getLastStep(user_id.toString())
    const step = await gameStep({roll: roll, response: [lastStep], telegram_id: ctx.from?.id.toString()})
    console.log("step", step)
    if (!ctx.from.language_code) throw new Error("Language code not found")
    const plan = await getPlan(step.loka, ctx.from.language_code)
    console.log(plan, "plan")
    const text = lang ? `${step.direction} Ваш план: ${step.loka}\n\n${plan.short_desc}\n\nОтветьте на сообщение, чтобы написать репорт.` : `${step.direction} Your plan: ${step.loka}\n\n${plan}\n\nReply to the message to write report.`
      const options = {reply_markup: {force_reply: true, inline_keyboard: [[{text: "Gameboard", web_app: {url: `https://leela-chakra-nextjs.vercel.app/gameboard`}}]]}}
      // if (plan.image) {
      //   await ctx.replyWithPhoto(plan.image, {caption: text, ...options})
      //   return
      // }
      await ctx.reply(text, options)
      await updateUser(ctx.from.id.toString(), {isWrite: true, first_request: true})
      return
  }

  if (callbackData.startsWith("buy")){
    if (callbackData.endsWith("student")){
      await ctx.replyWithInvoice(
        lang ? "Ученик" : "Student",
        lang ? "Вы получите подписку уровня 'Ученик'" : "You will receive a subscription to the 'Student' level",
        "student",
        "", // Оставьте пустым для цифровых товаров
        "XTR", // Используйте валюту Telegram Stars
        [{ label: "Цена", amount: 282 }],
      );
      return
    }
    if (callbackData.endsWith("expert")){
      await ctx.replyWithInvoice(
        lang ? "Эксперт" : "Expert",
        lang ? "Вы получите подписку уровня 'Эксперт'" : "You will receive a subscription to the 'Expert' level",
        "expert",
        "", // Оставьте пустым для цифровых товаров
        "XTR", // Используйте валюту Telegram Stars
        [{ label: "Цена", amount: 1978 }],
      );
      return
    }
    if (callbackData.endsWith("mentor")){
      await ctx.replyWithInvoice(
        lang ? "Ментор" : "Mentor",
        lang ? "Вы получите подписку уровня 'Ментор'" : "You will receive a subscription to the 'Mentor' level",
        "mentor",
        "", // Оставьте пустым для цифровых товаров
        "XTR", // Используйте валюту Telegram Stars
        [{ label: "Цена", amount: 19782 }],
      );
      return
    }
  }
  if (
    callbackData.startsWith("start_test") ||
    callbackData.startsWith("leelachakra")
  ) {
    if (callbackData === "start_test") {
      try {
        const theme = callbackData.split("_")[1]
        console.log(`start_test`)
        const questionContext = {
          lesson_number: 1,
          subtopic: 1,
        };

        console.log(theme)
        const questions = await getQuestion({
          ctx: questionContext,
          language: theme,
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
          const topic = lang ? ruTopic : enTopic;
          const allAnswers = await getCorrects({
            user_id: user_id.toString(),
            language: "all",
          });
          // Формируем сообщение
          const messageText =
            `${topic}\n\n<i><u>${lang ? "Теперь мы предлагаем вам закрепить полученные знания." : "Now we are offering you to reinforce the acquired knowledge."}</u></i>\n\n<b>${lang ? "Total: " : "Total: "}${allAnswers} $Leela Coin</b>`;

          // Формируем кнопки
          const inlineKeyboard = [
            [{
              text: lang ? "Перейти к вопросу" : "Go to the question",
              callback_data: `${theme}_01_01`,
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
          await ctx.reply(lang ? "Вопросы не найдены." : "No questions found.");
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (!isHaveAnswer) {
      try {
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
            lang
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
          variant_0_en: enVariant_0,
          variant_1_en: enVariant_1,
          variant_2_en: enVariant_2,
          id,
          image_lesson_url,
        } = questions[0];

        const question = lang ? ruQuestion : enQuestion;
        const variant_0 = lang ? ruVariant_0 : enVariant_0;
        const variant_1 = lang ? ruVariant_1 : enVariant_1;
        const variant_2 = lang ? ruVariant_2 : enVariant_2;

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
          `<b>№${id}</b>\n\n${question}\n\n<b> Total: ${allAnswers} $Leela Coin</b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: variant_0 || "Variant 1",
            callback_data: `${callbackData}_0`,
          }],
          [{
            text: variant_1 || "Variant 2",
            callback_data: `${callbackData}_1`,
          }],
          [{
            text: variant_2 || (lang ? "Не знаю" : "I don't know"),
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
        if (ctx.callbackQuery.from.id) {
          console.log("editMessageReplyMarkup")
          await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }); 
        }
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
            await ctx.reply(lang ? "Пользователь не найден." : "User not found.");
            return;
          }

          const path = `${language}_${lesson_number}_${subtopic}`;
          console.log(path, "path for getBiggest");
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
          console.log(biggestSubtopic, `biggestSubtopic`);
          console.log(subtopic, `subtopic`);
          const newPath = await pathIncrement({
            path,
            isSubtopic: Number(biggestSubtopic) === Number(subtopic)
              ? false
              : true,
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
                  lang
                    ? `<b>🥳 Поздравляем, вы прошли основной тест! Далее вы сможете пройти дополнительные тесты от искуственного интеллекта.</b>\n\n Total: ${allAnswers} $Leela Coin`
                    : `<b>🥳 Congratulations, you passed the main test! Then you can pass the additional tests from the artificial intelligence.</b>\n\n Total: ${allAnswers} $Leela Coin`,
                  { parse_mode: "HTML" },
                );
              } else {
                await updateResult({
                  user_id: user_id.toString(),
                  language,
                  value: false,
                });
                await ctx.reply(
                  lang
                    ? `<b>🥲 Вы не прошли основной тест, но это не помешает вам развиваться! </b>\n\n Total: ${allAnswers} $Leela Coin`
                    : `<b>🥲 You didn't pass the main test, but that won't stop you from developing!</b>\n\n Total: ${allAnswers} $Leela Coin`,
                  { parse_mode: "HTML" },
                );
              }
            }
            console.log(newPath, `newPath ai koshey`);
            const [newLanguage, newLesson, newSubtopic] = newPath.split("_");
            const getQuestionContext = {
              lesson_number: Number(newLesson),
              subtopic: Number(newSubtopic),
            };
            const newQuestions = await getQuestion({
              ctx: getQuestionContext,
              language,
            });
            console.log(newQuestions, `newQuestions ai koshey for`);
            console.log(getQuestionContext, `getQuestionContext`);
            const { topic: ruTopic, image_lesson_url, topic_en: enTopic, url } =
              newQuestions[0];
            const topic = lang ? ruTopic : enTopic;
            // Формируем сообщение
            const messageText =
              `${topic}\n\n<i><u>${lang ? "Теперь мы предлагаем вам закрепить полученные знания." : "Now we are offering you to reinforce the acquired knowledge."}</u></i>\n\n<b>${lang ? "Total: " : "Total: "}${allAnswers} $Leela Coin</b>`;

            // Формируем кнопки
            const inlineKeyboard = [
              [{
                text: lang ? "Перейти к вопросу" : "Go to the question",
                callback_data: newPath,
              }],
            ];
            if (url && lang) {
              console.log(url, "url");
              await ctx.replyWithVideoNote(url);
            }
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
            await ctx.reply(lang ? "Вопросы не найдены." : "No questions found.");
          }
        } else {
          console.error("Invalid callback(289)");
          return;
        }
      } catch (error) {
        console.error(error);
      }
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
