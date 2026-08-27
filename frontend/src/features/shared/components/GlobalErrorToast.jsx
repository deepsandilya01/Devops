import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setError } from "../../auth/slices/auth.slice";
import "../styles/GlobalErrorToast.css";

const GlobalErrorToast = () => {
  const dispatch = useDispatch();
  const authError = useSelector((state) => state.auth.error);
  const [visible, setVisible] = useState(false);
  const [currentError, setCurrentError] = useState("");

  useEffect(() => {
    if (authError) {
      let errorMsg = typeof authError === "string" ? authError : authError.message || JSON.stringify(authError);
      setCurrentError(errorMsg);
      setVisible(true);

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [authError]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      dispatch(setError(null));
      setCurrentError("");
    }, 400);
  };

  if (!currentError && !visible) return null;

  return (
    <div className={`gt-container ${visible ? "gt-enter" : "gt-exit"}`}>
      <div className="gt-toast">
        {/* Left accent bar */}
        <div className="gt-accent-bar" />

        {/* Icon */}
        <div className="gt-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Content */}
        <div className="gt-content">
          <div className="gt-title">Error</div>
          <div className="gt-message">{currentError}</div>
        </div>

        {/* Close */}
        <button className="gt-close" onClick={handleClose} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="gt-progress" />
      </div>
    </div>
  );
};

export default GlobalErrorToast;
