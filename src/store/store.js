import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./slices/settingsSlice";
import { useDispatch, useSelector } from "react-redux";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
  },
});

// Typed hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// default export (optional)
export default store;
