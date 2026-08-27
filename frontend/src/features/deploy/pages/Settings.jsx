import React, { useState, useEffect } from "react";
import Navbar from "../../shared/components/Navbar";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/Dashboard.css";
import { gsap } from "gsap";
import HackerText from "../../shared/components/HackerText";
import DeployBackground from "../components/DeployBackground";
import MouseTrail from "../../auth/components/MouseTrail";
import StaggeredText from "../../shared/components/StaggeredText";
import useDeploy from "../hooks/useDeploy";
import { useToast } from "../../shared/components/Toast";

export default function Settings() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [envs, setEnvs] = useState([{ key: "", value: "" }]);
  const [project, setProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pageRef = React.useRef(null);

  const { fetchProject, deleteProject, redeployProject } = useDeploy();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    document.body.style.background = "#000000";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await fetchProject(repoId);
      if (data?.success) {
        setProject(data.project);
      }
    };
    load();
  }, [repoId]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".dash-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
      gsap.fromTo(".dash-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "back.out(1.2)" }, "-=0.4");
    }, pageRef);
    return () => ctx.revert();
  }, [project]);

  const handleAddEnv = (e) => {
    e.preventDefault();
    setEnvs([...envs, { key: "", value: "" }]);
  };

  const handleEnvChange = (index, field, value) => {
    const updated = [...envs];
    updated[index][field] = value;
    setEnvs(updated);
  };

  const handleRemoveEnv = (index, e) => {
    e.preventDefault();
    setEnvs(envs.filter((_, i) => i !== index));
  };

  const handleSaveEnvs = async (e) => {
    e.preventDefault();
    const validEnvs = envs.filter(e => e.key.trim());
    if (validEnvs.length === 0) { showToast("Add at least one variable.", "error"); return; }
    const envObj = {};
    validEnvs.forEach(e => { envObj[e.key.trim()] = e.value.trim(); });
    setSaving(true);
    const result = await redeployProject(repoId, envObj);
    setSaving(false);
    if (result?.success) {
      showToast("Environment variables saved. Redeploying with new config...", "success");
      setTimeout(() => navigate(`/deploy/${repoId}`), 1500);
    } else {
      showToast(result?.message || "Failed to save.", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${repoId}"? This cannot be undone.`)) return;
    setDeleting(true);
    const result = await deleteProject(repoId);
    setDeleting(false);
    if (result?.success) {
      showToast("Project deleted.", "success");
      setTimeout(() => navigate("/dashboard"), 1000);
    } else {
      showToast(result?.message || "Delete failed.", "error");
    }
  };

  const getRepoName = (url) => {
    if (!url) return repoId;
    const parts = url.split("/");
    return parts[parts.length - 1].replace(".git", "");
  };

  const cardStyle = { padding: "0", display: "flex", flexWrap: "wrap", overflow: "hidden" };
  const leftPanelStyle = { flex: "1 1 280px", padding: "2rem", borderRight: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" };
  const rightPanelStyle = { flex: "2 1 460px", padding: "2rem" };
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.8rem", color: "#fff", fontFamily: "monospace", borderRadius: "6px", outline: "none", fontSize: "0.9rem" };
  const labelStyle = { display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" };
  const rowStyle = { display: "flex", justifyContent: "space-between", padding: "0.8rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontFamily: "var(--fm)", fontSize: "0.85rem" };

  return (
    <div ref={pageRef} className="dashboard-page">
      <MouseTrail compact />
      <DeployBackground />
      <Navbar />
      <ToastContainer />

      <main className="dash-main" style={{ maxWidth: "1500px", margin: "0 auto", width: "100%", paddingBottom: "4rem", paddingTop: "2rem" }}>
        <header className="dash-header" style={{ marginBottom: "2rem" }}>
          <div className="dash-header-left">
            <h1 className="dash-title" style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>
              <HackerText text={`${getRepoName(project?.repoUrl)} — Settings`} />
            </h1>
            <p className="dash-subtitle" style={{ fontSize: "0.9rem" }}>
              Manage environment variables and project configuration
            </p>
          </div>
          <Link to={`/deploy/${repoId}`} className="dash-btn dash-btn-outline" style={{ textDecoration: "none" }}>
            <HackerText text="← VIEW DEPLOYMENT" />
          </Link>
        </header>

        <div className="dash-grid" style={{ gridTemplateColumns: "1fr", gap: "2rem" }}>

          {/* ── Project Info (read-only) ── */}
          <div className="dash-card" style={cardStyle}>
            <div style={leftPanelStyle}>
              <h3 style={{ fontFamily: "var(--fb)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                <HackerText text="Project Info" />
              </h3>
              <p style={{ fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                Read-only metadata about this deployment, pulled directly from the database.
              </p>
            </div>
            <div style={rightPanelStyle}>
              {project ? (
                <div>
                  <div style={rowStyle}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>App ID</span>
                    <span style={{ color: "#fff", fontFamily: "monospace" }}>{project.appId}</span>
                  </div>
                  <div style={rowStyle}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Repository</span>
                    <a href={project.repoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all", textAlign: "right", maxWidth: "60%" }}>
                      {project.repoUrl?.replace("https://github.com/", "")}
                    </a>
                  </div>
                  <div style={rowStyle}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Framework</span>
                    <span style={{ color: "#fff", textTransform: "capitalize" }}>{project.type?.RepoType || "Unknown"}</span>
                  </div>
                  <div style={rowStyle}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Status</span>
                    <span style={{ color: project.status === "running" ? "#00e676" : project.status === "failed" ? "#ff4081" : "var(--accent)", textTransform: "capitalize" }}>
                      {project.status}
                    </span>
                  </div>
                  <div style={rowStyle}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Live URL</span>
                    {project.status === 'running' ? (
                      <a href={`https://${project.appId}.quicklive.tech`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontFamily: "monospace" }}>
                        {project.appId}.quicklive.tech
                      </a>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>Not assigned yet</span>
                    )}
                  </div>
                  <div style={{ ...rowStyle, borderBottom: "none" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Deployed</span>
                    <span style={{ color: "#fff" }}>{project.createdAt ? new Date(project.createdAt).toLocaleString() : "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--fm)", fontSize: "0.85rem" }}>Loading project data...</div>
              )}
            </div>
          </div>

          {/* ── Environment Variables ── */}
          <div className="dash-card" style={cardStyle}>
            <div style={leftPanelStyle}>
              <h3 style={{ fontFamily: "var(--fb)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                <HackerText text="Environment Variables" />
              </h3>
              <p style={{ fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                Add key-value pairs injected into your container at runtime. Saving will trigger a redeploy with the new configuration.
              </p>
              <div style={{ marginTop: "1.5rem", padding: "0.75rem 1rem", background: "rgba(232,255,0,0.05)", border: "1px solid rgba(232,255,0,0.15)", borderRadius: "6px" }}>
                <p style={{ fontFamily: "var(--fm)", fontSize: "0.75rem", color: "rgba(232,255,0,0.8)", margin: 0, lineHeight: "1.5" }}>
                  ⚡ Saving env vars triggers a redeploy. Your app will briefly restart.
                </p>
              </div>
            </div>

            <div style={rightPanelStyle}>
              <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={handleSaveEnvs}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "var(--fm)", fontSize: "0.75rem", letterSpacing: "0.05em", paddingLeft: "0.5rem" }}>
                  <span>KEY</span>
                  <span>VALUE</span>
                  <span />
                </div>

                {envs.map((env, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: "0.75rem", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="DATABASE_URL"
                      value={env.key}
                      onChange={(e) => handleEnvChange(i, "key", e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={env.value}
                      onChange={(e) => handleEnvChange(i, "value", e.target.value)}
                      style={inputStyle}
                    />
                    <button
                      onClick={(e) => handleRemoveEnv(i, e)}
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", cursor: "pointer", borderRadius: "6px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff2a4d"; e.currentTarget.style.color = "#ff2a4d"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                    >✕</button>
                  </div>
                ))}

                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={handleAddEnv} className="dash-btn dash-btn-outline" style={{ flex: 1, borderRadius: "6px" }}>
                    <StaggeredText text="+ Add Variable" />
                  </button>
                  <button type="submit" className="dash-btn" disabled={saving} style={{ flex: 1, borderRadius: "6px", opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                    <StaggeredText text={saving ? "Saving & Redeploying..." : "Save & Redeploy"} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div className="dash-card" style={{ ...cardStyle, borderColor: "#ff2a4d", borderStyle: "dashed" }}>
            <div style={{ ...leftPanelStyle, borderRight: "1px solid rgba(255,42,77,0.15)", background: "rgba(255,42,77,0.02)" }}>
              <h3 style={{ fontFamily: "var(--fd)", color: "#ff2a4d", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                <HackerText text="Danger Zone" />
              </h3>
              <p style={{ fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                Permanently deletes this project, stops the Docker container, and removes all logs. There is no going back.
              </p>
            </div>
            <div style={{ ...rightPanelStyle, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: "transparent", border: "1px solid #ff2a4d", color: "#ff2a4d", padding: "0.7rem 2rem", borderRadius: "6px", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "var(--fb)", fontSize: "0.9rem", transition: "all 0.2s", opacity: deleting ? 0.6 : 1 }}
                onMouseEnter={e => { if (!deleting) { e.currentTarget.style.background = "rgba(255,42,77,0.1)"; } }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <StaggeredText text={deleting ? "Deleting..." : "DELETE PROJECT"} />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
