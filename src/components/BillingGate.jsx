// ====================================================================
// 💰 BillingGate.jsx — MANIFIX AI RAZORPAY TRANSACTION GATEWAY
// ====================================================================
import React, { useState, useEffect } from 'react';

// ---- Design tokens: green / black / white / dark-blue ----
const BG_BLACK = '#04050a';
const PANEL_BLUE = '#0d1526';       // dark-blue panel/border color
const PANEL_BLUE_LIGHT = '#152038'; // hover / selected panel tint
const ACCENT_GREEN = '#2fe08a';     // primary accent (buttons, selected state)
const WHITE = '#ffffff';
const MUTED = '#7c8aa5';            // secondary text on dark-blue
const ERROR_RED = '#ff5470';        // functional-only, not part of core palette

// Authoritative localized pricing tiers, matching the rate card exactly.
const TICKET_BUNDLES = [
  {
    id: 'single_pass',
    title: 'PER-GAME PASS',
    tickets: '1 TICKET',
    badge: 'LOW FRICTION',
    price: { INR: 50, USD: 0.99, EUR: 0.99 }
  },
  {
    id: 'starter_pack',
    title: 'STARTER PACK',
    tickets: '5 TICKETS',
    badge: 'SQUAD FAV',
    price: { INR: 250, USD: 4.99, EUR: 4.99 }
  },
  {
    id: 'pro_bundle',
    title: 'PRO BUNDLE',
    tickets: '10 TICKETS',
    badge: 'BEST VALUE',
    price: { INR: 500, USD: 9.99, EUR: 9.99 }
  }
];

const ZONES = [
  { code: 'INR', label: 'INDIA', symbol: '₹' },
  { code: 'USD', label: 'GLOBAL', symbol: '$' },
  { code: 'EUR', label: 'EUROPE', symbol: '€' }
];

