// src/components/Button.jsx
import React from "react";

export default function Button({
  children,
  onClick,
  className = "",
  type = "button",
  icon = null, // optional icon
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        relative
        px-5 py-2.5
        flex items-center justify-center
        bg-gradient-to-r from-indigo-500 to-purple-600
        text-white font-semibold
        rounded-xl shadow-lg
        transition-all duration-300
        hover:scale-105 hover:shadow-2xl
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
        dark:from-indigo-600 dark:to-purple-700
        dark:focus:ring-indigo-300
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}

      {/* Optional glowing pulse */}
      <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-20 bg-white/20 animate-pulse"></span>
    </button>
  );
}
