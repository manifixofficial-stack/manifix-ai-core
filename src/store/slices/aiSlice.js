import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  thinking: false,
  lastResponse: null,
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    aiStart(state) {
      state.thinking = true;
    },
    aiSuccess(state, action) {
      state.thinking = false;
      state.lastResponse = action.payload;
    },
    aiStop(state) {
      state.thinking = false;
    },
  },
});

export const { aiStart, aiSuccess, aiStop } = aiSlice.actions;

export default aiSlice.reducer;
