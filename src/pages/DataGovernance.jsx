import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Lock, Eye, EyeOff, FileText, AlertTriangle,
  CheckCircle, XCircle, Users, Database, BrainCircuit,
  Baby, Activity, Globe, Server, KeyRound, BellRing,
  ChevronRight, RefreshCw, Download, Search, Filter,
  Zap, Clock, TrendingUp, BarChart2, Layers, Settings,
  Moon, Sun, ArrowUpRight, Info, Wifi, WifiOff
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const MODULES = [
  { id: 'genetic', name: 'Genetic Markers', description: 'Raw DNA sequence data and variant calls.', sensitivity: 'Critical', icon: '🧬', size: '2.4 GB' },
  { id: 'health', name: 'Health Records', description: 'Clinical history, lab results, and vitals.', sensitivity: 'Critical', icon: '🏥', size: '890 MB' },
  { id: 'neurological', name: 'Neurological Data', description: 'Brain scan results and cognitive assessments.', sensitivity: 'High', icon: '🧠', size: '1.1 GB' },
  { id: 'lifestyle', name: 'Lifestyle Metrics', description: 'Activity levels, sleep patterns, and diet logs.', sensitivity: 'Medium', icon: '📊', size: '340 MB' },
  { id: 'ancestry', name: 'Ancestry Data', description: 'Geographic origin and ethnic composition.', sensitivity: 'Low', icon: '🌍', size: '120 MB' },
  { id: 'microbiome', name: 'Microbiome Profile', description: 'Gut bacteria composition and diversity index.', sensitivity: 'High', icon: '🔬', size: '560 MB' },
];

const THIRD_PARTIES = [
  { id: 1, name: 'MediShare Research', type: 'Research Institute', accessLevel: 'Anonymized Genetic', lastAccess: '2026-06-24 14:30', status: 'Active', risk: 'Low', requests: 142 },
  { id: 2, name: 'FitTrack Pro', type: 'Wellness App', accessLevel: 'Lifestyle Only', lastAccess: '2026-06-25 09:15', status: 'Active', risk: 'Low', requests: 89 },
  { id: 3, name: 'PharmaCorp Trials', type: 'Pharmaceutical', accessLevel: 'None (Revoked)', lastAccess: '2026-05-10 11:00', status: 'Revoked', risk: 'High', requests: 0 },
  { id: 4, name: 'NeuroLab AI', type: 'AI Diagnostics', accessLevel: 'Anonymized Neural', lastAccess: '2026-06-25 16:42', status: 'Pending', risk: 'Medium', requests: 23 },
];

const INITIAL_LOGS = [
  { id: 1, timestamp: '2026-06-25 10:00:01', actor: 'System', action: 'AES-256 Encryption Key Rotated', status: 'Success', category: 'Security' },
  { id: 2, timestamp: '2026-06-24 14:30:22', actor: 'MediShare Research', action: 'Requested Anonymized Genetic Dataset', status: 'Approved', category: 'Access' },
  { id: 3, timestamp: '2026-06-23 08:15:00', actor: 'User', action: 'Updated Privacy Settings', status: 'Success', category: 'User' },
  { id: 4, timestamp: '2026-06-22 19:44:11', actor: 'System', action: 'GDPR Compliance Scan Completed', status: 'Success', category: 'Compliance' },
  { id: 5, timestamp: '2026-06-21 03:12:55', actor: 'External', action: 'Brute Force Attempt on API Gateway', status: 'Blocked', category: 'Threat' },
];

const COMPLIANCE_FRAMEWORKS = [
  { name: 'GDPR', score: 98, color: '#22c55e' },
  { name: 'HIPAA', score: 94, color: '#3b82f6' },
  { name: 'COPPA', score: 100, color: '#a855f7' },
  { name: 'CCPA', score: 91, color: '#f59e0b' },
];

// ── Micro Components ─────────────────────────────────────────────────────────

const Pulse = ({ color = '#22c55e' }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: color }} />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
  </span>
);

const Badge = ({ children, color }) => {
  const map = {
    Critical: 'bg-red-950 text-red-400 border-red-800',
    High: 'bg-orange-950 text-orange-400 border-orange-800',
    Medium: 'bg-yellow-950 text-yellow-400 border-yellow-800',
    Low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    Active: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    Revoked: 'bg-red-950 text-red-400 border-red-800',
    Pending: 'bg-yellow-950 text-yellow-400 border-yellow-800',
    Success: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    Approved: 'bg-blue-950 text-blue-400 border-blue-800',
    Blocked: 'bg-red-950 text-red-400 border-red-800',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${map[children] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
      {children}
    </span>
  );
};

const Toggle = ({ enabled, onToggle, label, disabled }) => (
  <button
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    aria-label={label}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
      disabled ? 'opacity-40 cursor-not-allowed' :
      enabled ? 'bg-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-700'
    }`}
  >
    <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-md`} />
  </button>
);

