// src/components/Modal.jsx
import React, { useEffect } from "react";

export default function Modal({ children, onClose }) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 animate-modal-in">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white font-bold text-xl transition-transform transform hover:scale-110"
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  );
}
