import { createHTTPServer } from "@trpc/server/adapters/standalone";
import config from "./config";
import { logger } from "./logger";
import { appRouter } from "./router";

const server = createHTTPServer({
  router: appRouter,
  middleware: async (req, res, next) => {
    if (req.url === "/health") {
      res.writeHead(200);
      res.end("OK");
      return;
    }
    logger.info({ url: req.url }, "incoming request");
    next();
  },
  onError({ error, path }) {
    logger.error({ message: error.message, path }, "Request failed");
  },
});

server.listen(config.port);
logger.info(`Server started on port ${config.port}`);
