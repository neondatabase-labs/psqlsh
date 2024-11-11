import { sentryVitePlugin } from "@sentry/vite-plugin";
import favicons from "@peterek/vite-plugin-favicons";

/** @type {import('vite').UserConfig */
export default {
  envDir: process.cwd(),

  server: {
    host: "0.0.0.0",
    proxy: {
      "/api/trpc": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trpc/, "/"),
      },
    },
  },

  build: {
    sourcemap: true,
  },

  plugins: [
    sentryVitePlugin({
      org: "neondatabase",
      project: "psqlsh-web",
    }),
    favicons("./client/images/favicon.png"),
  ],
};
