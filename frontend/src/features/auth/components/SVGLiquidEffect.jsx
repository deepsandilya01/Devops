import { useEffect, useRef } from "react";

/**
 * SVG Metaball / Liquid Glass effect for the home hero section.
 * Uses SVG filters (feGaussianBlur + feColorMatrix threshold) to create
 * a smooth metaball merge effect — no WebGL, pure SVG, ultra-lightweight.
 */

const BLOB_COUNT = 8;
const MOUSE_RADIUS = 180;

export default function SVGLiquidEffect({ className, style }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const ns = "http://www.w3.org/2000/svg";
    const parent = svg.parentElement;
    if (!parent) return;

    let W = 0, H = 0;
    let initialized = false;
    let raf;

    const mouse = { x: 0, y: 0, active: false };
    const blobs = [];
    const group = svg.querySelector(".svg-liquid-blobs");

    // Initialize blobs once sizes are known
    const initBlobs = () => {
      for (let i = 0; i < BLOB_COUNT; i++) {
        const circle = document.createElementNS(ns, "circle");
        const r = 30 + Math.random() * 60;
        const x = Math.random() * W;
        const y = Math.random() * H;
        circle.setAttribute("r", r);
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        group.appendChild(circle);

        blobs.push({
          el: circle,
          x, y, r,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          baseSpeed: 0.3 + Math.random() * 0.5,
          wanderAngle: Math.random() * Math.PI * 2,
          wanderSpeed: 0.5 + Math.random() * 1.0,
        });
      }
      mouse.x = W / 2;
      mouse.y = H / 2;
      raf = requestAnimationFrame(tick);
    };

    /* ── Animation loop ── */
    function tick() {
      for (const b of blobs) {
        /* Wander */
        b.wanderAngle += (Math.random() - 0.5) * 0.08 * b.wanderSpeed;
        b.vx += Math.cos(b.wanderAngle) * 0.02 * b.baseSpeed;
        b.vy += Math.sin(b.wanderAngle) * 0.02 * b.baseSpeed;

        /* Mouse repulsion */
        if (mouse.active) {
          const dx = b.x - mouse.x;
          const dy = b.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 1) {
            const force = (1 - dist / MOUSE_RADIUS) * 2;
            b.vx += (dx / dist) * force;
            b.vy += (dy / dist) * force;
          }
        }

        /* Gentle center pull */
        b.vx += (W / 2 - b.x) * 0.00005;
        b.vy += (H / 2 - b.y) * 0.00005;

        /* Damping */
        b.vx *= 0.985;
        b.vy *= 0.985;

        /* Speed clamp */
        const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (sp > 3) { b.vx *= 3 / sp; b.vy *= 3 / sp; }

        /* Integrate */
        b.x += b.vx;
        b.y += b.vy;

        /* Bounce */
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.5; }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.5; }
        if (b.y + b.r > H) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.5; }

        /* Update DOM */
        b.el.setAttribute("cx", b.x);
        b.el.setAttribute("cy", b.y);
      }

      raf = requestAnimationFrame(tick);
    }

    /* ── ResizeObserver to prevent Forced Reflow on mount ── */
    const ro = new ResizeObserver((entries) => {
      if (!entries.length) return;
      W = entries[0].contentRect.width;
      H = entries[0].contentRect.height;
      if (W === 0 || H === 0) return;

      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      if (!initialized) {
        initialized = true;
        initBlobs();
      }
    });
    ro.observe(parent);

    /* ── Events ── */
    const onMove = (e) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      blobs.forEach(b => b.el.remove());
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="svg-liquid-filter" x="-20%" y="-20%" width="140%" height="140%">
          {/* Blur to merge nearby blobs into smooth metaballs */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          {/* Threshold to crisp the edges — creates the metaball effect */}
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 25 -10"
            result="threshold"
          />
          {/* Composite original back for sharpness */}
          <feComposite in="SourceGraphic" in2="threshold" operator="atop" />
        </filter>
        {/* Gradient fill for the blobs */}
        <radialGradient id="svg-blob-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent, #e8ff00)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--accent, #e8ff00)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--accent, #e8ff00)" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <g className="svg-liquid-blobs" filter="url(#svg-liquid-filter)" fill="url(#svg-blob-grad)" />
    </svg>
  );
}
