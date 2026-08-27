import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function MouseTrail({ compact = false }) {
  const svgRef = useRef(null);
  const [isMobile] = useState(() =>
    window.innerWidth <= 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );

  // Skip entirely on mobile/touch devices
  if (isMobile) return null;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const p0 = svg.querySelector('#p0');
    // compact = fewer, thinner segments for dashboard; full = dramatic home trail
    const nPaths = compact ? 20 : 60;
    const strokeMult = compact ? 0.06 : 0.15;
    const strokeCap  = compact ? 1.0  : 2.2;
    const taper      = compact ? 1.8  : 1.2; // faster fade in compact mode

    const paths = [];
    const pts = [];
    const m = { x: innerWidth / 2, y: innerHeight };
    const xTo = gsap.quickTo(m, "x", { duration: 0.3 });
    const yTo = gsap.quickTo(m, "y", { duration: 0.3 });

    // Get base hue from current theme accent without forcing DOM reflow
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#e8ff00';
    let rv = 232 / 255, gv = 255 / 255, bv = 0; // Default to #e8ff00
    
    if (accent.startsWith('#')) {
      const hex = accent.replace('#', '');
      if (hex.length === 6) {
        rv = parseInt(hex.substring(0, 2), 16) / 255;
        gv = parseInt(hex.substring(2, 4), 16) / 255;
        bv = parseInt(hex.substring(4, 6), 16) / 255;
      }
    } else if (accent.startsWith('rgb')) {
      const vals = accent.match(/\d+/g);
      if (vals && vals.length >= 3) {
        rv = parseInt(vals[0]) / 255;
        gv = parseInt(vals[1]) / 255;
        bv = parseInt(vals[2]) / 255;
      }
    }

    const max = Math.max(rv, gv, bv), min = Math.min(rv, gv, bv);
    let h = 0;
    if (max !== min) {
      const dd = max - min;
      if (max === rv) h = ((gv - bv) / dd + (gv < bv ? 6 : 0)) / 6;
      else if (max === gv) h = ((bv - rv) / dd + 2) / 6;
      else h = ((rv - gv) / dd + 4) / 6;
    }
    const baseHue = Math.round(h * 360);

    for (let i = 0; i < nPaths; i++) {
      const path = p0.cloneNode();
      path.setAttribute("data-stroke-width", gsap.utils.wrapYoyo(1, nPaths / 2, i));
      path.setAttribute("data-speed", 0.25);
      path.removeAttribute("style");
      svg.prepend(path);
      paths.push(path);
      pts.push({ x: innerWidth * Math.random(), y: (1 - i / nPaths) * innerHeight });
    }

    const onMove = (e) => { xTo(e.x); yTo(e.y); };
    window.addEventListener("pointermove", onMove);

    const tick = () => {
      let next = { x: m.x, y: m.y };
      const time = Date.now() * 0.08;

      pts.forEach((pt, i) => {
        pt.x += (next.x - pt.x) / 4;
        pt.y += (next.y - pt.y) / 4;

        if (i > 0) {
          const prev = pts[i - 1];
          const dist = Math.hypot(prev.x - pt.x, prev.y - pt.y);

          const progress = i / nPaths;
          const currentHue = (baseHue + (progress * 150) - time) % 360;
          const lightness = 65 - (progress * 50);
          const alpha = 1 - Math.pow(progress, 2);

          gsap.set(paths[i], {
            attr: {
              d: 'M' + prev.x + ',' + prev.y + ' L' + pt.x + ',' + pt.y,
              "stroke": `hsla(${currentHue}, 100%, ${lightness}%, ${alpha})`,
              "stroke-width": (i, t) => {
                const baseWidth = parseFloat(t.dataset.strokeWidth);
                return baseWidth * Math.min(dist * strokeMult, strokeCap) * Math.pow(1 - progress, taper);
              }
            }
          });
        }
        next = pt;
      });
    };

    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
      paths.forEach(p => p.remove());
    };
  }, [compact]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        overflow: 'visible', pointerEvents: 'none',
        zIndex: 9999, mixBlendMode: 'screen',
      }}
    >
      <path id="p0" fill="none" strokeLinecap="round" />
    </svg>
  );
}
