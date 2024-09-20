import OpenAI from "openai";
import { tts } from "./tts";
import { systemPrompt } from "./system";
const openai = new OpenAI();

interface Message {
  role: "assistant" | "system" | "user";
  content: string;
}

export const history: Array<Message> = [
  {
    role: "system",
    content: systemPrompt,
  },
];

export const run_llm = async () => {
  if (!history.length) return;
  console.log(history.at(-1)?.content);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: history,
  });

  if (!completion.choices[0].message.content) return;
  console.log(completion.choices[0].message.content);
  history.push({
    role: "assistant",
    content: completion.choices[0].message.content ?? "",
  });

  tts(completion.choices[0].message.content);
};
