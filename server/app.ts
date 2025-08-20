import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { serveStatic } from "@hono/node-server/serve-static"
import { sessionMiddleware } from "hono-sessions";
import { MemoryStore } from "hono-sessions";
import z from "zod";
import { ContentType, EndpointType } from "@neondatabase/api-client";
import { isAxiosError } from "axios";
import * as fs from "fs";

import config from "./config.js";
import { logger } from "./logger.js";
import { apiClient } from "./apiClient.js";
import templates from "../templates/db.js";
import { generateBranchName } from "./templates.js";

type Variables = {
  logger: any;
  session: any;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api");

app.get("/ls", (c) => {
  // List all files in the work dir
  const files = fs.readdirSync("./");
  return c.json(files);
});

// Serve static files first, before other middleware
app.use("/*", serveStatic({
  root: "./public",
  index: "index.html"
}));

app.get("/ls", (c) => {
  // List all files in the work dir
  const files = fs.readdirSync("./");
  return c.json(files);
});

// CORS middleware
app.use("*", cors());

// Session middleware
const store = new MemoryStore();
app.use(
  "*",
  sessionMiddleware({
    store,
    encryptionKey: config.cookieSecret,
  })
);

// Logger middleware
app.use("*", async (c, next) => {
  const requestId =
    c.req.header("x-request-id") ||
    c.req.header("rndr-id") ||
    randomBytes(16).toString("hex");

  const loggerWithContext = logger.child({
    requestId,
    url: `${c.req.method} ${c.req.url}`,
  });
  loggerWithContext.info("Request started");

  c.set("logger", loggerWithContext);
  await next();
});

// Health check endpoint
app.get("/health", (c) => c.text("OK"));

// Issue database endpoint
app.post(
  "/issue-database",
  zValidator(
    "json",
    z.object({
      sourceBranch: z.string().optional(),
    })
  ),
  async (c) => {
    const { sourceBranch } = c.req.valid("json");
    const session = c.get("session");
    const logger = c.get("logger");

    try {
      const {
        data: { branches },
      } = await apiClient.listProjectBranches(config.neonProjectId);

      if (branches.length >= config.branchesLimit) {
        return c.json(
          { error: "Sorry, we have reached our limit 😅. Please try again later." },
          400
        );
      }

      const sourceBranchObj = sourceBranch
        ? branches.find((branch) => branch.name === sourceBranch)
        : branches.find((branch) => branch.default);

      if (!sourceBranchObj) {
        return c.json({ error: "No default branch found" }, 400);
      }

      logger.info(
        { sourceBranch: sourceBranchObj.id },
        "Creating new branch"
      );

      const {
        data: { connection_uris, branch, databases },
      } = await apiClient.createProjectBranch(config.neonProjectId, {
        branch: {
          parent_id: sourceBranchObj.id,
        },
        endpoints: [{ type: EndpointType.ReadWrite }],
      });

      if (!connection_uris) {
        return c.json({ error: "No connection URIs found" }, 500);
      }

      session.set("connection", {
        database: databases[0].name,
        branchId: branch.id,
      });

      return c.json({
        connectionString: connection_uris[0]?.connection_uri,
      });
    } catch (error) {
      logger.error({ error }, "Failed to issue database");
      return c.json({ error: "Failed to create database" }, 500);
    }
  }
);

// List templates endpoint
app.get("/templates", (c) => {
  const templateList = templates.map(({ name, description }) => ({
    name,
    description,
    branch: generateBranchName(name),
  }));
  return c.json(templateList);
});

// Text to SQL endpoint
app.post(
  "/text-to-sql",
  zValidator(
    "json",
    z.object({
      text: z.string(),
    })
  ),
  async (c) => {
    const { text } = c.req.valid("json");
    const session = c.get("session");
    const logger = c.get("logger");

    const connection = session.get("connection");
    if (!connection?.database || !connection?.branchId) {
      return c.json({ error: "No database data found in session" }, 400);
    }

    logger.info({ text }, "Converting text to SQL");

    try {
      const { data } = await apiClient.request({
        baseURL: "https://console.neon.tech/ai-api",
        path: "/text_to_sql",
        method: "POST",
        type: ContentType.Json,
        body: {
          text,
          branchId: connection.branchId,
          projectId: config.neonProjectId,
          db: connection.database,
        },
        format: "text",
      });

      logger.info({ data }, "Converted text to SQL");
      return c.json({ sql: data as string });
    } catch (error) {
      if (isAxiosError(error)) {
        logger.error(
          {
            message: error.message,
            request: error.request,
            response: {
              headers: error.response?.headers,
              data: error.response?.data,
            },
          },
          "Failed to convert text to SQL"
        );
      }
      return c.json({ error: "Failed to convert text to SQL" }, 500);
    }
  }
);

// Error handling
app.onError((err, c) => {
  const requestLogger = c.get("logger") || logger;
  requestLogger.error({ error: err.message }, "Request failed");
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
