// src/components/Loader.jsx
import React from "react";

export default function Loader({ size = 50, color = "#6366F1", className = "" }) {
  return (
    <div
      className={`flex justify-center items-center relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="animate-spin-slow"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50 50"
      >
        <defs>
          <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="url(#loaderGradient)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          className="opacity-30"
        />
        <path
          fill="url(#loaderGradient)"
          d="M25 5a20 20 0 1 1-14.14 34.14"
          className="opacity-75"
        />
      </svg>
    </div>
  );
}
