import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "../styles/navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth";
import { useSelector } from "react-redux";
import HackerText from "./HackerText";
import StaggeredText from "./StaggeredText";

const Navbar = () => {
  const [isBigNavVisible, setIsBigVisible] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const bigNavRef = useRef(null);
  const navRef = useRef(null);
  const linksRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const auth = useAuth() || {};
  const { handleLogout } = auth;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (handleLogout) {
      const { success } = await handleLogout();
      console.log(success);
      if (success) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  const themes = [
    { id: "midnight", hex: "#e8ff00", rgb: "232, 255, 0" },
    { id: "void", hex: "#c084fc", rgb: "192, 132, 252" },
    { id: "ember", hex: "#fb923c", rgb: "251, 146, 60" },
    { id: "arctic", hex: "#38bdf8", rgb: "56, 189, 248" },
    { id: "venom", hex: "#4ade80", rgb: "74, 222, 128" }
  ];

  const handleThemeChange = (theme, e) => {
    const updateTheme = () => {
      document.body.dataset.theme = theme.id;
      document.documentElement.style.setProperty("--acid", theme.hex);
      document.documentElement.style.setProperty("--acid-rgb", theme.rgb);
      document.documentElement.style.setProperty("--accent", theme.hex); // Sync with Home.css
      localStorage.setItem("quicklive-theme", JSON.stringify(theme));
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

  useEffect(() => {
    const savedTheme = localStorage.getItem("quicklive-theme");
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        handleThemeChange(theme);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;
      if (window.scrollY > 100) {
        navRef.current.style.transform = "translateY(-100%)";
      } else {
        navRef.current.style.transform = "translateY(0%)";
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const isAppRoute = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/projects') ||
    location.pathname.startsWith('/deploy') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/generate');

  const menuItems = isAppRoute
    ? [
      { label: "Dashboard", to: "/dashboard", icon: "⊞" },
      { label: "Projects", to: "/projects", icon: "≡" },
      { label: "Website Generator", to: "/generate", icon: "⋈" },
      { label: "Account Settings", to: "/account", icon: "◎" },
      ...(user?.role === 'admin' ? [{ label: "Admin Panel", to: "/admin", icon: "⚙" }] : []),
    ]
    : [
      { label: "Home", to: "/", icon: "⊞" },
      { label: "Work", to: "/#swork", icon: "≡" },
      { label: "About", to: "/#sabout", icon: "◎" },
      { label: "Services", to: "/#sservices", icon: "⊡" },
      { label: "Open App", to: "/dashboard", icon: "⋈" },
    ];

  const openNav = () => {
    setIsBigVisible(true);
    gsap.fromTo(
      bigNavRef.current,
      { yPercent: 100 },
      { yPercent: -10.3, duration: 0.65, ease: "power3.inOut" },
    );
    gsap.fromTo(
      linksRef.current.filter(Boolean),
      { x: -150, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.08,
        ease: "elastic.out(1, 0.5)",
        delay: 0.3,
      },
    );
  };

  const closeNav = () => {
    gsap.to(bigNavRef.current, {
      yPercent: -100,
      duration: 0.55,
      ease: "power3.inOut",
      onComplete: () => setIsBigVisible(false),
    });
  };

  const handleNavigate = (to) => {
    closeNav();
    if (to.startsWith('/#')) {
      if (location.pathname === '/') {
        const id = to.replace('/#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(to);
      }
    } else {
      navigate(to);
    }
  };

  return (
    <nav className="shared-nav">
      {/* Global Quicklive Logo Top Left */}
      <div
        className="nav-logo-wrap"
        onClick={() => navigate(isAppRoute ? "/dashboard" : "/")}
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2.5rem',
          fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
          fontSize: '2.4rem',
          fontWeight: 900,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          zIndex: 101,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          const quick = e.currentTarget.querySelector('.logo-quick');
          const live = e.currentTarget.querySelector('.logo-live');
          if (quick) quick.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
          if (live) live.style.textShadow = '0 0 20px rgba(var(--acid-rgb, 232, 255, 0), 0.7), 0 0 40px rgba(var(--acid-rgb, 232, 255, 0), 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          const quick = e.currentTarget.querySelector('.logo-quick');
          const live = e.currentTarget.querySelector('.logo-live');
          if (quick) quick.style.textShadow = 'none';
          if (live) live.style.textShadow = '0 0 12px rgba(var(--acid-rgb, 232, 255, 0), 0.4)';
        }}
      >
        <span className="logo-quick" style={{ color: '#fff', transition: 'text-shadow 0.3s' }}>Quick</span>
        <span className="logo-live" style={{ color: 'var(--accent)', textShadow: '0 0 12px rgba(var(--acid-rgb, 232, 255, 0), 0.4)', transition: 'text-shadow 0.3s' }}>live</span>
      </div>

      {/* Small Nav */}
      <div ref={navRef} className="small-nav">
        {/* Theme Switcher */}
        <div className="theme-switcher">
          <span className="theme-label">THEME</span>
          <div className="theme-dots">
            {themes.map((t, i) => (
              <div
                key={i}
                className="theme-dot"
                style={{ background: t.hex, boxShadow: `0 0 8px rgba(${t.rgb}, 0.6)` }}
                onClick={(e) => handleThemeChange(t, e)}
                title={`Switch Theme`}
              />
            ))}
          </div>
        </div>

        <div
          className="nav-container-small nav-cont"
          onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
        >
          <h4><StaggeredText text={user?.fullName || "GUEST"} /></h4>
        </div>

        {/* User Settings Pop-up Panel */}
        {isUserPanelOpen && (
          <div
            className="user-settings-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '4.5rem',
              right: '2.5rem', // Changed from 40rem
              background: 'rgba(15, 15, 15, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.2rem',
              minWidth: '220px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              zIndex: 1000,
              backdropFilter: 'blur(10px)',
              pointerEvents: 'auto',
              fontFamily: 'var(--fm)',
              color: '#fff'
            }}
          >
            <div style={{ paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signed in as</div>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--fb)', fontWeight: 'bold', marginTop: '0.2rem', color: 'var(--accent)' }}>{user?.fullName || "Guest"}</div>
            </div>

            <button onClick={() => { setIsUserPanelOpen(false); navigate('/account'); }} style={{ background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s', borderRadius: '6px', fontFamily: 'var(--fm)' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Account Settings</button>

            <button onClick={() => { setIsUserPanelOpen(false); navigate('/dashboard'); }} style={{ background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s', borderRadius: '6px', fontFamily: 'var(--fm)' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Dashboard</button>

            {user?.role === 'admin' && (
              <button onClick={() => { setIsUserPanelOpen(false); navigate('/admin'); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', textAlign: 'left', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s', borderRadius: '6px', fontFamily: 'var(--fm)' }} onMouseEnter={(e) => e.target.style.background = 'rgba(232, 255, 0, 0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Admin Panel</button>
            )}

            {user ? (
              <button onClick={(e) => { setIsUserPanelOpen(false); handleSubmit(e); }} style={{ background: 'transparent', border: 'none', color: '#ff4081', textAlign: 'left', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s', borderRadius: '6px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontFamily: 'var(--fm)' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,64,129,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Sign Out</button>
            ) : (
              <button onClick={() => { setIsUserPanelOpen(false); navigate('/login'); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', textAlign: 'left', padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s', borderRadius: '6px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontFamily: 'var(--fm)' }} onMouseEnter={(e) => e.target.style.background = 'rgba(232, 255, 0, 0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Sign In</button>
            )}
          </div>
        )}
        <div
          onClick={() => {
            navigate("/projects");
          }}
          className="nav-container-medium nav-cont"
        >
          <h4><StaggeredText text="Projects" /></h4>
        </div>
        <div onClick={openNav} className="nav-container-large nav-cont nav-menu-btn">
          <h4 className="menu-text"><StaggeredText text="Menu" /></h4>
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Big Nav Overlay */}
      <div
        ref={bigNavRef}
        style={{
          top: isBigNavVisible ? "0" : "100%",
        }}
        className="big-nav"
      >
        <div className="big-nav__logo">
          <span className="logo-quick">Quick</span><span className="logo-live">live</span>
        </div>
        <button className="big-nav__close" onClick={closeNav}>
          <span />
          <span />
        </button>

        <nav className="big-nav__links">
          <div className="big-nav__user-section" style={{ padding: "0 clamp(1.5rem, 4vw, 5rem)", marginBottom: "2rem" }}>
            <h3 style={{ fontFamily: "var(--fd)", fontSize: "2rem", color: "var(--accent, #e8ff00)", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }}>
              {user ? `WELCOME, ${user.fullName || "USER"}` : "WELCOME"}
            </h3>
            <span style={{ fontFamily: "var(--fm)", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {user ? "AUTHENTICATED SESSION" : "SYSTEM ACCESS"}
            </span>
          </div>

          {menuItems.map((item, i) => (
            <div
              key={item.label}
              className="big-nav__item"
              ref={(el) => (linksRef.current[i] = el)}
            >
              <button
                className="big-nav__link"
                onClick={() => handleNavigate(item.to)}
              >
                <span className="big-nav__link-num">0{i + 1}</span>
                <span className="big-nav__link-icon">{item.icon}</span>
                <span className="big-nav__link-label"><HackerText text={item.label} /></span>
                <span className="big-nav__link-arrow">→</span>
              </button>
            </div>
          ))}
          {user ? (
            <div onClick={handleSubmit} className="logout-button">
              <h4>↪ Sign Out</h4>
            </div>
          ) : (
            <div onClick={() => { closeNav(); navigate("/login"); }} className="logout-button">
              <h4>↪ Sign In</h4>
            </div>
          )}
        </nav>

        <div className="big-nav__footer">
          <span>© {new Date().getFullYear()} QUICKLIVE</span>
          <span>ALL RIGHTS RESERVED</span>
        </div>
      </div>

      {/* Floating Notification Panel */}
      {/* <NotificationPanel /> */}
    </nav>
  );
};

export default Navbar;
