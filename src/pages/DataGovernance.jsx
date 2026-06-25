import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  Database, 
  BrainCircuit, 
  Baby, 
  Activity,
  Globe,
  Server,
  KeyRound,
  BellRing
} from 'lucide-react';

// --- Mock Data & Constants ---

const MODULES = [
  { id: 'genetic', name: 'Genetic Markers', description: 'Raw DNA sequence data and variant calls.', sensitivity: 'High' },
  { id: 'health', name: 'Health Records', description: 'Clinical history, lab results, and vitals.', sensitivity: 'Critical' },
  { id: 'lifestyle', name: 'Lifestyle Metrics', description: 'Activity levels, sleep patterns, and diet logs.', sensitivity: 'Medium' },
  { id: 'ancestry', name: 'Ancestry Data', description: 'Geographic origin and ethnic composition.', sensitivity: 'Low' },
];

const THIRD_PARTIES = [
  { id: 1, name: 'MediShare Research', type: 'Research Institute', accessLevel: 'Anonymized Genetic', lastAccess: '2026-06-24 14:30', status: 'Active' },
  { id: 2, name: 'FitTrack Pro', type: 'Wellness App', accessLevel: 'Lifestyle Only', lastAccess: '2026-06-25 09:15', status: 'Active' },
  { id: 3, name: 'PharmaCorp Trials', type: 'Pharmaceutical', accessLevel: 'None (Revoked)', lastAccess: '2026-05-10 11:00', status: 'Revoked' },
];

