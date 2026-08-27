import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Eagerly loaded (home page must be fast)
import Home from "./features/auth/pages/Home";
import PageSwitcher from "./features/shared/components/PageSwitcher";
import CustomCursor from "./features/shared/components/CustomCursor";
import PrivateRoute from "./features/shared/components/PrivateRoute";
import PublicRoute from "./features/shared/components/PublicRoute";
import NotFound from "./features/shared/components/NotFound";

// Lazy loaded — these are code-split into separate chunks
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const Dashboard = lazy(() => import("./features/deploy/pages/Dashboard"));
const Projects = lazy(() => import("./features/deploy/pages/Projects"));
const Deploy = lazy(() => import("./features/deploy/pages/Deploy"));
const Settings = lazy(() => import("./features/deploy/pages/Settings"));
const GlobalSettings = lazy(() => import("./features/auth/pages/GlobalSettings"));
const AIChatPanel = lazy(() => import("./features/shared/components/AIChatPanel"));
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));
const GenerateWebsite = lazy(() => import("./features/deploy/pages/GenerateWebsite"));

// Minimal fallback while lazy chunk loads
const PageFallback = () => (
  <div style={{
    minHeight: '100vh', background: '#050505', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      border: '2px solid rgba(232,255,0,0.3)', borderTopColor: '#e8ff00',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionKey, setTransitionKey] = useState(0);

  // Determine if the AI Chat Panel should be shown on the current route
  const showAIChat = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/projects') ||
    location.pathname.startsWith('/deploy') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/generate');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        window.scrollTo(0, 0);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation.pathname]);


  return (
    <>
      {showAIChat && (
        <Suspense fallback={null}>
          <AIChatPanel />
        </Suspense>
      )}
      {transitionKey > 0 && <PageSwitcher key={`transition-${transitionKey}`} />}
      <Suspense fallback={<PageFallback />}>
        <Routes location={displayLocation}>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/deploy/:repoId" element={<Deploy />} />
            <Route path="/settings/:repoId" element={<Settings />} />
            <Route path="/account" element={<GlobalSettings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/generate" element={<GenerateWebsite />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <CustomCursor />
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default AppRoutes;
