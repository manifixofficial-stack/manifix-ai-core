// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // Base path for deployment
  base: "/",

  // Resolve aliases
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") }, // @ -> src
    ],
  },

  // Development server
  server: {
    port: 5173,
    open: true,
  },

  // Build settings
  build: {
    outDir: "dist",
    rollupOptions: {
      // Externalize modules to prevent Vite resolution issues
      external: ["react-icons/fa", "html2canvas"],
    },
  },

  // Optimize dependencies to pre-bundle for Vite dev & prevent runtime errors
  optimizeDeps: {
    include: [
      "react-icons/fa",
      "remark-math",
      "remark-gfm",
      "rehype-raw",
      "rehype-sanitize",
      "react-markdown",
      "html2canvas", // pre-bundle html2canvas for dev server
    ],
  },

  // SPA preview settings for Vercel / Netlify
  preview: {
    port: 4173,
  },
});
