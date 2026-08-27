import React, { useEffect, useState } from "react";
import AppRoutes from "./AppRoutes";
import useAuth from "./features/auth/hooks/useAuth";
import Lenis from "lenis";
import GlobalErrorToast from "./features/shared/components/GlobalErrorToast";
import Preloader from "./features/shared/components/Preloader";
import { useSelector } from "react-redux";
import "./features/shared/styles/mobile.css";

const App = () => {
  const [isPreloading, setIsPreloading] = useState(true);
  const { handleMe } = useAuth();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const initAuth = async () => {
      await handleMe();
    };
    initAuth();
  }, []);

  useEffect(() => {
    // Disable smooth scroll on touch devices — saves CPU and feels more native
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouchDevice) return;

    let lenis;
    let rafId;

    const initLenis = () => {
      lenis = new Lenis({
        duration: 1.6,
        wheelMultiplier: 0.8,
        touchMultiplier: 0, // fully disable touch (native scroll on mobile)
      });

      function raf(time) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    };

    // Defer initialization to prevent forced synchronous layout (reflow) on mount
    let initId;
    if ('requestIdleCallback' in window) {
      initId = requestIdleCallback(initLenis, { timeout: 1000 });
    } else {
      initId = setTimeout(initLenis, 50);
    }

    return () => {
      if ('cancelIdleCallback' in window && 'requestIdleCallback' in window) {
        cancelIdleCallback(initId);
      } else {
        clearTimeout(initId);
      }
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <>
      {isPreloading && <Preloader onComplete={() => setIsPreloading(false)} />}
      <AppRoutes />
      <GlobalErrorToast />
    </>
  );
};

export default App;
