import { useEffect, useRef, useState } from "react";
import "../styles/CustomCursor.css";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [isMobile] = useState(() =>
    window.innerWidth <= 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );

  if (isMobile) return null;

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const onMove = (e) => {
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
    };

    const isInteractive = (target) => {
      return target.closest(
        "a, button, .work-card, .srv-row, .nav-logo, .logo-live, .logo-quick, input, select, [role='button'], .theme-dot, .nav-cont, .auth-link, .rt-line"
      );
    };

    const onMouseOver = (e) => {
      if (isInteractive(e.target)) {
        el.classList.add("big");
      }
    };

    const onMouseOut = (e) => {
      if (isInteractive(e.target)) {
        el.classList.remove("big");
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  return <div id="s-cursor" ref={cursorRef} />;
}
