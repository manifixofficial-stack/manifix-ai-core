import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  listening: false,
  transcript: "",
};

const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    startListening(state) {
      state.listening = true;
    },
    stopListening(state) {
      state.listening = false;
    },
    setTranscript(state, action) {
      state.transcript = action.payload;
    },
    clearTranscript(state) {
      state.transcript = "";
    },
  },
});

export const {
  startListening,
  stopListening,
  setTranscript,
  clearTranscript,
} = voiceSlice.actions;

export default voiceSlice.reducer;
