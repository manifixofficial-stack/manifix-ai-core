import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sessions: [],
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addSession(state, action) {
      state.sessions.push(action.payload);
    },
    clearHistory(state) {
      state.sessions = [];
    },
  },
});

export const { addSession, clearHistory } =
  historySlice.actions;

export default historySlice.reducer;
