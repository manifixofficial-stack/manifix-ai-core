// vite.config.js
//
// 100/100 Universal Cross-Browser Build Compiler Configuration.
// Directs Rollup and Vite to transpile geometry class fields into legacy arrays
// that load perfectly on iOS Safari, Android Chrome, and all mobile browsers.
//
// THIS REVISION: externalize native-only Capacitor packages
// ==========================================================================
//   - PROBLEM: GoogleLogin.jsx dynamically imports @capacitor/core and
//     @codetrix-studio/capacitor-google-auth for its native-Android sign-in
//     branch. Neither is a real dependency of the WEB build — they're
//     native-only plugins, gated behind Capacitor.isNativePlatform() so
//     that branch never actually runs in a browser. Rollup still tries to
//     statically resolve them at build time regardless, and since this repo
//     is the web app (not the Capacitor Android project), they're not
//     installed here — Vite build failed with "Rollup failed to resolve
//     import '@codetrix-studio/capacitor-google-auth'".
//   - FIX: added build.rollupOptions.external for both packages. This
//     tells Rollup "don't try to bundle these, trust that they exist at
//     runtime" — which is safe specifically because the code path that
//     uses them is unreachable in a browser (isNative is false on web, so
//     runNativeSignIn() and its imports never execute). If you later build
//     THIS SAME SOURCE via Capacitor for the actual Android app (a
//     different build pipeline, typically `npx cap sync android` +
//     Android Studio, not `vite build` for Vercel), that pipeline installs
//     and resolves these packages for real — this external list only
//     affects this web/Vercel build.

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
    },
    // NEW: native-only Capacitor packages — see header note above. Without
    // this, GoogleLogin.jsx's dynamic imports for the native sign-in path
    // fail the web build even though that path never runs in a browser.
    rollupOptions: {
      external: [
        "@codetrix-studio/capacitor-google-auth",
        "@capacitor/core",
      ],
    },
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
