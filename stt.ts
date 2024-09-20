import { AssemblyAI, type RealtimeTranscript } from "assemblyai";
import { SoxRecording } from "./sox.ts";
import { history, run_llm } from "./llm.ts";

export const run_stt = async () => {
  const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY as string,
  });

  const SAMPLE_RATE = 16_000;

  const transcriber = client.realtime.transcriber({
    sampleRate: SAMPLE_RATE,
  });

  transcriber.on("open", ({ sessionId }) => {
    console.log(`Session opened with ID: ${sessionId}`);
  });

  transcriber.on("error", (error: Error) => {
    console.error("Error:", error);
  });

  transcriber.on("close", (code: number, reason: string) =>
    console.log("Session closed:", code, reason)
  );

  transcriber.on("transcript.final", (transcript: RealtimeTranscript) => {
    if (!transcript.text) {
      return;
    }

    history.push({ role: "user", content: transcript.text });
    run_llm();
  });

  console.log("Connecting to real-time transcript service");
  await transcriber.connect();

  console.log("Starting recording");
  const recording = new SoxRecording({
    channels: 1,
    sampleRate: SAMPLE_RATE,
    audioType: "wav", // Linear PCM
  });

  recording.stream().pipeTo(transcriber.stream() as WritableStream<any>);

  // Stop recording and close connection using Ctrl-C.
  process.on("SIGINT", async function () {
    console.log();
    console.log("Stopping recording");
    recording.stop();

    console.log("Closing real-time transcript connection");
    await transcriber.close();

    process.exit();
  });
};
