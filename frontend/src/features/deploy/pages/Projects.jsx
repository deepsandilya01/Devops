import React, { useState, useEffect } from "react";
import Navbar from "../../shared/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import useDeploy from "../hooks/useDeploy";
import NewProjectModal from "../components/NewProjectModal";
import { useToast } from "../../shared/components/Toast";
import "../styles/Dashboard.css";
import { gsap } from "gsap";
import HackerText from "../../shared/components/HackerText";
import DeployBackground from "../components/DeployBackground";
import { PlayGameButton } from "./Dashboard";
import MouseTrail from "../../auth/components/MouseTrail";
import StaggeredText from "../../shared/components/StaggeredText";

export default function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterMode, setFilterMode] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalRepo, setSelectedModalRepo] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.background = "#0b0b0b";
    return () => { document.body.style.background = ""; };
  }, []);

  const { fetchRepos: getRepos, fetchProjects } = useDeploy();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [reposData, projectsData] = await Promise.all([
          getRepos(),
          fetchProjects()
        ]);

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
        console.error("Error loading data:", err);
        setError("Failed to load projects. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const pageRef = React.useRef(null);

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.fromTo(".dash-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
          .fromTo(".stats-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }, "-=0.4")
          .fromTo(".dash-card, .dash-empty", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "back.out(1.2)" }, "-=0.2");
      }, pageRef);
      return () => ctx.revert();
    }
  }, [loading, repos]);

  const handleMouseMove = (e) => {
    if (pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pageRef.current.style.setProperty('--mouse-x', `${x}px`);
      pageRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  const displayRepos = repos || [];

  const filteredRepos = displayRepos.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterMode === "all" ? true :
        filterMode === "deployed" ? repo.isDeployed :
          !repo.isDeployed;
    return matchesSearch && matchesFilter;
  });

  return (
    <div ref={pageRef} className="dashboard-page" onMouseMove={!isMobile ? handleMouseMove : undefined} style={{
      backgroundColor: '#050505',
      backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(var(--acid-rgb, 255,255,255), 0.03) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(var(--acid-rgb, 255,255,255), 0.04) 0%, transparent 40%)',
      color: '#fff',
      minHeight: '100vh',
      paddingBottom: '4rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {!isMobile && <DeployBackground />}
      {!isMobile && <MouseTrail compact />}
      <div className="noise-overlay" style={{ opacity: 0.15, zIndex: 0 }} />

      {/* Interactive Cursor Spotlight — desktop only */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(600px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(var(--acid-rgb, 232, 255, 0), 0.05), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}></div>
      )}

      <Navbar />

      <main className="dash-main projects-main" style={{ maxWidth: '1500px', width: '100%', padding: '0 1.5rem' }}>
        <header className="dash-header projects-header" style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", borderBottom: "none", paddingBottom: "1rem" }}>
          <div className="dash-header-left" style={{ flex: 1 }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--fm)" }}>Your Work</span>
            <h1 className="dash-title" style={{ fontSize: "3.5rem", marginTop: "0.5rem" }}><HackerText text="Project Hub" /></h1>
            <p className="dash-subtitle" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)" }}>Build, collaborate, and ship real projects with your team.</p>
          </div>

          <div className="projects-controls" style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1.5rem" }}>
            <div className="projects-search-wrap" style={{ position: "relative", width: "260px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "rgba(255,255,255,0.4)" }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "0.7rem 1rem 0.7rem 2.5rem",
                  color: "var(--white)",
                  fontFamily: "var(--fm)",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  outline: "none",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
              />
            </div>

            <div className="projects-view-toggle" style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.2rem" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{ background: viewMode === "grid" ? "rgba(255,255,255,0.1)" : "transparent", border: "none", color: viewMode === "grid" ? "#fff" : "rgba(255,255,255,0.5)", padding: "0.4rem", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{ background: viewMode === "list" ? "rgba(255,255,255,0.1)" : "transparent", border: "none", color: viewMode === "list" ? "#fff" : "rgba(255,255,255,0.5)", padding: "0.4rem", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
            </div>

            <div className="projects-filter-wrap" style={{ position: "relative" }}>
              <button
                className="projects-filter-btn"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ background: isFilterOpen ? "rgba(255,255,255,0.05)" : "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--fm)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                {filterMode === "all" ? "All Projects" : filterMode === "deployed" ? "Deployed" : "Undeployed"}
              </button>

              {isFilterOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.5rem",
                  background: "rgba(15,15,15,0.95)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                  zIndex: 20,
                  minWidth: "150px"
                }}>
                  {[
                    { id: "all", label: "All Projects" },
                    { id: "deployed", label: "Deployed" },
                    { id: "undeployed", label: "Undeployed" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setFilterMode(opt.id); setIsFilterOpen(false); }}
                      style={{
                        background: filterMode === opt.id ? "rgba(255,255,255,0.1)" : "transparent",
                        border: "none",
                        color: filterMode === opt.id ? "#fff" : "rgba(255,255,255,0.6)",
                        padding: "0.5rem 1rem",
                        textAlign: "left",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontFamily: "var(--fm)",
                        fontSize: "0.85rem",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (filterMode !== opt.id) e.target.style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (filterMode !== opt.id) e.target.style.background = "transparent";
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="dash-btn new-project-btn"
              onClick={() => { setSelectedModalRepo(null); setIsModalOpen(true); }}
              style={{
                background: "var(--white)",
                color: "var(--black)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.7rem 1.2rem",
                borderRadius: "8px",
                fontFamily: "var(--fm)",
                fontWeight: "600",
                fontSize: "0.85rem",
                letterSpacing: "0",
                border: "none",
                cursor: "pointer",
                marginLeft: "auto"
              }}>
              <StaggeredText text="+ NEW PROJECT" />
            </button>
          </div>
        </header>

        {/* Stats Section */}
        <div className="stats-grid projects-stats-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "3rem"
        }}>
          {[
            { label: "Total Projects", value: displayRepos.length, icon: "📁" },
            { label: "Stars Earned", value: displayRepos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0), icon: "⭐" },
            { label: "Live Deploys", value: displayRepos.filter(r => r.isDeployed).length, icon: "🌐" }
          ].map((stat, idx) => (
            <div key={idx} className="stats-card" style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.2rem",
              transition: "transform 0.3s ease, background 0.3s ease"
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{
                background: "rgba(255,255,255,0.05)",
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.8)"
              }}>
                {stat.icon}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "1.8rem", fontWeight: "bold", fontFamily: "var(--fd)", color: "var(--white)", lineHeight: "1.1" }}>{stat.value}</span>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontFamily: "var(--fm)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="dash-empty" style={{ borderColor: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4rem" }}>
            <h2 className="dash-empty-title" style={{ color: "var(--accent)", animation: "pulse 1.5s infinite" }}><HackerText text="FETCHING PROJECTS..." /></h2>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="dash-empty" style={{ borderRadius: "12px", padding: "4rem", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <h2 className="dash-empty-title"><HackerText text="NO PROJECTS FOUND." /></h2>
            <p style={{ fontFamily: 'var(--fm)', color: 'rgba(255,255,255,0.6)', maxWidth: '400px', textAlign: 'center' }}>
              You don't have any GitHub repositories connected. Why not generate a custom website instantly?
            </p>
            <button 
              onClick={() => navigate('/generate')}
              style={{
                marginTop: '1rem',
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
        ) : (
          <div className="dash-grid projects-grid" style={{
            display: viewMode === "grid" ? "grid" : "flex",
            flexDirection: viewMode === "list" ? "column" : "row",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(min(100%, 380px), 1fr))" : "none",
            gap: "1.5rem",
            width: "100%"
          }}>
            {filteredRepos.map(repo => (
              <div key={repo.id} className="dash-card project-hub-card project-card" style={{
                display: "flex",
                flexDirection: viewMode === "grid" ? "column" : "row",
                alignItems: viewMode === "grid" ? "stretch" : "center",
                justifyContent: viewMode === "list" ? "space-between" : "flex-start",
                background: "rgba(255, 255, 255, 0.015)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "14px",
                padding: "1.5rem",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
                onClick={() => {
                  if (repo.isDeployed && repo.appId) {
                    navigate(`/deploy/${repo.appId}`);
                  } else {
                    setSelectedModalRepo(repo);
                    setIsModalOpen(true);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.015)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{
                    width: "36px", height: "36px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.6)"
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
                    <h3 style={{ fontSize: "1.1rem", margin: 0, fontFamily: "var(--fb)", fontWeight: "600", color: "var(--white)", textTransform: "none" }}>{repo.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", fontFamily: "var(--fm)", color: "rgba(255,255,255,0.5)" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.5)" }}></div>
                      {repo.isPrivate ? "PRIVATE" : "PUBLIC"}
                    </div>
                  </div>
                  {/* Owner Avatar */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden"
                    }}>
                      {repo.owner?.avatar_url ? (
                        <img src={repo.owner.avatar_url} alt={repo.owner.login} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>
                          {(repo.owner?.login || repo.name)[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                <div style={{ flexGrow: 1 }}>
                  <p style={{ fontFamily: "var(--fb)", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem", textTransform: "none", lineHeight: "1.5" }}>
                    {repo.description || "No description provided for this project."}
                  </p>

                  {/* Deployment Status Info */}
                  <div style={{
                    background: "rgba(255,255,255,0.01)",
                    borderRadius: "6px",
                    padding: "0.8rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    marginBottom: "1.5rem",
                    border: "1px solid rgba(255,255,255,0.05)"
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: repo.isDeployed ? "#00e676" : "rgba(255,255,255,0.2)",
                          boxShadow: repo.isDeployed ? "0 0 8px #00e676" : "none"
                        }}></div>
                        <span style={{ fontSize: "0.75rem", fontFamily: "var(--fm)", color: repo.isDeployed ? "#00e676" : "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                          {repo.isDeployed ? (repo.deployedStatus || "Deployed") : "Not Deployed"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.7rem", fontFamily: "var(--fm)", color: "rgba(255,255,255,0.4)" }}>
                        {repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--fb)", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
                      Branch: {repo.default_branch || "main"}
                    </div>
                  </div>

                </div>

                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--fm)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: repo.language === 'JavaScript' ? "#f1e05a" : repo.language === 'TypeScript' ? "#3178c6" : "var(--accent)" }}></div>
                      <span style={{ textTransform: "none" }}>{repo.language || "Unknown"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      {repo.stargazers_count || 0}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path><path d="M12 12v3"></path></svg>
                      {repo.forks_count || 0}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    {repo.isDeployed && repo.appId ? (
                      <Link to={`/deploy/${repo.appId}`} style={{ fontSize: "0.75rem", fontFamily: "var(--fm)", color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--white)"} onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.6)"}>
                        STATUS
                      </Link>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedModalRepo(repo); setIsModalOpen(true); }} style={{ background: "transparent", border: "none", fontSize: "0.75rem", fontFamily: "var(--fm)", color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--white)"} onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.6)"}>
                        DEPLOY
                      </button>
                    )}
                    {repo.isDeployed && repo.port ? (
                      <a
                        href={`http://localhost:${repo.port}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.75rem", fontFamily: "var(--fm)", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem", transition: "filter 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.2)"}
                        onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
                      >
                        OPEN <span style={{ fontSize: "1rem", lineHeight: "1" }}>›</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => showToast("You have to deploy the app first before opening it.", "warning")}
                        style={{ fontSize: "0.75rem", fontFamily: "var(--fm)", color: "rgba(255,255,255,0.9)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem", transition: "color 0.2s", padding: 0 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.9)"}
                      >
                        OPEN <span style={{ fontSize: "1rem", lineHeight: "1" }}>›</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isModalOpen && <NewProjectModal onClose={() => { setIsModalOpen(false); setSelectedModalRepo(null); }} initialRepo={selectedModalRepo} />}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Play Game */}
      <PlayGameButton />

    </div>
  );
}
