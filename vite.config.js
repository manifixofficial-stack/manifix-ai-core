import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// __dirname doesn't exist in ES modules (this file runs as ESM because
// package.json has "type": "module") — derive it from import.meta.url instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Base path for root level Vercel deployment
  base: "/",
  // Clean path aliasing setup
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // High-performance mobile development server routing
  server: {
    port: 3000,
    open: true,
    host: true, // Enables local IP access so you can test on your phone over local Wi-Fi!
  },
  // Production build bundle management
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
  },
  // Explicitly pre-bundle your actual game dependencies to ensure 0ms launch lag on mobile tabs
  optimizeDeps: {
    include: [
      "socket.io-client",
      "framer-motion",
      "canvas-confetti",
      "lucide-react",
      "react",
      "react-dom"
    ],
  },
  // Production SPA client staging configurations
  preview: {
    port: 4173,
  },
});
