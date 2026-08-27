import React, { useEffect, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const COLORS = {
    error:   { bg: "rgba(255,42,77,0.12)",   border: "rgba(255,42,77,0.35)",   icon: "✕", iconColor: "#ff2a4d" },
    success: { bg: "rgba(0,230,118,0.1)",    border: "rgba(0,230,118,0.3)",    icon: "✓", iconColor: "#00e676" },
    info:    { bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.3)",   icon: "ℹ", iconColor: "#38bdf8" },
    warning: { bg: "rgba(255,171,0,0.1)",    border: "rgba(255,171,0,0.3)",    icon: "⚠", iconColor: "#ffab00" },
  };

  const ToastContainer = () => (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0)   scale(1);    }
          to   { opacity: 0; transform: translateX(100%) scale(0.95); }
        }
      `}</style>
      <div style={{
        position: "fixed", bottom: "24px", right: "24px",
        display: "flex", flexDirection: "column", gap: "10px",
        zIndex: 9999, pointerEvents: "none",
      }}>
        {toasts.map((toast) => {
          const c = COLORS[toast.type] || COLORS.error;
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "all",
                display: "flex", alignItems: "flex-start", gap: "12px",
                background: "rgba(15,15,15,0.95)",
                border: `1px solid ${c.border}`,
                borderLeft: `3px solid ${c.iconColor}`,
                borderRadius: "10px",
                padding: "12px 16px",
                minWidth: "280px", maxWidth: "380px",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
                cursor: "pointer",
              }}
              onClick={() => dismiss(toast.id)}
            >
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%",
                background: c.bg, border: `1px solid ${c.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: "bold", color: c.iconColor,
                flexShrink: 0, marginTop: "1px",
              }}>
                {c.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: 0, fontFamily: "var(--fm)", fontSize: "0.88rem",
                  color: "#fff", lineHeight: "1.4",
                }}>
                  {toast.message}
                </p>
                <p style={{
                  margin: "3px 0 0", fontFamily: "var(--fm)", fontSize: "0.74rem",
                  color: "rgba(255,255,255,0.35)",
                }}>
                  Click to dismiss
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return { showToast, ToastContainer };
}
