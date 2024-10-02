import { pino } from "pino";

export const logger = pino({
  name: "psqlsh",
  formatters: {
    level: (label) => ({
      level: label,
    }),
  },
});