const INITIAL_LOGS = [
  { id: 1, timestamp: '2026-06-25 10:00:01', actor: 'System', action: 'Data Encryption Refresh', status: 'Success' },
  { id: 2, timestamp: '2026-06-24 14:30:22', actor: 'MediShare Research', action: 'Requested Anonymized Dataset', status: 'Approved' },
  { id: 3, timestamp: '2026-06-23 08:15:00', actor: 'User', action: 'Updated Privacy Settings', status: 'Success' },
];

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900/80 border border-yellow-600/30 rounded-xl p-6 backdrop-blur-sm shadow-lg ${className}`}>
    {children}
  </div>
);

const Toggle = ({ enabled, onToggle, label }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black ${
      enabled ? 'bg-yellow-600' : 'bg-zinc-700'
    }`}
  >
    <span className="sr-only">{label}</span>
    <span
      className={`${
        enabled ? 'translate-x-6' : 'translate-x-1'
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </button>
);

export default function DataGovernance() {
  // State
  const [permissions, setPermissions] = useState({
    genetic: true,
    health: true,
    lifestyle: false,
    ancestry: true,
  });
  
  const [aiOptOut, setAiOptOut] = useState(true);
  const [isMinorMode, setIsMinorMode] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [showBreachModal, setShowBreachModal] = useState(false);
  const [breachSimulated, setBreachSimulated] = useState(false);

  // Handlers
  const togglePermission = (moduleId) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
    
    addLog('User', `Toggled permission for ${MODULES.find(m => m.id === moduleId).name}`, 'Success');
  };

  const addLog = (actor, action, status) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor,
      action,
      status
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const simulateBreach = () => {
    setShowBreachModal(true);
    setBreachSimulated(true);
    addLog('External Threat', 'Unauthorized Access Attempt Detected', 'Blocked');
  };

  const handleAgeVerification = (isAdult) => {
    if (isAdult) {
      setAgeVerified(true);
      setIsMinorMode(false);
      addLog('System', 'Age Verification Passed', 'Success');
    } else {
      setIsMinorMode(true);
      setAgeVerified(true);
      addLog('System', 'Minor Mode Activated - Restricted Access', 'Info');
    }
  };

  // Age Gate Component
  if (!ageVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-yellow-600/50 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.1)]"
        >
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Baby className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Children's Health Protection</h2>
          <p className="text-zinc-400 mb-8">
            To comply with COPPA and GDPR-K, please verify your age to access sensitive health governance features.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => handleAgeVerification(true)}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors"
            >
              I am 18 or older
            </button>
            <button 
              onClick={() => handleAgeVerification(false)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
            >
              I am under 18 (Guardian Mode)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-yellow-500/30">
      
      {/* Breach Notification Modal */}
      <AnimatePresence>
        {showBreachModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              className="bg-zinc-900 border-2 border-red-600 rounded-xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Security Alert Simulation</h3>
                  <p className="text-red-400 text-sm">Potential Data Breach Detected</p>
                </div>
              </div>
              <div className="bg-black/50 p-4 rounded-lg mb-6 border border-red-900/30">
                <p className="text-zinc-300 text-sm mb-2">
                  <strong>Incident ID:</strong> #BR-2026-8892
                </p>
                <p className="text-zinc-300 text-sm mb-2">
                  <strong>Type:</strong> Unauthorized API Access Attempt
                </p>
                <p className="text-zinc-300 text-sm">
                  <strong>Action Taken:</strong> IP Blocked & Session Terminated. No data was exfiltrated due to local-only storage architecture.
                </p>
              </div>
              <button 
                onClick={() => setShowBreachModal(false)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
              >
                Acknowledge & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">DATA<span className="text-yellow-500">GOVERNANCE</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {isMinorMode && (
              <span className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded-full text-xs font-bold flex items-center gap-2">
                <Baby className="w-3 h-3" /> GUARDIAN MODE ACTIVE
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Database className="w-3 h-3" /> Local Storage Only
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-green-900/20 rounded-lg text-green-500">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Encryption Status</p>
              <p className="text-white font-bold">AES-256 Active</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-yellow-900/20 rounded-lg text-yellow-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Shared With</p>
              <p className="text-white font-bold">2 Third Parties</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 cursor-pointer hover:border-red-500/50 transition-colors" onClick={simulateBreach}>
            <div className="p-3 bg-red-900/20 rounded-lg text-red-500">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">System Health</p>
              <p className="text-white font-bold">Simulate Breach Test</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Permissions & AI */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Module Permissions */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-yellow-500" /> Per-Module Data Permissions
                </h2>
                <span className="text-xs text-zinc-500">WHO Dashboard Integration Ready</span>
              </div>
              
              <div className="grid gap-4">
                {MODULES.map((module) => (
                  <Card key={module.id} className="flex items-center justify-between group hover:border-yellow-500/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-lg ${
                        permissions[module.id] ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {module.sensitivity === 'Critical' ? <AlertTriangle className="w-5 h-5" /> : 
                         module.sensitivity === 'High' ? <Lock className="w-5 h-5" /> : 
                         <Database className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-yellow-500 transition-colors">{module.name}</h3>
                        <p className="text-sm text-zinc-400">{module.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            module.sensitivity === 'Critical' ? 'border-red-900 text-red-400 bg-red-950/30' :
                            module.sensitivity === 'High' ? 'border-orange-900 text-orange-400 bg-orange-950/30' :
                            'border-zinc-700 text-zinc-400 bg-zinc-900'
                          }`}>
                            Sensitivity: {module.sensitivity}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Toggle 
                        enabled={permissions[module.id]} 
                        onToggle={() => togglePermission(module.id)}
                        label={`Toggle ${module.name}`}
                      />
                      <span className={`text-xs font-medium ${permissions[module.id] ? 'text-green-500' : 'text-zinc-500'}`}>
                        {permissions[module.id] ? 'Sharing Enabled' : 'Private'}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* AI Training Opt-Out */}
            <section>
              <Card className="border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 bg-purple-900/20 rounded-lg text-purple-500">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">AI Training Enforcement</h3>
                      <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                        Control whether your anonymized genetic data is used to train large language models or diagnostic AI systems. 
                        Current policy: <span className="text-white font-medium">Strict Opt-In</span>.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Toggle 
                      enabled={aiOptOut} 
                      onToggle={() => {
                        setAiOptOut(!aiOptOut);
                        addLog('User', aiOptOut ? 'Opted IN to AI Training' : 'Opted OUT of AI Training', 'Success');
                      }}
                      label="AI Opt-Out"
                    />
                    <span className="text-xs text-zinc-500 mt-2">
                      {aiOptOut ? 'Currently Opted OUT' : 'Currently Opted IN'}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

          </div>

          {/* Right Column: Audit Log & Integrations */}
          <div className="space-y-8">
            
            {/* Third Party Integrations */}
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-yellow-500" /> Integration Audit Log
              </h2>
              <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-zinc-950 border-b border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-300">Active Connections</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                  {THIRD_PARTIES.map((party) => (
                    <div key={party.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-white text-sm">{party.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          party.status === 'Active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}>
                          {party.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 space-y-1">
                        <p>Type: {party.type}</p>
                        <p>Access: {party.accessLevel}</p>
                        <p className="text-zinc-600">Last: {party.lastAccess}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center">
                  <button className="text-xs text-yellow-500 hover:text-yellow-400 font-medium">
                    View Full Audit Trail
                  </button>
                </div>
              </Card>
            </section>

            {/* Recent Activity Log */}
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-yellow-500" /> Recent System Events
              </h2>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'Success' ? 'bg-green-500' : 
                      log.status === 'Blocked' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="overflow-hidden">
                      <p className="text-zinc-300 truncate">{log.action}</p>
                      <div className="flex justify-between text-xs text-zinc-600 mt-1">
                        <span>{log.actor}</span>
                        <span>{log.timestamp.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
