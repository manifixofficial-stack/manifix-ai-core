// src/pages/Settings.jsx

import React, { useState, useEffect } from "react";
import "../styles/settings.css";

const Settings = () => {

  const [notifications, setNotifications] = useState(true);
  const [timeRange, setTimeRange] = useState("6-7");
  const [freeze, setFreeze] = useState(1);

  /* LOAD SAVED */
  useEffect(() => {
    const savedStart = localStorage.getItem("notif_start");
    const savedEnd = localStorage.getItem("notif_end");
    const savedNotif = localStorage.getItem("notifications");
    const savedFreeze = localStorage.getItem("freeze");

    if (savedStart && savedEnd) {
      setTimeRange(`${savedStart}-${savedEnd}`);
    }

    if (savedNotif !== null) {
      setNotifications(savedNotif === "true");
    }

    if (savedFreeze !== null) {
      setFreeze(Number(savedFreeze));
    }
  }, []);

  /* SAVE */
  const handleSave = () => {
    const [start, end] = timeRange.split("-");

    localStorage.setItem("notif_start", start);
    localStorage.setItem("notif_end", end);
    localStorage.setItem("notifications", notifications);

    alert("🔥 Settings saved. Your habit system is active.");
  };

  return (
    <div className="settings-page">

      <h1 className="title">⚙️ Habit Settings</h1>

      {/* 🔔 NOTIFICATIONS */}
      <div className="card">
        <h3>🔔 Daily Reminders</h3>

        <label className="toggle">
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
          Enable Notifications
        </label>
      </div>

      {/* ⏰ TIME RANGE */}
      <div className="card">
        <h3>⏰ Choose Your Time Window</h3>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="3-6">🌅 3:00 AM – 6:00 AM (Deep Focus)</option>
          <option value="6-7">🔥 6:00 AM – 7:00 AM (Best Habit Time)</option>
          <option value="18-20">🌇 6:00 PM – 8:00 PM (Evening Reset)</option>
          <option value="21-22">🌙 9:00 PM – 10:00 PM (Last Chance)</option>
        </select>

        <p className="hint">
          We’ll pick the perfect time for you daily 🎯
        </p>
      </div>

      {/* 🧊 STREAK FREEZE */}
      <div className="card">
        <h3>🧊 Streak Protection</h3>
        <p>You have <strong>{freeze}</strong> freeze(s)</p>

        <p className="hint">
          Miss a day? We protect your streak automatically.
        </p>
      </div>

      {/* 🧠 PSYCHOLOGY */}
      <div className="card highlight">
        <h3>🧠 Why this matters</h3>
        <p>
          Consistency beats motivation.  
          One session a day = long-term transformation.
        </p>
      </div>

      {/* SAVE BUTTON */}
      <button className="save-btn" onClick={handleSave}>
        🚀 Activate My Routine
      </button>

    </div>
  );
};

export default Settings;
