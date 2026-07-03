import React from "react";

/**
 * PerspectiveGridOverlay
 * -----------------------
 * Draws a 3D vanishing-point wireframe over the AR camera feed inside
 * GameCanvas.jsx. Purely decorative / non-interactive, so it sits above
 * the <video> layer but below sprites and UI (z-10).
 *
 * Usage:
 *   <div className="relative w-full aspect-[4/3] bg-transparent overflow-hidden rounded-xl border border-amber-500/40">
 *     <video ... className="absolute inset-0 w-full h-full object-cover z-0" />
 *     <PerspectiveGridOverlay />
 *     ...sprites, radar, scoreboard...
 *   </div>
 */
export default function PerspectiveGridOverlay({
  color = "text-yellow-500/80",
  centerBoxSize = { width: 24, height: 30 },
}) {
  const { width, height } = centerBoxSize;
  const cx = 50 - width / 2;
  const cy = 50 - height / 2;

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none z-10 stroke-current ${color}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Vanishing-point lines from each corner toward the center focus box */}
      <line x1="0" y1="0" x2={cx} y2={cy} strokeWidth="0.4" />
      <line x1="100" y1="0" x2={cx + width} y2={cy} strokeWidth="0.4" />
      <line x1="0" y1="100" x2={cx} y2={cy + height} strokeWidth="0.4" />
      <line x1="100" y1="100" x2={cx + width} y2={cy + height} strokeWidth="0.4" />

      {/* Optional secondary horizon lines for extra depth */}
      <line x1="0" y1="50" x2={cx} y2={cy + height / 2} strokeWidth="0.2" strokeOpacity="0.5" />
      <line x1="100" y1="50" x2={cx + width} y2={cy + height / 2} strokeWidth="0.2" strokeOpacity="0.5" />

      {/* Central dashed focus rectangle */}
      <rect
        x={cx}
        y={cy}
        width={width}
        height={height}
        fill="none"
        strokeWidth="0.6"
        strokeDasharray="2,1"
      />
    </svg>
  );
}
