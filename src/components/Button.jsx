// src/components/Button.jsx
import React from "react";

export default function Button({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition ${className}`}
    >
      {children}
    </button>
  );
}
