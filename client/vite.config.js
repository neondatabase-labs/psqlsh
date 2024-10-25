/** @type {import('vite').UserConfig */
export default {
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
};
