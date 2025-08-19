import { serve } from "@hono/node-server";
import config from "./config.js";
import { logger } from "./logger.js";
import app from "./app.js";

serve({
  fetch: app.fetch,
  port: config.port,
});

logger.info(`Server started on port ${config.port}`);
