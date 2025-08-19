import { sentryVitePlugin } from "@sentry/vite-plugin";
import favicons from "@peterek/vite-plugin-favicons";

/** @type {import('vite').UserConfig */
export default {
  envDir: process.cwd(),

  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
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
