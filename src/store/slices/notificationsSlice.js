import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action) {
      state.list.push(action.payload);
    },
    removeNotification(state, action) {
      state.list = state.list.filter(
        (n) => n.id !== action.payload
      );
    },
    clearNotifications(state) {
      state.list = [];
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
