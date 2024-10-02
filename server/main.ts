import { createHTTPServer } from "@trpc/server/adapters/standalone";
import config from "./config";
import { logger } from "./logger";
import { appRouter } from "./router";

const server = createHTTPServer({
  router: appRouter,
  middleware: async (req, _res, next) => {
    logger.info({ url: req.url }, "incoming request");
    next();
  },
  onError({ error, path }) {
    logger.error({ message: error.message, path }, "Request failed");
  },
});

server.listen(config.port);
logger.info(`Server started on port ${config.port}`);
