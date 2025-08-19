import { serve } from "@hono/node-server";
import config from "./config";
import { logger } from "./logger";
import app from "./app";

serve({
  fetch: app.fetch,
  port: config.port,
});

logger.info(`Server started on port ${config.port}`);
