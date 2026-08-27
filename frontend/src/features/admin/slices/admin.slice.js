import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  projects: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    removeProject: (state, action) => {
      state.projects = state.projects.filter(
        (proj) => proj._id !== action.payload,
      );
    },
  },
});

export const { setUsers, setProjects, setLoading, setError, removeProject } =
  adminSlice.actions;

export default adminSlice.reducer;
