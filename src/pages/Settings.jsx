// src/pages/Settings.jsx
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  updateTheme,
  updateNotifications,
  updateLanguage,
} from "../store/slices/settingsSlice";
import "../styles/settings.css"; // Neon-inspired styling

const Settings = () => {
  const dispatch = useAppDispatch();
  const { theme, notifications, language } = useAppSelector(
    (state) => state.settings
  );

  const [localTheme, setLocalTheme] = useState(theme);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [localLanguage, setLocalLanguage] = useState(language);

  const handleSave = () => {
    dispatch(updateTheme(localTheme));
    dispatch(updateNotifications(localNotifications));
    dispatch(updateLanguage(localLanguage));
    alert("Settings saved ✨");
  };

  return (
    <div className="settings-page">
      <h1 className="neon-text">⚙️ Settings</h1>

      <div className="settings-card">
        <label>Theme</label>
        <select
          value={localTheme}
          onChange={(e) => setLocalTheme(e.target.value)}
        >
          <option value="light">Light 🌞</option>
          <option value="dark">Dark 🌙</option>
          <option value="system">System 💻</option>
        </select>
      </div>

      <div className="settings-card">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={localNotifications}
            onChange={() => setLocalNotifications(!localNotifications)}
          />
          Enable Notifications 🔔
        </label>
      </div>

      <div className="settings-card">
        <label>Language</label>
        <select
          value={localLanguage}
          onChange={(e) => setLocalLanguage(e.target.value)}
        >
          <option value="en">English 🇺🇸</option>
          <option value="hi">Hindi 🇮🇳</option>
          <option value="es">Spanish 🇪🇸</option>
        </select>
      </div>

      <button className="btn neon-btn" onClick={handleSave}>
        Save Settings ✨
      </button>

      <section className="features-section">
        <h2 className="neon-text">ManifiX Features</h2>
        <ul className="features-list">
          <li>💬 GPT Conversations</li>
          <li>🎤 STT & TTS Integration</li>
          <li>🌀 Magic16 Rituals</li>
          <li>🌙 Vibe Sharing & Manifestation</li>
          <li>🎵 Music & Meditation</li>
        </ul>
      </section>
    </div>
  );
};

export default Settings;
