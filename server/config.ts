import "dotenv/config";
import { z } from "zod";

export default z
  .object({
    port: z.coerce.number().default(3000),
    neonApiKey: z.string(),
    neonProjectId: z.string(),
    branchesLimit: z.coerce.number().default(1000),
    cookieSecret: z.string(),
  })
  .parse({
    port: process.env.PORT,
    neonApiKey: process.env.NEON_API_KEY,
    neonProjectId: process.env.NEON_PROJECT_ID,
    branchesLimit: process.env.BRANCHES_LIMIT,
    cookieSecret: process.env.COOKIE_SECRET,
  });

export const isEnvDev = () => process.env.NODE_ENV !== "production";