const GlassCard = ({ children, className = '', glow }) => (
  <div className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-5 shadow-xl transition-all duration-300 ${glow ? 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]' : ''} ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, children, sub }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 bg-cyan-500/10 rounded-lg">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <h2 className="text-base font-semibold text-white tracking-tight">{children}</h2>
    </div>
    {sub && <p className="text-xs text-zinc-500 mt-1 ml-9">{sub}</p>}
  </div>
);

// ── Compliance Ring ───────────────────────────────────────────────────────────

const ComplianceRing = ({ name, score, color }) => {
  const r = 28, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="rotate-[-90deg]" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score}</span>
      </div>
      <span className="text-[11px] text-zinc-400 font-medium">{name}</span>
    </div>
  );
};

// ── Age Gate ─────────────────────────────────────────────────────────────────

const AgeGate = ({ onVerify }) => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4"
    style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 60%)' }}>
    <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
      <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Baby className="w-7 h-7 text-cyan-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Age Verification Required</h2>
      <p className="text-zinc-400 text-sm mb-1">COPPA · GDPR-K · Children's Online Privacy</p>
      <p className="text-zinc-500 text-xs mb-7">This platform stores sensitive biometric and health data. Access is restricted per international child data protection law.</p>
      <div className="space-y-3">
        <button onClick={() => onVerify(true)}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] text-sm">
          I am 18 or older — Full Access
        </button>
        <button onClick={() => onVerify(false)}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors text-sm border border-zinc-700">
          Under 18 — Guardian Mode
        </button>
      </div>
      <p className="text-[10px] text-zinc-600 mt-5">Age data is never stored. Verification is session-only.</p>
    </div>
  </div>
);

// ── Breach Modal ──────────────────────────────────────────────────────────────

