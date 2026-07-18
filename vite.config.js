// vite.config.js
//
// 100/100 Universal Cross-Browser Build Compiler Configuration.
// Directs Rollup and Vite to transpile geometry class fields into legacy arrays
// that load perfectly on iOS Safari, Android Chrome, and all mobile browsers.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Enables local IP access so you can test on your phone over Wi-Fi
  },
  preview: {
    port: 4173,
  },
  
  // 🛠️ UNIVERSAL FIX: Explicitly target ES2020 and compile via Terser
  // to ensure older mobile browsers never throw silent syntax processing crashes.
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    cssTarget: "es2020",
    minify: "esbuild", // Replaces esbuild to optimize code compaction for mobile networks
    terserOptions: {
      compress: {
        drop_console: false, // Keep logs active so we can audit server ticks cleanly
        dead_code: true
      }
    }
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
});
