import React, { useEffect, useState } from 'react';

export default function ImpulseVault({ totalSaved, triggerPulse }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate the counter toward the real value instead of snapping
  useEffect(() => {
    const diff = totalSaved - displayValue;
    if (Math.abs(diff) < 0.01) return;
    const step = diff / 12;
    const t = setTimeout(() => setDisplayValue(prev => prev + step), 25);
    return () => clearTimeout(t);
  }, [totalSaved, displayValue]);

  return (
    <div
      className="relative rounded-2xl p-8 overflow-hidden border"
      style={{
        background: 'linear-gradient(165deg, #0a0a0a 0%, #141009 60%, #1a1408 100%)',
        borderColor: 'rgba(212,175,55,0.35)',
        boxShadow: triggerPulse
          ? '0 0 0 1px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.35)'
          : '0 0 0 1px rgba(212,175,55,0.15), 0 8px 40px rgba(0,0,0,0.6)',
        transition: 'box-shadow 0.6s ease'
      }}
    >
      {/* Ambient gold sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 0%, rgba(212,175,55,0.12), transparent 55%)'
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: '#caa94f' }}
          >
            The Vault
          </p>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              triggerPulse ? 'animate-pulse' : ''
            }`}
            style={{
              borderColor: 'rgba(212,175,55,0.4)',
              color: '#e8c766',
              background: 'rgba(212,175,55,0.08)'
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#e8c766' }}
            />
            Live Ledger
          </span>
        </div>

        <div className="mb-2">
          <p
            className="text-[11px] uppercase tracking-[0.18em] mb-2"
            style={{ color: '#8a7a4a' }}
          >
            Wealth Redirected
          </p>
          <div className="flex items-baseline">
            <span
              className="text-2xl font-bold mr-1"
              style={{ color: '#caa94f' }}
            >
              $
            </span>
            <span
              className="text-6xl font-black tracking-tight"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, #f5e3a3 0%, #d4af37 45%, #a8842a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {displayValue.toFixed(2)}
            </span>
          </div>
        </div>

        <div
          className="h-px my-6"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)'
          }}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#9a8a5a' }}>
              Checkout interceptions
            </span>
            <span className="text-sm font-bold text-white">Active</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#9a8a5a' }}>
              Subscription audits
            </span>
            <span className="text-sm font-bold text-white">Enabled</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#9a8a5a' }}>
              Status
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: '#e8c766' }}
            >
              Guarding
            </span>
          </div>
        </div>

        {triggerPulse && (
          <div
            className="mt-6 text-center text-xs font-semibold tracking-wide rounded-xl py-2.5 border"
            style={{
              color: '#0a0a0a',
              background: 'linear-gradient(90deg, #f5e3a3, #d4af37)',
              borderColor: 'rgba(212,175,55,0.6)'
            }}
          >
            ✦ Funds Redirected to Vault
          </div>
        )}
      </div>
    </div>
  );
}
