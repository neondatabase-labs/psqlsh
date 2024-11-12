import { EndpointType } from "@neondatabase/api-client";
import postgres from "postgres";
import { resolve } from "node:path";

import { apiClient } from "../apiClient";
import { logger } from "../logger";
import config from "../config";
import db from "../../templates/db";
import { generateBranchName } from "../templates";

const templateDir = resolve(process.cwd(), "templates");

async function uploadTemplates() {
  const {
    data: { branches },
  } = await apiClient.listProjectBranches(config.neonProjectId);
  const defaultBranch = branches.find((branch) => branch.default);
  if (!defaultBranch) {
    throw new Error("No default branch found");
  }

  for (const { file, name } of db) {
    const branchName = generateBranchName(name);
    const loggerC = logger.child({ branchName, file, name });
    const existingBranch = branches.find(
      (branch) => branch.name === branchName,
    );
    if (existingBranch) {
      loggerC.info("Branch already exists");
      continue;
    }
    loggerC.info("Creating branch");
    const {
      data: { connection_uris: cs, branch },
    } = await apiClient.createProjectBranch(config.neonProjectId, {
      branch: {
        parent_id: defaultBranch.id,
        name: branchName,
      },
      endpoints: [{ type: EndpointType.ReadWrite }],
    });

    try {
      if (!cs || cs.length === 0) {
        throw new Error("No connection string returned");
      }
      const sql = postgres(cs[0].connection_uri);
      if (file.endsWith(".sql")) {
        loggerC.info("Uploading SQL file");
        await sql.file(resolve(templateDir, file));
      } else {
        throw new Error("Unsupported file type");
      }
      loggerC.info("Template uploaded");
    } catch (ex) {
      loggerC.error(ex, "Error uploading template");
      loggerC.info("Deleting branch");
      await apiClient.deleteProjectBranch(branch.project_id, branch.id);
    }
  }
}

uploadTemplates()
  .then(() => {
    logger.info("Templates uploaded");
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
