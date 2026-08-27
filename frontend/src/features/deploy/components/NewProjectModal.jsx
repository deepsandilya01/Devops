import React, { useEffect, useState } from "react";
import useDeploy from "../hooks/useDeploy";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const GITHUB_OAUTH_URL = "https://quicklive.tech/api/auth/github";

const LANG_COLORS = {
  JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C++": "#f34b7d",
  CSS: "#563d7c", HTML: "#e34c26", Shell: "#89e051", Ruby: "#701516",
};

export default function NewProjectModal({ onClose, initialRepo = null }) {
  const user = useSelector((state) => state.auth?.user);
  const { fetchRepos, deployRepo } = useDeploy();
  const navigate = useNavigate();

  // We can't rely on githubId being in the Redux user object (backend doesn't return it).
  // Instead we try to fetch repos — if the API fails (500 / no token), GitHub isn't connected.
  const [githubConnected, setGithubConnected] = useState(null); // null = unknown (loading)
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(initialRepo);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [step, setStep] = useState(initialRepo ? "configure" : "list");
  const [envs, setEnvs] = useState([]);

  const handleAddEnv = (e) => {
    if (e) e.preventDefault();
    setEnvs([...envs, { key: "", value: "" }]);
  };

  const handleEnvChange = (index, field, value) => {
    const newEnvs = [...envs];
    newEnvs[index][field] = value;
    setEnvs(newEnvs);
  };

  const handleRemoveEnv = (index, e) => {
    if (e) e.preventDefault();
    const newEnvs = envs.filter((_, i) => i !== index);
    setEnvs(newEnvs);
  };

  useEffect(() => {
    setReposLoading(true);
    fetchRepos().then((data) => {
      if (Array.isArray(data) && data.length >= 0) {
        setGithubConnected(true);
        setRepos(data);
      } else {
        // fetchRepos returned null/undefined → API errored → no GitHub token
        setGithubConnected(false);
        setRepos([]);
      }
      setReposLoading(false);
    }).catch(() => {
      setGithubConnected(false);
      setReposLoading(false);
    });
  }, []);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = filtered.slice(0, 5);

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setStep("configure");
    setDeployError(null);
  };

  const handleDeploy = async () => {
    if (!selectedRepo) return;
    setDeploying(true);
    setDeployError(null);
    
    // Parse Env Vars
    const env = {};
    envs.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        env[item.key.trim()] = item.value.trim();
      }
    });

    const result = await deployRepo(selectedRepo.cloneUrl || selectedRepo.repoUrl, Object.keys(env).length > 0 ? env : null);
    if (result && result.success) {
      onClose();
      navigate(`/deploy/${result.appId}`);
    } else {
      setDeployError(result?.message || "Deployment failed. Please try again.");
      setDeploying(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .npm-repo-row:hover { background: rgba(255,255,255,0.05) !important; }
        .npm-import-btn:hover { background: var(--accent) !important; color: #000 !important; border-color: var(--accent) !important; }
        .npm-back:hover { background: rgba(255,255,255,0.07) !important; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px", width:"100%", maxWidth:"600px", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,0.6)", animation:"modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)", overflow:"hidden" }}
        >
          {/* ── Header ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.4rem 1.75rem", borderBottom:"1px solid rgba(255,255,255,0.07)", gap:"1rem" }}>
            {step === "configure" && (
              <button
                className="npm-back"
                onClick={() => { setStep("list"); setSelectedRepo(null); setDeployError(null); }}
                style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:"8px", padding:"0.35rem 0.75rem", fontFamily:"var(--fm)", fontSize:"0.8rem", cursor:"pointer", transition:"background 0.2s", whiteSpace:"nowrap" }}
              >
                ← Back
              </button>
            )}
            <div style={{ flex:1, paddingLeft: step === "configure" ? "0.75rem" : 0 }}>
              <h2 style={{ margin:0, fontFamily:"var(--fd)", fontSize:"1.25rem", color:"#fff" }}>
                {step === "list" ? "Import Git Repository" : `Configure · ${selectedRepo?.name}`}
              </h2>
              <p style={{ margin:"0.2rem 0 0", fontFamily:"var(--fm)", fontSize:"0.8rem", color:"rgba(255,255,255,0.4)" }}>
                {step === "list" ? "Select a repository from your GitHub account" : selectedRepo?.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:"8px", width:"30px", height:"30px", cursor:"pointer", fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
            >✕</button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding:"1.5rem 1.75rem", overflowY:"auto", flex:1 }}>

            {/* ── GitHub LOADING (checking connection) ── */}
            {githubConnected === null && (
              <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)", fontFamily:"var(--fm)", fontSize:"0.9rem" }}>
                <div style={{ display:"inline-block", animation:"spin 1s linear infinite", fontSize:"1.5rem", marginBottom:"0.8rem" }}>⟳</div>
                <div>Checking GitHub connection...</div>
              </div>
            )}

            {/* ── GitHub NOT connected ── */}
            {githubConnected === false && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"2.5rem 1rem", gap:"1.5rem" }}>
                <div style={{ width:"64px", height:"64px", borderRadius:"16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin:"0 0 0.4rem", fontFamily:"var(--fb)", fontSize:"1.1rem", color:"#fff" }}>GitHub Not Connected</h3>
                  <p style={{ margin:0, fontFamily:"var(--fm)", fontSize:"0.88rem", color:"rgba(255,255,255,0.5)", lineHeight:"1.6", maxWidth:"360px" }}>
                    Connect your GitHub account to import repositories and start deploying your projects instantly.
                  </p>
                </div>
                <a
                  href={GITHUB_OAUTH_URL}
                  style={{ display:"inline-flex", alignItems:"center", gap:"0.6rem", background:"#fff", color:"#000", border:"none", borderRadius:"9px", padding:"0.75rem 1.75rem", fontFamily:"var(--fb)", fontWeight:"bold", fontSize:"0.95rem", textDecoration:"none", transition:"opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Connect GitHub Account
                </a>
                <p style={{ margin:0, fontFamily:"var(--fm)", fontSize:"0.75rem", color:"rgba(255,255,255,0.25)" }}>
                  You'll be redirected to GitHub to authorize access to your repositories.
                </p>
              </div>
            )}

            {/* ── GitHub connected — STEP LIST ── */}
            {githubConnected === true && step === "list" && (
              <>
                <div style={{ position:"relative", marginBottom:"1.25rem" }}>
                  <svg style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", opacity:0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"0.65rem 1rem 0.65rem 2.4rem", color:"#fff", fontFamily:"var(--fm)", fontSize:"0.88rem", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                {reposLoading ? (
                  <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)", fontFamily:"var(--fm)", fontSize:"0.9rem" }}>
                    <div style={{ display:"inline-block", animation:"spin 1s linear infinite", fontSize:"1.5rem", marginBottom:"0.8rem" }}>⟳</div>
                    <div>Fetching your repositories...</div>
                  </div>
                ) : displayed.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)", fontFamily:"var(--fm)", fontSize:"0.9rem" }}>
                    {search ? `No repos matching "${search}"` : "No repositories found on your GitHub account."}
                  </div>
                ) : (
                  <div style={{ border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", overflow:"hidden" }}>
                    {displayed.map((repo, idx) => (
                      <div
                        key={repo.id || idx}
                        className="npm-repo-row"
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.9rem 1.2rem", borderBottom: idx < displayed.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", background:"transparent", transition:"background 0.15s" }}
                      >
                        {/* Left info */}
                        <div style={{ display:"flex", alignItems:"center", gap:"0.85rem", flex:1, minWidth:0 }}>
                          <div style={{ width:"34px", height:"34px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                            </svg>
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontFamily:"var(--fb)", fontSize:"0.92rem", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{repo.name}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.15rem", flexWrap:"wrap" }}>
                              {repo.language && (
                                <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.73rem", fontFamily:"var(--fm)", color:"rgba(255,255,255,0.45)" }}>
                                  <span style={{ width:"7px", height:"7px", borderRadius:"50%", background: LANG_COLORS[repo.language] || "#888", display:"inline-block" }}/>
                                  {repo.language}
                                </span>
                              )}
                              <span style={{ fontSize:"0.7rem", fontFamily:"var(--fm)", color:"rgba(255,255,255,0.28)", padding:"0.1rem 0.4rem", background:"rgba(255,255,255,0.05)", borderRadius:"4px" }}>
                                {repo.isPrivate ? "Private" : "Public"}
                              </span>
                              {repo.updatedAt && (
                                <span style={{ fontSize:"0.7rem", fontFamily:"var(--fm)", color:"rgba(255,255,255,0.28)" }}>
                                  {new Date(repo.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Import button */}
                        <button
                          className="npm-import-btn"
                          onClick={() => handleSelectRepo(repo)}
                          style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", borderRadius:"7px", padding:"0.42rem 1rem", fontFamily:"var(--fb)", fontSize:"0.8rem", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, marginLeft:"1rem", transition:"background 0.15s, color 0.15s, border-color 0.15s" }}
                        >
                          Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {filtered.length > 5 && (
                  <p style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.78rem", color:"rgba(255,255,255,0.3)", fontFamily:"var(--fm)" }}>
                    Showing 5 of {filtered.length} — use search to narrow results
                  </p>
                )}
              </>
            )}

            {/* ── GitHub connected — STEP CONFIGURE ── */}
            {githubConnected === true && step === "configure" && selectedRepo && (
              <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

                {/* Repo card */}
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"0.9rem 1.2rem", display:"flex", alignItems:"center", gap:"0.85rem" }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"9px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontFamily:"var(--fb)", fontSize:"0.95rem", color:"#fff" }}>{selectedRepo.name}</div>
                    <div style={{ fontFamily:"var(--fm)", fontSize:"0.76rem", color:"rgba(255,255,255,0.4)", marginTop:"0.1rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <span>{selectedRepo.fullName}</span>
                      <span>·</span>
                      <span>{selectedRepo.branch || "main"}</span>
                      {selectedRepo.language && (
                        <>
                          <span>·</span>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem" }}>
                            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background: LANG_COLORS[selectedRepo.language] || "#888", display:"inline-block" }}/>
                            {selectedRepo.language}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project name */}
                <div>
                  <label style={{ display:"block", fontFamily:"var(--fm)", fontSize:"0.81rem", color:"rgba(255,255,255,0.55)", marginBottom:"0.45rem" }}>Project Name</label>
                  <input type="text" defaultValue={selectedRepo.name}
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"0.68rem 1rem", color:"#fff", fontFamily:"var(--fm)", fontSize:"0.9rem", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                {/* Framework + Branch */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                  <div>
                    <label style={{ display:"block", fontFamily:"var(--fm)", fontSize:"0.81rem", color:"rgba(255,255,255,0.55)", marginBottom:"0.45rem" }}>Framework</label>
                    <select style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"0.68rem 1rem", color:"#fff", fontFamily:"var(--fm)", fontSize:"0.88rem", outline:"none", appearance:"none", boxSizing:"border-box" }}>
                      <option value="">Auto-detect</option>
                      <option value="vite">Vite</option>
                      <option value="react">Create React App</option>
                      <option value="next">Next.js</option>
                      <option value="express">Express / Node</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:"block", fontFamily:"var(--fm)", fontSize:"0.81rem", color:"rgba(255,255,255,0.55)", marginBottom:"0.45rem" }}>Branch</label>
                    <input type="text" defaultValue={selectedRepo.branch || "main"}
                      style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"0.68rem 1rem", color:"#fff", fontFamily:"var(--fm)", fontSize:"0.88rem", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                  </div>
                </div>

                {/* Environment Variables */}
                <div>
                  <label style={{ display:"block", fontFamily:"var(--fm)", fontSize:"0.81rem", color:"rgba(255,255,255,0.55)", marginBottom:"0.45rem" }}>Environment Variables (Optional)</label>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "0.8rem" }}>
                    {envs.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "1rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--fm)", fontSize: "0.75rem", paddingLeft: "0.5rem" }}>
                        <span>KEY</span>
                        <span>VALUE</span>
                        <span></span>
                      </div>
                    )}
                    
                    {envs.map((envItem, i) => (
                      <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="API_KEY"
                          value={envItem.key}
                          onChange={(e) => handleEnvChange(i, 'key', e.target.value)}
                          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.68rem 1rem", color: "#fff", fontFamily: "monospace", fontSize: "0.85rem", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                        />
                        <input
                          type="text"
                          placeholder="your_key_here"
                          value={envItem.value}
                          onChange={(e) => handleEnvChange(i, 'value', e.target.value)}
                          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.68rem 1rem", color: "#fff", fontFamily: "monospace", fontSize: "0.85rem", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                        />
                        <button onClick={(e) => handleRemoveEnv(i, e)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "1.1rem", padding: "0.5rem", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#ff2a4d"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleAddEnv} style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "0.68rem 1rem", fontFamily: "var(--fm)", fontSize: "0.85rem", cursor: "pointer", width: "100%", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--white)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>
                    + Add Environment Variable
                  </button>
                </div>

                {/* Clone URL read-only */}
                <div>
                  <label style={{ display:"block", fontFamily:"var(--fm)", fontSize:"0.81rem", color:"rgba(255,255,255,0.55)", marginBottom:"0.45rem" }}>Repository URL</label>
                  <input type="text" value={selectedRepo.cloneUrl || selectedRepo.repoUrl || ""} readOnly
                    style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"0.68rem 1rem", color:"rgba(255,255,255,0.4)", fontFamily:"monospace", fontSize:"0.8rem", outline:"none", boxSizing:"border-box" }}
                  />
                </div>

                {/* Error */}
                {deployError && (
                  <div style={{ background:"rgba(255,42,77,0.08)", border:"1px solid rgba(255,42,77,0.25)", borderRadius:"8px", padding:"0.75rem 1rem", fontFamily:"var(--fm)", fontSize:"0.85rem", color:"#ff6b8a" }}>
                    ⚠ {deployError}
                  </div>
                )}

                {/* Deploy button */}
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  style={{ background:"var(--accent)", color:"#000", border:"none", borderRadius:"9px", padding:"0.88rem", fontFamily:"var(--fb)", fontWeight:"bold", fontSize:"1rem", cursor: deploying ? "not-allowed" : "pointer", width:"100%", opacity: deploying ? 0.6 : 1, transition:"opacity 0.2s, transform 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}
                  onMouseEnter={(e) => { if (!deploying) e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {deploying ? (
                    <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span> Deploying...</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Deploy</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
