<script>
  import { onMount, onDestroy } from "svelte";
  import { MediaRecorder, register } from "extendable-media-recorder";
  import { connect } from "extendable-media-recorder-wav-encoder";

  let mediaRecorder;
  let socket;
  let transcription = "";
  let isRecording = false;
  let isLoading = false;
  let errorMessage = "";

  onMount(async () => {
    try {
      await register(await connect());

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/wav" });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.readAsArrayBuffer(event.data);

          reader.onloadend = () => {
            const audioData = new Uint8Array(reader.result);

            socket.send(
              JSON.stringify({
                type: "audioData",
                data: Array.from(audioData),
              }),
            );
          };
        }
      };

      socket = new WebSocket("ws://localhost:3000");

      socket.onopen = () => {
        console.log("Connected to WebSocket server");
        socket.send(JSON.stringify({ type: "startTranscription" }));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "ready") {
          console.log("Ready to transcribe!");
        } else if (message.type === "transcript") {
          transcription = message.data;
          isLoading = false;
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        errorMessage = "WebSocket error occurred. Please try again.";
        isLoading = false;
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
      errorMessage = "Unable to access microphone. Please check permissions.";
    }
  });

  onDestroy(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (socket) {
      socket.close();
    }
  });

  function startRecording() {
    if (mediaRecorder && mediaRecorder.state !== "recording") {
      mediaRecorder.start(1000);
      isRecording = true;
      isLoading = true;
      errorMessage = "";
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      isRecording = false;
    }
  }
</script>

<div>
  <button on:click={startRecording} disabled={isRecording}>
    {isRecording ? "Recording..." : "Start Recording"}
  </button>

  <button on:click={stopRecording} disabled={!isRecording}>
    Stop Recording
  </button>
</div>

{#if errorMessage}
  <div class="error">{errorMessage}</div>
{/if}

{#if isLoading && isRecording}
  <div class="loading">Transcribing audio...</div>
{/if}

<div id="transcription">
  <strong>Transcription:</strong>
  {transcription || "No transcription yet."}
</div>

<style>
  .error {
    color: red;
  }
  .loading {
    font-style: italic;
  }
  #transcription {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
</style>
