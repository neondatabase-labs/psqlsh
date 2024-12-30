import { ContentType, EndpointType } from "@neondatabase/api-client";
import { isAxiosError } from "axios";
import z from "zod";

import { router, publicProcedure } from "./trpc";
import config from "./config";
import { apiClient } from "./apiClient";
import templates from "../templates/db";
import { generateBranchName } from "./templates";

export const appRouter = router({
  issueDatabase: publicProcedure
    .input(
      z.object({
        sourceBranch: z.string().optional(),
      }),
    )
    .mutation(async (opts) => {
      const {
        data: { branches },
      } = await apiClient.listProjectBranches(config.neonProjectId);
      if (branches.length >= config.branchesLimit) {
        throw new Error(
          "Sorry, we have reached our limit 😅. Please try again later.",
        );
      }
      const sourceBranch = opts.input.sourceBranch
        ? branches.find((branch) => branch.name === opts.input.sourceBranch)
        : branches.find((branch) => branch.default);
      if (!sourceBranch) {
        throw new Error("No default branch found");
      }

      opts.ctx.logger.info(
        { sourceBranch: sourceBranch.id },
        "Creating new branch",
      );
      const {
        data: { connection_uris, branch, databases },
      } = await apiClient.createProjectBranch(config.neonProjectId, {
        branch: {
          parent_id: sourceBranch.id,
        },
        endpoints: [{ type: EndpointType.ReadWrite }],
      });

      if (!connection_uris) {
        throw new Error("No connection URIs found");
      }

      opts.ctx.session.connection = {
        database: databases[0].name,
        branchId: branch.id,
      };
      await opts.ctx.session.save();

      return {
        connectionString: connection_uris[0]?.connection_uri,
      };
    }),

  listTemplates: publicProcedure.query(() =>
    templates.map(({ name, description }) => ({
      name,
      description,
      branch: generateBranchName(name),
    })),
  ),
  textToSql: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async (opts) => {
      const { text } = opts.input;
      const { database, branchId } = opts.ctx.session.connection ?? {};
      if (!database || !branchId) {
        throw new Error("No database data found in session");
      }

      opts.ctx.logger.info({ text }, "Converting text to SQL");
      try {
        const { data } = await apiClient.request({
          baseURL: "https://console.neon.tech/ai-api",
          path: "/text_to_sql",
          method: "POST",
          type: ContentType.Json,
          body: {
            text,
            branchId,
            projectId: config.neonProjectId,
            db: database,
          },
          format: "text",
        });

        opts.ctx.logger.info({ data }, "Converted text to SQL");
        return data as string;
      } catch (error) {
        if (isAxiosError(error)) {
          opts.ctx.logger.error(
            {
              message: error.message,
              request: error.request,
              response: {
                headers: error.response?.headers,
                data: error.response?.data,
              },
            },
            "Failed to convert text to SQL",
          );
        }
        throw new Error("Failed to convert text to SQL");
      }
    }),
});

export type AppRouter = typeof appRouter;