const BreachModal = ({ onClose }) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < 3) { const t = setTimeout(() => setStep(s => s + 1), 700); return () => clearTimeout(t); }
  }, [step]);
  const steps = [
    { label: 'Detecting anomalous traffic pattern...', done: step > 0 },
    { label: 'Isolating affected session...', done: step > 1 },
    { label: 'IP blocked. Session terminated.', done: step > 2 },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border-2 border-red-700/70 rounded-2xl max-w-md w-full p-6 shadow-[0_0_60px_rgba(220,38,38,0.25)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-red-900/30 rounded-xl border border-red-800/50">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Breach Simulation Active</h3>
            <p className="text-red-400 text-xs">Incident #BR-2026-8892 · Live Response</p>
          </div>
          <Pulse color="#ef4444" />
        </div>
        <div className="space-y-2 mb-5">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${s.done ? 'bg-red-950/30 border-red-800/40' : 'bg-zinc-900 border-zinc-800'}`}>
              {s.done ? <CheckCircle className="w-4 h-4 text-red-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-600 shrink-0" />}
              <span className="text-xs text-zinc-300">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-black/40 rounded-xl p-4 mb-5 border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
          <p><span className="text-zinc-500">Type:</span> <span className="text-zinc-200">Unauthorized API Access Attempt</span></p>
          <p><span className="text-zinc-500">Origin:</span> <span className="text-zinc-200">185.234.xx.xx (masked)</span></p>
          <p><span className="text-zinc-500">Data Exfiltrated:</span> <span className="text-emerald-400 font-semibold">None — Local-only architecture protected.</span></p>
        </div>
        <button onClick={onClose} disabled={step < 3}
          className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-wait text-white font-semibold rounded-xl transition-colors text-sm">
          {step < 3 ? 'Responding...' : 'Acknowledge & Close'}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function DataGovernance() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [permissions, setPermissions] = useState({ genetic: true, health: true, neurological: false, lifestyle: false, ancestry: true, microbiome: true });
  const [aiOptOut, setAiOptOut] = useState(true);
  const [showBreach, setShowBreach] = useState(false);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');
  const [dataMode, setDataMode] = useState('federated'); // federated | local | hybrid
  const [encryptionLevel, setEncryptionLevel] = useState('AES-256');
  const [retentionDays, setRetentionDays] = useState(90);
  const [showExportToast, setShowExportToast] = useState(false);

  const addLog = (actor, action, status, category = 'User') => {
    setLogs(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor, action, status, category
    }, ...prev]);
  };

  const handleVerify = (isAdult) => {
    setAgeVerified(true);
    setIsMinor(!isAdult);
    addLog('System', isAdult ? 'Age Verification Passed' : 'Minor Mode Activated', 'Success', 'Compliance');
  };

  const togglePermission = (id) => {
    if (isMinor && (id === 'genetic' || id === 'health' || id === 'neurological')) return;
    setPermissions(p => ({ ...p, [id]: !p[id] }));
    const mod = MODULES.find(m => m.id === id);
    addLog('User', `${!permissions[id] ? 'Enabled' : 'Disabled'} sharing: ${mod.name}`, 'Success', 'Access');
  };

  const handleExport = () => {
    addLog('User', 'Exported Audit Report (PDF)', 'Success', 'Compliance');
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const totalSize = MODULES.filter(m => permissions[m.id]).reduce((acc, m) => {
    const n = parseFloat(m.size); const u = m.size.includes('GB') ? 1024 : 1;
    return acc + n * u;
  }, 0);

  if (!ageVerified) return <AgeGate onVerify={handleVerify} />;

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-cyan-500/25"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(6,182,212,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.04) 0%, transparent 50%)' }}>

      {/* Breach Modal */}
      {showBreach && <BreachModal onClose={() => setShowBreach(false)} />}

      {/* Export Toast */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-zinc-200">Audit report exported successfully</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">DataGuard</span>
              <span className="text-cyan-500 font-bold text-sm"> Pro</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-emerald-950/50 border border-emerald-800/50 rounded-full">
              <Pulse color="#22c55e" />
              <span className="text-[11px] text-emerald-400 font-medium">All Systems Nominal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMinor && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/50 border border-blue-800/50 rounded-full">
                <Baby className="w-3 h-3 text-blue-400" />
                <span className="text-[11px] text-blue-400 font-semibold">GUARDIAN MODE</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Server className="w-3 h-3" />
              <span>Local-Only Storage</span>
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors">
              <Download className="w-3 h-3" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Sharing', value: `${enabledCount} / ${MODULES.length}`, sub: 'Data modules', icon: Layers, color: 'cyan' },
            { label: 'Data Shared', value: `${(totalSize / 1024).toFixed(1)} GB`, sub: 'Estimated exposure', icon: Database, color: 'purple' },
            { label: 'Encryption', value: encryptionLevel, sub: 'Military-grade', icon: Lock, color: 'emerald' },
            { label: 'Breach Attempts', value: '1 Blocked', sub: 'Last 30 days', icon: AlertTriangle, color: 'red' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <GlassCard key={label} glow>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-zinc-500 font-medium">{label}</span>
                <div className={`p-1.5 rounded-lg bg-${color}-500/10`}>
                  <Icon className={`w-3.5 h-3.5 text-${color}-400`} />
                </div>
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>
            </GlassCard>
          ))}
        </div>

        {/* Compliance Row */}
        <GlassCard>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Regulatory Compliance</h3>
              <p className="text-xs text-zinc-500">Real-time framework adherence scores</p>
            </div>
            <div className="flex items-center gap-6">
              {COMPLIANCE_FRAMEWORKS.map(f => <ComplianceRing key={f.name} {...f} />)}
            </div>
          </div>
        </GlassCard>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 w-full sm:w-auto">
          {['permissions', 'integrations', 'audit', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                activeTab === tab ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-zinc-400 hover:text-zinc-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Permissions */}
        {activeTab === 'permissions' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <SectionTitle icon={KeyRound} sub="Toggle per-module data sharing. Critical modules are restricted in Guardian Mode.">
                Per-Module Data Permissions
              </SectionTitle>
              {MODULES.map(mod => {
                const locked = isMinor && ['genetic', 'health', 'neurological'].includes(mod.id);
                return (
                  <GlassCard key={mod.id} glow className={`transition-all duration-300 ${locked ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl w-10 text-center shrink-0">{mod.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-white">{mod.name}</span>
                          <Badge>{mod.sensitivity}</Badge>
                          {locked && <span className="text-[10px] text-blue-400 bg-blue-950/50 border border-blue-800/50 px-1.5 py-0.5 rounded font-semibold">GUARDIAN LOCKED</span>}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{mod.description}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">Data size: {mod.size}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Toggle enabled={permissions[mod.id]} onToggle={() => togglePermission(mod.id)} label={mod.name} disabled={locked} />
                        <span className={`text-[10px] font-semibold ${permissions[mod.id] ? 'text-cyan-400' : 'text-zinc-600'}`}>
                          {permissions[mod.id] ? 'Sharing' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <div className="space-y-4">
              {/* AI Training */}
              <GlassCard className="border-l-2 border-l-purple-500">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-xl shrink-0">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">AI Training Opt-Out</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Control whether anonymized data trains diagnostic AI or LLMs.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <div>
                    <p className="text-xs font-medium text-zinc-300">AI Training Use</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${aiOptOut ? 'text-red-400' : 'text-emerald-400'}`}>
                      {aiOptOut ? 'Opted OUT' : 'Opted IN'}
                    </p>
                  </div>
                  <Toggle enabled={!aiOptOut} onToggle={() => {
                    setAiOptOut(!aiOptOut);
                    addLog('User', aiOptOut ? 'Opted IN to AI Training' : 'Opted OUT of AI Training', 'Success', 'Privacy');
                  }} label="AI Training" />
                </div>
                <p className="text-[10px] text-zinc-600 mt-3">Policy: Strict Opt-In by default. Your data is never used without explicit consent.</p>
              </GlassCard>

              {/* Data Retention */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-sm text-white">Data Retention</h3>
                </div>
                <div className="space-y-2">
                  {[30, 90, 180, 365].map(d => (
                    <button key={d} onClick={() => { setRetentionDays(d); addLog('User', `Retention set to ${d} days`, 'Success', 'Privacy'); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs border transition-all ${
                        retentionDays === d ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}>
                      <span>{d} days</span>
                      {retentionDays === d && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Simulate Breach */}
              <button onClick={() => { setShowBreach(true); addLog('External Threat', 'Unauthorized Access Attempt Detected', 'Blocked', 'Threat'); }}
                className="w-full p-4 rounded-2xl border border-red-800/40 bg-red-950/20 hover:bg-red-950/30 hover:border-red-700/60 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-900/30 rounded-xl">
                    <BellRing className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-300 group-hover:text-red-200">Simulate Breach Test</p>
                    <p className="text-[11px] text-zinc-500">Run an incident response drill</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-600 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tab: Integrations */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <SectionTitle icon={Globe} sub="Third-party services with access to your health data">
              Active Integrations
            </SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              {THIRD_PARTIES.map(p => (
                <GlassCard key={p.id} glow>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-white">{p.name}</h3>
                      <p className="text-xs text-zinc-500">{p.type}</p>
                    </div>
                    <Badge>{p.status}</Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Access Level</span>
                      <span className="text-zinc-300 font-medium">{p.accessLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Risk Score</span>
                      <Badge>{p.risk}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total Requests</span>
                      <span className="text-zinc-300">{p.requests.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Last Access</span>
                      <span className="text-zinc-400">{p.lastAccess}</span>
                    </div>
                  </div>
                  {p.status === 'Active' && (
                    <button onClick={() => addLog('User', `Revoked access for ${p.name}`, 'Success', 'Access')}
                      className="mt-4 w-full py-2 border border-red-800/50 text-red-400 rounded-lg text-xs hover:bg-red-950/30 transition-colors font-medium">
                      Revoke Access
                    </button>
                  )}
                  {p.status === 'Pending' && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button className="py-2 bg-cyan-600 text-white rounded-lg text-xs hover:bg-cyan-500 transition-colors font-medium">Approve</button>
                      <button className="py-2 border border-zinc-700 text-zinc-400 rounded-lg text-xs hover:bg-zinc-800 transition-colors">Deny</button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Audit */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-600 transition-colors" />
              </div>
              <button onClick={() => addLog('System', 'Manual Log Refresh', 'Success', 'System')}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:border-zinc-600 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
            <GlassCard className="p-0 overflow-hidden">
              <div className="divide-y divide-zinc-800/60">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'Success' ? 'bg-emerald-500' :
                      log.status === 'Blocked' ? 'bg-red-500' :
                      log.status === 'Approved' ? 'bg-cyan-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{log.action}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-zinc-500">{log.actor}</span>
                        <span className="text-[11px] text-zinc-600">{log.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded">{log.category}</span>
                      <Badge>{log.status}</Badge>
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="py-12 text-center text-zinc-600 text-sm">No logs match your search.</div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <GlassCard>
              <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /> Encryption Level</h3>
              {['AES-128', 'AES-256', 'ChaCha20-Poly1305'].map(level => (
                <button key={level} onClick={() => { setEncryptionLevel(level); addLog('User', `Encryption changed to ${level}`, 'Success', 'Security'); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs border mb-2 transition-all ${
                    encryptionLevel === level ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300' : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}>
                  {level}
                  {encryptionLevel === level && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </GlassCard>
            <GlassCard>
              <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-purple-400" /> Storage Architecture</h3>
              {['local', 'federated', 'hybrid'].map(mode => (
                <button key={mode} onClick={() => { setDataMode(mode); addLog('User', `Storage mode changed to ${mode}`, 'Success', 'System'); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs border mb-2 transition-all capitalize ${
                    dataMode === mode ? 'bg-purple-950/40 border-purple-800/50 text-purple-300' : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}>
                  {mode}
                  {dataMode === mode && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              ))}
            </GlassCard>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 mt-12 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-600">
          <span>DataGuard Pro · GDPR · HIPAA · COPPA · CCPA Compliant</span>
          <span>All data processed locally. Zero cloud exposure.</span>
        </div>
      </footer>
    </div>
  );
}
