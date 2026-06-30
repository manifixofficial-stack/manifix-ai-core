import React, { useState, useEffect } from 'react';
import ImpulseVault from './ImpulseVault';

export default function ImpulseGuard() {
  // Biometric States
  const [heartRate, setHeartRate] = useState(72);
  const [isScanning, setIsScanning] = useState(true);
  const [stressLevel, setStressLevel] = useState('NORMAL');

  // Checkout States
  const [checkoutAmount, setCheckoutAmount] = useState(120.0);
  const [selectedItem, setSelectedItem] = useState('Streetwear Jacket');
  const [gateStatus, setGateStatus] = useState('READY'); // READY, BLOCKED, PASSED

  // Vault & Subscription States
  const [totalSaved, setTotalSaved] = useState(0);
  const [triggerVaultPulse, setTriggerVaultPulse] = useState(false);
  const [subscriptions, setSubscriptions] = useState([
    { id: 1, name: 'Premium Fitness App', cost: 14.99, lastUsed: 48, status: 'ACTIVE' },
    { id: 2, name: 'HD Video Streaming Bundle', cost: 22.99, lastUsed: 5, status: 'ACTIVE' },
    { id: 3, name: 'Design Assets Monthly', cost: 12.0, lastUsed: 52, status: 'ACTIVE' }
  ]);

  useEffect(() => {
    let interval;
    if (isScanning && gateStatus !== 'BLOCKED') {
      interval = setInterval(() => {
        const base = stressLevel === 'HIGH' ? 95 : 70;
        const variance = Math.floor(Math.random() * 6) - 3;
        setHeartRate(Math.max(60, base + variance));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isScanning, stressLevel, gateStatus]);

  const handleCheckoutIntent = () => {
    if (heartRate >= 88 || stressLevel === 'HIGH') {
      setGateStatus('BLOCKED');
      setTotalSaved(prev => prev + checkoutAmount);
      setTriggerVaultPulse(true);
      setTimeout(() => setTriggerVaultPulse(false), 2000);
    } else {
      setGateStatus('PASSED');
    }
  };

  const runSubscriptionAudit = () => {
    setSubscriptions(prevSubs =>
      prevSubs.map(sub => {
        if (sub.lastUsed >= 45 && sub.status === 'ACTIVE') {
          setTotalSaved(prev => prev + sub.cost);
          setTriggerVaultPulse(true);
          setTimeout(() => setTriggerVaultPulse(false), 2000);
          return { ...sub, status: 'PAUSED_BY_MANIFIX' };
        }
        return sub;
      })
    );
  };

  const resetDemo = () => {
    setGateStatus('READY');
    setStressLevel('NORMAL');
    setHeartRate(72);
  };

  const gold = '#d4af37';
  const goldSoft = 'rgba(212,175,55,0.18)';
  const goldBorder = 'rgba(212,175,55,0.3)';

  return (
    <div
      className="min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 max-w-7xl mx-auto"
      style={{ background: '#08070a', color: '#f4ead0' }}
    >
      {/* COLUMN 1: LIVE INTERACTIVE WORKSPACE */}
      <div className="lg:col-span-2 space-y-6">

        {/* Biometric Telemetry Panel */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden border"
          style={{
            background: 'linear-gradient(160deg, #100d08, #1a150c)',
            borderColor: goldBorder
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: '#a8915a' }}
            >
              Biometric Engine (Edge AI Shield)
            </h3>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
              style={
                stressLevel === 'HIGH'
                  ? { background: 'rgba(180,40,40,0.12)', color: '#e07a7a', borderColor: 'rgba(180,40,40,0.3)' }
                  : { background: goldSoft, color: '#e8c766', borderColor: goldBorder }
              }
            >
              ● {stressLevel === 'HIGH' ? 'ACUTE SYMPATHETIC RESPONSE' : 'HOMEOSTASIS'}
            </span>
          </div>

          <div className="flex items-baseline space-x-4">
            <span
              className="text-5xl font-black tracking-tight animate-pulse"
              style={{
                backgroundImage: 'linear-gradient(180deg, #f5e3a3, #d4af37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {heartRate}
            </span>
            <span className="text-sm font-medium" style={{ color: '#7a6a45' }}>
              BPM (AMBIENT STREAM)
            </span>
          </div>

          <div
            className="mt-6 pt-4 flex flex-wrap gap-2 border-t"
            style={{ borderColor: 'rgba(212,175,55,0.15)' }}
          >
            <button
              onClick={() => { setStressLevel('HIGH'); setHeartRate(94); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
              style={{ background: 'rgba(180,40,40,0.1)', color: '#e07a7a', borderColor: 'rgba(180,40,40,0.3)' }}
            >
              💥 Force Stress Spike
            </button>
            <button
              onClick={() => { setStressLevel('NORMAL'); setHeartRate(71); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
              style={{ background: '#15110a', color: '#cdbb8a', borderColor: goldBorder }}
            >
              🧘 Calm Baseline
            </button>
          </div>
        </div>

        {/* Checkout Gateway Panel */}
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: goldBorder }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#a8915a' }}>
            Interactive Checkout Gateway
          </h3>

          <div
            className="border p-4 rounded-xl flex justify-between items-center mb-6"
            style={{ background: '#0c0a06', borderColor: 'rgba(212,175,55,0.15)' }}
          >
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#7a6a45' }}>
                Target Merchant Intent
              </p>
              <p className="text-lg font-bold mt-0.5" style={{ color: '#f0e4c0' }}>
                {selectedItem}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase" style={{ color: '#7a6a45' }}>
                Subtotal
              </p>
              <p
                className="text-xl font-black mt-0.5"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #f5e3a3, #d4af37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                ${checkoutAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {gateStatus === 'READY' && (
            <button
              onClick={handleCheckoutIntent}
              className="w-full font-bold py-3.5 px-4 rounded-xl tracking-wide transition-all text-center"
              style={{
                background: 'linear-gradient(90deg, #f5e3a3, #d4af37)',
                color: '#0a0805',
                boxShadow: '0 8px 24px rgba(212,175,55,0.25)'
              }}
            >
              💳 Authorize Instant Checkout Swipe
            </button>
          )}

          {gateStatus === 'BLOCKED' && (
            <div
              className="p-5 rounded-xl text-center space-y-3 border"
              style={{ background: 'rgba(180,40,40,0.08)', borderColor: 'rgba(180,40,40,0.25)' }}
            >
              <p className="text-sm font-bold tracking-wide" style={{ color: '#e07a7a' }}>
                ⛔ TRANSACTION CIRCUIT BREAKER TRIPPED
              </p>
              <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: '#a8915a' }}>
                Autonomic Nervous System check failed (Heart Rate: {heartRate} BPM). Order declined at funding
                source card level. ${checkoutAmount.toFixed(2)} instantly redirected to your vault.
              </p>
              <button
                onClick={resetDemo}
                className="text-xs underline font-semibold mt-1 block mx-auto"
                style={{ color: '#cdbb8a' }}
              >
                Retry Scenario
              </button>
            </div>
          )}

          {gateStatus === 'PASSED' && (
            <div
              className="p-5 rounded-xl text-center space-y-2 border"
              style={{ background: goldSoft, borderColor: goldBorder }}
            >
              <p className="text-sm font-bold tracking-wide" style={{ color: '#e8c766' }}>
                ✅ TRANSACTION AUTHORIZED
              </p>
              <p className="text-xs" style={{ color: '#a8915a' }}>
                Biometrics cool. Checkout approved. Balance cleared.
              </p>
              <button
                onClick={resetDemo}
                className="text-xs underline font-semibold mt-1 block mx-auto"
                style={{ color: '#cdbb8a' }}
              >
                Reset App
              </button>
            </div>
          )}
        </div>

        {/* Subscription Dead Man's Switch Panel */}
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: goldBorder }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#a8915a' }}>
                Subscription Dead Man's Switch
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#7a6a45' }}>
                Automated cleanup tracking based on 45-day zero engagement parameters.
              </p>
            </div>
            <button
              onClick={runSubscriptionAudit}
              className="px-3 py-1.5 text-xs font-bold rounded-lg shadow-md transition-colors"
              style={{ background: 'linear-gradient(90deg, #f5e3a3, #d4af37)', color: '#0a0805' }}
            >
              🔍 Run Passive Audit
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {subscriptions.map(sub => (
              <div
                key={sub.id}
                className="border p-3.5 rounded-xl flex justify-between items-center"
                style={{ background: '#0c0a06', borderColor: 'rgba(212,175,55,0.12)' }}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-sm" style={{ color: '#f0e4c0' }}>
                      {sub.name}
                    </p>
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-tight border"
                      style={
                        sub.status === 'ACTIVE'
                          ? { background: 'rgba(212,175,55,0.08)', color: '#9a8a5a', borderColor: 'rgba(212,175,55,0.2)' }
                          : { background: 'rgba(180,40,40,0.12)', color: '#e07a7a', borderColor: 'rgba(180,40,40,0.3)' }
                      }
                    >
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#7a6a45' }}>
                    Last engagement footprint:{' '}
                    <span style={{ color: sub.lastUsed >= 45 ? '#e07a7a' : '#a8915a', fontWeight: 600 }}>
                      {sub.lastUsed} days ago
                    </span>
                  </p>
                </div>
                <p
                  className="font-bold text-sm tracking-tight"
                  style={{
                    backgroundImage: 'linear-gradient(180deg, #f5e3a3, #d4af37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  ${sub.cost}/mo
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COLUMN 2: WEALTH DISPLAY MODULE */}
      <div className="lg:col-span-1">
        <ImpulseVault totalSaved={totalSaved} triggerPulse={triggerVaultPulse} />
      </div>
    </div>
  );
}
