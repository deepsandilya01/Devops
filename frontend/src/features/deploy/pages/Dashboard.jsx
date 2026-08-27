import React, { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "../../shared/components/Navbar";
import "../styles/Dashboard.css";
import "../../auth/styles/Home.css";
import { gsap } from "gsap";
import DeployBackground from "../components/DeployBackground";
import NewProjectModal from "../components/NewProjectModal";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useDeploy from "../hooks/useDeploy";
import MouseTrail from "../../auth/components/MouseTrail";
import ElasticText from "../../shared/components/ElasticText";
import StaggeredText from "../../shared/components/StaggeredText";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [repos, setRepos] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);

  const { fetchRepos: getRepos, fetchProjects } = useDeploy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#050505";
    document.body.style.backgroundImage =
      "radial-gradient(circle at 50% 0%, rgba(var(--acid-rgb, 255, 255, 255), 0.05) 0%, #050505 70%)";

    const loadData = async () => {
      try {
        setLoading(true);
        const [reposData, projectsData] = await Promise.all([
          getRepos(),
          fetchProjects()
        ]);

        setAllProjects(projectsData || []);

        // Match repos with projects
        const enrichedRepos = (reposData || []).map(repo => {
          const project = (projectsData || []).find(p => p.repoUrl === (repo.cloneUrl || repo.repoUrl));
          return {
            ...repo,
            isDeployed: !!project,
            appId: project?.appId,
            port: project?.port,
            deployedStatus: project?.status
          };
        });

        setRepos(enrichedRepos);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };


    loadData();

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(
        ".dash-fade-in",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power3.out" },
        "+=0.2",
      );
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  // Click particle burst — same as Home page
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest("button") || e.target.closest("a") || e.target.closest(".modal-overlay")) return;

      const words = ["SYS", "OK", "NULL", "DEP", "EXE", "200", "PING"];
      const word = words[Math.floor(Math.random() * words.length)];

      const el = document.createElement("div");
      el.className = "click-particle text-particle";
      el.innerText = `[${word}]`;

      for (let i = 0; i < 4; i++) {
        const plus = document.createElement("div");
        plus.className = "click-particle plus-particle";
        plus.innerText = "+";
        document.body.appendChild(plus);
        gsap.fromTo(
          plus,
          { x: e.clientX, y: e.clientY, opacity: 1, scale: Math.random() * 0.5 + 0.5 },
          {
            x: e.clientX + (Math.random() - 0.5) * 120,
            y: e.clientY + (Math.random() - 0.5) * 120,
            opacity: 0,
            rotation: Math.random() * 180 - 90,
            duration: 0.6 + Math.random() * 0.4,
            ease: "power3.out",
            onComplete: () => plus.remove(),
          }
        );
      }

      document.body.appendChild(el);
      gsap.fromTo(
        el,
        { x: e.clientX, y: e.clientY, opacity: 1, scale: 0.5 },
        {
          y: e.clientY - 80,
          opacity: 0,
          scale: 1.2,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => el.remove(),
        }
      );
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleMouseMove = (e) => {
    if (pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pageRef.current.style.setProperty("--mouse-x", `${x}px`);
      pageRef.current.style.setProperty("--mouse-y", `${y}px`);
    }
  };

  const userName = user?.fullName || "Developer";
  const userInitial = userName.charAt(0).toUpperCase();

  const displayRepos = repos || [];

  // Calculate metrics
  const totalRepos = displayRepos.length;
  const deployedProjects = displayRepos.filter(r => r.isDeployed);
  const totalDeployed = deployedProjects.length;
  const totalStars = displayRepos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);

  // Project health score based on deployments
  const healthScore = totalRepos > 0 ? Math.round((totalDeployed / totalRepos) * 100) : 0;
  const healthStatus = healthScore > 80 ? "Healthy" : healthScore > 40 ? "Warning" : "Critical";

  // Real-ish stats derived from actual GitHub repo sizes
  const storageUsed = totalDeployed > 0 ? (deployedProjects.reduce((acc, repo) => acc + (repo.size || 0), 0) / 1024).toFixed(1) : 0;
  const storageLimit = 500; // MB
  const storagePercent = Math.min(100, (storageUsed / storageLimit) * 100);

  const bandwidthUsed = totalDeployed > 0 ? (storageUsed * 0.05).toFixed(2) : 0; // Simulated GB based on MB storage
  const buildMinutes = totalDeployed * 3; // Approx 3 mins per docker build

  return (
    <div
      ref={pageRef}
      className="dashboard-page"
      onMouseMove={handleMouseMove}
      style={{
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(circle at 15% 50%, rgba(var(--acid-rgb, 255,255,255), 0.03) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(var(--acid-rgb, 255,255,255), 0.04) 0%, transparent 40%)",
        color: "#fff",
        minHeight: "100vh",
        paddingBottom: "4rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <DeployBackground />
      <MouseTrail compact />
      <div className="noise-overlay" style={{ opacity: 0.15, zIndex: 0 }} />

      {/* Interactive Cursor Spotlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(var(--acid-rgb, 232, 255, 0), 0.05), transparent 60%)",
          pointerEvents: "none",
          zIndex: 1,
          transition: "background 0.1s ease",
        }}
      ></div>

      <Navbar />
      <div
        className="dashboard-container"
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
          padding: "4rem 1.5rem 0",
        }}
      >
        {/* Top Navigation / Search area */}
        <div
          className="dash-fade-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "3rem",
            padding: "0 1rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "12px",
                background: "var(--accent)",
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontFamily: "var(--fb)",
                fontWeight: "bold",
              }}
            >
              {userInitial}
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "2rem",
                  fontFamily: "var(--fd)",
                  letterSpacing: "0.05em",
                }}
              >
                <ElasticText text={`${userName[0].toUpperCase() + userName.slice(1)}'s Workspace`} />
              </h2>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--fm)",
                }}
              >
                Hobby Plan
              </span>
            </div>
          </div>

          <div
            style={{ position: "relative", width: "100%", maxWidth: "400px" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "0.7rem 1rem 0.7rem 2.8rem",
                color: "#fff",
                fontFamily: "var(--fm)",
                fontSize: "0.85rem",
                outline: "none",
                transition: "all 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </div>
        </div>

        {/* Hero Section */}
        <div
          className="dash-fade-in ticket-container"
          style={{
            padding: "0 1rem",
            marginBottom: "2rem",
            filter: "drop-shadow(0 25px 45px rgba(0, 0, 0, 0.3)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15))",
          }}
        >
          <style>
            {`
              @keyframes spin-slow { 100% { transform: rotate(360deg); } }
              @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
              @keyframes pulse-glow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); box-shadow: 0 0 40px var(--accent); } }
            `}
          </style>
          <div
            className="ticket-main"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
              position: "relative",
              padding: "3rem 3.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
              clipPath: "polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(50% - 15px), calc(100% - 15px) 50%, 100% calc(50% + 15px), 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 calc(50% + 15px), 15px 50%, 0 calc(50% - 15px), 0 20px)",
              backdropFilter: "blur(20px)"
            }}
          >
            {/* Background grid texture inside ticket */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              zIndex: 0,
              pointerEvents: "none"
            }}></div>
            {/* Top Glowing Edge */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "20px",
              right: "20px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
              zIndex: 1
            }}></div>
            {/* Bottom Glowing Edge */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: "20px",
              right: "20px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
              zIndex: 1
            }}></div>
            {/* Left Content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                flex: "1",
                maxWidth: "600px",
                zIndex: 2,
              }}
            >
              <h1
                style={{
                  fontSize: "3.2rem",
                  margin: 0,
                  fontFamily: "var(--fd)",
                  letterSpacing: "0.02em",
                  lineHeight: "1.1",
                }}
              >
                Command Center
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "1.05rem",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                Monitor your projects, track build times, and analyze edge
                network activity. Your infrastructure is currently operating at
                optimal efficiency.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  marginTop: "1rem",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    background: "var(--accent)",
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.9rem 1.8rem",
                    borderRadius: "8px",
                    fontFamily: "var(--fm)",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <StaggeredText text="Deploy New App" />
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "var(--fm)",
                    fontSize: "0.9rem",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#00e676",
                      boxShadow: "0 0 12px #00e676",
                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                  All Systems Operational
                </div>
              </div>
            </div>

            {/* Right Graphic: Edge Network HUD */}
            <div
              style={{
                flex: "1",
                display: "flex",
                justifyContent: "flex-end",
                zIndex: 2,
                paddingRight: "2rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "220px",
                  height: "220px",
                }}
              >
                {/* Outer Dashed Ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: "0",
                    borderRadius: "50%",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    animation: "spin-slow 30s linear infinite",
                  }}
                ></div>

                {/* Middle Solid Ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: "15%",
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.08)",
                    animation: "spin-reverse 20s linear infinite",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "10%",
                      left: "10%",
                      width: "4px",
                      height: "4px",
                      background: "#fff",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "20%",
                      right: "5%",
                      width: "6px",
                      height: "6px",
                      background: "#fff",
                      borderRadius: "50%",
                    }}
                  ></div>
                </div>

                {/* Accent Orbiting Ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: "30%",
                    borderRadius: "50%",
                    border: "1px solid var(--accent)",
                    opacity: 0.4,
                    animation: "spin-slow 10s linear infinite",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px",
                      left: "50%",
                      width: "10px",
                      height: "10px",
                      background: "var(--accent)",
                      borderRadius: "50%",
                      boxShadow: "0 0 15px var(--accent)",
                      transform: "translateX(-50%)",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "15%",
                      left: "10%",
                      width: "6px",
                      height: "6px",
                      background: "var(--accent)",
                      borderRadius: "50%",
                      boxShadow: "0 0 10px var(--accent)",
                    }}
                  ></div>
                </div>

                {/* Glowing Core */}
                <div
                  style={{
                    position: "absolute",
                    inset: "42%",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    opacity: 0.8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "pulse-glow 3s ease-in-out infinite",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Accent background blur */}
            <div
              style={{
                position: "absolute",
                right: "-15%",
                top: "-60%",
                width: "500px",
                height: "500px",
                background:
                  "radial-gradient(circle, var(--accent) 0%, rgba(0,0,0,0) 65%)",
                opacity: 0.08,
                zIndex: 0,
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                left: "-10%",
                bottom: "-50%",
                width: "400px",
                height: "400px",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 60%)",
                opacity: 0.05,
                zIndex: 0,
                pointerEvents: "none",
              }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div
          className="dash-fade-in dash-metrics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
            padding: "0 1rem",
          }}
        >
          {[
            {
              label: "Connected Projects",
              value: loading ? "-" : totalRepos,
              change: "Linked Repositories",
            },
            {
              label: "Active Deployments",
              value: loading ? "-" : totalDeployed,
              change: "Currently running",
            },
            {
              label: "Total Stars",
              value: loading ? "-" : totalStars || 0,
              change: "Across all repos",
            },
            {
              label: "Health Status",
              value: loading ? "-" : healthStatus,
              change: `Score: ${healthScore}/100`,
            },
          ].map((metric, i) => (
            <div key={i} style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  transition: "background 0.3s ease",
                  clipPath: "polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(50% - 10px), calc(100% - 10px) 50%, 100% calc(50% + 10px), 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 calc(50% + 10px), 10px 50%, 0 calc(50% - 10px), 0 15px)",
                  position: "relative",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)")
                }
              >
                {/* Top/Bottom glowing edge */}
                <div style={{ position: "absolute", top: 0, left: "15px", right: 0, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }}></div>
                <div style={{ position: "absolute", bottom: 0, right: "15px", left: 0, height: "1px", background: "linear-gradient(-90deg, rgba(255,255,255,0.1), transparent)" }}></div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    fontFamily: "var(--fm)",
                  }}
                >
                  {metric.label}
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontFamily: "var(--fd)",
                    color: "#fff",
                    lineHeight: "1",
                  }}
                >
                  {metric.value}
                </div>
                <div
                  style={{
                    color: "var(--accent)",
                    fontSize: "0.75rem",
                    fontFamily: "var(--fm)",
                  }}
                >
                  {metric.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lower Layout: 2 Columns */}
        <div
          className="dash-fade-in dash-lower-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.5rem",
            padding: "0 1rem",
          }}
        >
          {/* Deployment Activity — Real SVG Line Chart */}
          <DeploymentActivityChart repos={displayRepos} />

          {/* Resource Usage & Web Vitals (Netlify & Vercel Inspired) */}
          <div
            className="dash-resource-section"
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Netlify-Style Resource Usage */}
            <div
              className="dash-resource-card"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  margin: "0",
                  fontFamily: "var(--fb)",
                  fontWeight: "500",
                }}
              >
                Resource Usage
              </h3>

              {/* Bandwidth */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontFamily: "var(--fm)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Bandwidth
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {bandwidthUsed} GB / 100 GB
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (bandwidthUsed / 100) * 100)}%`,
                      height: "100%",
                      background: "#38bdf8",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>

              {/* Build Minutes */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontFamily: "var(--fm)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Build Minutes
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {buildMinutes}m / 300m
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (buildMinutes / 300) * 100)}%`,
                      height: "100%",
                      background: "#fb923c",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>

              {/* Storage Used */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontFamily: "var(--fm)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Storage Used
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {storageUsed} MB / {storageLimit} MB
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${storagePercent}%`,
                      height: "100%",
                      background: "var(--accent)",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>

              {/* Active Containers */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontFamily: "var(--fm)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Active Containers
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {totalDeployed} / 10
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (totalDeployed / 10) * 100)}%`,
                      height: "100%",
                      background: "#a78bfa",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Vercel-Style Web Vitals */}
            <div
              className="dash-resource-card"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                padding: "2rem",
                display: "flex",
                alignItems: "center",
                gap: "2rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "80px",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 36 36"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    transform: "rotate(-90deg)",
                  }}
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#00e676"
                    strokeWidth="3"
                    strokeDasharray="98, 100"
                  />
                </svg>
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontFamily: "var(--fd)",
                    color: totalRepos > 0 ? "#00e676" : "rgba(255,255,255,0.4)",
                    fontWeight: "bold",
                  }}
                >
                  {totalRepos > 0 ? "✓" : "—"}
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    margin: "0 0 0.2rem 0",
                    fontFamily: "var(--fb)",
                    fontWeight: "500",
                  }}
                >
                  System Status
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "var(--fm)",
                  }}
                >
                  {totalRepos > 0 ? "Projects connected and active." : "No projects deployed yet. Deploy your first app."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deployments Section */}
        <div
          className="dash-fade-in"
          style={{ padding: "0 1rem", marginTop: "2.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.2rem",
                margin: 0,
                fontFamily: "var(--fb)",
                fontWeight: "500",
              }}
            >
              Recent Deployments
            </h3>
            <Link
              to="/projects"
              style={{
                fontSize: "0.85rem",
                fontFamily: "var(--fm)",
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              View All →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {allProjects.map((project) => {
              const getRepoName = (url) => {
                if (!url) return "Project";
                const parts = url.split("/");
                return parts[parts.length - 1].replace(".git", "");
              };
              const statusColor = project.status === 'running' ? '#00e676' : project.status === 'failed' ? '#ff4081' : 'var(--accent)';
              const statusLabel = project.status === 'running' ? 'LIVE' : project.status === 'failed' ? 'FAILED' : 'BUILDING';
              return (
              <div key={project.appId} style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))", height: "100%" }}>
                <div
                  onClick={() => navigate(`/deploy/${project.appId}`)}
                  style={{
                    cursor: "pointer",
                    height: "100%",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    transition: "background 0.2s",
                    clipPath: "polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(50% - 10px), calc(100% - 10px) 50%, 100% calc(50% + 10px), 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 calc(50% + 10px), 10px 50%, 0 calc(50% - 10px), 0 15px)",
                    position: "relative",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)";
                  }}
                >
                  {/* Glowing edges inside the ticket clip path */}
                  <div style={{ position: "absolute", top: 0, left: "15px", right: "15px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}></div>
                  <div style={{ position: "absolute", bottom: 0, left: "15px", right: "15px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}></div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "1rem",
                            fontFamily: "var(--fb)",
                            fontWeight: "500",
                            color: "#fff",
                          }}
                        >
                          {getRepoName(project.repoUrl)}
                        </h4>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "var(--fm)",
                          }}
                        >
                          {project.type?.RepoType || "Unknown"}
                        </span>
                      </div>
                    </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--fm)",
                          padding: "0.2rem 0.6rem",
                          background: project.status === 'running' ? "rgba(0, 230, 118, 0.1)" : project.status === 'failed' ? "rgba(255,64,129,0.1)" : "rgba(232,255,0,0.1)",
                          color: statusColor,
                          borderRadius: "4px",
                          border: `1px solid ${project.status === 'running' ? 'rgba(0, 230, 118, 0.2)' : project.status === 'failed' ? 'rgba(255,64,129,0.2)' : 'rgba(232,255,0,0.2)'}`,
                        }}
                      >
                        {statusLabel}
                      </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "auto",
                      paddingTop: "1rem",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "var(--fm)",
                      }}
                    >
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <a
                      href={project.status === 'running' ? `https://${project.appId}.quicklive.tech` : undefined}
                      onClick={(e) => { if (project.status !== 'running') { e.preventDefault(); navigate(`/deploy/${project.appId}`); } else { e.stopPropagation(); } }}
                      target={project.status === 'running' ? "_blank" : undefined}
                      rel="noreferrer"
                      style={{
                        fontSize: "0.75rem",
                        fontFamily: "var(--fm)",
                        color: project.status === 'running' ? "var(--accent)" : 'rgba(255,255,255,0.6)',
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        transition: "color 0.2s, filter 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                    >
                      {project.status === 'running' ? "OPEN SITE" : "VIEW LOGS"}{" "}
                      <span style={{ fontSize: "1rem", lineHeight: "1" }}>›</span>
                    </a>
                  </div>
                </div>
              </div>
            );
            })}
            {allProjects.length === 0 && !loading && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "4rem",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.01)",
                  borderRadius: "12px",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem"
                }}
              >
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "var(--fm)",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  No recent deployments found. Start by generating a custom website!
                </p>
                <button 
                  onClick={() => navigate('/generate')}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.8rem 1.5rem',
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    fontFamily: 'var(--fb)',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'filter 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  OPEN WEBSITE GENERATOR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && <NewProjectModal onClose={() => setIsModalOpen(false)} />}

      {/* Play Game floating button */}
      <PlayGameButton />


    </div>
  );
};

