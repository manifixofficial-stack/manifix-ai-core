import React, { useState } from 'react';
import ImpulseGuard from './modules/ImpulseGuard';

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState('guard');
  const [userName] = useState('Maya R.');

  const gold = 'linear-gradient(180deg, #f5e3a3 0%, #d4af37 45%, #a8842a 100%)';
  const panel = { background: 'linear-gradient(160deg, #100d08, #1a150c)', borderColor: 'rgba(212,175,55,0.25)' };

  const navItems = [
    { id: 'guard', icon: '🛡️', label: 'Impulse Guard' },
    { id: 'vault', icon: '💰', label: 'Vault History' },
    { id: 'subs', icon: '🔍', label: 'Subscriptions' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#08070a', color: '#f4ead0' }}>

      {/* SIDEBAR */}
      <aside
        className="w-64 hidden lg:flex flex-col border-r shrink-0"
        style={{ borderColor: 'rgba(212,175,55,0.15)', background: '#0a0907' }}
      >
        <div className="px-6 py-6 flex items-center gap-2">
          <span
            className="text-lg font-black tracking-tight"
            style={{ backgroundImage: gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            IMPULSE
          </span>
          <span className="text-lg font-black tracking-tight">GUARD</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-left"
              style={
                activeTab === item.id
                  ? { background: 'rgba(212,175,55,0.1)', color: '#e8c766', border: '1px solid rgba(212,175,55,0.3)' }
                  : { color: '#8a7a52', border: '1px solid transparent' }
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div
          className="px-4 py-5 mx-4 mb-4 rounded-xl border"
          style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.2)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#7a6a45' }}>
            Private Space
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#9a8a5a' }}>
            All biometric processing for this session runs on-device. Nothing here is uploaded.
          </p>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOPBAR */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(212,175,55,0.15)', background: '#0a0907' }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#7a6a45' }}>
              Private Workspace
            </p>
            <h1 className="text-lg font-bold" style={{ color: '#f0e4c0' }}>
              Welcome back, {userName.split(' ')[0]}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#e8c766', background: 'rgba(212,175,55,0.06)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e8c766' }} />
              Live Session
            </span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: gold, color: '#0a0805' }}
            >
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* MOBILE TAB BAR */}
        <div
          className="flex lg:hidden overflow-x-auto gap-2 px-4 py-3 border-b"
          style={{ borderColor: 'rgba(212,175,55,0.15)', background: '#0a0907' }}
        >
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={
                activeTab === item.id
                  ? { background: 'rgba(212,175,55,0.1)', color: '#e8c766', border: '1px solid rgba(212,175,55,0.3)' }
                  : { color: '#8a7a52', border: '1px solid rgba(212,175,55,0.1)' }
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'guard' && <ImpulseGuard />}

          {activeTab === 'vault' && (
            <PlaceholderPane
              icon="💰"
              title="Vault History"
              desc="Detailed transaction-by-transaction redirection history will appear here once you've blocked your first impulse checkout."
              panel={panel}
            />
          )}

          {activeTab === 'subs' && (
            <PlaceholderPane
              icon="🔍"
              title="Subscription Audit Log"
              desc="A running record of every subscription paused by the Dead Man's Switch, with reclaimed monthly totals."
              panel={panel}
            />
          )}

          {activeTab === 'settings' && (
            <PlaceholderPane
              icon="⚙️"
              title="Settings"
              desc="Manage connected cards, biometric sensitivity thresholds, and notification preferences."
              panel={panel}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function PlaceholderPane({ icon, title, desc, panel }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 border"
        style={{ background: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.25)' }}
      >
        {icon}
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-3" style={{ color: '#f0e4c0' }}>{title}</h2>
      <p className="text-sm leading-relaxed" style={{ color: '#9a8a5a' }}>{desc}</p>
      <div className="mt-8 rounded-2xl p-8 border" style={panel}>
        <p className="text-xs uppercase tracking-wider font-bold" style={{ color: '#7a6a45' }}>
          Coming Soon
        </p>
      </div>
    </div>
  );
}
