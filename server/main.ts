import { createHTTPServer } from "@trpc/server/adapters/standalone";
import config from "./config";
import { logger } from "./logger";
import { appRouter } from "./router";
import { createContext } from "./trpc";

const server = createHTTPServer({
  router: appRouter,
  middleware: async (req, res, next) => {
    if (req.url === "/health") {
      res.writeHead(200);
      res.end("OK");
      return;
    }
    next();
  },
  onError({ error, path, ctx }) {
    (ctx?.logger ?? logger).error(
      { message: error.message, path },
      "Request failed",
    );
  },
  createContext,
});

server.listen(config.port);
logger.info(`Server started on port ${config.port}`);
