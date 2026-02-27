/* ==========================================================
 * ManifiX — UI Modal
 * ----------------------------------------------------------
 * Responsibilities:
 * - Global modal system
 * - Mobile & desktop optimized
 * - Keyboard & accessibility support
 * - Smooth animations
 * - Privacy-first (no external libs)
 * ========================================================== */

import React, { useEffect } from "react";
import ReactDOM from "react-dom";

const Modal = ({
  open = false,
  onClose,
  title,
  children,
  footer,
  size = "md", // sm | md | lg | fullscreen
  closeOnOverlay = true,
  className = "",
}) => {
  // ===============================
  // ⌨️ ESC KEY HANDLER
  // ===============================
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className={`ui-modal-overlay ${open ? "show" : ""}`}
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`ui-modal ${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===============================
            HEADER
        =============================== */}
        {title && (
          <header className="ui-modal-header">
            <h3>{title}</h3>
            <button
              className="close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </header>
        )}

        {/* ===============================
            BODY
        =============================== */}
        <section className="ui-modal-body">{children}</section>

        {/* ===============================
            FOOTER
        =============================== */}
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
