/** @type {import('vite').UserConfig */
export default {
  server: {
    proxy: {
      "/api/trpc": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trpc/, "/"),
      },
    },
  },
};
