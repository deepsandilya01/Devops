import React, { useEffect, useState } from "react";
import Navbar from "../../shared/components/Navbar";
import { useParams, Link } from "react-router-dom";
import "../styles/Dashboard.css";
import { gsap } from "gsap";
import HackerText from "../../shared/components/HackerText";
import StaggeredText from "../../shared/components/StaggeredText";
import DeployBackground from "../components/DeployBackground";
import useDeploy from "../hooks/useDeploy";
import { PlayGameButton } from "./Dashboard";
import MouseTrail from "../../auth/components/MouseTrail";
import { useToast } from "../../shared/components/Toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Deploy() {
  const { repoId } = useParams();
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("building");
  const [activeTab, setActiveTab] = useState("deployment");
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [redeployTick, setRedeployTick] = useState(0);
  const { fetchLogs, redeployProject, deleteProject, fetchProject, fetchContainerStats, analyzeRepo } = useDeploy();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.background = "#000000";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    const loadProjectData = async () => {
      const data = await fetchProject(repoId);
      if (data && data.success) {
        setProject(data.project);
        setStatus(data.project.status === 'running' ? 'ready' : data.project.status === 'failed' ? 'failed' : 'building');
      }
    };
    loadProjectData();
  }, [repoId]);

  useEffect(() => {
    let statsInterval;
    const loadStats = async () => {
      const data = await fetchContainerStats(repoId);
      if (data && data.success && data.stats) {
        setStats(data.stats);
      }
    };
    if (activeTab === 'resources' && status === 'ready') {
      loadStats();
      statsInterval = setInterval(loadStats, 3000);
    }
    return () => clearInterval(statsInterval);
  }, [repoId, activeTab, status]);

  useEffect(() => {
    let settled = false;
    let fullLog = "";

    const es = new EventSource(
      `https://quicklive.tech/api/project/logs/${repoId}/stream`,
      { withCredentials: true }
    );

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // Initial batch of existing logs
        if (payload.logs !== undefined) {
          fullLog = payload.logs;
        }
        // Incremental append
        if (payload.append !== undefined) {
          fullLog += payload.append;
        }

        const logLines = fullLog.split("\n").filter(Boolean);
        setLogs(logLines);

        if (!settled && fullLog.toLowerCase().includes("deployment successful")) {
          settled = true;
          setStatus("ready");
          es.close();
          fetchProject(repoId).then(d => { if (d?.success) setProject(d.project); });
        } else if (!settled && fullLog.includes("exited with 1")) {
          settled = true;
          setStatus("failed");
          es.close();
        }
      } catch (_) {}
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [repoId, redeployTick]);

  const pageRef = React.useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(".dash-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .fromTo(".dash-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" }, "-=0.4");
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e) => {
    if (pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pageRef.current.style.setProperty('--mouse-x', `${x}px`);
      pageRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  const getRepoName = (url) => {
    if (!url) return "Project";
    const parts = url.split("/");
    return parts[parts.length - 1].replace(".git", "");
  };

  const handleGenerateSummary = async () => {
    if (!project?.repoUrl) {
      showToast("No repository URL found for this project.", "error");
      return;
    }
    setSummaryLoading(true);
    try {
      const result = await analyzeRepo(project.repoUrl);
      if (result && result.success && result.data) {
        setAiSummary(result.data);
        setShowSummary(true);
      } else {
        showToast(result?.message || "Failed to generate summary.", "error");
      }
    } catch (err) {
      showToast("Summary generation failed. Please try again.", "error");
    } finally {
      setSummaryLoading(false);
    }
  };

  const tabs = [
    { id: "deployment", label: "DEPLOYMENT" },
    { id: "summary", label: "SUMMARY" },
    { id: "logs", label: "LOGS" },
    { id: "resources", label: "RESOURCES" },
    { id: "source", label: "SOURCE" },
    { id: "opengraph", label: "OPEN GRAPH" }
  ];

  return (
    <div ref={pageRef} className="dashboard-page" onMouseMove={handleMouseMove} style={{
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

      {/* Interactive Cursor Spotlight */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(600px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(var(--acid-rgb, 232, 255, 0), 0.05), transparent 60%)',
        pointerEvents: 'none',
        zIndex: 1,
        transition: 'background 0.1s ease'
      }}></div>
      <Navbar />


      <main className="dash-main" style={{ maxWidth: '1500px', margin: '0 auto', width: '100%', paddingTop: '1rem' }}>
        <header className="dash-header" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-header-left">
            <h1 className="dash-title" style={{ fontSize: '1.8rem', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
              <HackerText text={project ? getRepoName(project.repoUrl) : "Loading..."} />
            </h1>
            <p className="dash-subtitle" style={{ fontSize: '0.9rem' }}>Production Deployment • {project ? getRepoName(project.repoUrl) : repoId}</p>
          </div>
          <Link to={`/settings/${repoId}`} className="dash-btn dash-btn-outline" style={{ textDecoration: "none" }}>
            <HackerText text="SETTINGS" />
          </Link>
        </header>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', paddingBottom: '0.5rem', fontFamily: 'var(--fm)', fontSize: '0.9rem' }}>
          {tabs.map(tab => (
            <span
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : 'none',
                paddingBottom: '0.5rem',
                marginBottom: '-0.6rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
                fontFamily: activeTab === tab.id ? 'var(--fb)' : 'var(--fm)'
              }}
            >
              {tab.label}
            </span>
          ))}
        </div>

        {/* Deployment Details Card */}
        <div className="dash-card" style={{ padding: 0, marginBottom: "2rem", overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: "var(--fb)", fontSize: "1rem", margin: 0, color: '#fff', textTransform: 'capitalize' }}>
              {activeTab === 'opengraph' ? 'Open Graph' : activeTab} Details
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="dash-btn"
                disabled={status === "building" || status === "redeploying"}
                onClick={async () => {
                  setStatus("building");
                  setLogs([]);
                  const result = await redeployProject(repoId, null);
                  if (result && result.success === false) {
                    showToast(result.message || "Redeploy failed to start.", "error");
                    setStatus("failed");
                  } else {
                    // Bump tick to restart the log polling effect
                    setRedeployTick(t => t + 1);
                  }
                }}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: (status === "building" || status === "redeploying") ? 'not-allowed' : 'pointer' }}
              >
                <span style={{ display: 'inline-block', transform: 'rotate(-45deg)', marginRight: '4px' }}>↻</span><StaggeredText text={status === "redeploying" ? "Redeploying..." : "Redeploy"} />
              </button>
              <button
                className="dash-btn"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this project?")) {
                    await deleteProject(repoId);
                    window.location.href = "/dashboard";
                  }
                }}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid #ff2a4d', color: '#ff2a4d', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,42,77,0.1)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                <StaggeredText text="Delete" />
              </button>
              <button className="dash-btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                •••
              </button>
            </div>
          </div>

          {/* ✅ FIX 1: deployment tab content — properly closed */}
          {activeTab === 'deployment' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', padding: '1.5rem', gap: '2rem' }}>
              {/* Left side Status Box */}
              <div style={{
                flex: '1 1 300px',
                border: status === 'building' ? '1px solid var(--accent)' : status === 'ready' ? '1px solid rgba(0, 230, 118, 0.5)' : '1px solid rgba(255, 64, 129, 0.5)',
                borderRadius: '8px',
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {status === 'building' && <div style={{ position: 'absolute', top: 0, left: 0, height: '2px', background: 'var(--accent)', width: '50%', animation: 'loadingBar 2s infinite ease-in-out' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  {status === 'building' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />}
                  {status === 'ready' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                  <span style={{
                    fontFamily: 'var(--fb)',
                    fontSize: '1.1rem',
                    color: status === 'building' ? 'var(--accent)' : status === 'ready' ? '#00e676' : '#ff4081'
                  }}>
                    {status === 'building' ? 'Building Deployment' : status === 'ready' ? 'Deployment Successful' : 'Build Failed'}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--fm)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.5' }}>
                  {status === 'building' ? 'Command "npm run build" is executing.' : status === 'ready' ? 'This deployment is complete and live on the edge network.' : 'Command "npm run build" exited with 1'}
                </p>
              </div>

              {/* Right side Info Grid */}
              <div style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', fontFamily: 'var(--fm)', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontSize: '0.75rem' }}>Created</div>
                  <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>P</div>
                    Project <span style={{ color: 'rgba(255,255,255,0.4)' }}>{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontSize: '0.75rem' }}>Status</div>
                  <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status === 'building' ? 'var(--accent)' : status === 'ready' ? '#00e676' : '#ff4081', boxShadow: `0 0 8px ${status === 'building' ? 'var(--accent)' : '#00e676'}` }}></div>
                    {status === 'building' ? 'Building' : status === 'ready' ? 'Ready' : 'Failed'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontSize: '0.75rem' }}>Type</div>
                  <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    <span style={{ textTransform: 'capitalize' }}>{project ? project.type?.RepoType : 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontSize: '0.75rem' }}>Environment</div>
                  <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    Production
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem', fontSize: '0.75rem' }}>Domains</div>
                  <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {status === 'ready' && project?.appId ? (
                      <a href={`https://${project?.appId}.quicklive.tech`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        {project?.appId}.quicklive.tech
                      </a>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--fm)', fontSize: '0.8rem' }}>
                        {status === 'building' || status === 'redeploying' ? 'Assigning after build...' : 'Domain not available'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem', fontSize: '0.75rem' }}>Source</div>
                  <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                      main
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                      <a href={project?.repoUrl} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>{project ? project.repoUrl.replace("https://github.com/", "") : "Loading..."}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ✅ closes the outer dash-card div */}
        </div>

        {/* Vercel/Amplify Style CI/CD Pipeline Visualizer */}
        {activeTab === 'deployment' && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontFamily: "var(--fb)", fontSize: "1rem", margin: "0 0 1rem 0", color: '#fff' }}>PIPELINE STATUS</h3>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "2rem",
              position: "relative"
            }}>
              {/* Connecting Line Track */}
              <div style={{ position: "absolute", top: "calc(2rem + 16px)", left: "calc(2rem + 16px)", right: "calc(2rem + 16px)", height: "2px", background: "rgba(255,255,255,0.1)", zIndex: 0, transform: "translateY(-50%)" }}>
                {/* Connecting Line Active */}
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: status === 'ready' ? "100%" : "33.33%", background: status === 'ready' ? "#00e676" : "var(--accent)", transition: "width 1s ease" }}></div>
              </div>

              {/* Steps */}
              {[
                { id: 1, label: "PROVISION", status: "completed" },
                { id: 2, label: "BUILD", status: status === 'ready' ? "completed" : "active" },
                { id: 3, label: "DEPLOY", status: status === 'ready' ? "completed" : "pending" },
                { id: 4, label: "COMPLETE", status: status === 'ready' ? "completed" : "pending" }
              ].map((step, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", zIndex: 1, position: "relative" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: step.status === 'completed' ? "rgba(0, 230, 118, 0.2)" : step.status === 'active' ? "rgba(232, 255, 0, 0.2)" : "rgba(255,255,255,0.05)",
                    color: step.status === 'completed' ? "#00e676" : step.status === 'active' ? "var(--accent)" : "rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: step.status === 'pending' ? "1px solid rgba(255,255,255,0.1)" : step.status === 'active' ? "1px solid var(--accent)" : "1px solid #00e676",
                    boxShadow: step.status === 'active' ? "0 0 15px rgba(232, 255, 0, 0.4)" : step.status === 'completed' ? "0 0 15px rgba(0, 230, 118, 0.4)" : "none",
                    fontWeight: "bold", fontFamily: "var(--fm)", fontSize: "0.8rem"
                  }}>
                    {step.status === 'completed' ? "✓" : step.status === 'active' ? "..." : step.id}
                  </div>
                  <span style={{
                    fontFamily: "var(--fm)", fontSize: "0.75rem", letterSpacing: "1px", fontWeight: "600",
                    color: step.status === 'completed' ? "#00e676" : step.status === 'active' ? "#fff" : "rgba(255,255,255,0.3)"
                  }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary Tab */}
        {activeTab === 'summary' && (
          <div className="dash-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "var(--fb)", fontSize: "1.1rem", margin: 0, color: '#fff' }}>PROJECT INTELLIGENCE</h3>
              {showSummary && (
                <button
                  onClick={() => { setShowSummary(false); setAiSummary(null); }}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--fm)', fontSize: '0.75rem' }}
                >↺ Re-analyze</button>
              )}
            </div>

            {!showSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(232,255,0,0.06)', border: '1px solid rgba(232,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--fm)', fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>AI Project Intelligence</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--fm)', fontSize: '0.8rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '380px', lineHeight: '1.6' }}>
                  Clones your repository, detects the tech stack, identifies entry points, and generates an AI-powered architectural summary.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  style={{ padding: '0.85rem 2rem', background: summaryLoading ? 'rgba(232,255,0,0.1)' : 'var(--accent)', color: summaryLoading ? 'rgba(255,255,255,0.4)' : '#000', border: summaryLoading ? '1px solid rgba(232,255,0,0.2)' : 'none', borderRadius: '8px', fontFamily: 'var(--fb)', fontSize: '0.9rem', cursor: summaryLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s', boxShadow: summaryLoading ? 'none' : '0 0 20px rgba(232, 255, 0, 0.25)' }}
                >
                  {summaryLoading ? (
                    <>
                      <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      Analyzing repository...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      Generate Summary
                    </>
                  )}
                </button>
              </div>
            ) : aiSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* AI Summary Text */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span style={{ fontFamily: 'var(--fb)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>SUMMARY</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--fm)', background: 'rgba(232,255,0,0.08)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(232,255,0,0.15)' }}>AI-powered</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: '1.8', fontFamily: 'var(--fm)' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 style={{ fontFamily: 'var(--fb)', fontSize: '1.2rem', color: '#fff', margin: '1rem 0 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ fontFamily: 'var(--fb)', fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', margin: '0.8rem 0 0.4rem' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontFamily: 'var(--fb)', fontSize: '0.95rem', color: 'var(--accent)', margin: '0.6rem 0 0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }} {...props} />,
                        p: ({node, ...props}) => <p style={{ margin: '0.4rem 0', lineHeight: '1.8', color: 'rgba(255,255,255,0.75)' }} {...props} />,
                        strong: ({node, ...props}) => <strong style={{ color: '#fff', fontWeight: 600 }} {...props} />,
                        em: ({node, ...props}) => <em style={{ color: 'rgba(232,255,0,0.8)' }} {...props} />,
                        code: ({node, inline, ...props}) => inline
                          ? <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.82em', color: '#00e676' }} {...props} />
                          : <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1rem', overflowX: 'auto', margin: '0.6rem 0' }}><code style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#a0a0a0', whiteSpace: 'pre-wrap' }} {...props} /></pre>,
                        ul: ({node, ...props}) => <ul style={{ paddingLeft: '1.5rem', margin: '0.4rem 0', color: 'rgba(255,255,255,0.7)' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ paddingLeft: '1.5rem', margin: '0.4rem 0', color: 'rgba(255,255,255,0.7)' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: '0.3rem', lineHeight: '1.6' }} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '3px solid var(--accent)', marginLeft: 0, paddingLeft: '1rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: '0.6rem 0' }} {...props} />,
                        hr: ({node, ...props}) => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1rem 0' }} {...props} />,
                        table: ({node, ...props}) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0.6rem 0', fontSize: '0.85rem' }} {...props} />,
                        th: ({node, ...props}) => <th style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--fm)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px' }} {...props} />,
                        td: ({node, ...props}) => <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }} {...props} />,
                        a: ({node, ...props}) => <a style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid rgba(232,255,0,0.3)' }} target="_blank" rel="noreferrer" {...props} />,
                      }}
                    >
                      {aiSummary.summary}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Tech Stack */}
                {aiSummary.techStack && aiSummary.techStack.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ fontFamily: 'var(--fb)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', margin: '0 0 1rem 0' }}>TECH STACK</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {aiSummary.techStack.map((tech, i) => (
                        <span key={i} style={{ padding: '0.35rem 0.75rem', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '6px', fontFamily: 'var(--fm)', fontSize: '0.78rem', color: '#00e676' }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entry Points */}
                {aiSummary.entryPoints && aiSummary.entryPoints.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ fontFamily: 'var(--fb)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', margin: '0 0 1rem 0' }}>ENTRY POINTS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {aiSummary.entryPoints.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                          <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>▶</span>
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Folder Structure */}
                {aiSummary.folderExplanation && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ fontFamily: 'var(--fb)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', margin: '0 0 1rem 0' }}>FOLDER STRUCTURE</p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1rem', overflowX: 'auto' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({node, inline, ...props}) => <code style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap' }} {...props} />,
                        p: ({node, ...props}) => <p style={{ margin: '0.2rem 0', lineHeight: '1.7', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '0.82rem' }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ paddingLeft: '1.2rem', margin: '0.2rem 0' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '0.15rem' }} {...props} />,
                      }}
                    >
                      {typeof aiSummary.folderExplanation === 'object'
                        ? JSON.stringify(aiSummary.folderExplanation, null, 2)
                        : aiSummary.folderExplanation}
                    </ReactMarkdown>
                  </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ✅ FIX 2: logs tab — now its own properly closed dash-card */}
        {(activeTab === 'logs' || activeTab === 'deployment') && (
          <div className="dash-card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                <h3 style={{ fontFamily: "var(--fb)", fontSize: "0.95rem", margin: 0, color: '#fff' }}>Build Logs</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'var(--fm)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                <span>24s</span>
                {status === 'building' ? (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(var(--acid-rgb, 232, 255, 0), 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }}></div>
                  </div>
                ) : (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Log Toolbar */}
            <div style={{ padding: '0.6rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--fm)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                <span>{logs.length} lines</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--fm)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff4081" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> 0</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> {logs.some(l => l.includes("Warning")) ? "1" : "0"}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--fm)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Find in logs
                  </span>
                  <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '2px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>Ctrl F</span>
                </div>
              </div>
            </div>

            {/* Terminal Render */}
            <div style={{ background: "#000", padding: "1.5rem", fontFamily: "'Fira Code', monospace", fontSize: "0.8rem", color: "#a0a0a0", height: "400px", overflowY: "auto", display: "flex", flexDirection: "column", borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              {logs.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)' }}>Waiting for build logs...</div>}
              {logs.map((log, i) => {
                const isWarning = log.includes("Warning") || log.toLowerCase().includes("warn");
                const isError = log.includes("Error") || log.toLowerCase().includes("err");
                const isSuccess = log.includes("successful") || log.toLowerCase().includes("success");
                return (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '1.5rem',
                    padding: '0.15rem 0.5rem',
                    background: isError ? 'rgba(255, 64, 129, 0.1)' : isWarning ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                    color: isError ? '#ff4081' : isWarning ? '#f5a623' : isSuccess ? "#00e676" : "#a0a0a0",
                    borderLeft: isError ? '2px solid #ff4081' : isWarning ? '2px solid #f5a623' : '2px solid transparent',
                    marginLeft: (isWarning || isError) ? '-2px' : '0',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ whiteSpace: 'pre-wrap', flex: 1 }}>{log}</span>
                    {isError && (
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('ai-explain-error', { detail: { error: log } }))}
                        style={{
                          background: 'rgba(255, 64, 129, 0.15)',
                          color: '#ff4081',
                          border: '1px solid rgba(255, 64, 129, 0.3)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontFamily: 'var(--fm)',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 64, 129, 0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 64, 129, 0.15)'; }}
                      >
                        Explain Error
                      </button>
                    )}
                  </div>
                );
              })}
              {status === "building" && (
                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.15rem 0.5rem' }}>
                  <span style={{ color: "var(--accent)", animation: "pulse 1.5s infinite" }}>_</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="dash-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: "var(--fb)", fontSize: "1.1rem", margin: "0 0 1.5rem 0", color: '#fff' }}>Live Container Metrics</h3>
            {status !== 'ready' ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <p>Container is not currently running. Metrics are unavailable.</p>
              </div>
            ) : !stats ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                <p>Collecting metrics...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>CPU Usage</div>
                  <div style={{ fontSize: '1.8rem', fontFamily: 'var(--fd)', color: 'var(--accent)' }}>{stats.cpuPercent}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Memory Usage</div>
                  <div style={{ fontSize: '1.8rem', fontFamily: 'var(--fd)', color: '#00e676' }}>{stats.memUsage} <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}>({stats.memPercent})</span></div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Network I/O</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--fd)', color: '#fff' }}>{stats.netIO}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Block I/O</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--fd)', color: '#fff' }}>{stats.blockIO}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'source' && (
          <div className="dash-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: "var(--fb)", fontSize: "1.1rem", margin: "0 0 1.5rem 0", color: '#fff' }}>Repository Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Repository URL</span>
                <a href={project?.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{project?.repoUrl || 'Loading...'}</a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Branch</span>
                <span style={{ color: '#fff' }}>main</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Framework</span>
                <span style={{ color: '#fff', textTransform: 'capitalize' }}>{project?.type?.RepoType || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Environment Variables</span>
                <span style={{ color: '#fff' }}>{project?.envCount !== undefined ? project.envCount : 'Loading...'} configured</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opengraph' && (
          <div className="dash-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: "var(--fb)", fontSize: "1.1rem", margin: "0 0 1.5rem 0", color: '#fff' }}>Social Preview</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '2rem' }}>This is how your site will appear when shared on platforms like Twitter, Discord, or iMessage.</p>
            <div style={{ maxWidth: '500px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', background: '#151515' }}>
              <div style={{ width: '100%', height: '260px', background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(var(--acid-rgb, 232, 255, 0), 0.1) 0%, transparent 70%)' }}></div>
                <h2 style={{ fontFamily: 'var(--fd)', fontSize: '2.5rem', color: '#fff', zIndex: 1, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{project ? getRepoName(project.repoUrl) : "Loading..."}</h2>
              </div>
              <div style={{ padding: '1.2rem', background: '#000' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{repoId}.localhost:3000</div>
                <div style={{ color: '#fff', fontSize: '1.1rem', fontFamily: 'var(--fb)', marginBottom: '0.4rem' }}>{project ? getRepoName(project.repoUrl) : "App"} - Deployed with Command Center</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.4' }}>Seamlessly built and deployed to the edge network. Built with {project?.type?.RepoType || 'Unknown framework'}.</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Play Game while build runs */}
      <PlayGameButton />
      <ToastContainer />
    </div>
  );
}