import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css"; // Injects your premium gold and black styles globally

// This register block tells the browser to safely run your public/sw.js script in the background
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("🤖 Game Service Worker Registered Successfully"))
      .catch((err) => console.warn("Service Worker connection failed:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
