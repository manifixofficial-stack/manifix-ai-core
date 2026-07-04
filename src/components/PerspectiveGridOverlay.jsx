import React, { useEffect, useRef } from 'react';

/**
 * PerspectiveGridOverlay
 * -----------------------
 * 3D vanishing-point wireframe drawn over the AR camera feed on an HTML5
 * <canvas> (swapped from the old static SVG so the grid can actually
 * animate/warp/react to input each frame). Pure overlay — sits above the
 * <video>/simBackground layer and below sprites/UI, no pointer events.
 *
 * Mount directly inside GameCanvas's root wrap div:
 *   <PerspectiveGridOverlay velocity={joystickVelocity} isHacked={isHacked}
 *     batteryPercent={battery} sprintDurationMs={sprintMs} impactSignal={impactCount} />
 *
 * All the "high-intensity" props are optional and default to an inert
 * state, so dropping this in with zero props still renders a calm static
 * grid — nothing here requires the rest of the integration to exist yet.
 */

// -----------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------
const HORIZON_RATIO = 0.45; // vanishing point fixed at 45% viewport depth
const H_LINE_COUNT = 12; // horizontal "rungs" receding to the horizon
const V_LINE_COUNT = 9; // longitudinal lines converging on the horizon point

// -----------------------------------------------------------------------
// Velocity scroll
// -----------------------------------------------------------------------
const SCROLL_SPEED_PX_PER_SEC = 220; // scale factor for velocity -> scroll px/sec

// -----------------------------------------------------------------------
// Hacked overdrive
// -----------------------------------------------------------------------
const HACKED_COLOR = '255, 0, 40';
const BINARY_COLUMN_COUNT = 22;
const BINARY_FALL_PX_PER_SEC = 260;

// -----------------------------------------------------------------------
// Vertigo warp / tunnel
// -----------------------------------------------------------------------
const LOW_BATTERY_WARP_PCT = 20; // battery below this alone triggers ripple warp
const SPRINT_WARP_MS = 8000; // sprinting this long alone triggers ripple warp
const SPRINT_TUNNEL_MS = 16000; // sprinting this long escalates into full vortex tunnel
const WARP_AMPLITUDE_PX = 6;
const WARP_FREQ = 8; // matches the spec's `ratio * 8` term
const TUNNEL_ORBIT_RADIUS_PX = 14;
const TUNNEL_ROTATION_SPEED = 1.6; // radians/sec

// -----------------------------------------------------------------------
// Low-voltage scan noise
// -----------------------------------------------------------------------
const LOW_BATTERY_NOISE_PCT = 20;
const NOISE_BAR_COUNT = 5;
const NOISE_REFRESH_MS = 90;

// -----------------------------------------------------------------------
// Impact fracture / shockwave
// -----------------------------------------------------------------------
const FRACTURE_DURATION_MS = 500;
const SHOCKWAVE_DURATION_MS = 650;
const FRACTURE_JAG_PX = 10;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Draws a horizontal "rung" as a sequence of small segments so the sine
// warp (and fracture jag) can be applied per-segment instead of as one
// straight ctx.lineTo call.
function drawHorizontalRung(ctx, xStart, xEnd, y, segments, warpT, fractureT) {
  ctx.beginPath();
  for (let i = 0; i <= segments; i += 1) {
    const ratio = i / segments;
    const x = lerp(xStart, xEnd, ratio);
    let sy = y;
    if (warpT > 0) {
      sy += Math.sin(ratio * WARP_FREQ + drawHorizontalRung._frame * 0.05) * WARP_AMPLITUDE_PX * warpT;
    }
    if (fractureT > 0) {
      sy += (Math.random() - 0.5) * FRACTURE_JAG_PX * fractureT;
    }
    if (i === 0) ctx.moveTo(x, sy);
    else ctx.lineTo(x, sy);
  }
  ctx.stroke();
}

