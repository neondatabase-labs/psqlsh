import { pino } from "pino";
import { isEnvDev } from "./config";

export const logger = pino({
  name: "psqlsh",
  formatters: {
    level: (label) => ({
      level: label,
    }),
  },
  ...(isEnvDev() ? { transport: { target: "pino-pretty" } } : {}),
});
