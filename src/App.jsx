import React, { useEffect } from "react";
import AppRouter from "./AppRouter";
import CookieBanner from "./components/CookieBanner";

export default function App() {

  /* 🔔 REQUEST NOTIFICATION PERMISSION */
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  /* 🔥 DAILY STREAK CHECK SYSTEM */
  useEffect(() => {
    const lastDate = localStorage.getItem("magic16_last_date");
    const today = new Date().toDateString();

    let streak = Number(localStorage.getItem("magic16_streak") || 0);
    let freeze = Number(localStorage.getItem("freeze") || 1);

    if (lastDate && lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // if missed day
      if (lastDate !== yesterday.toDateString()) {

        if (freeze > 0) {
          freeze--;
          localStorage.setItem("freeze", freeze);
        } else {
          streak = 0; // streak broken
        }

        localStorage.setItem("magic16_streak", streak);
      }

      /* 🔔 SEND WARNING NOTIFICATION */
      if (Notification.permission === "granted") {
        new Notification("🔥 Your streak is at risk!", {
          body: "Complete 1 session now to keep it alive.",
        });
      }
    }

  }, []);

  return (
    <>
      <AppRouter />
      <CookieBanner />
    </>
  );
}
