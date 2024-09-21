import OpenAI from "openai";
import { tts } from "./text_to_speech.js";
import { systemPrompt, judgePrompt, judgeSchema } from "./model_alignment.js";
import { logger } from "./logger.js";
import { endCall } from "./endCall.js";
import { recording } from "./audio_processing.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const history = [
  {
    role: "system",
    content: systemPrompt,
  },
];

let queue = "";
let isBusy = false;

const run_llm = async () => {
  if (!history.length) return;
  isBusy = true;
  recording?.pause();

  try {
    logger.info(`User input: ${queue}`);
    console.log(`\x1b[36m    ${queue}\x1b[0m`);

    history.push({
      role: "user",
      content: queue,
    });

    logger.info(`Sending request to OpenAI's chat completions API...`);
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: history,
    });
    logger.info(`OpenAI API call successful!`);

    const chatResponseContent = chatResponse.choices[0].message.content;
    logger.info(`Chat response: ${chatResponseContent}`);
    console.log(`\x1b[36m    ${chatResponseContent}\x1b[0m`);

    logger.info(`Sending request to OpenAI's data extractor API...`);
    const judgement = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: judgePrompt,
        },
        {
          role: "user",
          content: JSON.stringify({ history }),
        },
      ],
    });
    logger.info(`OpenAI API call successful!`);
    let judgementContent = judgement.choices[0].message.content.trim();
    if (/^```.+```$/.test(judgementContent))
      judgementContent = judgementContent.slice(3, -3);
    const judgementData = judgeSchema.parse(JSON.parse(judgementContent));
    logger.info(`Judgement data: ${JSON.stringify(judgementData)}`);

    history.push({
      role: "assistant",
      content: chatResponseContent,
    });

    logger.info(`Initiating text-to-speech...`);
    await tts(chatResponseContent);
    logger.info(`Text-to-speech successful!`);

    if (judgementData.action === "endCall") {
      logger.info("Ending call...");
      endCall(judgementData);
    } else if (judgementData.action === "transferToOperator") {
      logger.info("Transferring call to human operator...");
      console.log(`\x1b[36m    Human intervention required   \x1b[0m`);
      // await transferToOperator();
      endCall(judgementData);
    }
  } catch (error) {
    logger.error(`Error during call: ${error}`);
  } finally {
    queue = "";
    isBusy = false;
    recording?.resume();
  }
};

export const say = async (text) => {
  if (!isBusy) {
    queue += text;
    await run_llm();
  }
};

// say("direct me to a human please")
