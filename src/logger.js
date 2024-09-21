import winston from "winston";

const coloredPrintf = winston.format.printf(({ level, message, timestamp }) => {
  const levelColor =
    level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : "\x1b[32m";
  return `${timestamp} [${levelColor}${level.toUpperCase()}\x1b[0m]: ${message}`;
});

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    coloredPrintf
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "app_logs.log",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
    }),
  ],
});
