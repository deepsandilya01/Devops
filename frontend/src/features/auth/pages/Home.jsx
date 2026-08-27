import { useEffect, useRef, useState, Suspense, lazy } from "react";
import SVGLiquidEffect from "../components/SVGLiquidEffect";
import RotatingText from "../components/RotatingText";
import MagneticButton from "../components/MagneticButton";
import { initThree } from "../components/initThree";
import { initGSAP } from "../components/initGSAP";
import { useClock } from "../components/useClock";
import { STEPS, SERVICES, THEMES, VALUES } from "../components/constants";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import HackerText from "../../shared/components/HackerText";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";

// Lazy-loaded: none of these are needed for first paint
const ProjectsCylinder = lazy(() => import("../components/ProjectsCylinder"));
const CTASection = lazy(() => import("../components/CTASection"));
const MouseTrail = lazy(() => import("../components/MouseTrail"));

const LazySection = ({ children, height }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px 0px" });
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {inView ? <Suspense fallback={<div style={{ height }} />}>{children}</Suspense> : null}
    </div>
  );
};

const ServiceRow = ({ s, index }) => {
  const rowRef = useRef(null);
  const imgRef = useRef(null);
  const lastX = useRef(0);

  const images = ["/images/deploy.png", "/images/github.png", "/images/logs.png", "/images/container.png", "/images/edge.png"];

  const handleMouseEnter = (e) => {
    lastX.current = e.clientX;
  };

  const handleMouseLeave = () => {
    if (imgRef.current) {
      gsap.to(imgRef.current, { rotation: 0, duration: 0.8, ease: "power3.out" });
    }
  };

  const handleMouseMove = (e) => {
    if (!rowRef.current || !imgRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;

    const targetRotation = Math.max(-20, Math.min(20, deltaX * -0.8));

    gsap.to(imgRef.current, {
      x: x,
      y: y,
      xPercent: -50,
      yPercent: -50,
      rotation: targetRotation,
      duration: 0.8,
      ease: "power3.out"
    });
  };

  return (
    <div className="srv-row" ref={rowRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove}>
      <img ref={imgRef} src={images[index % images.length]} className="srv-hover-img" alt="" loading="lazy" />
      <div className="srv-left" style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
        <span className="srv-num">{s.num}</span>
        <div>
          <div className="srv-name glitch-text" data-text={s.name}>{s.name}</div>
          <div className="srv-tag"><HackerText text={s.tag} /></div>
        </div>
      </div>
      <span className="srv-arrow" style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>→</span>
    </div>
  );
};

const ValueCard = ({ v }) => {
  return (
    <div className="value-card value-effect-container">
      <div className="value-inner">
        <div className="value-icon">{v.icon}</div>
        <div className="value-title glitch-text" data-text={v.title}>{v.title}</div>
        <div className="value-desc">{v.desc}</div>
      </div>

      <span className="value-hover-layer">
        <div className="value-inner inverted">
          <div className="value-icon">{v.icon}</div>
          <div className="value-title" data-text={v.title}>{v.title}</div>
          <div className="value-desc">{v.desc}</div>
        </div>
      </span>
    </div>
  );
};

export default function Home() {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState("midnight");
  const clock = useClock();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() =>
    window.innerWidth <= 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile || !canvasRef.current) return;
    let cleanup;
    initThree(canvasRef.current).then((fn) => { cleanup = fn; });
    return () => { if (cleanup) cleanup(); };
  }, [isMobile]);

  useEffect(() => {
    let id;
    if ('requestIdleCallback' in window) {
      id = requestIdleCallback(() => initGSAP(), { timeout: 2000 });
    } else {
      id = setTimeout(initGSAP, 100);
    }
    return () => {
      if ('cancelIdleCallback' in window && 'requestIdleCallback' in window) {
        cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  // Click Particle Effect
  useEffect(() => {
    const handleClick = (e) => {
      // Don't override native clickable elements
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.theme-dot')) return;

      const words = ["SYS", "OK", "NULL", "DEP", "EXE", "200", "PING"];
      const word = words[Math.floor(Math.random() * words.length)];

      const el = document.createElement("div");
      el.className = "click-particle text-particle";
      el.innerText = `[${word}]`;

      // Create exploding plus signs
      for (let i = 0; i < 4; i++) {
        const plus = document.createElement("div");
        plus.className = "click-particle plus-particle";
        plus.innerText = "+";
        document.body.appendChild(plus);

        gsap.fromTo(plus,
          { x: e.clientX, y: e.clientY, opacity: 1, scale: Math.random() * 0.5 + 0.5 },
          {
            x: e.clientX + (Math.random() - 0.5) * 120,
            y: e.clientY + (Math.random() - 0.5) * 120,
            opacity: 0,
            rotation: Math.random() * 180 - 90,
            duration: 0.6 + Math.random() * 0.4,
            ease: "power3.out",
            onComplete: () => plus.remove()
          }
        );
      }

      document.body.appendChild(el);

      // Create floating text
      gsap.fromTo(el,
        { x: e.clientX, y: e.clientY, opacity: 1, scale: 0.5 },
        {
          y: e.clientY - 80,
          opacity: 0,
          scale: 1.2,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => el.remove()
        }
      );
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleThemeChange = (newThemeId, e) => {
    const updateTheme = () => {
      setTheme(newThemeId);
    };

    if (!document.startViewTransition || !e) {
      updateTheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      updateTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
        ],
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    });
  };

  return (
    <>
      <Suspense fallback={null}><MouseTrail /></Suspense>
      <div className="noise-overlay" />
      {!isMobile && <canvas id="three-bg" ref={canvasRef} />}


      <nav className="nav">
        <div className="nav-logo">
          <span className="logo-quick">Quick</span><span className="logo-live">live</span>
        </div>

        <div className="theme-switcher">
          <span className="theme-label-text">THEME</span>
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-dot ${theme === t.id ? "active" : ""}`}
              style={{ background: t.accent }}
              onClick={(e) => handleThemeChange(t.id, e)}
              title={t.id}
            />
          ))}
        </div>

        <div className="nav-links">
          <a href="#swork"><HackerText text="Work" /></a>
          <a href="#sabout"><HackerText text="About" /></a>
          <a href="#sservices"><HackerText text="Services" /></a>
          <a href="#sprojects"><HackerText text="Deploy" /></a>
          <MagneticButton onClick={() => {
            navigate('/register')
          }} className="nav-cta"><HackerText text="Register Now!" /></MagneticButton>
          <MagneticButton onClick={() => {
            navigate('/login')
          }} className="nav-cta nav-cta-outline"><HackerText text="Login" /></MagneticButton>
        </div>
      </nav>

      <div id="studio-app">
        <section id="hero">
          {!isMobile && (
            <SVGLiquidEffect className="hero-svg-liquid" style={{ position: "absolute", inset: 0, zIndex: 0, width: "100%", height: "100%" }} />
          )}

          <div className="hero-meta">
            <div>Push. Build. Deploy.</div>
            <div>Platform v1.0</div>
          </div>
          <h1 className="hero-title" data-scroll-speed="1.5">
            <span className="hero-line">
              <span className="hero-word hero-hover-word">PUSH</span>{" "}
              <span className="hero-word hero-hover-word">CODE</span>
            </span>
            <span className="hero-line">
              <span className="hero-word hero-yellow hero-hover-word">DEPLOY</span>{" "}
              <span className="hero-word hero-hover-word">&amp;</span>{" "}
              <span className="hero-word hero-hover-word">HOST</span>
            </span>
            <span className="hero-line">
              <span className="hero-word hero-hover-word">INSTANTLY</span>
            </span>
          </h1>
          <div className="hero-sub" data-scroll-speed="0.8">
            <div className="hero-desc-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className="hero-actions">
                <MagneticButton onClick={() => navigate('/dashboard')} className="hero-btn">
                  <HackerText text="START DEPLOYING" />
                </MagneticButton>
              </div>
              <p className="hero-desc">
                The premium deployment platform for modern web teams. Connect your repo, push your code, and let our infrastructure handle the rest.
              </p>
            </div>
            <div className="hero-scroll">
              <div className="hero-sline" />
              <span>Scroll to explore</span>
            </div>
          </div>
          <div className="hero-loc">
            <div>SHERYIANS HACKATHON</div>
            <div className="hero-clock">{clock}</div>
          </div>
        </section>

        <div className="marquee-transition-wrap">
          <div className="marquee-stripe marquee-stripe-left">
            <span>ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦</span>
          </div>
          <div className="marquee-stripe marquee-stripe-right">
            <span>GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦</span>
          </div>
        </div>

        <section id="swork" className="process-wrap">
          <div className="process-progress">
            <div className="process-progress-fill" />
          </div>
          <div className="process-header about-top">
            <div className="about-num-big">01</div>
            <div>
              <div className="sec-num"><HackerText text="// PROCESS" /></div>
              <div className="sec-title glitch-text" data-text="How It Works">How It<br />Works</div>
            </div>
          </div>
          <div className="process-stage">
            {STEPS.map((s, i) => (
              <div key={i} className="process-step text-effect-container">
                <div className="step-inner">
                  <div className="step-icon">{s.icon}</div>
                  <div className="step-num">{s.num}</div>
                  <div className="step-content">
                    <div className="step-title glitch-text" data-text={s.title}>{s.title}</div>
                    <div className="step-line" />
                    <p className="step-desc">{s.desc}</p>
                  </div>
                </div>

                <span className="step-hover-layer">
                  <div className="step-inner inverted">
                    <div className="step-icon">{s.icon}</div>
                    <div className="step-num">{s.num}</div>
                    <div className="step-content">
                      <div className="step-title" data-text={s.title}>{s.title}</div>
                      <div className="step-line" />
                      <p className="step-desc">{s.desc}</p>
                    </div>
                  </div>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="sabout" className="sec about-sec">
          <div className="about-top">
            <div className="about-num-big">02</div>
            <div>
              <div className="sec-num sec-num-dark">// ABOUT</div>
              <div className="sec-title sec-title-dark glitch-text" data-text="The Platform">The<br />Platform</div>
            </div>
          </div>
          <div className="about-divider" />
          <div className="manifesto">
            <div className="manifesto-big glitch-text" data-text="Stop configuring servers. Start shipping products.">
              Stop<br />configuring <span className="red">servers.</span><br />Start shipping<br />products.
            </div>
            <div className="manifesto-right">
              <p className="manifesto-p">
                An ultra-fast, zero-configuration deployment engine built specifically for frontend developers and full-stack teams.
              </p>
              <p className="manifesto-p">
                Connect your repository, manage your environment variables, and watch your application go live with real-time build logs.
              </p>
              <div className="values-row">
                {VALUES.map((v, i) => (
                  <ValueCard key={i} v={v} index={i} />
                ))}
              </div>
            </div>
          </div>
          <div className="about-tagline">
            <span className="about-dot" />
            <span>SYSTEMS OPERATIONAL</span>
            <span className="about-dot" />
            <span>ACCEPTING PROJECTS</span>
            <span className="about-dot" />
            <span>SHERYIANS HACKATHON</span>
          </div>
        </section>

        <section id="sservices" className="sec">
          <div className="about-top" style={{ marginBottom: '4rem' }}>
            <div className="about-num-big">03</div>
            <div>
              <div className="sec-num"><HackerText text="// CAPABILITIES" /></div>
              <div className="sec-title glitch-text" data-text="Features">Core<br />Features</div>
            </div>
          </div>
          <div className="srv-list">
            {SERVICES.map((s, i) => (
              <ServiceRow key={i} s={s} index={i} />
            ))}
          </div>
        </section>

        <LazySection height="400px">
          <ProjectsCylinder />
        </LazySection>

        <div className="marquee-transition-wrap">
          <div className="marquee-stripe marquee-stripe-left">
            <span>ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦ ZERO CONFIG ✦ INSTANT DEPLOYS ✦ EDGE NETWORK ✦</span>
          </div>
          <div className="marquee-stripe marquee-stripe-right">
            <span>GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦ GLOBAL INFRASTRUCTURE ✦ 99.9% UPTIME ✦ SEAMLESS SCALING ✦</span>
          </div>
        </div>

        <LazySection height="100vh">
          <CTASection />
        </LazySection>

        <footer className="footer">
          <div className="footer-logo"><span>Quick</span>live</div>
          <p>© 2025 — All systems operational</p>
          <p>Sheryians Hackathon · v1.0.0</p>
        </footer>
      </div>
    </>
  );
}