// Draws a longitudinal line from a bottom-edge point up to the (possibly
// orbiting, for the tunnel effect) vanishing point. When tunnelT > 0 the
// line is bent through a quadratic curve toward a rotating control point
// instead of running straight, which is what sells the funnel-vortex
// pull described in the spec.
function drawConvergingLine(ctx, x0, y0, vpX, vpY, segments, warpT, fractureT, tunnelT, frame, phaseOffset) {
  ctx.beginPath();
  for (let i = 0; i <= segments; i += 1) {
    const ratio = i / segments;
    let x = lerp(x0, vpX, ratio);
    let y = lerp(y0, vpY, ratio);

    if (tunnelT > 0) {
      // Pull each point toward a point orbiting the vanishing point,
      // strength increasing the closer we get to the horizon so lines
      // visibly funnel/spiral in rather than just converge.
      const orbitAngle = frame * 0.001 * TUNNEL_ROTATION_SPEED + phaseOffset;
      const pull = ratio * ratio * tunnelT;
      const orbitX = vpX + Math.cos(orbitAngle) * TUNNEL_ORBIT_RADIUS_PX;
      const orbitY = vpY + Math.sin(orbitAngle) * TUNNEL_ORBIT_RADIUS_PX;
      x = lerp(x, orbitX, pull);
      y = lerp(y, orbitY, pull);
    }
    if (warpT > 0) {
      x += Math.sin(ratio * WARP_FREQ + frame * 0.05 + phaseOffset) * WARP_AMPLITUDE_PX * warpT * 0.6;
    }
    if (fractureT > 0) {
      x += (Math.random() - 0.5) * FRACTURE_JAG_PX * fractureT;
      y += (Math.random() - 0.5) * FRACTURE_JAG_PX * fractureT;
    }

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export default function PerspectiveGridOverlay({
  color = 'rgba(250, 204, 21, 0.8)',
  velocity = { x: 0, y: 0 }, // normalized roughly -1..1, from the joystick/GPS delta
  isHacked = false,
  batteryPercent = 100,
  sprintDurationMs = 0,
  impactSignal = 0, // bump this number every time an obstacle/stampede impact fires
  screenW,
  screenH,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const frameRef = useRef(0);
  const scrollYRef = useRef(0);
  const scrollXRef = useRef(0);
  const lastTsRef = useRef(null);
  const impactStartRef = useRef(null);
  const lastImpactSignalRef = useRef(impactSignal);
  const noiseBarsRef = useRef([]);
  const lastNoiseRefreshRef = useRef(0);
  const binaryColumnsRef = useRef(
    Array.from({ length: BINARY_COLUMN_COUNT }, () => ({
      xRatio: Math.random(),
      y: Math.random() * -400,
      speedMul: 0.6 + Math.random() * 0.8,
      chars: Array.from({ length: 14 }, () => (Math.random() > 0.5 ? '1' : '0')),
    }))
  );

  // Latest-props ref so the render loop (started once on mount) always
  // sees fresh values without needing to restart on every prop change.
  const propsRef = useRef();
  propsRef.current = { color, velocity, isHacked, batteryPercent, sprintDurationMs, impactSignal };

  useEffect(() => {
    if (impactSignal !== lastImpactSignalRef.current) {
      lastImpactSignalRef.current = impactSignal;
      impactStartRef.current = performance.now();
    }
  }, [impactSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const w = screenW || window.innerWidth;
      const h = screenH || window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (ts) => {
      const {
        color: liveColor,
        velocity: liveVelocity,
        isHacked: liveHacked,
        batteryPercent: liveBattery,
        sprintDurationMs: liveSprintMs,
      } = propsRef.current;

      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = ts;
      frameRef.current += 1;
      drawHorizontalRung._frame = frameRef.current;

      const w = canvas.width;
      const h = canvas.height;
      const horizonY = h * HORIZON_RATIO;
      const vpX = w / 2;

      // Velocity-driven scroll: pushing "forward" on the stick visually
      // rushes the grid toward the viewer, so the accumulated baseline
      // offset moves opposite to the raw input vector.
      scrollYRef.current += -(liveVelocity.y || 0) * SCROLL_SPEED_PX_PER_SEC * dt;
      scrollXRef.current += -(liveVelocity.x || 0) * SCROLL_SPEED_PX_PER_SEC * dt;

      // Derived intensities, each 0..1
      const lowBattery = liveBattery <= LOW_BATTERY_WARP_PCT;
      const longSprint = liveSprintMs >= SPRINT_WARP_MS;
      const warpT = lowBattery || longSprint ? 1 : 0;
      const tunnelT = Math.max(0, Math.min(1, (liveSprintMs - SPRINT_TUNNEL_MS) / 6000));
      const noiseActive = liveBattery < LOW_BATTERY_NOISE_PCT;

      const impactStart = impactStartRef.current;
      const impactElapsed = impactStart != null ? ts - impactStart : Infinity;
      const fractureT = impactElapsed < FRACTURE_DURATION_MS ? 1 - impactElapsed / FRACTURE_DURATION_MS : 0;
      const shockwaveT = impactElapsed < SHOCKWAVE_DURATION_MS ? impactElapsed / SHOCKWAVE_DURATION_MS : null;

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      // Flicker the whole grid's alpha down under low voltage to sell a
      // failing display, before anything else is drawn.
      ctx.globalAlpha = noiseActive ? 0.5 : 1;

      const activeColor = liveHacked
        ? `rgba(${HACKED_COLOR}, ${0.55 + Math.sin(frameRef.current * 0.3) * 0.35})`
        : liveColor;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1.4;

      // Horizontal rungs, receding from the bottom edge to the horizon,
      // scrolling based on velocity and wrapping seamlessly.
      const rungSpacing = h / H_LINE_COUNT;
      const wrappedScrollY = ((scrollYRef.current % rungSpacing) + rungSpacing) % rungSpacing;
      for (let i = -1; i <= H_LINE_COUNT; i += 1) {
        const rawY = h - i * rungSpacing - wrappedScrollY;
        if (rawY < horizonY || rawY > h) continue;
        // Perspective compression: rungs bunch up as they approach the horizon.
        const depthT = 1 - (rawY - horizonY) / (h - horizonY);
        const y = lerp(h, horizonY, depthT * depthT);
        const spanHalf = lerp(w * 0.55, 4, depthT * depthT);
        drawHorizontalRung(ctx, vpX - spanHalf, vpX + spanHalf, y, 10, warpT, fractureT);
      }

      // Longitudinal converging lines from the bottom edge up to the
      // (possibly orbiting) vanishing point.
      for (let i = 0; i < V_LINE_COUNT; i += 1) {
        const t = i / (V_LINE_COUNT - 1);
        const x0 = lerp(0, w, t) + scrollXRef.current * 0.15;
        drawConvergingLine(ctx, x0, h, vpX, horizonY, 16, warpT, fractureT, tunnelT, frameRef.current, i * 0.7);
      }

      // Hacked overdrive: falling binary rain across the grid plane.
      if (liveHacked) {
        ctx.font = '10px monospace';
        ctx.fillStyle = `rgba(${HACKED_COLOR}, 0.8)`;
        for (const col of binaryColumnsRef.current) {
          col.y += BINARY_FALL_PX_PER_SEC * col.speedMul * dt;
          if (col.y > h + 140) {
            col.y = -140;
            col.xRatio = Math.random();
          }
          const x = col.xRatio * w;
          col.chars.forEach((ch, ci) => {
            const cy = col.y + ci * 12;
            if (cy < 0 || cy > h) return;
            ctx.fillText(Math.random() > 0.94 ? (ch === '1' ? '0' : '1') : ch, x, cy);
          });
        }
      }

      // Low-voltage scan noise: thin flickering horizontal static bars.
      if (noiseActive) {
        if (ts - lastNoiseRefreshRef.current > NOISE_REFRESH_MS) {
          lastNoiseRefreshRef.current = ts;
          noiseBarsRef.current = Array.from({ length: NOISE_BAR_COUNT }, () => ({
            y: Math.random() * h,
            height: 1 + Math.random() * 3,
            alpha: 0.15 + Math.random() * 0.35,
          }));
        }
        for (const bar of noiseBarsRef.current) {
          ctx.fillStyle = `rgba(255,255,255,${bar.alpha})`;
          ctx.fillRect(0, bar.y, w, bar.height);
        }
      }

      // Impact shockwave ring, expanding out from the horizon/vanishing point.
      if (shockwaveT != null) {
        const maxRadius = Math.hypot(w, h) * 0.6;
        const radius = maxRadius * shockwaveT;
        ctx.save();
        ctx.globalAlpha = (1 - shockwaveT) * 0.9;
        ctx.strokeStyle = liveHacked ? `rgba(${HACKED_COLOR}, 1)` : activeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(vpX, horizonY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
    // Intentionally only re-run this setup if the canvas element itself
    // or explicit screen dimensions change — everything else flows
    // through propsRef so the loop doesn't restart on every prop tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenW, screenH]);

  return <canvas ref={canvasRef} style={styles.canvas} aria-hidden="true" />;
}

const styles = {
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  },
};
