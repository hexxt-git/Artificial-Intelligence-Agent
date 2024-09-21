import { AssemblyAI } from "assemblyai";
import { SoxRecording } from "./sox.js";
import { say } from "./language_processing.js";
import { logger } from "./logger.js";

export let recording = null;

export const run_stt = async () => {
  const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY,
  });

  const SAMPLE_RATE = 16_000;

  const transcriber = client.realtime.transcriber({
    sampleRate: SAMPLE_RATE,
  });

  transcriber.on("open", ({ sessionId }) => {
    logger.info(`Session opened with ID: ${sessionId}`);
  });

  transcriber.on("error", (error) => {
    logger.error(`Error during transcription: ${error}`);
  });

  transcriber.on("close", (code, reason) => {
    logger.info(`Session closed with code: ${code}, reason: ${reason}`);
  });

  transcriber.on("transcript.final", (transcript) => {
    if (!transcript.text) {
      logger.info("Received empty transcript");
      return;
    }

    logger.info(`Received final transcript: ${transcript.text}`);
    say(transcript.text);
  });

  logger.info("Connecting to real-time transcript service");
  await transcriber.connect();

  logger.info("Starting recording");
  recording = new SoxRecording({
    channels: 1,
    sampleRate: SAMPLE_RATE,
    audioType: "wav", // Linear PCM
  });

  // inf future version implement mobile support through piping the stream here
  // we don't have required hardware to test this feature
  recording.stream().pipeTo(transcriber.stream());
  logger.info("Recording started and streaming to transcription service");

  process.on("SIGINT", async function () {
    logger.info("SIGINT received, stopping recording");

    recording.stop();
    logger.info("Recording stopped");

    logger.info("Closing real-time transcript connection");
    transcriber.close();

    logger.info("Exiting process");
    process.exit();
  });
};
