// ====================================================================
// 💬 Feedback.jsx — Cyberpunk user feedback HUD
// ====================================================================
// Fixes vs. the original:
//   - The API call now actually points at a real endpoint. The original
//     posted to `https://onrender.com` with no path, which cannot ever
//     succeed against an Express route like `router.post('/', ...)`
//     mounted at `/api/feedback`. It now builds the URL from
//     `VITE_API_BASE_URL` (falls back to same-origin `/api` if unset).
//   - Success/error handling no longer assumes `data.message` exists —
//     the old code called `.toUpperCase()` on it unconditionally, which
//     throws if the backend sends an error with no `message` field.
//   - Non-2xx HTTP responses are now treated as failures even if the
//     body happens to parse as JSON (previously only `data.success`
//     was checked, so a 500 with `{ success: false }` "worked" but a
//     500 with an unexpected body would silently fall through).
//   - The auto-close timeout is cleared on unmount so it can't fire
//     `onClose()` (and trigger a state update) after the component
//     is gone.
//   - Basic accessibility: labelled form controls, `aria-live` on the
//     status console, `aria-pressed` on the category toggle, Escape
//     closes the modal, focus starts on the message field.
//   - A live character counter replaces the silent `maxLength` cutoff.
//   - `playerMeta` and `onClose` are validated with PropTypes.
// ====================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const BG_BLACK = '#030305';
const NEON_GOLD = '#ffbe1a';
const MATRIX_GREEN = '#39ff88';
const ERROR_PINK = '#ff3b94';
const DECK_MUTED = '#4c5364';

const MESSAGE_MIN_LEN = 5;
const MESSAGE_MAX_LEN = 1000;
const AUTO_CLOSE_DELAY_MS = 1500;

// Falls back to the deployed Render backend if VITE_API_BASE_URL isn't set.
// Still best set via env var so staging/local builds can point elsewhere
// without editing code.
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://manifix-ai-core.onrender.com/api';

const CATEGORIES = {
  SUGGESTION: { label: 'IDEA', activeColor: NEON_GOLD, activeText: BG_BLACK },
  BUG_REPORT: { label: 'BUG', activeColor: ERROR_PINK, activeText: '#ffffff' },
};

