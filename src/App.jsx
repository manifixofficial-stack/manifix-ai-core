// ====================================================================
// 🛸 App.jsx — Global real-time architecture interface switchboard
// ====================================================================
// This file merges two App.jsx versions found in the project:
//
//   1. A GameContext/hook-driven "switchboard" version (useGameScope,
//      useNetworkShield, useDailyStreak) with screens for auth, forgot
//      password, lobby, radar map, AR playspace, and prize camera.
//   2. An earlier, simpler version that managed room/match state with
//      local useState + raw socket events (roomStatus, scoreMetricsUpdated,
//      advanceRound, submitCaptureScore).
//
// Those two use INCOMPATIBLE socket protocols — version 2's events don't
// exist on the current server.js (which speaks join-room / round-start /
// capture-attempt / round-win, not roomStatus / advanceRound). So this
// merge treats version 1's architecture as authoritative and does NOT
// bring over its socket wiring. What IS carried forward from version 2:
//
//   - The pattern of a dedicated overlay/drawer layer (its "collection
//     drawer" + "victory banner" became the generalized `activeOverlay`
//     system below).
//   - Cleanup discipline for timers/intervals on unmount (applied to the
//     network-log effect and available for any future local timers).
//   - The 'space-between' CSS bug (version 2 had already fixed a
//     'spaceBetween' typo — carried forward correctly here too).
//
// BUGS FIXED vs. the GameContext version specifically:
//   - 8 components were imported but never rendered anywhere: CaptureThrow,
//     Scoreboard, Leaderboard, CollectionBook, BillingGate, Feedback,
//     PrivacyModal, TermsModal. That means there was no way to actually
//     open the ticket store, leaderboard, collection book, or feedback
//     form, and no in-match capture UI or scoreboard. All are now wired
//     up via an `activeOverlay` panel system plus the AR playspace.
//   - The console diagnostic log ran on every render in every environment
//     (including production) — now gated to non-production builds.
//   - The footer badge hardcoded stale text ("STABLE CCU ON PORT 5000")
//     that doesn't reflect the deployed Render origin — replaced with
//     live streak info and working Privacy/Terms links instead.
//
// ⚠️ ASSUMPTIONS (I don't have source for these files, so prop names are
// my best guess based on how each component is already invoked elsewhere
// in the project — verify against the real component signatures):
//   - Leaderboard, CollectionBook, BillingGate, Feedback, PrivacyModal,
//     TermsModal all accept an `onClose` prop (matches Feedback.jsx,
//     which we already have).
//   - BillingGate additionally accepts `playerMeta` + `wallet`.
//   - Scoreboard accepts `players` + `currentUsername`.
//   - CaptureThrow accepts `veggieId`, `currentRound`, and
//     `onCaptureDispatched(captureResult)`, matching its usage in the
//     older App.jsx version. Its result shape is assumed to include
//     `success`, `matchFinished`, and `totalAccumulatedPoints` — adjust
//     if the real component reports differently.
// ====================================================================
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';

import { useGameScope } from './lib/GameContext';
import { useNetworkShield } from './hooks/useNetworkShield';
import { useDailyStreak } from './hooks/useDailyStreak';

import GoogleLogin from './components/GoogleLogin';
import ForgotPassword from './components/ForgotPassword';
import RoomJoin from './components/RoomJoin';
import MapView from './components/MapView';
import GameCanvas from './components/GameCanvas';
import CaptureThrow from './components/CaptureThrow';
import Scoreboard from './components/Scoreboard';
import PrizeCamera from './components/PrizeCamera';
import Leaderboard from './components/Leaderboard';
import CollectionBook from './components/CollectionBook';
import BillingGate from './components/BillingGate';
import Feedback from './components/Feedback';
import PrivacyModal from './components/PrivacyModal';
import TermsModal from './components/TermsModal';

// Named screen states, kept string-identical to what GameContext already
// stores so no changes are needed on the context/hook side.
export const GAME_STATE = {
  AUTH: 'AUTH_SCREEN',
  FORGOT: 'FORGOT_SCREEN',
  LOBBY: 'LOBBY_SCREEN',
  RADAR: 'RADAR_SCREEN',
  AR_PLAYSPACE: 'AR_PLAYSPACE',
  PRIZE_CAMERA: 'PRIZE_CAMERA',
};

// Overlay panels are independent of the main screen state machine so a
// player can check the leaderboard or send feedback without losing their
// place in onboarding/lobby/match flow.
const OVERLAY = {
  LEADERBOARD: 'LEADERBOARD',
  COLLECTION: 'COLLECTION',
  BILLING: 'BILLING',
  FEEDBACK: 'FEEDBACK',
  PRIVACY: 'PRIVACY',
  TERMS: 'TERMS',
};

