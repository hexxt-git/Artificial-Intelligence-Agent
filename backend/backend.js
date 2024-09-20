const WebSocket = require("ws");
const { AssemblyAI } = require("assemblyai");

const wss = new WebSocket.Server({ port: 3000 });

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});


wss.on("connection", (socket) => {
  console.log("Client connected");

  let realTime;

  socket.on("message", async (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === "startTranscription") {
        realTime = client.realtime.transcriber();

        realTime.on("transcript", (transcript) => {
          if (!transcript.text) return;
          socket.send(
            JSON.stringify({
              type: "transcript",
              data: transcript.text,
              isFinal: transcript.message_type === "FinalTranscript",
            })
          );
        });

        realTime.on("error", (error) => {
          console.error("Transcription error:", error);
          socket.send(
            JSON.stringify({ type: "error", message: error.message })
          );
        });

        realTime.on("open", () => {
          console.log("Connected to AssemblyAI");
          socket.send(JSON.stringify({ type: "ready" }));
        });

        realTime.on("close", () => {
          console.log("AssemblyAI connection closed");
          realTime = null;
        });

        try {
          await realTime.connect();
        } catch (error) {
          console.error("Failed to connect to AssemblyAI:", error);
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Failed to connect to transcription service",
            })
          );
        }
      } else if (message.type === "audioData") {
        if (!realTime || realTime.readyState !== realTime.OPEN) {
          console.error("Transcriber not initialized or WebSocket not open");
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Transcriber not initialized or WebSocket not open",
            })
          );
          return;
        }

        const audioData = new Uint8Array(message.data);
        console.log("sending", audioData.length, "bytes");

        // Send the audio data to AssemblyAI
        realTime.sendAudio(audioData);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      socket.send(
        JSON.stringify({ type: "error", message: "Internal server error" })
      );
    }
  });

  socket.on("close", async () => {
    console.log("Client disconnected");
    if (realTime) {
      await realTime.close();
    }
  });
});

console.log("WebSocket server started on port 3000");
