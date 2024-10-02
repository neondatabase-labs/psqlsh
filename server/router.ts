import { EndpointType, createApiClient } from "@neondatabase/api-client";

import { router, publicProcedure } from "./trpc";
import config from "./config";
import { logger } from "./logger";

const apiClient = createApiClient({
  apiKey: config.neonApiKey,
});

export const appRouter = router({
  issueDatabase: publicProcedure.mutation(async () => {
    const {
      data: { branches },
    } = await apiClient.listProjectBranches(config.neonProjectId);
    const defaultBranch = branches.find((branch) => branch.default);
    if (!defaultBranch) {
      throw new Error("No default branch found");
    }

    logger.info({ defaultBranch: defaultBranch.id }, "Creating new branch");
    const {
      data: { connection_uris },
    } = await apiClient.createProjectBranch(config.neonProjectId, {
      branch: {
        parent_id: defaultBranch.id,
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
});

export type AppRouter = typeof appRouter;
