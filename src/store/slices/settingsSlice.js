// src/store/slices/settingsSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: "light", // "light" or "dark"
  notifications: true,
  language: "en",
  soundEnabled: true,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    // Toggle between light/dark theme
    updateTheme: (state, action) => {
      state.theme = action.payload; // expects "light" or "dark"
    },

    // Enable or disable notifications
    updateNotifications: (state, action) => {
      state.notifications = action.payload; // expects true/false
    },

    // Set app language
    updateLanguage: (state, action) => {
      state.language = action.payload; // expects "en", "es", etc.
    },

    // Toggle sound (for other app features)
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
  },
});

// Export actions
export const {
  updateTheme,
  updateNotifications,
  updateLanguage,
  toggleSound,
} = settingsSlice.actions;

// Default export
export default settingsSlice.reducer;
