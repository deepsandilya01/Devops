import { useRef, useCallback } from "react";
import { gsap } from "gsap";

/**
 * MagneticButton — button that magnetically pulls toward the cursor
 * when hovered, then snaps back on leave.
 *
 * Usage:
 *   <MagneticButton className="nav-cta">Register Now!</MagneticButton>
 */
export default function MagneticButton({
  children,
  className = "",
  style = {},
  strength = 0.35,
  as: Tag = "button",
  ...rest
}) {
  const btnRef = useRef(null);

  const onMove = useCallback(
    (e) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
  }, []);

  return (
    <Tag
      ref={btnRef}
      className={`magnetic-btn ${className}`}
      style={{ display: "inline-block", willChange: "transform", ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      {children}
    </Tag>
  );
}
