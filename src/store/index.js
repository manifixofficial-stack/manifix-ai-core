// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

// Reducers
import authReducer from "./slices/authSlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import voiceReducer from "./slices/voiceSlice";
import aiReducer from "./slices/aiSlice";
import uiReducer from "./slices/uiSlice";
import searchReducer from "./slices/searchSlice";
import notificationsReducer from "./slices/notificationsSlice";
import settingsReducer from "./slices/settingsSlice";
import historyReducer from "./slices/historySlice";
import chatReducer from "./slices/chatSlice";

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    subscription: subscriptionReducer,
    voice: voiceReducer,
    ai: aiReducer,
    ui: uiReducer,
    search: searchReducer,
    notifications: notificationsReducer,
    settings: settingsReducer,
    history: historyReducer,
    chat: chatReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

// Typed-like hooks (JS version, no TypeScript)
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Default export
export default store;
