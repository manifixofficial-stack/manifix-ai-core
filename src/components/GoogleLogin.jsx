// ====================================================================
// GoogleLogin.jsx — Veggie Go sign-in
// Backend: MongoDB via /api/auth/google (server.js on Render, reads/writes
// hot state through Redis Cloud)
//
// THIS REVISION — legal links fixed to actually work inside the native app:
//
//   PROBLEM: the previous version linked Privacy/Terms with plain
//   <a href="/terms"> / <a href="/privacy"> tags. That works fine in a
//   real browser tab (resolves against manifixai.com), but once this
//   runs inside the packaged Capacitor Android app, the WebView's origin
//   is NOT manifixai.com — it's a local app-scheme origin (typically
//   capacitor://localhost). Tapping either link would try to navigate
//   the entire app shell to a path that doesn't exist there, producing a
//   blank/broken screen instead of the actual policy — and since this is
//   the ONLY place in the reviewed codebase that currently surfaces
//   Privacy/Terms at all (the game's own App.jsx flow doesn't gate on
//   them), a broken link here means Play Store reviewers may not be able
//   to reach your privacy policy at all from within the submitted app.
//
//   FIX: both links are now buttons that open PrivacyModal.jsx /
//   TermsModal.jsx in-place — the same "borderless WebView modal"
//   components already built for exactly this purpose, so nothing ever
//   navigates the app shell away from itself. Works identically on web
//   and native since it's just local React state, not a route.
//
// WHY THE REST OF THIS FILE LOOKS THE WAY IT DOES (unchanged from prior
// revision): branches on Capacitor.isNativePlatform():
//   - NATIVE (Android app)  -> native Google Sign-In via a Capacitor plugin
//   - WEB (browser/manifixai.com) -> Google Identity Services (GIS) One
//     Tap, PLUS a visible renderButton() fallback in case One Tap is
//     silently skipped (a known native-WebView failure mode — One Tap is
//     built for real browser tabs and no-ops with no error inside a
//     wrapped WebView, which is why the native branch exists at all).
//
// ---------------------------------------------------------------------
// ONE-TIME SETUP REQUIRED FOR THE NATIVE PATH (unchanged, do this before
// the native branch will work):
//
// 1. npm install @codetrix-studio/capacitor-google-auth
//    npx cap sync android
//
// 2. In Google Cloud Console (same project as your existing OAuth client):
//    a. Create a SECOND OAuth client of type "Android", using your release
//       keystore's SHA-1 fingerprint (get it with:
//       keytool -list -v -keystore veggiego-release.keystore -alias veggiego)
//       — and ALSO create a debug one from your debug keystore's SHA-1 so
//       local testing works before you have a signed release build.
//    b. Your EXISTING web client ID (GOOGLE_CLIENT_ID below) becomes the
//       "Server Client ID" / serverClientId — this is what lets the native
//       plugin return an idToken your Node backend can verify. Keep using it.
//
// 3. android/app/src/main/res/values/strings.xml — add:
//    <string name="server_client_id">YOUR_WEB_CLIENT_ID.apps.googleusercontent.com</string>
//
// 4. capacitor.config.json — add:
//    "plugins": {
//      "GoogleAuth": {
//        "scopes": ["profile", "email"],
//        "serverClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
//        "forceCodeForRefreshToken": true
//      }
//    }
//
// Until steps 1-4 are done, the native branch below will throw on import —
// it's wrapped in try/catch so the web path still works in the meantime.
//
// ---------------------------------------------------------------------
// ⚠️ STILL FLAGGED, NOT FIXED — architecture-level, needs App.jsx changes:
//
// This component is not currently imported or rendered anywhere in the
// game's App.jsx (the RoomJoin -> MapView -> GameCanvas -> Scoreboard
// flow reviewed in prior revisions starts directly at RoomJoin, with no
// auth or legal-consent gate before it). That means:
//   - Nothing currently collects Google sign-in before a player uses
//     camera/GPS in the live app.
//   - Nothing currently shows Privacy/Terms before gameplay starts either
//     — this file's modals only fire if THIS component is on-screen,
//     which it presently never is.
// Google Play requires an in-app privacy policy be reachable, and your
// AndroidManifest.xml grants CAMERA + location permissions — an app that
// never surfaces a privacy policy anywhere in its actual runtime flow is
// a real review-rejection risk, independent of whether the modal itself
// works correctly. This file being correct in isolation does not fix
// that; App.jsx needs an AUTH/LEGAL stage wired in ahead of RoomJoin
// that actually renders GoogleLogin (and, on first run, the legal gate)
// before the room-join screen. Flagging so it isn't mistaken for done.
// ---------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';

