import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * 3D Rotating Text effect — inspired by codepen.io/petebarr/pen/oJvVpw
 * Splits each line into individual characters and rotates them on X-axis
 * in a continuous loop, creating a rolling/flipping effect.
 *
 * Usage:
 *   <RotatingText lines={["CRAFT", "SHIP", "SCALE", "BUILD"]} />
 */
export default function RotatingText({ lines = [], className = "", style = {} }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const lineEls = el.querySelectorAll(".rt-line");
    if (!lineEls.length) return;

    const width = window.innerWidth;
    const depth = -width / 8;
    const transformOrigin = `50% 50% ${depth}px`;

    gsap.set(el, { visibility: "visible" });
    gsap.set(lineEls, { perspective: 700, transformStyle: "preserve-3d" });

    /* Split each line into characters manually */
    const allSplits = [];
    lineEls.forEach((lineEl) => {
      const text = lineEl.textContent;
      lineEl.textContent = "";
      const chars = [];
      for (const ch of text) {
        const span = document.createElement("span");
        span.className = "rt-char";
        span.textContent = ch === " " ? "\u00A0" : ch;
        span.style.display = "inline-block";
        lineEl.appendChild(span);
        chars.push(span);
      }
      allSplits.push(chars);
    });

    /* Animate */
    const animTime = 0.9;
    const tl = gsap.timeline({ repeat: -1 });

    allSplits.forEach((chars, index) => {
      tl.fromTo(
        chars,
        { rotationX: -90 },
        {
          rotationX: 90,
          stagger: 0.08,
          duration: animTime,
          ease: "none",
          transformOrigin,
        },
        index * 0.45
      );
    });

    return () => {
      tl.kill();
    };
  }, [lines]);

  return (
    <div ref={containerRef} className={`rt-container ${className}`} style={style}>
      {lines.map((line, i) => (
        <div key={i} className="rt-line">
          {line}
        </div>
      ))}
    </div>
  );
}
