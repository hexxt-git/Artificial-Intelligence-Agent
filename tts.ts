import OpenAI from "openai";
import fs from "fs";
import path from "path";
const openai = new OpenAI();
const player = require("play-sound")();

export const tts = async (text: string) => {
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "nova",
    input: text,
    speed: 0.9,
  });

  // Assuming response is an ArrayBuffer
  const buffer = Buffer.from(await response.arrayBuffer());
  const tempFilePath = path.resolve(
    `./temp/audio-${Math.floor(Math.random() * 1e3)}.mp3`
  ); // Change the file extension as needed

  fs.writeFileSync(tempFilePath, buffer);

  player.play(tempFilePath, (error: any) => {
    if (error) {
      console.error("Error playing audio:", error);
    }
    // Optionally delete the temp file afterward
    fs.unlinkSync(tempFilePath);
  });
};
