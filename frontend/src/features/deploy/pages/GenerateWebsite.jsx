import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../shared/components/Navbar";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { gsap } from "gsap";
import HackerText from "../../shared/components/HackerText";
import StaggeredText from "../../shared/components/StaggeredText";
import DeployBackground from "../components/DeployBackground";
import MouseTrail from "../../auth/components/MouseTrail";
import useDeploy from "../hooks/useDeploy";
import { useToast } from "../../shared/components/Toast";
import { PlayGameButton } from "./Dashboard";
import JellyLoader from "../../shared/components/JellyLoader";

const TEMPLATE_ICONS = {
  portfolio: "👤",
  landing: "🚀",
  blog: "📝",
  ecommerce: "🛒",
  agency: "🎨",
  custom: "✨",
};

const TEMPLATE_GRADIENTS = {
  portfolio: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  landing: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  blog: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  ecommerce: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  agency: "linear-gradient(135deg, #a78bfa 0%, #f0abfc 100%)",
  custom: "linear-gradient(135deg, #e8ff00 0%, #00e5ff 100%)",
};

export default function GenerateWebsite() {
  const navigate = useNavigate();
  const { getTemplates, generateWebsite, deployRepo, loading } = useDeploy();
  const { showToast, ToastContainer } = useToast();
  const pageRef = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [repoName, setRepoName] = useState("");
  const [step, setStep] = useState("templates"); // "templates" | "configure" | "generating"
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationLogs, setGenerationLogs] = useState([]);

  useEffect(() => {
    document.body.style.background = "#050505";
    getTemplates().then((data) => {
      const templatesData = data?.templates || [];
      if (templatesData.length > 0) {
        setTemplates(templatesData);
        const firstPremade = templatesData.find(t => t.hasTemplate);
        if (firstPremade) setPreviewId(firstPremade.id);
      }
    });
    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gen-card",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: "back.out(1.2)", delay: 0.2 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [templates, step]);

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    if (template.hasTemplate) setPreviewId(template.id);
    else setPreviewId(null);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    setRepoName(`my-${selectedTemplate.id}-site`);
    setStep("configure");
  };

  const addLog = (msg) => {
    setGenerationLogs((prev) => [...prev, msg]);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !prompt.trim() || !repoName.trim()) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    setStep("generating");
    setGenerationLogs([]);
    addLog("[SYS] Starting AI website generation...");
    setGenerationStatus("Generating website code with AI...");

    addLog(`[SYS] Template: ${selectedTemplate.name}`);
    addLog(`[SYS] Prompt: "${prompt}"`);
    addLog("[SYS] Calling Mistral AI to generate code...");

    const result = await generateWebsite({ templateId: selectedTemplate.id, prompt, repoName });

    if (result && result.success) {
      addLog("[SYS] ✅ Code generated successfully!");
      addLog(`[SYS] ✅ GitHub repo created: ${result.repoName}`);
      addLog("[SYS] ✅ Files pushed to GitHub!");
      setGenerationStatus("Website generated! Starting deployment...");

      // Now auto-deploy the generated repo
      addLog("[SYS] Triggering deployment...");
      const deployResult = await deployRepo(result.repoUrl);

      if (deployResult && deployResult.success) {
        addLog("[SYS] ✅ Deployment triggered!");
        showToast("Website generated and deployment started!", "success");
        setTimeout(() => {
          navigate(`/deploy/${deployResult.appId}`, {
            state: { toastMessage: "AI-generated website is deploying!", toastType: "success" },
          });
        }, 1500);
      } else {
        addLog(`[ERROR] Deployment failed: ${deployResult?.message || "Unknown error"}`);
        setGenerationStatus("Generation succeeded but deployment failed");
        showToast("Website generated but deployment failed. You can deploy it from the Projects page.", "warning");
      }
    } else {
      addLog(`[ERROR] Generation failed: ${result?.message || "Unknown error"}`);
      setGenerationStatus("Generation failed");
      showToast(result?.message || "Failed to generate website", "error");
    }
  };

  return (
    <div ref={pageRef} className="dashboard-page">
      <MouseTrail compact />
      <Navbar />

      <main className="dash-main gen-main" style={{ maxWidth: "1500px", margin: "0 auto", width: "100%", paddingBottom: "4rem", paddingTop: "2rem" }}>
        {/* Header */}
        <header className="dash-header gen-header" style={{ marginBottom: "2.5rem" }}>
          <div className="dash-header-left">
            <h1 className="dash-title" style={{ fontSize: "2rem", marginBottom: "0.3rem" }}>
              <HackerText text="Generate Website" />
            </h1>
            <p className="dash-subtitle" style={{ fontSize: "0.95rem", maxWidth: "600px" }}>
              Choose a template, describe your vision, and let AI build & deploy your website in minutes.
            </p>
          </div>
          {step !== "templates" && (
            <button
              onClick={() => { setStep("templates"); setSelectedTemplate(null); setPreviewId(null); setPrompt(""); setGenerationLogs([]); }}
              className="dash-btn dash-btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              ← Back to Templates
            </button>
          )}
        </header>

        {/* Pipeline indicator */}
        <div className="gen-pipeline" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem", padding: "1rem 1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
          {["Choose Template", "Configure", "Generate & Deploy"].map((label, i) => {
            const stepIdx = step === "templates" ? 0 : step === "configure" ? 1 : 2;
            const isActive = i === stepIdx;
            const isDone = i < stepIdx;
            return (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ flex: 1, height: "1px", background: isDone ? "var(--accent)" : "rgba(255,255,255,0.1)" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: isActive ? "var(--accent)" : isDone ? "rgba(0,230,118,0.2)" : "rgba(255,255,255,0.05)",
                    color: isActive ? "#000" : isDone ? "#00e676" : "rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: "bold", fontFamily: "var(--fm)",
                    border: isActive ? "none" : isDone ? "1px solid rgba(0,230,118,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s"
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span style={{
                    fontFamily: "var(--fm)", fontSize: "0.8rem",
                    color: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                    fontWeight: isActive ? "600" : "400"
                  }}>
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Template Selection — split layout */}
        {step === "templates" && (
          <div className="gen-template-split" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem", minHeight: "520px" }}>
            {/* Left: template list */}
            <div className="gen-template-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "600px", paddingRight: "0.5rem" }}>
              {templates.map((template) => {
                const isActive = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    className="gen-card"
                    onClick={() => handlePreviewTemplate(template)}
                    style={{
                      background: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      border: isActive ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "1.1rem 1.25rem",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    {/* Active indicator */}
                    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", background: isActive ? (TEMPLATE_GRADIENTS[template.id] || "var(--accent)") : "transparent", borderRadius: "0 2px 2px 0", transition: "background 0.2s" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: "38px", height: "38px", borderRadius: "10px",
                        background: isActive ? (TEMPLATE_GRADIENTS[template.id] || "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.15rem", flexShrink: 0, transition: "background 0.3s",
                      }}>
                        {TEMPLATE_ICONS[template.id] || "🌐"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <h3 style={{ margin: 0, fontFamily: "var(--fb)", fontSize: "0.95rem", color: isActive ? "#fff" : "rgba(255,255,255,0.7)" }}>
                            {template.name}
                          </h3>
                          {template.hasTemplate && (
                            <span style={{
                              fontSize: "0.55rem", fontFamily: "var(--fm)", fontWeight: "600",
                              padding: "0.1rem 0.35rem", borderRadius: "3px",
                              background: "rgba(0,230,118,0.12)", color: "#00e676",
                              border: "1px solid rgba(0,230,118,0.25)",
                            }}>
                              Premade
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--fm)", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Use template button */}
              {selectedTemplate && (
                <button
                  onClick={handleUseTemplate}
                  style={{
                    marginTop: "0.5rem", padding: "0.85rem",
                    background: "var(--accent)", color: "#000",
                    border: "none", borderRadius: "10px",
                    fontFamily: "var(--fb)", fontSize: "0.9rem", fontWeight: "600",
                    cursor: "pointer", transition: "opacity 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  Use {selectedTemplate.name} Template →
                </button>
              )}
            </div>

            {/* Right: live preview */}
            <div className="gen-preview-wrap" style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              {/* Preview toolbar */}
              <div style={{
                padding: "0.6rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#28c840" }} />
                <div style={{
                  flex: 1, marginLeft: "0.5rem", background: "rgba(255,255,255,0.04)",
                  borderRadius: "5px", padding: "0.25rem 0.6rem",
                  fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)",
                }}>
                  {previewId ? `preview — ${selectedTemplate?.name || previewId}` : "select a template"}
                </div>
              </div>

              {/* Iframe */}
              <div style={{ flex: 1, position: "relative", minHeight: "460px", background: "#fff" }}>
                {previewId ? (
                  <iframe
                    key={previewId}
                    src={`https://quicklive.tech/api/generate/preview/${previewId}`}
                    title="Template Preview"
                    style={{
                      width: "100%", height: "100%", border: "none",
                      position: "absolute", inset: 0,
                    }}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    flexDirection: "column", gap: "0.75rem",
                    background: "rgba(0,0,0,0.3)",
                  }}>
                    <span style={{ fontSize: "2rem" }}>🎨</span>
                    <span style={{ fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                      {selectedTemplate ? "No preview available — AI will generate this template" : "Click a template to preview"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === "configure" && selectedTemplate && (
          <div style={{ width: "100%" }}>
            {/* Selected template preview */}
            <div className="gen-card" style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem",
              display: "flex", alignItems: "center", gap: "1rem"
            }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "12px",
                background: TEMPLATE_GRADIENTS[selectedTemplate.id] || "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", flexShrink: 0,
              }}>
                {TEMPLATE_ICONS[selectedTemplate.id] || "🌐"}
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: "var(--fb)", fontSize: "1.1rem", color: "#fff" }}>
                  {selectedTemplate.name} Template
                </h3>
                <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--fm)", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                  {selectedTemplate.description}
                </p>
              </div>
            </div>

            {/* Repo Name */}
            <div className="gen-card" style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
                Repository Name
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-awesome-site"
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                  padding: "0.9rem 1.2rem", color: "#fff", fontFamily: "monospace",
                  fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <p style={{ margin: "0.4rem 0 0", fontFamily: "var(--fm)", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                This will be the name of your new GitHub repository
              </p>
            </div>

            {/* Prompt */}
            <div className="gen-card" style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
                {selectedTemplate.id === "custom" ? "Describe Your Custom Website" : "Describe Your Website"}
              </label>

              {/* Special hint for Custom Site */}
              {selectedTemplate.id === "custom" && (
                <div style={{
                  background: "rgba(232,255,0,0.04)", border: "1px solid rgba(232,255,0,0.15)",
                  borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "0.75rem",
                  display: "flex", gap: "0.6rem", alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>✨</span>
                  <p style={{ margin: 0, fontFamily: "var(--fm)", fontSize: "0.78rem", color: "rgba(232,255,0,0.8)", lineHeight: "1.6" }}>
                    <strong>Custom Site</strong> — AI will build your site exactly from your description with no predefined template. Be as detailed as possible: include type of site, sections, colors, fonts, content, and style.
                  </p>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedTemplate.id === "custom"
                  ? `e.g. "A personal finance tracker app landing page. Dark minimal design with neon green accents. Sections: hero with animated counter stats, features grid (6 cards), pricing table (3 tiers), FAQ accordion, and a CTA section. Use Space Mono font."`
                  : `e.g. "A portfolio for a freelance photographer named Alex Chen. Dark theme with a full-screen hero, gallery grid, about section, and contact form. Use warm amber accents."`
                }
                rows={5}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                  padding: "0.9rem 1.2rem", color: "#fff", fontFamily: "var(--fm)",
                  fontSize: "0.9rem", outline: "none", resize: "vertical",
                  lineHeight: "1.6", transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <p style={{ margin: "0.4rem 0 0", fontFamily: "var(--fm)", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                {selectedTemplate.id === "custom"
                  ? "The more detail you provide, the more accurate and unique your site will be"
                  : "Be specific — mention colors, sections, content, and style preferences for best results"
                }
              </p>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || !repoName.trim()}
              style={{
                width: "100%", padding: "1rem",
                background: loading ? "rgba(255,255,255,0.1)" : "var(--accent)",
                color: loading ? "rgba(255,255,255,0.5)" : "#000",
                border: "none", borderRadius: "10px",
                fontFamily: "var(--fb)", fontSize: "1rem", fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <div style={{ position: "relative", width: "40px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <JellyLoader style={{ transform: "scale(0.2)", position: "absolute" }} />
                  </div>
                  Generating...
                </>
              ) : (
                <><StaggeredText text="✨ Generate & Deploy" /></>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && (
          <div style={{ width: "100%" }}>
            {/* Status banner */}
            <div className="gen-card" style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem",
              display: "flex", alignItems: "center", gap: "1rem"
            }}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%",
                background: "rgba(var(--acid-rgb, 232,255,0), 0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative"
              }}>
                <JellyLoader style={{ transform: "scale(0.2)", position: "absolute" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: "var(--fb)", fontSize: "1rem", color: "#fff" }}>
                  {generationStatus || "Processing..."}
                </h3>
                <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--fm)", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  AI-powered • Generates code → pushes to GitHub → deploys live
                </p>
              </div>
            </div>

            {/* Live logs */}
            <div style={{
              background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "1rem 1.2rem",
              fontFamily: "monospace", fontSize: "0.8rem",
              maxHeight: "400px", overflowY: "auto",
              color: "rgba(255,255,255,0.6)",
            }}>
              {generationLogs.map((log, i) => (
                <div key={i} style={{
                  padding: "0.3rem 0",
                  color: log.includes("[ERROR]") ? "#ff6b8a" : log.includes("✅") ? "#00e676" : "rgba(255,255,255,0.6)",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.2)", marginRight: "0.5rem" }}>{String(i + 1).padStart(2, "0")}</span>
                  {log}
                </div>
              ))}
              {generationLogs.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "2rem" }}>
                  Waiting for logs...
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI-powered footer badge */}
        <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{
            fontSize: "0.7rem", fontFamily: "var(--fm)", fontWeight: "600",
            padding: "0.25rem 0.6rem", borderRadius: "4px",
            background: "rgba(var(--acid-rgb, 232,255,0), 0.15)",
            color: "var(--accent)", border: "1px solid rgba(var(--acid-rgb, 232,255,0), 0.3)",
          }}>
            AI-powered
          </span>
          <span style={{ fontFamily: "var(--fm)", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
            Generates code → pushes to GitHub → deploys live in minutes
          </span>
        </div>
      </main>

      <PlayGameButton />
      <ToastContainer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
