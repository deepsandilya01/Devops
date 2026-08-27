import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/slices/auth.slice.js";
import deployReducer from "./features/deploy/slices/deploy.slice.js";
import adminReducer from "./features/admin/slices/admin.slice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    deploy: deployReducer,
    admin: adminReducer,
  },
});
