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
};
