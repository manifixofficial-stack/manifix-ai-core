/* ==========================================================
 * ManifiX — UI Loader
 * ----------------------------------------------------------
 * Responsibilities:
 * - Global loading indicator
 * - Inline loader support
 * - Accessible & lightweight
 * - Works across mobile & web
 * ========================================================== */

import React from "react";

const Loader = ({
  size = "md",      // sm | md | lg
  variant = "primary", // primary | secondary | light
  inline = false,
  label = "Loading...",
  className = "",
}) => {
  return (
    <div
      className={`ui-loader ${size} ${variant} ${inline ? "inline" : ""} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="spinner" />
      {!inline && <span className="label">{label}</span>}
    </div>
  );
};

export default Loader;
