// ====================================================================
// 🛸 GoogleLogin.jsx - CYBERPUNK AUTHENTICATION LAYER (MongoDB backend)
// ====================================================================
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Device } from '@capacitor/device';

const BG_BLACK = '#030305';
const NEON_GOLD = '#ffbe1a';
const MATRIX_GREEN = '#39ff88';
const ERROR_PINK = '#ff3b94';
const DECK_MUTED = '#4c5364';

// 🔧 CONFIG — replace these two with your real values
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const AUTH_ENDPOINT = 'https://your-backend.onrender.com/api/auth/google';

// Inline Google "G" logo — no external image request needed
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

export default function GoogleLogin({ onLoginSuccess }) {
  const [authStatus, setAuthStatus] = useState('CONSOLE // STANDBY FOR AUTH DIRECTIVE...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Load the real Google Identity Services SDK once on mount
  useEffect(() => {
    if (document.getElementById('google-login-sdk')) {
      setSdkReady(!!window.google);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-login-sdk';
    script.src = 'https://accounts.google.com/gsi/client'; // ✅ correct SDK URL
    script.async = true;
    script.defer = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setAuthStatus('🚨 SDK LOAD FAILURE: COULD NOT REACH GOOGLE IDENTITY SERVICES');
    document.head.appendChild(script);
  }, []);

  const handleExecuteGoogleAuth = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAuthStatus('🔮 DECRYPTING SECURE HANDSHAKE KEY WITH GOOGLE NETWORK...');

    try {
      if (!sdkReady || !window.google) {
        setAuthStatus('🚨 SDK NOT READY: GOOGLE IDENTITY NETWORK UNREACHABLE. RETRY.');
        setIsProcessing(false);
        return;
      }

      // Native device identifier (used for multi-device tracking in Mongo, if you want it)
      let deviceUUID = null;
      try {
        const hardwareInfo = await Device.getId();
        deviceUUID = hardwareInfo.uuid ?? hardwareInfo.identifier ?? null;
      } catch {
        // Device plugin not available (e.g. running in a plain browser) — safe to ignore
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setAuthStatus('📡 TOKEN ACQUIRED. VERIFYING WITH BACKEND...');

          try {
            // Backend verifies response.credential (a JWT) with Google,
            // then upserts the user into MongoDB and returns your app's own session/user data.
            const backendResponse = await fetch(AUTH_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                credentialToken: response.credential,
                deviceUUID,
                deviceOS: 'ANDROID',
              }),
            });

            if (!backendResponse.ok) {
              throw new Error(`Backend responded with ${backendResponse.status}`);
            }

            const data = await backendResponse.json();

            if (data.success) {
              setAuthStatus('✅ ACCESS GRANTED! INITIALIZING DECK INTERFACE...');
              setTimeout(() => {
                onLoginSuccess({
                  player: data.player,
                  wallet: data.wallet,
                  deviceUUID,
                });
              }, 1000);
            } else {
              setAuthStatus(`🚨 ACCESS DENIED: ${(data.message || 'UNKNOWN ERROR').toUpperCase()}`);
              setIsProcessing(false);
            }
          } catch (err) {
            setAuthStatus('🚨 CRITICAL BREACH: BACKEND CONNECTION FAILURE');
            setIsProcessing(false);
          }
        },
      });

      window.google.accounts.id.prompt();
    } catch (err) {
      setAuthStatus('🚨 HARDWARE ERROR: DEVICE ID CORRUPT OR LOCKED');
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.authWrapperLayer}>
      <div style={styles.laserScanline} />
      <div style={styles.gridMatrixBackdrop} />

      <motion.div
        style={styles.terminalCardFrame}
        initial={{ opacity: 0, scale: 0.92, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div style={styles.holoCoreScanner}>
          <div style={styles.pulsingRingNode} />
          <span style={styles.coreGlyph}>🛰️</span>
        </div>

        <h1 style={styles.brandTitleText}>VEGGE GO // <span style={styles.greenNeonSpan}>AUTH</span></h1>
        <p style={styles.brandSubtitle}>MANIFIX AI STUDIO DIGITAL ID TERMINAL</p>

        <div style={{
          ...styles.terminalConsoleLogBox,
          borderColor: authStatus.includes('🚨') ? ERROR_PINK : authStatus.includes('✅') ? MATRIX_GREEN : NEON_GOLD,
          color: authStatus.includes('🚨') ? ERROR_PINK : authStatus.includes('✅') ? MATRIX_GREEN : '#a0a5c0'
        }}>
          <span style={{ color: MATRIX_GREEN }}>{'> '}</span>{authStatus}
        </div>

        <button
          onClick={handleExecuteGoogleAuth}
          disabled={isProcessing || !sdkReady}
          style={{
            ...styles.googleTriggerBtn,
            background: isProcessing ? '#111' : 'linear-gradient(135deg, #ffffff, #e0e0e0)',
            color: '#000000',
            boxShadow: isProcessing ? 'none' : '0 0 25px rgba(255, 255, 255, 0.25)',
            opacity: sdkReady ? 1 : 0.6,
          }}
        >
          <GoogleIcon />
          {isProcessing ? '🤖 COMMUNICATING G-NET...' : sdkReady ? 'CONTINUE WITH GOOGLE' : 'LOADING G-NET...'}
        </button>

        <div style={styles.complianceLogFooter}>
          CORE COMPLIANCE SECURED: Google Identity Services & End-To-End Encrypted Handshakes
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  authWrapperLayer: { position: 'fixed', inset: 0, zIndex: 700, backgroundColor: BG_BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  laserScanline: { position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent, #39ff88, transparent)', opacity: 0.4, pointerEvents: 'none', zIndex: 710, animation: 'laserScan 4s linear infinite' },
  gridMatrixBackdrop: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255, 190, 26, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 190, 26, 0.01) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none', zIndex: 705 },
  terminalCardFrame: { position: 'relative', background: 'rgba(6, 7, 15, 0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `2px solid ${NEON_GOLD}`, borderRadius: '24px', padding: '40px 22px', width: '90%', maxWidth: '380px', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 0 45px rgba(255, 190, 26, 0.15)', zIndex: 720 },
  holoCoreScanner: { position: 'relative', width: '80px', height: '80px', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pulsingRingNode: { position: 'absolute', inset: 0, border: `2px dashed ${MATRIX_GREEN}`, borderRadius: '50%', animation: 'spin 16s linear infinite' },
  coreGlyph: { fontSize: '28px', zIndex: 2 },
  brandTitleText: { fontFamily: "'Orbitron', sans-serif", color: '#ffffff', fontSize: '22px', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '4px' },
  greenNeonSpan: { color: MATRIX_GREEN, textShadow: '0 0 12px rgba(57, 255, 136, 0.5)' },
  brandSubtitle: { fontFamily: "'Orbitron', sans-serif", color: DECK_MUTED, fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '24px' },
  terminalConsoleLogBox: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', background: '#000000', border: '1px solid', padding: '14px', borderRadius: '10px', marginBottom: '25px', lineHeight: '1.4', textAlign: 'left', fontWeight: 'bold', minHeight: '48px', boxSizing: 'border-box' },
  googleTriggerBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 900, letterSpacing: '1px', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' },
  complianceLogFooter: { fontFamily: "'Orbitron', sans-serif", fontSize: '8px', color: DECK_MUTED, fontWeight: 'bold', marginTop: '25px', letterSpacing: '0.2px', opacity: 0.7 }
};
