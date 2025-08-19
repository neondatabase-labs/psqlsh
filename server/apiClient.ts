import { createApiClient } from "@neondatabase/api-client";
import config from "./config.js";

export const apiClient = createApiClient({
  apiKey: config.neonApiKey,
});
