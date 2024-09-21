import { logger } from "./logger.js";
import axios from "axios";

export const endCall = async (judgement) => {
  try {
    const response = await axios.post(
      "http://192.168.8.121:8080/add_complain",
      { ...judgement },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
        },
      }
    );

    logger.info("Exiting...");
    process.exit(0);
  } catch (error) {
    logger.error("Failed to send judgement:", error);
    process.exit(1);
  }
};
