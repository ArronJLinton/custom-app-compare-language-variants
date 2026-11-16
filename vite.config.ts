import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), basicSsl()],
  // HTTPS is provided by @vitejs/plugin-basic-ssl (required for Kontent custom apps).
  server: {
    // When using `pnpm dev` alone, point API calls at Netlify Dev if running
    // separately. Prefer `netlify dev` for integrated local proxy + HTTPS.
    proxy: {
      "/api/kontent": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
      "/.netlify/functions": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
