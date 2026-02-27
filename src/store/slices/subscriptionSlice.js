import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  plan: "free",
  active: false,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSubscription(state, action) {
      state.plan = action.payload.plan;
      state.active = action.payload.active;
    },
    clearSubscription(state) {
      state.plan = "free";
      state.active = false;
    },
  },
});

export const { setSubscription, clearSubscription } =
  subscriptionSlice.actions;

export default subscriptionSlice.reducer;