const RAZORPAY_SDK_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export default function BillingGate({ username, deviceUUID, onPurchaseSuccess, onClose }) {
  const [selectedBundle, setSelectedBundle] = useState('starter_pack');
  const [currencyMode, setCurrencyMode] = useState('INR'); // 'INR' | 'USD' | 'EUR'
  const [transactionLog, setTransactionLog] = useState('SYSTEM: STANDBY FOR TRANSACTION INTENT...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Load the real Razorpay checkout script (was pointed at the wrong URL before).
  useEffect(() => {
    const existing = document.getElementById('razorpay-sdk-script');
    if (existing) {
      if (window.Razorpay) setSdkReady(true);
      else existing.addEventListener('load', () => setSdkReady(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk-script';
    script.src = RAZORPAY_SDK_SRC;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setTransactionLog('🚨 ERROR: RAZORPAY SDK FAILED TO LOAD.');
    document.head.appendChild(script);
  }, []);

  const activeBundle = TICKET_BUNDLES.find(b => b.id === selectedBundle);
  const activeZone = ZONES.find(z => z.code === currencyMode);

  // ⚡ RAZORPAY EXECUTION CORE
  const handleInitializePayment = async () => {
    if (isProcessing) return;

    if (!window.Razorpay || !sdkReady) {
      setTransactionLog('🚨 ERROR: PAYMENT SDK NOT READY. RETRYING...');
      return;
    }

    setIsProcessing(true);
    setTransactionLog('🔮 COMMUNICATING WITH BILLING GATEWAY...');

    try {
      // Razorpay expects the amount in the smallest unit of the SELECTED
      // currency (paise for INR, cents for USD/EUR) — no cross-currency
      // conversion needed here, since each zone already has its own price.
      const amountInSmallestUnit = Math.round(activeBundle.price[currencyMode] * 100);

      const paymentOptions = {
        key: 'rzp_live_YOUR_KEY_HERE', // 🚨 Replace with your real public Razorpay key
        amount: amountInSmallestUnit,
        currency: currencyMode,
        name: 'MANIFIX AI STUDIO',
        description: `PURCHASE: ${activeBundle.title} (${activeBundle.tickets})`,
        prefill: {
          name: username
        },
        notes: {
          deviceUUID: deviceUUID || '',
          bundleId: selectedBundle
        },
        theme: {
          color: ACCENT_GREEN
        },
        handler: function (response) {
          setTransactionLog('✅ TRANSACTION GRANTED! CREDITING TICKETS...');
          setTimeout(() => {
            onPurchaseSuccess({
              success: true,
              bundleId: selectedBundle,
              ticketsCount: parseInt(activeBundle.tickets, 10),
              paymentId: response.razorpay_payment_id
            });
            setIsProcessing(false);
          }, 1200);
        },
        modal: {
          ondismiss: function () {
            setTransactionLog('🚨 TRANSACTION ABORTED: CLOSED BY USER');
            setIsProcessing(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(paymentOptions);
      razorpayInstance.on('payment.failed', function (response) {
        setTransactionLog(`🚨 PAYMENT FAILED: ${response.error.description || 'UNKNOWN ERROR'}`);
        setIsProcessing(false);
      });
      razorpayInstance.open();
    } catch (err) {
      setTransactionLog('🚨 BILLING CRASH: GATEWAY COMMUNICATION TIMEOUT');
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.billingWrapperModal}>
      <div style={styles.glassCardContainer}>

        {/* Header */}
        <div style={styles.topNavbarRow}>
          <h2 style={styles.hudTitle}>SECURE BILLING // <span style={styles.greenGlowSpan}>HUD</span></h2>
          <button onClick={onClose} disabled={isProcessing} style={styles.exitDockBtn}>[ CLOSE ]</button>
        </div>

        {/* Currency zone selector */}
        <div style={styles.currencyToggleTrack}>
          {ZONES.map(zone => (
            <button
              key={zone.code}
              onClick={() => setCurrencyMode(zone.code)}
              style={{
                ...styles.zoneTabBtn,
                background: currencyMode === zone.code ? ACCENT_GREEN : 'transparent',
                color: currencyMode === zone.code ? BG_BLACK : WHITE
              }}
            >
              {zone.label} ({zone.symbol})
            </button>
          ))}
        </div>

        {/* Transaction console log */}
        <div style={{
          ...styles.terminalConsoleLogBox,
          borderColor: transactionLog.includes('🚨') ? ERROR_RED : transactionLog.includes('✅') ? ACCENT_GREEN : PANEL_BLUE_LIGHT,
          color: transactionLog.includes('🚨') ? ERROR_RED : transactionLog.includes('✅') ? ACCENT_GREEN : MUTED
        }}>
          <span>&gt; </span>{transactionLog}
        </div>

        {/* Ticket bundle cards */}
        <div style={styles.bundlesSelectionGrid}>
          {TICKET_BUNDLES.map((bundle) => {
            const isSelected = selectedBundle === bundle.id;
            const displayedPrice = `${activeZone.symbol}${bundle.price[currencyMode]}`;

            return (
              <div
                key={bundle.id}
                onClick={() => !isProcessing && setSelectedBundle(bundle.id)}
                style={{
                  ...styles.bundleCardRow,
                  borderColor: isSelected ? ACCENT_GREEN : PANEL_BLUE_LIGHT,
                  background: isSelected ? 'rgba(47, 224, 138, 0.06)' : PANEL_BLUE
                }}
              >
                <div style={styles.bundleLeftMeta}>
                  <span style={{
                    ...styles.bundlePillBadge,
                    color: isSelected ? ACCENT_GREEN : MUTED,
                    borderColor: isSelected ? ACCENT_GREEN : MUTED
                  }}>
                    {bundle.badge}
                  </span>
                  <div style={styles.bundleMainTitle}>{bundle.title}</div>
                  <div style={styles.bundleTicketVolume}>{bundle.tickets}</div>
                </div>
                <div style={{ ...styles.bundlePriceText, color: isSelected ? ACCENT_GREEN : WHITE }}>
                  {displayedPrice}
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout button */}
        <button
          onClick={handleInitializePayment}
          disabled={isProcessing || !sdkReady}
          style={{ ...styles.checkoutExecutionBtn, opacity: (isProcessing || !sdkReady) ? 0.5 : 1 }}
        >
          {isProcessing ? '⏳ PROCESSING...' : `⚡ AUTHORIZE ${activeBundle.tickets} NOW`}
        </button>

        <span style={styles.encryptionBadge}>🔒 256-BIT ENCRYPTED RAZORPAY CHECKOUT</span>
      </div>
    </div>
  );
}

const styles = {
  billingWrapperModal: {
    position: 'fixed', inset: 0, zIndex: 500, backgroundColor: 'rgba(4, 5, 10, 0.94)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  glassCardContainer: {
    position: 'relative', background: BG_BLACK, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${PANEL_BLUE_LIGHT}`, borderRadius: '20px', padding: '32px 22px', width: '92%',
    maxWidth: '380px', boxSizing: 'border-box', boxShadow: `0 0 60px rgba(47, 224, 138, 0.08)`,
    display: 'flex', flexDirection: 'column'
  },
  topNavbarRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
    borderBottom: `1px solid ${PANEL_BLUE_LIGHT}`, paddingBottom: '12px'
  },
  hudTitle: { fontFamily: "'Orbitron', sans-serif", color: WHITE, fontSize: '16px', fontWeight: 900, letterSpacing: '1px', margin: 0 },
  greenGlowSpan: { color: ACCENT_GREEN, textShadow: '0 0 10px rgba(47, 224, 138, 0.5)' },
  exitDockBtn: { background: 'none', border: 'none', color: MUTED, fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' },
  currencyToggleTrack: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: PANEL_BLUE,
    padding: '4px', borderRadius: '8px', border: `1px solid ${PANEL_BLUE_LIGHT}`, marginBottom: '16px'
  },
  zoneTabBtn: {
    padding: '10px 4px', border: 'none', borderRadius: '6px', fontFamily: "'Orbitron', sans-serif",
    fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.15s ease'
  },
  terminalConsoleLogBox: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', background: '#000', border: '1px solid',
    padding: '12px', borderRadius: '8px', marginBottom: '20px', lineHeight: '1.4', fontWeight: 'bold',
    minHeight: '44px', boxSizing: 'border-box'
  },
  bundlesSelectionGrid: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
  bundleCardRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px',
    border: '1px solid', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box', transition: 'all 0.15s ease'
  },
  bundleLeftMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' },
  bundlePillBadge: {
    fontFamily: "'Orbitron', sans-serif", fontSize: '8px', fontWeight: 'bold', border: '1px solid',
    padding: '2px 8px', borderRadius: '4px', marginLeft: '-4px'
  },
  bundleMainTitle: { fontFamily: "'Orbitron', sans-serif", color: WHITE, fontSize: '14px', fontWeight: 900, letterSpacing: '0.5px' },
  bundleTicketVolume: { fontFamily: "'Fredoka', sans-serif", color: MUTED, fontSize: '11px', fontWeight: 'bold' },
  bundlePriceText: { fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 900 },
  checkoutExecutionBtn: {
    display: 'block', width: '100%', background: `linear-gradient(135deg, ${ACCENT_GREEN}, #17b869)`,
    color: BG_BLACK, fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 900,
    letterSpacing: '1.5px', padding: '18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
    textTransform: 'uppercase', boxShadow: '0 0 25px rgba(47, 224, 138, 0.3)', transition: 'all 0.2s ease'
  },
  encryptionBadge: {
    display: 'inline-block', fontFamily: "'Orbitron', sans-serif", fontSize: '8px', fontWeight: 700,
    color: MUTED, marginTop: '20px', letterSpacing: '0.5px', opacity: 0.8, textAlign: 'center', width: '100%'
  }
};
