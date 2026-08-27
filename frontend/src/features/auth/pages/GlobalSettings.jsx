import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../shared/components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { gsap } from "gsap";
import HackerText from "../../shared/components/HackerText";
import { updateProfile } from "../services/auth.api";
import { useToast } from "../../shared/components/Toast";
import "../../deploy/styles/Dashboard.css";

export default function GlobalSettings() {
  const user = useSelector((state) => state.auth?.user);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    contact: user?.contact || "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast, ToastContainer } = useToast();
  const pageRef = useRef(null);

  useEffect(() => {
    document.body.style.background = "#050505";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(".dash-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .fromTo(".dash-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "back.out(1.2)" }, "-=0.4");
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Clean up empty fields so we don't send them
      const payload = {};
      if (formData.fullName && formData.fullName !== user?.fullName) payload.fullName = formData.fullName;
      if (formData.contact && formData.contact !== user?.contact) payload.contact = formData.contact;
      if (formData.password) payload.password = formData.password;
      
      if (Object.keys(payload).length === 0) {
        showToast("No changes detected", "info");
        setIsSubmitting(false);
        return;
      }
      
      const res = await updateProfile(payload);
      
      if (res.success) {
        showToast("Profile updated successfully", "success");
        // Clear password field
        setFormData(prev => ({ ...prev, password: "" }));
        // Note: For a fully reactive app, you would dispatch an action here to update Redux store
        // dispatch(setUser(res.user));
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={pageRef} className="dashboard-page" style={{ backgroundColor: "#050505", minHeight: "100vh" }}>
      <Navbar />

      <main className="dash-main" style={{ maxWidth: "1000px", margin: "0 auto", width: "100%", paddingBottom: "4rem", paddingTop: "2rem" }}>
        <header className="dash-header" style={{ marginBottom: "2rem", borderBottom: "none" }}>
          <div className="dash-header-left">
            <h1 className="dash-title" style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>
              <HackerText text="Account Settings" />
            </h1>
            <p className="dash-subtitle" style={{ fontSize: '1rem', color: "rgba(255,255,255,0.6)" }}>
              Manage your personal information, contact details, and security.
            </p>
          </div>
        </header>

        <form onSubmit={handleSave} className="dash-grid" style={{ gridTemplateColumns: "1fr", gap: "2rem" }}>
          
          {/* Profile Section */}
          <div className="dash-card" style={{ padding: "0", overflow: "hidden", background: "rgba(255, 255, 255, 0.015)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px" }}>
            <div style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="dash-card-title" style={{ fontFamily: "var(--fb)", fontSize: "1.2rem", marginBottom: "0.5rem", color: "#fff" }}>Profile Information</h3>
              <p style={{ fontFamily: "var(--fm)", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
                Update your display name and how we can reach you.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "500px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.8rem", color: "#fff", fontFamily: "var(--fm)", borderRadius: "6px", outline: "none", transition: "border-color 0.3s" }} 
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>Contact / Phone</label>
                  <input 
                    type="text" 
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.8rem", color: "#fff", fontFamily: "var(--fm)", borderRadius: "6px", outline: "none", transition: "border-color 0.3s" }} 
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ""}
                    disabled
                    style={{ width: "100%", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: "0.8rem", color: "rgba(255,255,255,0.4)", fontFamily: "var(--fm)", borderRadius: "6px", outline: "none", cursor: "not-allowed" }} 
                  />
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.4rem", display: "block", fontFamily: "var(--fm)" }}>Email cannot be changed currently.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="dash-card" style={{ padding: "0", overflow: "hidden", background: "rgba(255, 255, 255, 0.015)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px" }}>
            <div style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="dash-card-title" style={{ fontFamily: "var(--fb)", fontSize: "1.2rem", marginBottom: "0.5rem", color: "#fff" }}>Security</h3>
              <p style={{ fontFamily: "var(--fm)", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
                Update your password to keep your account secure.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "500px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--fm)", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>New Password</label>
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password to change..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.8rem", color: "#fff", fontFamily: "var(--fm)", borderRadius: "6px", outline: "none", transition: "border-color 0.3s" }} 
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.4rem", display: "block", fontFamily: "var(--fm)" }}>Leave blank if you do not wish to change your password.</span>
                </div>
              </div>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem 2rem", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="dash-btn" 
                style={{ 
                  background: isSubmitting ? "rgba(255,255,255,0.5)" : "#fff", 
                  color: "#000", 
                  border: "none", 
                  padding: "0.7rem 2rem", 
                  borderRadius: "6px", 
                  fontFamily: "var(--fb)",
                  cursor: isSubmitting ? "not-allowed" : "pointer"
                }}
              >
                {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </form>
      </main>
      <ToastContainer />
    </div>
  );
}
