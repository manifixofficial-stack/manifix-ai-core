import React, { useEffect } from "react";
import AppRouter from "./AppRouter";

export default function App() {

  /* Notification Permission */
  useEffect(() => {
    if ("Notification" in window") {
      Notification.requestPermission();
    }
  }, []);

  return <AppRouter />;
}
