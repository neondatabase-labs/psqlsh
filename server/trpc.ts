import { randomBytes } from "node:crypto";
import { initTRPC } from "@trpc/server";
import { getIronSession } from "iron-session";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";

import config from "./config";
import { logger } from "./logger";

interface SessionData {
  connection?: {
    database: string;
    branchId: string;
  };
}
export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getIronSession<SessionData>(opts.req, opts.res, {
    cookieName: "s",
    password: config.cookieSecret,
  });

  const requestId =
    opts.req.headers["x-request-id"] ||
    opts.req.headers["rndr-id"] ||
    randomBytes(16).toString("hex");

  const loggerWithContext = logger.child({
    requestId,
    url: `${opts.req.method} ${opts.req.url}`,
  });
  loggerWithContext.info("Request started");

  return {
    session,
    logger: loggerWithContext,
  };
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
