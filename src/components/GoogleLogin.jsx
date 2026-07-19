// ====================================================================
// GoogleLogin.jsx — Veggie Go sign-in (MongoDB backend via /api/auth/google)
// ====================================================================
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BG = '#F7F5EF';
const INK = '#1A1F1B';
const MUTED = '#6B7280';
const GREEN = '#1B5E3F';
const GREEN_DARK = '#153F2B';
const GOLD = '#D98F27';
const ERROR = '#B3261E';
const BORDER = '#E4E0D6';

// 🔧 CONFIG — replace these two with your real values
const GOOGLE_CLIENT_ID = '90180381725-jjrbi2uvlfq8ouk6fvmlgbho2k8qjdha.apps.googleusercontent.com';
const AUTH_ENDPOINT = 'https://manifix-ai-core.onrender.com/api/auth/google';

const STATUS = {
  idle: { text: 'Sign in to start collecting.', tone: 'muted' },
  connecting: { text: 'Connecting to Google…', tone: 'muted' },
  verifying: { text: 'Verifying your account…', tone: 'muted' },
  success: { text: 'You\u2019re in. Loading Veggie Go…', tone: 'success' },
  sdkError: { text: 'Couldn\u2019t reach Google. Check your connection and try again.', tone: 'error' },
  authError: { text: 'Sign-in didn\u2019t go through. Try again.', tone: 'error' },
  serverError: { text: 'Our server didn\u2019t respond. Try again in a moment.', tone: 'error' },
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

// Single restrained signature detail — a thin hand-drawn vine curling
// behind the card. This is the one decorative element on the page.
const VineAccent = () => (
  <svg
    style={styles.vine}
    width="420" height="420" viewBox="0 0 420 420" fill="none"
    aria-hidden="true"
  >
    <path
      d="M40 380 C 90 330, 60 260, 120 230 C 180 200, 190 140, 150 90 C 120 55, 140 20, 190 10"
      stroke={GREEN} strokeOpacity="0.16" strokeWidth="2.5" strokeLinecap="round"
    />
    <circle cx="150" cy="90" r="5" fill={GOLD} fillOpacity="0.35" />
    <circle cx="120" cy="230" r="4" fill={GREEN} fillOpacity="0.22" />
  </svg>
);

export default function GoogleLogin({ onLoginSuccess }) {
  const [statusKey, setStatusKey] = useState('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Load brand fonts once
  useEffect(() => {
    if (document.getElementById('veggiego-fonts')) return;
    const link = document.createElement('link');
    link.id = 'veggiego-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  // Load the Google Identity Services SDK once
  useEffect(() => {
    if (document.getElementById('google-login-sdk')) {
      setSdkReady(!!window.google);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-login-sdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setStatusKey('sdkError');
    document.head.appendChild(script);
  }, []);

  const handleExecuteGoogleAuth = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusKey('connecting');

    try {
      if (!sdkReady || !window.google) {
        setStatusKey('sdkError');
        setIsProcessing(false);
        return;
      }

      // Native device identifier removed for the web build — @capacitor/device
      // is not installed/bundled here. deviceUUID stays null on web logins;
      // the backend already handles a null deviceUUID gracefully.
      const deviceUUID = null;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        use_fedcm: false, // FedCM disabled during setup/testing — falls back to
                           // the classic GSI popup flow, which gives clearer
                           // console errors while debugging client_id/consent
                           // screen issues. Safe to remove once everything's
                           // confirmed working, if you want FedCM's smoother UX.
        callback: async (response) => {
          setStatusKey('verifying');

          try {
            // Backend verifies response.credential (a JWT) with Google,
            // upserts the user into MongoDB, and returns session/user data.
            const backendResponse = await fetch(AUTH_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                credentialToken: response.credential,
                deviceUUID,
                deviceOS: 'WEB',
              }),
            });

            if (!backendResponse.ok) {
              throw new Error(`Backend responded with ${backendResponse.status}`);
            }

            const data = await backendResponse.json();

            if (data.success) {
              setStatusKey('success');
              setTimeout(() => {
                onLoginSuccess({
                  player: data.player,
                  wallet: data.wallet,
                  deviceUUID,
                });
              }, 700);
            } else {
              setStatusKey('authError');
              setIsProcessing(false);
            }
          } catch (err) {
            setStatusKey('serverError');
            setIsProcessing(false);
          }
        },
      });

      window.google.accounts.id.prompt();
    } catch (err) {
      setStatusKey('authError');
      setIsProcessing(false);
    }
  };

  const status = STATUS[statusKey];
  const statusColor = status.tone === 'error' ? ERROR : status.tone === 'success' ? GREEN : MUTED;

  return (
    <div style={styles.page}>
      <VineAccent />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div style={styles.brandRow}>
          <div style={styles.badge}>VG</div>
          <div>
            <h1 style={styles.wordmark}>Veggie Go</h1>
            <p style={styles.publisher}>by ManifiX AI</p>
          </div>
        </div>

        <p style={styles.lead}>Welcome back</p>
        <p style={styles.sub}>Sign in with Google to sync your collection and matches.</p>

        <button
          onClick={handleExecuteGoogleAuth}
          disabled={isProcessing || !sdkReady}
          style={{
            ...styles.googleButton,
            opacity: sdkReady ? 1 : 0.6,
            cursor: isProcessing || !sdkReady ? 'default' : 'pointer',
          }}
        >
          <GoogleIcon />
          <span>{isProcessing ? 'Signing in…' : sdkReady ? 'Continue with Google' : 'Loading…'}</span>
        </button>

        <p style={{ ...styles.status, color: statusColor }} role="status">
          {status.text}
        </p>

        <p style={styles.legal}>
          By continuing, you agree to Veggie Go\u2019s{' '}
          <a href="/terms" style={styles.legalLink}>Terms</a> and{' '}
          <a href="/privacy" style={styles.legalLink}>Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    position: 'fixed',
    inset: 0,
    zIndex: 700,
    background: BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  vine: {
    position: 'absolute',
    left: '-60px',
    bottom: '-40px',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    background: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    borderRadius: '20px',
    padding: '40px 36px',
    width: '90%',
    maxWidth: '380px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 60px rgba(27, 94, 63, 0.08)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  badge: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: GREEN,
    color: '#FFFFFF',
    fontFamily: "'Fraunces', serif",
    fontWeight: 600,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wordmark: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 600,
    fontSize: '19px',
    color: INK,
    margin: 0,
    lineHeight: 1.2,
  },
  publisher: {
    fontSize: '12px',
    color: MUTED,
    margin: 0,
    marginTop: '2px',
  },
  lead: {
    fontFamily: "'Fraunces', serif",
    fontSize: '24px',
    fontWeight: 500,
    color: INK,
    margin: '0 0 6px 0',
  },
  sub: {
    fontSize: '14px',
    color: MUTED,
    margin: '0 0 28px 0',
    lineHeight: 1.5,
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    background: '#FFFFFF',
    color: INK,
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    fontWeight: 600,
    padding: '13px',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  status: {
    fontSize: '13px',
    textAlign: 'center',
    margin: '18px 0 0 0',
    minHeight: '18px',
  },
  legal: {
    fontSize: '11px',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 1.6,
    margin: '20px 0 0 0',
  },
  legalLink: {
    color: GREEN_DARK,
    textDecoration: 'none',
    fontWeight: 500,
  },
};
