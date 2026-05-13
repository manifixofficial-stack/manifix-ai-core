import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { AppProvider } from "./context/AppProvider";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root not found");
}

/* Service Worker */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("✅ SW Registered"))
    .catch((err) => console.warn("SW failed:", err));
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
