import React from "react";
import AppRouter from "./AppRouter";
import CookieBanner from "./components/CookieBanner";

export default function App() {
  return (
    <>
      <AppRouter />
      <CookieBanner /> {/* ✅ ADD THIS */}
    </>
  );
}
