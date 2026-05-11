import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppProvider";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";

// ✅ ADD THIS — service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("✅ SW Registered"))
    .catch((err) => console.warn("SW failed:", err));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