/* ─── Shared Play Game Button (used across pages) ─── */
export function PlayGameButton() {
  const [open, setOpen] = useState(false);
  const text = "PLAY GAME PLAY GAME ";
  const letters = text.split("");

  return (
    <>
      <style>{`
        .pg-container {
          --radius: 35px;
          --radius-text: calc(var(--radius) + 15px);
          --blur: 8px;
          --spinDuration: 15s;
          --speedYMod: -2;
          --speedXMod: 0.5;
          --speedZMod: 0;
          --perspective: 1000px;
          --c-bg: rgba(var(--acid-rgb, 232, 255, 0), 0.2);
          --c-accent: var(--accent);
          
          position: fixed;
          bottom: 50px;
          right: 50px;
          width: calc(2 * var(--radius));
          height: calc(2 * var(--radius));
          perspective: var(--perspective);
          transform-style: preserve-3d;
          z-index: 100;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pg-circle {
          position: absolute;
          width: calc(2 * var(--radius));
          height: calc(2 * var(--radius));
          border-radius: 50%;
          backdrop-filter: blur(var(--blur));
          transform: translateZ(0);
          background: radial-gradient(var(--c-bg) 20%, transparent);
          border: 1px solid rgba(var(--acid-rgb, 232, 255, 0), 0.3);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pg-circle svg {
          width: 20px;
          height: 20px;
          fill: var(--c-accent);
          filter: drop-shadow(0 0 5px var(--c-accent));
          margin-left: 3px;
        }

        .pg-container:hover .pg-circle {
          backdrop-filter: unset;
          background-image: radial-gradient(
            circle at 50% 50%,
            transparent 0% 35%,
            var(--c-bg) 35% 100%
          );
          background-repeat: repeat;
          background-size: 3px 3px;
          transform: scale(1.1);
        }

        .pg-text-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: pg-spin3d var(--spinDuration) linear infinite;
          pointer-events: none;
        }

        .pg-text-ring span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate3d(-50%, -50%, 0) rotateY(calc(var(--i) * 360deg)) translateZ(var(--radius-text));
          backface-visibility: visible;
          font-family: monospace;
          font-weight: bold;
          font-size: 14px;
          color: var(--c-accent);
          text-shadow: 0 0 5px var(--c-accent);
        }

        @keyframes pg-spin3d {
          0% {
            transform: rotateX(0deg) rotateZ(0deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(calc(360deg * var(--speedXMod))) 
                       rotateZ(calc(360deg * var(--speedZMod)))
                       rotateY(calc(360deg * var(--speedYMod)));
          }
        }
        @keyframes pg-modal-bg {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes pg-modal-content {
          0% { opacity: 0; transform: scale(0.92) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div className="pg-container" onClick={() => setOpen(true)}>
        <div className="pg-circle">
          <svg viewBox="0 0 24 24" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div className="pg-text-ring">
          {letters.map((char, i) => (
            <span key={i} style={{ '--i': i / (letters.length + 1) }}>
              {char}
            </span>
          ))}
        </div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "pg-modal-bg 0.4s ease forwards" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "840px", width: "100%", padding: "20px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", animation: "pg-modal-content 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, fontFamily: "var(--fd)", fontSize: "1.1rem" }}>
                <span style={{ color: "var(--accent)" }}>MadKidGames</span>
                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--fm)" }}>Plug & Play</span>
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >×</button>
            </div>
            <div style={{ width: "100%", background: "#000", borderRadius: "12px", overflow: "hidden" }}>
              <iframe src="https://playbrain.games" style={{ width: "100%", height: "700px", border: "none" }} title="Play while you wait" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Deployment Activity Chart ─── */
function DeploymentActivityChart({ repos }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [tf, setTf] = useState("30D");
  const [tooltip, setTooltip] = useState(null);
  const TFS = ["7D", "30D", "90D"];

  const days = tf === "7D" ? 7 : tf === "30D" ? 30 : 90;

  // Build day-by-day activity from real repo updatedAt dates
  const { points, maxVal, labels } = React.useMemo(() => {
    const today = new Date();
    const pts = [];
    const lbls = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const count = repos.filter(r => r.updatedAt && new Date(r.updatedAt).toDateString() === ds).length;
      pts.push(count);
      lbls.push(d);
    }
    return { points: pts, maxVal: Math.max(1, ...pts), labels: lbls };
  }, [repos, tf, days]);

  const W = 600, H = 160, PAD = 14;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * W,
    y: PAD + (1 - p / maxVal) * (H - PAD * 2),
    val: p,
    date: labels[i],
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const fillPath = linePath + ` L${coords[coords.length - 1].x},${H} L0,${H} Z`;

  const totalUpdates = points.reduce((a, b) => a + b, 0);
  const activeDays = points.filter(p => p > 0).length;
  const peakDay = labels[points.indexOf(Math.max(...points))];

  const handleMouseMove = useCallback((e) => {
    const wrap = wrapRef.current;
    if (!wrap || coords.length < 2) return;
    const rect = wrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgW = rect.width;
    const idx = Math.min(Math.round((mouseX / svgW) * (coords.length - 1)), coords.length - 1);
    const c = coords[idx];
    const xPx = (c.x / W) * svgW;
    const yPx = (c.y / H) * rect.height;
    setTooltip({ x: xPx, y: yPx, val: c.val, date: c.date, idx });
  }, [coords, W, H]);

  return (
    <div className="dash-chart-card" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", margin: 0, fontFamily: "var(--fb)", fontWeight: "500" }}>Deployment Activity</h3>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "var(--fm)" }}>
            {totalUpdates} repo updates · {activeDays} active days
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {TFS.map(t => (
            <button key={t} onClick={() => setTf(t)} style={{
              padding: "4px 12px", borderRadius: "999px", border: "1px solid",
              fontFamily: "var(--fm)", fontSize: "0.7rem", fontWeight: "700", cursor: "pointer",
              background: tf === t ? "rgba(var(--acid-rgb,202,255,0),0.12)" : "transparent",
              borderColor: tf === t ? "rgba(var(--acid-rgb,202,255,0),0.35)" : "rgba(255,255,255,0.1)",
              color: tf === t ? "var(--accent)" : "rgba(255,255,255,0.5)",
              transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ position: "relative", cursor: "crosshair", height: "160px", marginBottom: "0.75rem" }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <defs>
            <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <filter id="actGlow">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Grid */}
          {[0.25, 0.5, 0.75].map(y => (
            <line key={y} x1="0" y1={y * H} x2={W} y2={y * H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          <path d={fillPath} fill="url(#actGrad)" />
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.9" filter="url(#actGlow)" />
          {/* Crosshair dot */}
          {tooltip && (
            <circle cx={coords[tooltip.idx]?.x} cy={coords[tooltip.idx]?.y} r="5" fill="var(--accent)" opacity="0.95" />
          )}
        </svg>

        {/* Crosshair vertical line */}
        {tooltip && (
          <div style={{ position: "absolute", top: 0, bottom: 0, left: tooltip.x, width: "1px", background: "rgba(255,255,255,0.15)", pointerEvents: "none" }} />
        )}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: Math.min(tooltip.x + 12, (wrapRef.current?.offsetWidth || 600) - 130),
            top: Math.max(tooltip.y - 40, 0),
            background: "rgba(20,20,32,0.95)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "10px",
            padding: "8px 12px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>
              {tooltip.val} update{tooltip.val !== 1 ? "s" : ""}
            </div>
            <div style={{ fontFamily: "var(--fm)", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
              {tooltip.date?.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        )}
      </div>

      {/* Footer labels */}
      <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", fontFamily: "var(--fm)" }}>
        <span>{labels[0]?.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>
          Peak: {peakDay ? peakDay.toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
        </span>
        <span>Today</span>
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Repo Updates", val: totalUpdates },
          { label: "Active Days", val: activeDays },
          { label: "Day Range", val: `${days}D` },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: "var(--fm)", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: "1.1rem", color: "var(--accent)" }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
