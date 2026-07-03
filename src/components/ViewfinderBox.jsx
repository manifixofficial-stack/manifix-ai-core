import React from "react";

/**
 * ViewfinderBox
 * -------------
 * Centered scan-target frame overlaid on the AR canvas. Use this as the
 * hit-region reference for CaptureThrow.jsx: only allow a capture attempt
 * to register when a veggie's projected screen coordinates fall inside
 * this box's bounds.
 *
 * `active` toggles a highlighted/pulsing state (e.g. when a veggie is
 * currently inside the frame and capturable).
 *
 * Usage:
 *   <ViewfinderBox active={targetInFrame} />
 *
 * To compute `active` in GameCanvas.jsx, compare each veggie's projected
 * x/y percentage against the box's on-screen bounds (default 24%/24%
 * width/height, centered) and set true if any veggie falls inside.
 */
export default function ViewfinderBox({
  active = false,
  size = { width: 96, height: 96 }, // px
}) {
  const { width, height } = size;

  return (
    <div
      className="absolute top-1/2 left-1/2 z-20 pointer-events-none"
      style={{
        width,
        height,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={`relative w-full h-full border-2 rounded-sm transition-colors duration-150 ${
          active
            ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
            : "border-yellow-400/70"
        }`}
      >
        {/* Corner brackets */}
        <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-current" />
        <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-current" />
        <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-current" />
        <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-current" />

        {/* Center crosshair dot */}
        <span
          className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
            active ? "bg-emerald-400 animate-pulse" : "bg-yellow-400/70"
          }`}
        />
      </div>

      {active && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-widest font-bold text-emerald-300">
          TARGET LOCKED
        </div>
      )}
    </div>
  );
}
