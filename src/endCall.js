import { logger } from "./logger.js";

export const endCall = async (judgement) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/judgement",
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
