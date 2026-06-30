import React, { useState, useEffect } from 'react';

export default function Security() {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulseIndex(prev => (prev + 1) % 4), 1400);
    return () => clearInterval(t);
  }, []);

  const gold = 'linear-gradient(180deg, #f5e3a3 0%, #d4af37 45%, #a8842a 100%)';
  const panel = { background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: 'rgba(212,175,55,0.25)' };

  const pipeline = [
    { label: 'Camera / Mic Sensor', detail: 'Raw frames captured on-device' },
    { label: 'On-Device Model', detail: 'Inference runs in local secure enclave' },
    { label: 'Biometric Signal', detail: 'Only a derived stress score is produced' },
    { label: 'Raw Data Discarded', detail: 'Frames and audio are purged from memory' }
  ];

  return (
    <div style={{ background: '#08070a', color: '#f4ead0' }} className="min-h-screen w-full overflow-x-hidden">

      {/* NAV */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight" style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            IMPULSE
          </span>
          <span className="text-xl font-black tracking-tight">GUARD</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#a8915a' }}>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#guarantees" className="hover:text-white transition-colors">Guarantees</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <button className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: gold, color: '#0a0805' }}>
          Get Started
        </button>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-6"
          style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)', color: '#e8c766' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e8c766' }} />
          Zero-Cloud Edge AI Architecture
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
          Your biometrics never
          <br />
          leave your{' '}
          <span style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            device.
          </span>
        </h1>
        <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#b8a878' }}>
          Every heart rate reading, facial micro-expression, and vocal signal is processed entirely on-device.
          Nothing biometric is ever uploaded, stored remotely, or seen by us — by design, not by policy.
        </p>
      </section>

      {/* LIVE PIPELINE VISUAL */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl p-8 border relative overflow-hidden" style={panel}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.1), transparent 60%)' }}
          />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest mb-8 text-center" style={{ color: '#a8915a' }}>
              On-Device Processing Pipeline
            </p>

            <div className="flex flex-col md:flex-row items-stretch gap-3">
              {pipeline.map((step, i) => (
                <React.Fragment key={step.label}>
                  <div
                    className="flex-1 rounded-xl p-5 border transition-all duration-500"
                    style={{
                      background: i === pulseIndex ? 'rgba(212,175,55,0.1)' : '#0c0a06',
                      borderColor: i === pulseIndex ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.15)',
                      boxShadow: i === pulseIndex ? '0 0 24px rgba(212,175,55,0.2)' : 'none'
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: i === pulseIndex ? '#e8c766' : '#7a6a45' }}
                    >
                      Step {i + 1}
                    </p>
                    <p className="text-sm font-bold mb-1" style={{ color: '#f0e4c0' }}>{step.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#9a8a5a' }}>{step.detail}</p>
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className="hidden md:flex items-center justify-center px-1">
                      <span style={{ color: i === pulseIndex ? '#e8c766' : '#3a3320' }}>→</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t flex justify-center" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
              <span
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border"
                style={{ borderColor: 'rgba(212,175,55,0.4)', color: '#e8c766', background: 'rgba(212,175,55,0.08)' }}
              >
                ✦ Zero biometric bytes ever cross the network
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE COMPARISON */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a8915a' }}>Architecture</p>
          <h2 className="text-4xl font-black tracking-tight">Edge-first by construction</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 0.75rem' }}>
            <thead>
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#7a6a45' }}>Layer</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#7a6a45' }}>Typical Cloud App</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#e8c766' }}>ImpulseGuard</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Camera / Mic Capture', 'Streamed to remote servers', 'Processed locally, never transmitted'],
                ['Model Inference', 'Runs in a cloud data center', 'Runs in an on-device secure enclave'],
                ['Data Retention', 'Raw biometrics often stored for retraining', 'Raw frames discarded immediately after inference'],
                ['What Leaves the Device', 'Images, audio, identifiers', 'A single anonymized stress score, if anything'],
                ['Attack Surface', 'Centralized server breach exposes all users', 'A breach exposes nothing biometric, by design']
              ].map(row => (
                <tr key={row[0]}>
                  <td className="px-5 py-4 rounded-l-xl border-y border-l font-bold" style={{ ...panel, color: '#f0e4c0' }}>{row[0]}</td>
                  <td className="px-5 py-4 border-y" style={{ ...panel, color: '#9a8a5a' }}>{row[1]}</td>
                  <td className="px-5 py-4 rounded-r-xl border-y border-r font-semibold" style={{ ...panel, color: '#e8c766' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GUARANTEES GRID */}
      <section id="guarantees" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a8915a' }}>Guarantees</p>
          <h2 className="text-4xl font-black tracking-tight">What "zero-cloud" actually means</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '🔒', title: 'On-Device Inference', desc: 'All biometric models run locally on your phone or wearable hardware — never in a remote server.' },
            { icon: '🚫', title: 'No Raw Data Upload', desc: 'Camera frames and audio samples are processed in memory and discarded; they are never written to disk or sent over the network.' },
            { icon: '🧬', title: 'Derived Signals Only', desc: 'If any signal leaves the device, it is a single anonymized score — never an image, recording, or identifiable biometric.' },
            { icon: '🗝️', title: 'Local Secure Enclave', desc: 'Inference runs inside the same hardware-isolated environment used for device passcodes and Face ID.' },
            { icon: '🧹', title: 'Nothing to Breach', desc: 'Because biometric data is never centralized, a server compromise cannot expose your physiological history.' },
            { icon: '📜', title: 'Auditable by Design', desc: 'The architecture itself — not a policy document — is the guarantee. No cloud endpoint exists to receive biometric payloads.' }
          ].map(card => (
            <div key={card.title} className="rounded-2xl p-7 border transition-transform hover:-translate-y-1" style={panel}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                {card.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#f0e4c0' }}>{card.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9a8a5a' }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a8915a' }}>FAQ</p>
          <h2 className="text-4xl font-black tracking-tight">Common questions</h2>
        </div>

        <div className="space-y-4">
          {[
            { q: 'Does ImpulseGuard ever upload my camera feed?', a: 'No. Frames are processed in volatile memory on-device and discarded immediately after a stress score is computed. They are never written to disk or transmitted.' },
            { q: 'Can Anthropic, the app developer, or anyone else see my biometric data?', a: 'No one can, because no cloud endpoint exists to receive it. The architecture has no server-side path for biometric payloads to travel through.' },
            { q: 'What exactly syncs to the cloud?', a: 'Only non-biometric account data — your savings totals, subscription audit results, and settings. Your physiological signals stay local.' },
            { q: 'What happens if I lose my device?', a: 'Biometric models and any cached signals are scoped to the secure enclave and are not recoverable or transferable, consistent with standard device security.' }
          ].map(item => (
            <div key={item.q} className="rounded-xl p-6 border" style={panel}>
              <p className="text-sm font-bold mb-2" style={{ color: '#e8c766' }}>{item.q}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#9a8a5a' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
          Privacy isn't a setting.
          <br />
          It's the architecture.
        </h2>
        <button
          className="px-8 py-4 rounded-xl text-sm font-bold tracking-wide transition-transform hover:scale-105"
          style={{ background: gold, color: '#0a0805', boxShadow: '0 10px 30px rgba(212,175,55,0.3)' }}
        >
          Explore ImpulseGuard
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-sm font-bold" style={{ color: '#7a6a45' }}>© 2026 ImpulseGuard</span>
          <div className="flex gap-6 text-xs" style={{ color: '#7a6a45' }}>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
