import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PublicRoute = () => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0a0a0a", color: "var(--accent, #e8ff00)", fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: "0.1em" }}>
        <div style={{ animation: "pulse 1.5s infinite" }}>INITIALIZING...</div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
