import { createApiClient } from "@neondatabase/api-client";
import config from "./config";

export const apiClient = createApiClient({
  apiKey: config.neonApiKey,
});
