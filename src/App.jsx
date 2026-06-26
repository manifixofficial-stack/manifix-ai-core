import React, { useEffect, createContext, useContext, useState, useCallback } from "react";
import AppRouter from "./AppRouter";

// ─────────────────────────────────────────────
// GLOBAL STATE CONTEXT
// Central store that feeds ALL 17 modules.
// Any module can READ from here and WRITE to here.
// ─────────────────────────────────────────────

export const ManifiXContext = createContext(null);

const STORAGE_KEY = "manifix_global_state";

const DEFAULT_STATE = {
  user: {
    name: "",
    age: null,
    gender: "",
    cycleDay: null,
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    onboardingComplete: false,
  },
  health: {
    hrv: [],           // [{ timestamp, value }] — feeds Stress + PreventiveHealth
    sleep: [],         // [{ date, hours, quality, stages }] — feeds SleepGold + ChronicDisease
    mood: [],          // [{ timestamp, score, note }] — feeds Stress + WomenHealth + ChildrenHealth
    medications: [],   // [{ name, dose, time, taken }] — feeds MedicationHealth + ElderlyHealth
    nutrition: [],     // [{ date, calories, macros }] — feeds NutritionHealth + ChronicDisease
    symptoms: [],      // [{ date, type, severity }] — feeds WomenHealth + ChronicDisease + ElderlyHealth
    vitals: [],        // [{ date, bp, hr, weight, temp }] — feeds ElderlyHealth + PreventiveHealth
    steps: [],         // [{ date, count }] — feeds ChildrenHealth + PreventiveHealth
    stress: [],        // [{ timestamp, level }] — feeds Stress + NutritionHealth
  },
  settings: {
    privacyMode: false,
    notifications: true,
    theme: "light",
    dataRetentionDays: 90,
    aiCallsEnabled: true,
    shareHealthData: false,
  },
  meta: {
    lastSync: null,
    appVersion: "1.0.0",
    consentLog: [],    // [{ action, module, timestamp }] — for DataGovernance
  },
};

// ─────────────────────────────────────────────
// GLOBAL STATE PROVIDER
// ─────────────────────────────────────────────

export function ManifiXProvider({ children }) {
  const [state, setStateRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge saved state into defaults (handles new keys added in updates)
        return deepMerge(DEFAULT_STATE, parsed);
      }
    } catch (e) {
      console.warn("ManifiX: Could not load saved state, using defaults.", e);
    }
    return DEFAULT_STATE;
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("ManifiX: Could not persist state.", e);
    }
  }, [state]);

  // ── Updaters ──────────────────────────────

  // Update any top-level section (user, health, settings, meta)
  const updateSection = useCallback((section, patch) => {
    setStateRaw(prev => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));
  }, []);

  // Append a timestamped entry to any health array
  const appendHealth = useCallback((key, entry) => {
    setStateRaw(prev => ({
      ...prev,
      health: {
        ...prev.health,
        [key]: [
          ...prev.health[key],
          { ...entry, _id: Date.now(), timestamp: entry.timestamp || new Date().toISOString() },
        ],
      },
    }));
  }, []);

  // Replace the entire health array for a key (e.g. after editing)
  const setHealth = useCallback((key, array) => {
    setStateRaw(prev => ({
      ...prev,
      health: { ...prev.health, [key]: array },
    }));
  }, []);

  // Log a consent action (used by DataGovernance + PrivacyVault)
  const logConsent = useCallback((action, module) => {
    setStateRaw(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        consentLog: [
          ...prev.meta.consentLog,
          { action, module, timestamp: new Date().toISOString() },
        ],
      },
    }));
  }, []);

  // Nuclear wipe — GDPR right-to-erasure
  const wipeAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStateRaw(DEFAULT_STATE);
  }, []);

  // ── Cross-module derived values ───────────

  // Latest HRV value (used by Stress, PreventiveHealth, BiomarkerEngine)
  const latestHRV = state.health.hrv.length
    ? state.health.hrv[state.health.hrv.length - 1].value
    : null;

  // Last 7 days average sleep (used by ChronicDisease, NutritionHealth)
  const avgSleepLast7 = (() => {
    const recent = state.health.sleep.slice(-7);
    if (!recent.length) return null;
    return (recent.reduce((s, e) => s + (e.hours || 0), 0) / recent.length).toFixed(1);
  })();

  // Latest mood score (used by WomenHealth, ChildrenHealth)
  const latestMood = state.health.mood.length
    ? state.health.mood[state.health.mood.length - 1].score
    : null;

  // Today's step count (used by ChildrenHealth, PreventiveHealth)
  const todaySteps = (() => {
    const today = new Date().toISOString().slice(0, 10);
    const entry = state.health.steps.find(e => e.date === today);
    return entry ? entry.count : 0;
  })();

  const ctx = {
    // Raw state
    state,
    // Section updaters
    updateUser: patch => updateSection("user", patch),
    updateSettings: patch => updateSection("settings", patch),
    updateMeta: patch => updateSection("meta", patch),
    // Health data
    appendHealth,
    setHealth,
    // Consent & privacy
    logConsent,
    wipeAllData,
    // Derived cross-module values
    derived: { latestHRV, avgSleepLast7, latestMood, todaySteps },
  };

  return (
    <ManifiXContext.Provider value={ctx}>
      {children}
    </ManifiXContext.Provider>
  );
}

// Hook for any module to consume global state
export function useManifiX() {
  const ctx = useContext(ManifiXContext);
  if (!ctx) throw new Error("useManifiX must be used inside <ManifiXProvider>");
  return ctx;
}

// ─────────────────────────────────────────────
// NOTIFICATION MANAGER
// ─────────────────────────────────────────────

function useNotifications(settingsRef) {
  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      // Delay request slightly so it doesn't fire on first load before user interaction
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Medication reminder scheduler (reads from global health.medications)
  useEffect(() => {
    if (!settingsRef?.notifications) return;
    // Hook point: future WearableSync and BiomarkerEngine
    // will push urgent alerts through here (e.g. low HRV warning)
  }, [settingsRef?.notifications]);
}

// ─────────────────────────────────────────────
// ERROR BOUNDARY
// Wraps the whole app so a crash in one module
// doesn't take down ManifiX entirely.
// ─────────────────────────────────────────────

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ManifiX Error Boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorScreen}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>Something went wrong</h2>
            <p style={styles.errorMsg}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              style={styles.errorBtn}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────

export default function App() {
  return (
    <AppErrorBoundary>
      <ManifiXProvider>
        <AppInner />
      </ManifiXProvider>
    </AppErrorBoundary>
  );
}

function AppInner() {
  const { state } = useManifiX();
  useNotifications(state.settings);
  return <AppRouter />;
}

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ─────────────────────────────────────────────
// ERROR SCREEN STYLES
// ─────────────────────────────────────────────

const styles = {
  errorScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000000",
    padding: "24px",
  },
  errorCard: {
    background: "#111111",
    borderRadius: "16px",
    padding: "40px 32px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    border: "1px solid #D4AF37",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorTitle: {
    color: "#D4AF37",
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 12px",
  },
  errorMsg: {
    color: "#999999",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: "0 0 28px",
  },
  errorBtn: {
    background: "linear-gradient(135deg, #D4AF37, #B8960C)",
    color: "#000000",
    border: "none",
    borderRadius: "10px",
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
