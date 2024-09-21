import { logger } from "./logger.js";
import axios from "axios";
import format from "pretty-format";

export const endCall = async (judgement) => {
  try {
    console.log("\n\n");
    console.log({ judgement });
    console.log("\n\n");

    const response = await axios.post(
      "http://192.168.248.169:8000/api/complaints/",
      {
        ...judgement, // ai output is already checked by zod schema
        staffID: 1, // special staff id for Automated calls
      },
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
