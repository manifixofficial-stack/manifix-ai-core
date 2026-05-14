import React, { useEffect } from "react";

export default function App() {

  /* Notification Permission */
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div
      style={{
        background: "#000",
        color: "gold",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "40px",
        fontWeight: "bold",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      ManifiX AI
    </div>
  );
}
