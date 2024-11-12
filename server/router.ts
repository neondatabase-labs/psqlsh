import { EndpointType } from "@neondatabase/api-client";
import z from "zod";

import { router, publicProcedure } from "./trpc";
import config from "./config";
import { logger } from "./logger";
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

      logger.info({ sourceBranch: sourceBranch.id }, "Creating new branch");
      const {
        data: { connection_uris },
      } = await apiClient.createProjectBranch(config.neonProjectId, {
        branch: {
          parent_id: sourceBranch.id,
        },
        endpoints: [{ type: EndpointType.ReadWrite }],
      });

      if (!connection_uris) {
        throw new Error("No connection URIs found");
      }

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
});

export type AppRouter = typeof appRouter;