const fadeTransition = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

export default function App({ isNative }) {
  const {
    player,
    wallet,
    room,
    setRoom,
    gameState,
    setGameState,
    finalScore,
    setFinalScore,
    activeTarget,
    loginUserPayload,
  } = useGameScope();

  // 📡 Real-world 5G/LTE connection shield — prevents match disconnects
  // from silently crashing the client.
  const { isOnline, networkLog } = useNetworkShield(room?.roomCode, player?.username);

  // 📅 Pokémon GO-style 24-hour retention streak.
  const { streakCount, bonusPoints } = useDailyStreak();

  const [activeOverlay, setActiveOverlay] = useState(null);
  const closeOverlay = useCallback(() => setActiveOverlay(null), []);

  // Dev-only diagnostic logging — previously ran unconditionally, which
  // means it also fired (and leaked internals) in production builds.
  useEffect(() => {
    if (networkLog && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`%c[NETWORK DIAGNOSTIC]: ${networkLog}`, 'color: #ffbe1a; font-weight: bold;');
    }
  }, [networkLog]);

  const handleLeaveLobby = useCallback(() => {
    setRoom(null);
    setGameState(GAME_STATE.LOBBY);
  }, [setRoom, setGameState]);

  const handleCaptureDispatched = useCallback((captureResult) => {
    if (!captureResult?.success) return;
    if (captureResult.matchFinished) {
      setFinalScore(captureResult.totalAccumulatedPoints ?? 0);
      setGameState(GAME_STATE.PRIZE_CAMERA);
    }
  }, [setFinalScore, setGameState]);

  const showOverlayDock = Boolean(player) && gameState !== GAME_STATE.AUTH && gameState !== GAME_STATE.FORGOT;

  return (
    <div className="app-container game-lock-zone" style={styles.masterAppViewportChassis}>
      {/* ⚠️ Offline signal dropout banner */}
      {!isOnline && (
        <div
          className="hack-alert-banner"
          style={styles.offlineDropBanner}
          role="alert"
          aria-live="assertive"
        >
          📶 STATUS CRITICAL: SIGNAL DROPOUT DETECTED // PAUSING VEGGIE MATCH SYNC...
        </div>
      )}

      {/* 🔮 Primary screen routing matrix */}
      <AnimatePresence mode="wait">
        {gameState === GAME_STATE.AUTH && (
          <motion.div key="auth" {...fadeTransition} style={styles.fullscreenView}>
            <GoogleLogin
              onLoginSuccess={(authPacket) => loginUserPayload(authPacket)}
              onNavigateToForgot={() => setGameState(GAME_STATE.FORGOT)}
            />
          </motion.div>
        )}

        {gameState === GAME_STATE.FORGOT && (
          <motion.div key="forgot" {...fadeTransition} style={styles.fullscreenView}>
            <ForgotPassword onReturnToLogin={() => setGameState(GAME_STATE.AUTH)} />
          </motion.div>
        )}

        {gameState === GAME_STATE.LOBBY && (
          <motion.div key="lobby" {...fadeTransition} style={styles.fullscreenView}>
            <RoomJoin
              playerMeta={player}
              walletMeta={wallet}
              onRoomJoined={(syncedRoom) => {
                setRoom(syncedRoom);
                setGameState(GAME_STATE.RADAR);
              }}
            />
          </motion.div>
        )}

        {gameState === GAME_STATE.RADAR && (
          <motion.div key="radar" {...fadeTransition} style={styles.fullscreenView}>
            <MapView
              playerMeta={player}
              roomData={room}
              streakBonus={bonusPoints}
              onBeginMatch={() => setGameState(GAME_STATE.AR_PLAYSPACE)}
              onLeaveLobby={handleLeaveLobby}
            />
            {room?.players && (
              <Scoreboard players={room.players} currentUsername={player?.username} />
            )}
          </motion.div>
        )}

        {gameState === GAME_STATE.AR_PLAYSPACE && (
          <motion.div key="arena" {...fadeTransition} style={styles.fullscreenView}>
            {/* Transparent WebGL 3D ground-locked model viewport */}
            <GameCanvas
              playerMeta={player}
              roomData={room}
              activeTarget={activeTarget}
              onMatchFinished={(totalAccumulatedPoints) => {
                setFinalScore(totalAccumulatedPoints);
                setGameState(GAME_STATE.PRIZE_CAMERA);
              }}
            />
            {/* Tinder-style vertical swipe capture HUD layer */}
            <CaptureThrow
              veggieId={activeTarget}
              currentRound={room?.currentRound}
              onCaptureDispatched={handleCaptureDispatched}
            />
          </motion.div>
        )}

        {gameState === GAME_STATE.PRIZE_CAMERA && (
          <motion.div key="prize" {...fadeTransition} style={styles.fullscreenView}>
            <PrizeCamera
              playerMeta={player}
              finalScore={finalScore}
              roomCode={room?.roomCode}
              streakDay={streakCount}
              onReturnHome={handleLeaveLobby}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧭 Overlay trigger dock — leaderboard, collection, store, feedback */}
      {showOverlayDock && (
        <div style={styles.overlayDock} role="toolbar" aria-label="Quick access panels">
          <button
            type="button"
            onClick={() => setActiveOverlay(OVERLAY.LEADERBOARD)}
            style={styles.overlayDockBtn}
            aria-label="Open leaderboard"
          >
            🏆
          </button>
          <button
            type="button"
            onClick={() => setActiveOverlay(OVERLAY.COLLECTION)}
            style={styles.overlayDockBtn}
            aria-label="Open lifetime collection ledger"
          >
            📖
          </button>
          <button
            type="button"
            onClick={() => setActiveOverlay(OVERLAY.BILLING)}
            style={styles.overlayDockBtn}
            aria-label="Open ticket store"
          >
            🎟️
          </button>
          <button
            type="button"
            onClick={() => setActiveOverlay(OVERLAY.FEEDBACK)}
            style={styles.overlayDockBtn}
            aria-label="Send feedback"
          >
            💬
          </button>
        </div>
      )}

      {/* 🗂️ Overlay panel layer */}
      <AnimatePresence>
        {activeOverlay === OVERLAY.LEADERBOARD && <Leaderboard onClose={closeOverlay} />}
        {activeOverlay === OVERLAY.COLLECTION && <CollectionBook onClose={closeOverlay} />}
        {activeOverlay === OVERLAY.BILLING && (
          <BillingGate playerMeta={player} wallet={wallet} onClose={closeOverlay} />
        )}
        {activeOverlay === OVERLAY.FEEDBACK && <Feedback playerMeta={player} onClose={closeOverlay} />}
        {activeOverlay === OVERLAY.PRIVACY && <PrivacyModal onClose={closeOverlay} />}
        {activeOverlay === OVERLAY.TERMS && <TermsModal onClose={closeOverlay} />}
      </AnimatePresence>

      {/* Footer: streak status + legal links (replaces the old hardcoded
          "STABLE CCU ON PORT 5000" placeholder text) */}
      {player && (
        <div style={styles.ambientTelemetryFooterBadge}>
          <button type="button" onClick={() => setActiveOverlay(OVERLAY.PRIVACY)} style={styles.footerLinkBtn}>
            PRIVACY
          </button>
          <span aria-hidden="true"> · </span>
          <button type="button" onClick={() => setActiveOverlay(OVERLAY.TERMS)} style={styles.footerLinkBtn}>
            TERMS
          </button>
          <span aria-hidden="true"> · </span>
          <span>STREAK: {streakCount}D (+{bonusPoints} PTS)</span>
        </div>
      )}
    </div>
  );
}

