import React, { useState, useEffect } from 'react';

export default function Home() {
  const [heartRate, setHeartRate] = useState(72);
  const [savedTicker, setSavedTicker] = useState(48213);

  useEffect(() => {
    const hr = setInterval(() => {
      setHeartRate(prev => Math.max(64, prev + (Math.floor(Math.random() * 5) - 2)));
    }, 1800);
    const ticker = setInterval(() => {
      setSavedTicker(prev => prev + Math.floor(Math.random() * 14) + 3);
    }, 2200);
    return () => { clearInterval(hr); clearInterval(ticker); };
  }, []);

  const gold = 'linear-gradient(180deg, #f5e3a3 0%, #d4af37 45%, #a8842a 100%)';

  return (
    <div style={{ background: '#08070a', color: '#f4ead0' }} className="min-h-screen w-full overflow-x-hidden">

      {/* NAV */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-black tracking-tight"
            style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            IMPULSE
          </span>
          <span className="text-xl font-black tracking-tight" style={{ color: '#f4ead0' }}>GUARD</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#a8915a' }}>
          <a href="#how" className="hover:text-white transition-colors">How It Works</a>
          <a href="#proof" className="hover:text-white transition-colors">Results</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <button
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105"
          style={{ background: gold, color: '#0a0805' }}
        >
          Get Started
        </button>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-6"
            style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)', color: '#e8c766' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e8c766' }} />
            Biometric Financial Protection
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
            Your nervous system
            <br />
            just became your
            <br />
            <span
              style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              wealth manager.
            </span>
          </h1>

          <p className="text-lg leading-relaxed mb-8 max-w-md" style={{ color: '#b8a878' }}>
            ImpulseGuard reads your stress response in real time and blocks impulsive checkouts
            before they happen — redirecting every dollar saved straight into your portfolio.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button
              className="px-7 py-4 rounded-xl text-sm font-bold tracking-wide transition-transform hover:scale-105"
              style={{ background: gold, color: '#0a0805', boxShadow: '0 10px 30px rgba(212,175,55,0.3)' }}
            >
              Start Protecting My Wealth
            </button>
            <button
              className="px-7 py-4 rounded-xl text-sm font-bold tracking-wide border transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#f4ead0' }}
            >
              ▶ Watch 60-Sec Demo
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs" style={{ color: '#7a6a45' }}>
            <span>✦ No credit card required</span>
            <span>✦ 14-day free trial</span>
          </div>
        </div>

        {/* LIVE DEMO CARD */}
        <div
          className="rounded-2xl p-6 border relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: 'rgba(212,175,55,0.3)' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,175,55,0.12), transparent 55%)' }}
          />
          <div className="relative">
            <div className="flex justify-between items-center mb-6">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a8915a' }}>
                Live Biometric Feed
              </p>
              <span
                className="text-[10px] font-bold uppercase px-2 py-1 rounded-full border"
                style={{ borderColor: 'rgba(212,175,55,0.4)', color: '#e8c766', background: 'rgba(212,175,55,0.08)' }}
              >
                ● Scanning
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span
                className="text-6xl font-black"
                style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {heartRate}
              </span>
              <span className="text-sm font-medium" style={{ color: '#7a6a45' }}>BPM</span>
            </div>

            <div
              className="border p-4 rounded-xl mb-4"
              style={{ background: '#0c0a06', borderColor: 'rgba(212,175,55,0.15)' }}
            >
              <p className="text-xs font-bold uppercase mb-1" style={{ color: '#7a6a45' }}>Checkout Detected</p>
              <p className="text-lg font-bold" style={{ color: '#f0e4c0' }}>Streetwear Jacket — $120.00</p>
            </div>

            <div
              className="p-4 rounded-xl text-center border"
              style={{ background: 'rgba(180,40,40,0.08)', borderColor: 'rgba(180,40,40,0.25)' }}
            >
              <p className="text-sm font-bold" style={{ color: '#e07a7a' }}>⛔ Transaction Blocked</p>
              <p className="text-xs mt-1" style={{ color: '#a8915a' }}>$120.00 redirected to your vault</p>
            </div>

            <div
              className="mt-6 pt-4 border-t flex justify-between items-baseline"
              style={{ borderColor: 'rgba(212,175,55,0.15)' }}
            >
              <span className="text-xs uppercase tracking-wider" style={{ color: '#7a6a45' }}>Total Saved Today</span>
              <span
                className="text-2xl font-black"
                style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                ${savedTicker.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section id="proof" className="border-y" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ['$4.2M+', 'Wealth Redirected'],
            ['41,000+', 'Transactions Blocked'],
            ['92%', 'Reduction in Impulse Spend'],
            ['4.9/5', 'User Rating']
          ].map(([stat, label]) => (
            <div key={label}>
              <p
                className="text-3xl font-black mb-1"
                style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {stat}
              </p>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#7a6a45' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a8915a' }}>
            How It Works
          </p>
          <h2 className="text-4xl font-black tracking-tight">Three lines of defense for your wallet</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '💓',
              title: 'Biometric Friction',
              desc: 'Ambient stress sensing reads your sympathetic nervous system before you swipe — catching impulse spikes in real time.'
            },
            {
              icon: '⛔',
              title: 'Checkout Interception',
              desc: 'High-stress checkouts are automatically declined at the gateway, instantly redirecting funds into your portfolio.'
            },
            {
              icon: '🔍',
              title: "Dead Man's Switch",
              desc: 'Forgotten subscriptions with 45+ days of zero engagement are auto-paused, recovering silent monthly leakage.'
            }
          ].map(card => (
            <div
              key={card.title}
              className="rounded-2xl p-7 border transition-transform hover:-translate-y-1"
              style={{ background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: 'rgba(212,175,55,0.25)' }}
            >
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

      {/* TESTIMONIAL */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div
          className="rounded-2xl p-10 border text-center"
          style={{ background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: 'rgba(212,175,55,0.25)' }}
        >
          <p className="text-2xl font-medium leading-relaxed mb-6" style={{ color: '#f0e4c0' }}>
            "ImpulseGuard caught three late-night checkouts I would've regretted by morning.
            My savings account has never grown faster without me trying."
          </p>
          <p className="text-sm font-bold" style={{ color: '#e8c766' }}>Maya R. — Early Access User</p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a8915a' }}>
            Pricing
          </p>
          <h2 className="text-4xl font-black tracking-tight">Start saving in minutes</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-8 border"
            style={{ background: '#0c0a06', borderColor: 'rgba(212,175,55,0.2)' }}
          >
            <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#a8915a' }}>Starter</p>
            <p className="text-4xl font-black mb-6" style={{ color: '#f0e4c0' }}>$0<span className="text-base font-medium" style={{ color: '#7a6a45' }}>/mo</span></p>
            <ul className="space-y-3 text-sm mb-8" style={{ color: '#9a8a5a' }}>
              <li>✓ Biometric checkout alerts</li>
              <li>✓ 1 connected card</li>
              <li>✓ Weekly savings summary</li>
            </ul>
            <button
              className="w-full py-3 rounded-xl text-sm font-bold border"
              style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#f4ead0' }}
            >
              Get Started Free
            </button>
          </div>

          <div
            className="rounded-2xl p-8 border-2 relative"
            style={{ background: 'linear-gradient(160deg, #15120a, #1f190d)', borderColor: 'rgba(212,175,55,0.5)' }}
          >
            <span
              className="absolute -top-3 right-6 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
              style={{ background: gold, color: '#0a0805' }}
            >
              Most Popular
            </span>
            <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#e8c766' }}>Vault Pro</p>
            <p className="text-4xl font-black mb-6" style={{ color: '#f0e4c0' }}>$19<span className="text-base font-medium" style={{ color: '#7a6a45' }}>/mo</span></p>
            <ul className="space-y-3 text-sm mb-8" style={{ color: '#cdbb8a' }}>
              <li>✓ Real-time checkout interception</li>
              <li>✓ Unlimited connected cards</li>
              <li>✓ Subscription dead man's switch</li>
              <li>✓ Automated wealth redirection</li>
            </ul>
            <button
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: gold, color: '#0a0805' }}
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
          Stop spending on impulse.
          <br />
          Start building on instinct.
        </h2>
        <button
          className="px-8 py-4 rounded-xl text-sm font-bold tracking-wide transition-transform hover:scale-105"
          style={{ background: gold, color: '#0a0805', boxShadow: '0 10px 30px rgba(212,175,55,0.3)' }}
        >
          Protect My Wealth Now
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
