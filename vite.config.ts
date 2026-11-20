import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Plain HTTP so `ngrok http 3000` can proxy it. ngrok supplies the public
  // HTTPS URL Kontent requires. HTTPS here makes ngrok report ERR_NGROK_3004.
  server: {
    port: 3000,
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io", ".ngrok.app"],
    // When using `pnpm dev` alone, point API calls at Netlify Dev if running
    // separately. Prefer `netlify dev` for integrated local proxy + HTTPS.
    proxy: {
      "/api/kontent": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/kontent/, "/.netlify/functions/kontent"),
      },
      "/.netlify/functions": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
