import { EndpointState } from "@neondatabase/api-client";

import config from "../config";
import { apiClient } from "../apiClient";
import { logger } from "../logger";

export async function cleanup() {
  const {
    data: { branches },
  } = await apiClient.listProjectBranches(config.neonProjectId);
  const defaultBranch = branches.find((branch) => branch.default);
  if (!defaultBranch) {
    throw new Error("No default branch found");
  }
  const {
    data: { endpoints },
  } = await apiClient.listProjectEndpoints(config.neonProjectId);
  let count = 0;
  for (const endpoint of endpoints) {
    const branch = branches.find((b) => b.id === endpoint.branch_id);
    if (!branch) {
      throw new Error("Branch not found");
    }
    if (branch.name.startsWith("template/")) {
      logger.info({ branchName: branch.name }, "Skipping template branch");
      continue;
    }
    if (
      endpoint.current_state === EndpointState.Idle &&
      endpoint.branch_id !== defaultBranch.id
    ) {
      await apiClient.deleteProjectBranch(
        config.neonProjectId,
        endpoint.branch_id,
      );
      count++;
    }
  }
  return count;
}

cleanup()
  .then((c) => {
    logger.info({ count: c }, "Cleanup completed");
  })
  .catch((error) => {
    logger.error(error, "Cleanup failed");
  });
