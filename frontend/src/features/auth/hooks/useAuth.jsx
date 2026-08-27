import React from "react";
import { useDispatch } from "react-redux";
import { setError, setLoading, setUser } from "../slices/auth.slice";
import { login, logout, Me, register, updateProfile } from "../services/auth.api";

const useAuth = () => {
  const dispatch = useDispatch();
  const handleLogin = async ({ email, password }) => {
    try {
      dispatch(setLoading(true));
      const response = await login({ email, password });
      dispatch(setUser(response.user));
      return response;
    } catch (err) {
      dispatch(setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.message || "Server Error"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRegister = async ({ email, fullName, contact, password }) => {
    try {
      dispatch(setLoading(true));
      const response = await register({ fullName, contact, email, password });
      dispatch(setUser(response.user));
      return response;
    } catch (err) {
      dispatch(setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.message || "Server Error"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleMe = async () => {
    try {
      dispatch(setLoading(true));
      const response = await Me();
      dispatch(setUser(response.user));
      return response;
    } catch (err) {
      dispatch(setUser(null));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(setLoading(true));
      await logout();
      dispatch(setUser(null));
    } catch (err) {
      dispatch(setError(err.response?.data?.message || "Server Error"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateProfile = async (data) => {
    try {
      dispatch(setLoading(true));
      const response = await updateProfile(data);
      if (response && response.user) {
        dispatch(setUser(response.user));
      }
      return response;
    } catch (err) {
      dispatch(setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.message || "Server Error"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleMe,
    handleLogout,
    handleUpdateProfile
  };
};

export default useAuth;
