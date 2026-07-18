// ====================================================================
// 🧲 CaptureThrow.jsx - CYBERPUNK VACUUM HARPOON LOCK-ON INTERFACE
// v2: fixes a mismatched style key, an invalid CSS value, missing
// keyframes, page-scroll interference during the swipe gesture, and
// adds a state reset so the reticle actually works on the next target.
// ====================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MATRIX_GREEN = '#39ff88';
const GLITCH_GOLD = '#ffbe1a';
const LASER_PINK = '#ff3b94';
const BG_BLACK = '#030305';

export default function CaptureThrow({ veggieId, currentRound, onCaptureDispatched }) {
  const [vacuumPower, setVacuumPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [lockStatus, setLockStatus] = useState('STANDBY // ALIGN RADAR RETICLE');
  const [ringScale, setRingScale] = useState(1);
  const [isSwiped, setIsSwiped] = useState(false);

  const chargingIntervalRef = useRef(null);
  const touchStartYRef = useRef(0);
  const hudContainerRef = useRef(null);

  // Inject keyframes + fonts once, scoped under a unique id so this
  // component works standalone even if RoomJoin's style node isn't mounted.
  useEffect(() => {
    if (!document.getElementById('ct-fonts-node')) {
      const link = document.createElement('link');
      link.id = 'ct-fonts-node';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;900&family=JetBrains+Mono:wght@500&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('ct-style-node')) {
      const el = document.createElement('style');
      el.id = 'ct-style-node';
      el.textContent = `
        @keyframes laserScan {
          0% { transform: translateY(0); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateY(100vh); opacity: 0.2; }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  // Reset the whole rig whenever a new target comes up, so the ring,
  // charge meter, and status line don't stay frozen from the last catch.
  useEffect(() => {
    clearInterval(chargingIntervalRef.current);
    setVacuumPower(0);
    setIsCharging(false);
    setIsSwiped(false);
    setRingScale(1);
    setLockStatus('STANDBY // ALIGN RADAR RETICLE');
  }, [veggieId, currentRound]);

  // Always clear any live interval on unmount to avoid state updates
  // firing after the component is gone.
  useEffect(() => {
    return () => clearInterval(chargingIntervalRef.current);
  }, []);

  // 🎯 Dynamic Pokémon GO-style closing target ring loop physics
  useEffect(() => {
    if (isSwiped) return;
    const interval = setInterval(() => {
      setRingScale((prev) => (prev <= 0.25 ? 1.0 : prev - 0.015));
    }, 16);
    return () => clearInterval(interval);
  }, [isSwiped]);

  // Lock page scroll while the player is charging/swiping so the vertical
  // swipe gesture doesn't fight the browser's native scroll behavior.
  // Needs a real (non-passive) listener since React's synthetic touch
  // handlers are passive by default and can't reliably preventDefault.
  useEffect(() => {
    const node = hudContainerRef.current;
    if (!node) return;
    const blockScroll = (e) => {
      if (isCharging) e.preventDefault();
    };
    node.addEventListener('touchmove', blockScroll, { passive: false });
    return () => node.removeEventListener('touchmove', blockScroll);
  }, [isCharging]);

  // ⚡ Physical thumb charge triggers
  const handleStartSuctionCharge = (e) => {
    if (isSwiped) return;
    setIsCharging(true);
    setLockStatus('ENERGY CORE INJECTING... HOLD BACKPACK TRIGGER');
    touchStartYRef.current = e.touches ? e.touches[0].clientY : e.clientY;

    clearInterval(chargingIntervalRef.current);
    chargingIntervalRef.current = setInterval(() => {
      setVacuumPower((prev) => {
        if (prev >= 100) {
          setLockStatus('⚠️ MAXIMUM PRESSURE EXCEEDED // RELEASE IMMEDIATELY');
          clearInterval(chargingIntervalRef.current);
          return 100;
        }
        return prev + 2.5;
      });
    }, 25);
  };

  // 🌪️ Tinder-style vertical "Swipe Up to Throw" gesture engine
  const handleTouchMove = (e) => {
    if (!isCharging || isSwiped) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = touchStartYRef.current - currentY;

    // Trigger explosive harpoon release if swipe distance passes 120px boundary threshold
    if (deltaY > 120) {
      handleExecuteHarpoonLaunch();
    }
  };

  const handleExecuteHarpoonLaunch = useCallback(() => {
    clearInterval(chargingIntervalRef.current);
    setIsCharging(false);
    setIsSwiped(true);

    // Evaluate capture accuracy matching your strict 3-round point constraints
    let classification = 'MISS';
    let precisionMultiplier = 0;

    if (ringScale >= 0.35 && ringScale <= 0.55) {
      classification = '🔥 PERFECT LOCK-ON!';
      precisionMultiplier = 2.0;
    } else if (ringScale > 0.55 && ringScale <= 0.8) {
      classification = '⚡ GOOD MATCH!';
      precisionMultiplier = 1.0;
    }

    setLockStatus(`LAUNCH DISPATCHED: ${classification}`);

    // Map point values natively to server.js tournament rules based on current round
    let baseStakes = 100;
    if (currentRound === 2) baseStakes = 300;
    if (currentRound === 3) baseStakes = 600; // Round 3 Overdrive Glitch Core

    const finalCalculatedPoints = Math.round(baseStakes * precisionMultiplier * (vacuumPower / 100));

    // Emit the tactical data schema packet straight to server.js multiplayer endpoints
    setTimeout(() => {
      onCaptureDispatched({
        targetId: veggieId,
        success: classification !== 'MISS' && vacuumPower > 20,
        scoreValue: classification !== 'MISS' ? Math.min(finalCalculatedPoints, 1000) : 0, // 1,000 PTS absolute max ceiling
        accuracyTier: classification
      });
    }, 1200);
  }, [ringScale, vacuumPower, currentRound, veggieId, onCaptureDispatched]);

  const handleReleaseAborted = () => {
    clearInterval(chargingIntervalRef.current);
    if (!isSwiped) {
      setIsCharging(false);
      setVacuumPower(0);
      setLockStatus('PRESSURE LOST // RETICLE HANDSHAKE ABORTED');
    }
  };

  const ringInBand = ringScale <= 0.55 && ringScale >= 0.35;

  return (
    <div
      ref={hudContainerRef}
      style={styles.hudContainer}
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
      onTouchEnd={handleReleaseAborted}
      onMouseUp={handleReleaseAborted}
      onMouseLeave={handleReleaseAborted}
    >
      {/* Laser Scanlines Matrix HUD Borders */}
      <div style={styles.laserScanline} />
      <div style={styles.cyberHudFrame} />

      {/* 🔴 POKÉMON GO TARGETING CATCH RING OVERLAYS */}
      <AnimatePresence>
        {!isSwiped && (
          <motion.div
            key="reticle"
            style={styles.reticleOuterBounds}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.25 }}
          >
            {/* Base target ring */}
            <div style={styles.staticTargetOuterRing} />
            {/* Closing capture circle indicator */}
            <motion.div
              style={{
                ...styles.shrinkingCaptureCircle,
                transform: `scale(${ringScale})`,
                borderColor: ringInBand ? MATRIX_GREEN : GLITCH_GOLD,
                boxShadow: `0 0 20px ${ringInBand ? MATRIX_GREEN : GLITCH_GOLD}`
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Telemetry Status Board Banner */}
      <div style={styles.dashboardDock}>
        <div style={styles.roundTelemetryLabel}>ROUND {currentRound} TARGETING MATRIX</div>

        <div
          style={{
            ...styles.terminalConsoleLog,
            borderColor: lockStatus.includes('🚨') || lockStatus.includes('⚠️') ? LASER_PINK : lockStatus.includes('🔥') ? MATRIX_GREEN : GLITCH_GOLD,
            color: lockStatus.includes('🚨') || lockStatus.includes('⚠️') ? LASER_PINK : lockStatus.includes('🔥') ? MATRIX_GREEN : '#ffffff'
          }}
        >
          <span style={{ color: MATRIX_GREEN }}>{'> '}</span>
          {lockStatus}
        </div>

        {/* Dynamic Heavy Vacuum Power Loading Progress Indicator Bar */}
        <div style={styles.powerTrackContainer}>
          <motion.div
            style={{ ...styles.powerFillVolume, width: `${vacuumPower}%` }}
            animate={isCharging ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <span style={styles.progressTextPercent}>{Math.round(vacuumPower)}% PRESSURE</span>
        </div>

        {/* 🧲 THE UNHINGED GESTURE CONTROL BUTTON */}
        <div
          style={{
            ...styles.tacticalChargePad,
            background: isCharging ? 'rgba(255, 190, 26, 0.15)' : 'rgba(57, 255, 136, 0.05)',
            borderColor: isCharging ? GLITCH_GOLD : MATRIX_GREEN,
            cursor: isSwiped ? 'default' : 'pointer',
            opacity: isSwiped ? 0.5 : 1
          }}
          onTouchStart={handleStartSuctionCharge}
          onMouseDown={handleStartSuctionCharge}
        >
          <motion.div
            style={styles.innerCoreGlowDot}
            animate={isCharging ? { scale: [1, 1.4, 1], backgroundColor: LASER_PINK } : { scale: 1 }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
          <div style={styles.touchPadLabelPrompt}>
            {isSwiped ? 'TARGET RESOLVED' : isCharging ? '⬆️ NOW SWIPE UP TO LAUNCH ⬆️' : 'HOLD TO CHARGE VACUUM ENGINE'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Immersive Premium Custom CSS Variable Layout Sheets
const styles = {
  hudContainer: {
    position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none',
    background: BG_BLACK, touchAction: 'none'
  },
  laserScanline: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
    background: 'linear-gradient(90deg, transparent, #ff3b94, transparent)', opacity: 0.5,
    zIndex: 160, pointerEvents: 'none', animation: 'laserScan 5s linear infinite'
  },
  cyberHudFrame: {
    position: 'absolute', inset: '15px', border: '1px solid rgba(255,202,40,0.15)',
    pointerEvents: 'none', zIndex: 155
  },
  reticleOuterBounds: {
    position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none'
  },
  staticTargetOuterRing: {
    position: 'absolute', width: '130px', height: '130px', border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '50%'
  },
  shrinkingCaptureCircle: {
    position: 'absolute', width: '130px', height: '130px', border: '3px solid', borderRadius: '50%',
    transition: 'border-color 0.1s ease'
  },
  dashboardDock: {
    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '92%',
    maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 170
  },
  roundTelemetryLabel: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: '#8a8a93', fontWeight: 'bold',
    letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase'
  },
  terminalConsoleLog: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', background: '#000', border: '1px solid',
    padding: '12px', borderRadius: '8px', lineHeight: '1.4', minHeight: '44px', boxSizing: 'border-box',
    fontWeight: 'bold'
  },
  powerTrackContainer: {
    position: 'relative', width: '100%', height: '24px', background: '#000', borderRadius: '6px',
    border: '1px solid #2d2d3f', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  powerFillVolume: {
    position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #ff3b94, #ff006e)'
  },
  progressTextPercent: {
    position: 'relative', fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', fontWeight: 900,
    color: '#ffffff', letterSpacing: '1px', zIndex: 5
  },
  tacticalChargePad: {
    width: '100%', padding: '20px', border: '2px dashed', borderRadius: '14px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '10px', boxSizing: 'border-box',
    transition: 'all 0.15s ease'
  },
  innerCoreGlowDot: {
    width: '12px', height: '12px', backgroundColor: MATRIX_GREEN, borderRadius: '50%',
    boxShadow: '0 0 10px currentColor'
  },
  touchPadLabelPrompt: {
    fontFamily: "'Space Grotesk', sans-serif", color: '#ffffff', fontSize: '12px', fontWeight: 900,
    letterSpacing: '0.5px', textTransform: 'uppercase'
  }
};
