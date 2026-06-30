import { useEffect, useRef, useState } from "react";
import ImpulseVault from "./ImpulseVault";

/**
 * ImpulseVaultContainer
 * Feeds ImpulseVault.jsx with a real `totalSaved` figure pulled from the
 * backend (see stripe-issuing-routes.js). ImpulseVault.jsx itself stays a
 * pure display component — this is the only thing that knows where the
 * number comes from.
 *
 * Polls every few seconds and fires `triggerPulse` whenever the total
 * goes up — i.e. whenever Stripe Issuing actually declined a purchase and
 * redirected funds to the vault. Swap the polling loop for an SSE/WebSocket
 * subscription later if you want the pulse to fire the instant a decline
 * happens rather than on the next poll tick.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const POLL_MS = 4000;
const PULSE_MS = 2200;

export default function ImpulseVaultContainer() {
  const [totalSaved, setTotalSaved] = useState(0);
  const [triggerPulse, setTriggerPulse] = useState(false);
  const [error, setError] = useState(null);

  const lastValueRef = useRef(0);
  const pulseTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTotal = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vault/total-saved`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to load vault total (${res.status})`);
        const data = await res.json();
        if (cancelled) return;

        const amount = data.total_saved ?? 0;
        if (amount > lastValueRef.current) {
          setTriggerPulse(true);
          clearTimeout(pulseTimeoutRef.current);
          pulseTimeoutRef.current = setTimeout(() => setTriggerPulse(false), PULSE_MS);
        }
        lastValueRef.current = amount;
        setTotalSaved(amount);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load vault total.");
      }
    };

    fetchTotal();
    const id = setInterval(fetchTotal, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  return (
    <div>
      <ImpulseVault totalSaved={totalSaved} triggerPulse={triggerPulse} />
      {error && (
        <p
          className="mt-3 text-xs text-center"
          style={{ color: "#d97359" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
