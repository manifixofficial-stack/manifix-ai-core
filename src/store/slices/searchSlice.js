import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  query: "",
  results: [],
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    setResults(state, action) {
      state.results = action.payload;
    },
    clearSearch(state) {
      state.query = "";
      state.results = [];
    },
  },
});

export const { setQuery, setResults, clearSearch } =
  searchSlice.actions;

export default searchSlice.reducer;