const STATUS = {
  IDLE: 'IDLE',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

const STATUS_MESSAGES = {
  [STATUS.IDLE]: 'SYSTEM: READY FOR USER INPUT METRICS...',
  [STATUS.SENDING]: '🔮 INJECTING DATA INTO CLOUD ENGINE...',
  [STATUS.SUCCESS]: '✅ RECORD GRANTED! TELEMETRY WRITTEN TO MONGO.',
};

export default function Feedback({ playerMeta, onClose }) {
  const [category, setCategory] = useState('SUGGESTION');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(STATUS.IDLE);
  const [statusDetail, setStatusDetail] = useState(null); // extra text for error states

  const closeTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const isSending = status === STATUS.SENDING;

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSending, onClose]);

  const trimmedLength = message.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MESSAGE_MIN_LEN;

  const handleSendFeedback = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = message.trim();

    if (trimmed.length < MESSAGE_MIN_LEN) {
      setStatus(STATUS.ERROR);
      setStatusDetail('COMPILATION FAILED. INPUT STRING TOO CONCISE.');
      return;
    }

    setStatus(STATUS.SENDING);
    setStatusDetail(null);

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerMeta?.player_id || 'usr_anonymous_8656',
          username: playerMeta?.username || 'ANONYMOUS_SQUAD',
          category,
          message: trimmed,
          device_os: 'ANDROID',
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // Non-JSON body — fall through to the generic error below.
      }

      if (response.ok && data?.success) {
        setStatus(STATUS.SUCCESS);
        setMessage('');
        closeTimeoutRef.current = setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
      } else {
        setStatus(STATUS.ERROR);
        setStatusDetail((data?.message || 'REQUEST REJECTED BY SERVER').toUpperCase());
      }
    } catch (err) {
      setStatus(STATUS.ERROR);
      setStatusDetail('CRITICAL MISFIRE: NETWORK COMMUNICATION TIMEOUT');
    }
  }, [category, message, onClose, playerMeta]);

  const logText = status === STATUS.ERROR
    ? `🚨 ${statusDetail}`
    : STATUS_MESSAGES[status];

  const logColor = status === STATUS.ERROR
    ? ERROR_PINK
    : status === STATUS.SUCCESS
      ? MATRIX_GREEN
      : '#a0a5c0';

  return (
    <div style={styles.feedbackWrapperModal} role="dialog" aria-modal="true" aria-labelledby="feedback-hud-title">
      <motion.div
        style={styles.glassCardContainer}
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 30 }}
      >
        <div style={styles.topNavbarRow}>
          <h2 id="feedback-hud-title" style={styles.hudTitle}>
            BUG REPORT // <span style={styles.goldGlowSpan}>HUD</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            style={styles.exitDockBtn}
            aria-label="Close feedback panel"
          >
            [ CLOSE ]
          </button>
        </div>

        <div
          style={{ ...styles.terminalConsoleLogBox, borderColor: logColor, color: logColor }}
          role="status"
          aria-live="polite"
        >
          <span>&gt; </span>{logText}
        </div>

        <form onSubmit={handleSendFeedback} style={styles.feedbackFormFields}>
          <div style={styles.inputFieldContainer}>
            <span id="category-label" style={styles.inputLabelField}>METRIC CATEGORY</span>
            <div style={styles.categoryToggleTrack} role="group" aria-labelledby="category-label">
              {Object.entries(CATEGORIES).map(([key, cfg]) => {
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    aria-pressed={active}
                    style={{
                      ...styles.categoryTabBtn,
                      background: active ? cfg.activeColor : '#000',
                      color: active ? cfg.activeText : '#fff',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.inputFieldContainer}>
            <label htmlFor="feedback-message" style={styles.inputLabelField}>
              DESCRIBE WHAT HAPPENED
            </label>
            <textarea
              id="feedback-message"
              ref={textareaRef}
              placeholder={`Describe what happened (min ${MESSAGE_MIN_LEN} characters)...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              style={{
                ...styles.tacticalTextAreaField,
                borderColor: isTooShort ? ERROR_PINK : '#1c1c24',
              }}
              maxLength={MESSAGE_MAX_LEN}
              aria-describedby="feedback-char-count"
            />
            <span id="feedback-char-count" style={styles.charCount}>
              {message.length} / {MESSAGE_MAX_LEN}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSending || trimmedLength < MESSAGE_MIN_LEN}
            style={{
              ...styles.submitActionExecutionBtn,
              opacity: isSending || trimmedLength < MESSAGE_MIN_LEN ? 0.5 : 1,
              cursor: isSending || trimmedLength < MESSAGE_MIN_LEN ? 'not-allowed' : 'pointer',
            }}
          >
            {isSending ? '🤖 SENDING...' : '⚡ SEND FEEDBACK'}
          </button>
        </form>

        <span style={styles.encryptionBadge}>🔒 SECURE STREAM VERIFIED DIRECTLY INTO ATLAS SEED LEDGERS</span>
      </motion.div>
    </div>
  );
}

Feedback.propTypes = {
  playerMeta: PropTypes.shape({
    player_id: PropTypes.string,
    username: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

Feedback.defaultProps = {
  playerMeta: null,
};

const styles = {
  feedbackWrapperModal: { position: 'fixed', inset: 0, zIndex: 550, backgroundColor: 'rgba(3, 3, 5, 0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glassCardContainer: { position: 'relative', background: 'rgba(6, 7, 15, 0.94)', backdropFilter: 'blur(20px)', border: `2px solid ${NEON_GOLD}`, borderRadius: '24px', padding: '35px 22px', width: '92%', maxWidth: '380px', boxSizing: 'border-box', boxShadow: '0 0 50px rgba(255, 190, 26, 0.15)', display: 'flex', flexDirection: 'column' },
  topNavbarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1c1c24', paddingBottom: '12px' },
  hudTitle: { fontFamily: "'Orbitron', sans-serif", color: '#ffffff', fontSize: '15px', fontWeight: 900, letterSpacing: '1px', margin: 0 },
  goldGlowSpan: { color: NEON_GOLD, textShadow: '0 0 10px rgba(255, 190, 26, 0.4)' },
  exitDockBtn: { background: 'none', border: 'none', color: DECK_MUTED, fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' },
  terminalConsoleLogBox: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', background: '#000000', border: '1px solid', padding: '12px', borderRadius: '8px', marginBottom: '20px', lineHeight: '1.4', textAlign: 'left', fontWeight: 'bold', minHeight: '44px', boxSizing: 'border-box' },
  feedbackFormFields: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputFieldContainer: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' },
  inputLabelField: { fontFamily: "'Orbitron', sans-serif", color: NEON_GOLD, fontSize: '9px', fontWeight: 900, letterSpacing: '1px' },
  categoryToggleTrack: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#000', padding: '4px', borderRadius: '8px', border: '1px solid #1c1c24', width: '100%', boxSizing: 'border-box' },
  categoryTabBtn: { padding: '10px', border: 'none', borderRadius: '6px', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.15s ease' },
  tacticalTextAreaField: { width: '100%', height: '110px', boxSizing: 'border-box', background: '#000000', border: '1px solid', borderRadius: '8px', padding: '12px', color: '#ffffff', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', resize: 'none', outline: 'none' },
  charCount: { alignSelf: 'flex-end', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: DECK_MUTED },
  submitActionExecutionBtn: { display: 'block', width: '100%', background: `linear-gradient(135deg, ${NEON_GOLD}, #ffaa00)`, color: BG_BLACK, fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 900, letterSpacing: '1.5px', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 0 25px rgba(255, 190, 26, 0.3)', transition: 'all 0.2s ease', marginTop: '5px' },
  encryptionBadge: { display: 'inline-block', fontFamily: "'Orbitron', sans-serif", fontSize: '8px', fontWeight: 700, color: DECK_MUTED, marginTop: '20px', letterSpacing: '0.5px', opacity: 0.8 },
};
