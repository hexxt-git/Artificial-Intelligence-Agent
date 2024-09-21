import { run_stt } from "./audio_processing.js";
import { configDotenv } from "dotenv";
import figlet from "figlet";
import { logger } from "./logger.js";

figlet("CallCenter Agent", (err, data) => {
  if (err) {
    logger.error("Error generating banner:", err);
  } else {
    console.log(data);
    logger.info("Real-Time STT system starting...");
  }
});

configDotenv();

logger.info("Environment variables loaded successfully");

run_stt()
  .then(() => {
    logger.info("Speech-to-text system initialized successfully");
  })
  .catch((error) => {
    logger.error(`Error initializing STT system: ${error}`);
  });
