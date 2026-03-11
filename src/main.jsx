import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppProvider";
import { Provider } from "react-redux";
import store from "./store"; // adjust path if needed
import App from "./App";
import { HelmetProvider } from "react-helmet-async"; // <-- import

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider> {/* <-- wrap here */}
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
