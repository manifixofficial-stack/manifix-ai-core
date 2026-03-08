// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  base: "/",

  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") }, // src alias
    ],
  },

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      // Externalize react-icons/fa to avoid Vite resolution issues
      external: ["react-icons/fa"],
    },
  },

  optimizeDeps: {
    include: ["react-icons/fa"], // pre-bundle react-icons for dev to avoid runtime errors
  },

  // SPA fallback (important for Vercel/Netlify)
  // ensures client-side routing works
  preview: {
    port: 4173,
  },
});
