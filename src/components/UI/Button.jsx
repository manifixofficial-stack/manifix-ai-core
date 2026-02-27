/* ==========================================================
 * ManifiX — UI Button
 * ----------------------------------------------------------
 * Responsibilities:
 * - Reusable button component
 * - Variants (primary, secondary, danger, ghost)
 * - Sizes (sm, md, lg)
 * - Loading & disabled states
 * - Accessible & mobile-friendly
 * ========================================================== */

import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary | secondary | danger | ghost
  size = "md",         // sm | md | lg
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  ...rest
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`ui-btn ${variant} ${size} ${fullWidth ? "full" : ""} ${className}`}
      aria-busy={loading}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
};

export default Button;
