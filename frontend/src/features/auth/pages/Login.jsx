import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import LiquidGlass from "../components/LiquidGlass";
import "../styles/Auth.css";
import Laptop from "../components/Laptop";
import MagneticButton from "../components/MagneticButton";
import useAuth from "../hooks/useAuth";
import HackerText from "../../shared/components/HackerText";
import MouseTrail from "../components/MouseTrail";
import StaggeredText from "../../shared/components/StaggeredText";
import ElasticText from "../../shared/components/ElasticText";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin } = useAuth();
  const payload = { email, password };
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
    const tl = gsap.timeline({ delay: 0.3 });
    tl.to(".auth-brand", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
    });
    tl.to(
      ".auth-heading",
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      "-=0.4",
    );
    tl.to(
      ".auth-sub",
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      "-=0.3",
    );
    tl.to(
      ".auth-field",
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" },
      "-=0.2",
    );
    tl.to(
      ".auth-submit, .auth-github-btn",
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" },
      "-=0.1",
    );
    tl.to(
      ".auth-footer",
      { opacity: 1, duration: 0.5, ease: "power3.out" },
      "-=0.2",
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await handleLogin(payload);
    if (res.success) {
      navigate('/dashboard')
    }
  };

  return (
    <div className="auth-page">
      <MouseTrail />
      {!isMobile && (
        <LiquidGlass
          className="auth-liquid"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
      )}
      <div className="auth-noise" />

      <Link to="/" className="auth-return-btn">
        <HackerText text="← RETURN TO BASE" />
      </Link>

      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-3d-area">
            <Laptop />
          </div>
          <div className="auth-left-content">
            <div className="auth-eyebrow">// QUICKLIVE</div>
            <div
              className="auth-tagline glitch-text"
              data-text="CRAFT. SHIP. SCALE."
            >
              CRAFT.
              <br />
              SHIP.
              <br />
              SCALE.
            </div>
            <p className="auth-left-desc">
              Premium digital experiences — designed to perform, built to last.
            </p>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <Link to="/" className="auth-brand">
              <span className="logo-quick">Quick</span>
              <span className="logo-live">live</span>
            </Link>

            <h1 className="auth-heading">
              <ElasticText text="Welcome Back" />
            </h1>
            <p className="auth-sub">
              Sign in to continue building extraordinary.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    style={{ paddingRight: '3rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <MagneticButton type="submit" className="auth-submit">
                <StaggeredText text="SIGN IN →" />
              </MagneticButton>
              
              <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'rgba(255, 255, 255, 0.4)' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <span style={{ padding: '0 1rem', fontSize: '0.8rem', letterSpacing: '0.1em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              </div>

              <button
                type="button"
                className="auth-github-btn"
                onClick={() => window.location.href = "https://quicklive.tech/api/auth/github"}
              >
                <GithubIcon />
                CONTINUE WITH GITHUB
              </button>
            </form>

            <div className="auth-footer">
              <span>Don't have an account? </span>
              <Link to="/register" className="auth-link">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