const BG = '#F7F5EF';
const INK = '#1A1F1B';
const MUTED = '#6B7280';
const GREEN = '#1B5E3F';
const GREEN_DARK = '#153F2B';
const GOLD = '#D98F27';
const ERROR = '#B3261E';
const BORDER = '#E4E0D6';

// 🔧 CONFIG — replace with your real values
// This is your WEB client ID. It doubles as "serverClientId" for the
// native Android sign-in flow (see setup notes above) — do not swap it
// out for the Android client ID, native sign-in needs the web one here.
const GOOGLE_CLIENT_ID = '90180381725-jjrbi2uvlfq8ouk6fvmlgbho2k8qjdha.apps.googleusercontent.com';
const AUTH_ENDPOINT = 'https://manifix-ai-core.onrender.com/api/auth/google';

const STATUS = {
  idle: { text: 'Sign in to start collecting.', tone: 'muted' },
  connecting: { text: 'Connecting to Google…', tone: 'muted' },
  verifying: { text: 'Verifying your account…', tone: 'muted' },
  success: { text: "You're in. Loading Veggie Go…", tone: 'success' },
  sdkError: { text: "Couldn't reach Google. Check your connection and try again.", tone: 'error' },
  authError: { text: "Sign-in didn't go through. Try again.", tone: 'error' },
  serverError: { text: "Our server didn't respond. Try again in a moment.", tone: 'error' },
  cancelled: { text: 'Sign-in cancelled.', tone: 'muted' },
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

const VineAccent = () => (
  <svg style={styles.vine} width="420" height="420" viewBox="0 0 420 420" fill="none" aria-hidden="true">
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
  const [isNative, setIsNative] = useState(false);
  const buttonHostRef = useRef(null);

  // FIX: replaces the old <a href="/terms">/<a href="/privacy"> tags.
  // Local modal visibility state — opens PrivacyModal/TermsModal in place
  // instead of navigating the WebView, so this works identically on web
  // and inside the native Capacitor app shell.
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Fonts
  useEffect(() => {
    if (document.getElementById('veggiego-fonts')) return;
    const link = document.createElement('link');
    link.id = 'veggiego-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  // Detect platform once, on mount
  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor?.isNativePlatform?.()) {
          setIsNative(true);
          // Native plugin needs no external <script> tag — it's ready
          // as soon as the JS module resolves.
          setSdkReady(true);
          return;
        }
      } catch (e) {
        // @capacitor/core not present — definitely a plain web build.
      }
      setIsNative(false);
      loadWebSdk();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- WEB PATH: Google Identity Services -----------------------------
  const loadWebSdk = () => {
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
  };

  const sendCredentialToBackend = async (credentialToken, deviceOS, deviceUUID = null) => {
    setStatusKey('verifying');
    try {
      const backendResponse = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialToken, deviceUUID, deviceOS }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with ${backendResponse.status}`);
      }

      const data = await backendResponse.json();

      if (data.success) {
        setStatusKey('success');
        setTimeout(() => {
          onLoginSuccess({ player: data.player, wallet: data.wallet, deviceUUID });
        }, 700);
      } else {
        setStatusKey('authError');
        setIsProcessing(false);
      }
    } catch (err) {
      setStatusKey('serverError');
      setIsProcessing(false);
    }
  };

  const runWebSignIn = () => {
    if (!window.google) {
      setStatusKey('sdkError');
      setIsProcessing(false);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      use_fedcm: false,
      callback: (response) => sendCredentialToBackend(response.credential, 'WEB'),
    });

    // Try One Tap first, but don't trust it silently — if it's not
    // displayed or gets dismissed/skipped, fall back to a real button
    // the user can click. This is the gap your original code had: no
    // fallback meant a silent skip left the user stuck on "Connecting…".
    window.google.accounts.id.prompt((notification) => {
      const skipped =
        notification.isNotDisplayed?.() || notification.isSkippedMoment?.();
      if (skipped && buttonHostRef.current) {
        window.google.accounts.id.renderButton(buttonHostRef.current, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'continue_with',
        });
        setStatusKey('idle');
        setIsProcessing(false);
      }
    });
  };

  // ---- NATIVE PATH: Capacitor Google Auth plugin -----------------------
  const runNativeSignIn = async () => {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

      // Safe to call repeatedly; plugin no-ops if already initialized.
      await GoogleAuth.initialize({
        clientId: GOOGLE_CLIENT_ID, // serverClientId, see setup notes above
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });

      const user = await GoogleAuth.signIn();
      // user.authentication.idToken is the JWT your backend verifies —
      // same shape/verification path as the web credential.
      const idToken = user?.authentication?.idToken;
      if (!idToken) {
        setStatusKey('authError');
        setIsProcessing(false);
        return;
      }

      // Best-effort device id for durable player identity on Android.
      // Optional: npm install @capacitor/device if you want this.
      let deviceUUID = null;
      try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getId();
        deviceUUID = info?.identifier || null;
      } catch (e) {
        // @capacitor/device not installed — fine, backend handles null.
      }

      await sendCredentialToBackend(idToken, 'ANDROID', deviceUUID);
    } catch (err) {
      // err.code === '12501' from the plugin typically means the user
      // cancelled the native sign-in sheet — treat that as a soft cancel,
      // not a hard error, so we don't scare them with "Sign-in didn't go
      // through" for something they did on purpose.
      if (String(err?.code) === '12501' || String(err?.message || '').toLowerCase().includes('cancel')) {
        setStatusKey('cancelled');
      } else {
        setStatusKey('authError');
      }
      setIsProcessing(false);
    }
  };

  const handleSignInPress = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusKey('connecting');

    if (isNative) {
      await runNativeSignIn();
    } else {
      if (!sdkReady || !window.google) {
        setStatusKey('sdkError');
        setIsProcessing(false);
        return;
      }
      runWebSignIn();
    }
  };

  const status = STATUS[statusKey];
  const statusColor =
    status.tone === 'error' ? ERROR : status.tone === 'success' ? GREEN : MUTED;

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
          onClick={handleSignInPress}
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

        {/* Fallback mount point for web renderButton() if One Tap is skipped */}
        <div ref={buttonHostRef} style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }} />

        <p style={{ ...styles.status, color: statusColor }} role="status">
          {status.text}
        </p>

        {/* FIX: was <a href="/terms">/<a href="/privacy"> — broken inside
            the native app's WebView origin. Now opens the same in-app
            modal components (PrivacyModal/TermsModal) used elsewhere,
            so this never navigates the app shell away from itself. */}
        <p style={styles.legal}>
          By continuing, you agree to Veggie Go's{' '}
          <button type="button" onClick={() => setShowTerms(true)} style={styles.legalLinkBtn}>
            Terms
          </button>{' '}
          and{' '}
          <button type="button" onClick={() => setShowPrivacy(true)} style={styles.legalLinkBtn}>
            Privacy Policy
          </button>.
        </p>
      </motion.div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

const styles = {
  page: {
    position: 'fixed', inset: 0, zIndex: 700, background: BG,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif",
  },
  vine: { position: 'absolute', left: '-60px', bottom: '-40px', pointerEvents: 'none' },
  card: {
    position: 'relative', background: '#FFFFFF', border: `1px solid ${BORDER}`,
    borderRadius: '20px', padding: '40px 36px', width: '90%', maxWidth: '380px',
    boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(27, 94, 63, 0.08)',
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' },
  badge: {
    width: '40px', height: '40px', borderRadius: '10px', background: GREEN, color: '#FFFFFF',
    fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '15px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  wordmark: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '19px', color: INK, margin: 0, lineHeight: 1.2 },
  publisher: { fontSize: '12px', color: MUTED, margin: 0, marginTop: '2px' },
  lead: { fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 500, color: INK, margin: '0 0 6px 0' },
  sub: { fontSize: '14px', color: MUTED, margin: '0 0 28px 0', lineHeight: 1.5 },
  googleButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%',
    background: '#FFFFFF', color: INK, fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
    padding: '13px', border: `1px solid ${BORDER}`, borderRadius: '10px',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  status: { fontSize: '13px', textAlign: 'center', margin: '18px 0 0 0', minHeight: '18px' },
  legal: { fontSize: '11px', color: MUTED, textAlign: 'center', lineHeight: 1.6, margin: '20px 0 0 0' },
  legalLinkBtn: {
    background: 'none', border: 'none', padding: 0, margin: 0,
    color: GREEN_DARK, textDecoration: 'underline', fontWeight: 500,
    fontFamily: "'Inter', sans-serif", fontSize: '11px', cursor: 'pointer',
    display: 'inline',
  },
};