App.propTypes = {
  isNative: PropTypes.bool,
};

App.defaultProps = {
  isNative: false,
};

// Ultra-Premium Core Chassis Layout Configurations Mapped for Native Android Display Metrics
const styles = {
  masterAppViewportChassis: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    backgroundColor: '#030305',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenView: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    inset: 0,
  },
  offlineDropBanner: {
    position: 'absolute',
    top: 'calc(20px + env(safe-area-inset-top))',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '340px',
    backgroundColor: 'rgba(255, 59, 148, 0.95)',
    border: '2px solid #ff3b94',
    borderRadius: '12px',
    boxShadow: '0 0 30px rgba(255, 59, 148, 0.4)',
    color: '#ffffff',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '14px',
    zIndex: 9999,
    boxSizing: 'border-box',
    letterSpacing: '0.5px',
  },
  overlayDock: {
    position: 'absolute',
    top: 'calc(16px + env(safe-area-inset-top))',
    right: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 200,
  },
  overlayDockBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid rgba(255,190,26,0.35)',
    background: 'rgba(6,7,15,0.85)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  ambientTelemetryFooterBadge: {
    position: 'absolute',
    bottom: 'calc(12px + env(safe-area-inset-bottom))',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '8px',
    color: '#4c5364',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    opacity: 0.8,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  footerLinkBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    letterSpacing: 'inherit',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
};
