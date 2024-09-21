import OpenAI from "openai";
import { tts } from "./tts.js";
import {
  systemPrompt,
  dataExtractorPrompt,
  CallCenterSchema,
} from "./system.js";
import { logger } from "./logger.js";
import { endCall } from "./endCall.js";

const openai = new OpenAI();

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
          content: dataExtractorPrompt,
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
    const judgementData = CallCenterSchema.parse(JSON.parse(judgementContent));
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
      endCall(judgementData)
    } else if (judgementData.action === "transferToOperator") {
      logger.info("Transferring call to human operator...");
      endCall(judgementData)
    }
  } catch (error) {
    logger.error(`Error during call: ${error}`);
  } finally {
    queue = "";
    isBusy = false;
  }
};

export const say = async (text) => {
  queue += text;
  if (!isBusy) {
    await run_llm();
  }
};

say("transfer me to an operator");
