import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
  // SPA fallback for Vercel / Netlify
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
});
