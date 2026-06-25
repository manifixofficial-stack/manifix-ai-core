import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Heart, 
  Moon, 
  Watch, 
  Bluetooth, 
  Wifi, 
  Battery, 
  ChevronRight, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  Droplets,
  Footprints,
  Clock
} from 'lucide-react';

// --- Utility Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900/50 backdrop-blur-md border border-yellow-500/20 rounded-xl p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "yellow" }) => (
  <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
    {children}
  </span>
);

const ProgressBar = ({ value, max = 100, color = "bg-yellow-500" }) => (
  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${(value / max) * 100}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`h-full ${color}`}
    />
  </div>
);

// --- Main Component ---

export default function WearableSync() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real-time Data States
  const [hrvData, setHrvData] = useState([]);
  const [currentHRV, setCurrentHRV] = useState(65);
  const [steps, setSteps] = useState(0);
  const [sleepStages, setSleepStages] = useState({ deep: 0, light: 0, rem: 0 });
  const [spo2, setSpo2] = useState(98);
  const [batteryLevel, setBatteryLevel] = useState(85);

  // Simulate Web Bluetooth API Connection
  const handleConnect = async () => {
    setIsScanning(true);
    
    // In a real app, this would be navigator.bluetooth.requestDevice(...)
    // We simulate the delay and connection success here
    setTimeout(() => {
      setConnectedDevice({
        name: "GoldPulse Pro X",
        id: "BT-7723-XJ",
        manufacturer: "WearableSync Inc.",
        firmware: "v2.4.1"
      });
      setIsScanning(false);
      startDataStream();
    }, 2500);
  };

  // Simulate Real-time Data Stream
  const startDataStream = () => {
    // HRV Simulation
    const hrvInterval = setInterval(() => {
      setCurrentHRV(prev => {
        const change = Math.floor(Math.random() * 10) - 5;
        const newVal = Math.max(40, Math.min(120, prev + change));
        setHrvData(prevData => [...prevData.slice(-19), newVal]);
        return newVal;
      });
    }, 2000);

    // Step Count Sync Simulation
    const stepInterval = setInterval(() => {
      setSteps(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    // SpO2 Monitoring
    const spo2Interval = setInterval(() => {
      setSpo2(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(95, Math.min(100, prev + change));
      });
    }, 3000);

    // Cleanup not implemented for brevity in this demo, but would be needed in prod
    return () => {
      clearInterval(hrvInterval);
      clearInterval(stepInterval);
      clearInterval(spo2Interval);
    };
  };

  // Mock Initial Data Load
  useEffect(() => {
    if (connectedDevice) {
      setSteps(8432);
      setSleepStages({ deep: 95, light: 180, rem: 65 });
      setHrvData([60, 62, 65, 63, 68, 70, 65, 62, 60, 58]);
    }
  }, [connectedDevice]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-yellow-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-700 flex items-center justify-center shadow-lg shadow-yellow-900/20">
              <Watch className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Wearable<span className="text-yellow-500">Sync</span></h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Health Bridge Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {connectedDevice ? (
              <div className="flex items-center gap-3 bg-zinc-900/80 border border-yellow-500/30 px-4 py-2 rounded-full">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-yellow-400">{connectedDevice.name}</span>
                  <span className="text-[10px] text-zinc-500">Connected via BLE 5.2</span>
                </div>
                <Bluetooth className="w-5 h-5 text-blue-500 animate-pulse" />
                <div className="h-6 w-px bg-zinc-800 mx-2" />
                <div className="flex items-center gap-1 text-zinc-400">
                  <Battery className="w-4 h-4" />
                  <span className="text-xs">{batteryLevel}%</span>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleConnect}
                disabled={isScanning}
                className="group relative px-6 py-3 bg-zinc-900 border border-yellow-500/50 rounded-full overflow-hidden transition-all hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="flex items-center gap-2 text-yellow-500 font-medium">
                  {isScanning ? (
                    <>
                      <Wifi className="w-4 h-4 animate-spin" /> Scanning...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4" /> Pair Device
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </header>

        {!connectedDevice && !isScanning ? (
          // Empty State
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border border-yellow-500/20 animate-ping" />
              <Watch className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">No Device Connected</h2>
            <p className="text-zinc-500 max-w-md mb-8">
              Connect your Fitbit, Garmin, or Apple Health compatible device to enable real-time biometric streaming and automatic data synchronization.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {['Fitbit OS', 'Garmin Connect', 'Apple Health'].map((platform) => (
                <div key={platform} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-sm">
                  Supports {platform}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          // Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Navigation & Quick Stats */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Modules</h3>
                {[
                  { id: 'dashboard', label: 'Live Dashboard', icon: Activity },
                  { id: 'stress', label: 'Stress & HRV', icon: Heart },
                  { id: 'activity', label: 'Activity Log', icon: Footprints },
                  { id: 'sleep', label: 'Sleep Analysis', icon: Moon },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      activeTab === item.id 
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </Card>

              <Card>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400 text-sm">Daily Goal</span>
                  <span className="text-yellow-400 font-bold">84%</span>
                </div>
                <ProgressBar value={84} color="bg-gradient-to-r from-yellow-600 to-yellow-400" />
                <div className="mt-4 flex justify-between text-xs text-zinc-500">
                  <span>Steps: {steps.toLocaleString()}</span>
                  <span>Goal: 10,000</span>
                </div>
              </Card>
            </div>

            {/* Right Column: Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Top Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* HRV Card */}
                <Card className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Heart className="w-24 h-24 text-red-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Activity className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-zinc-400 text-sm font-medium">Real-time HRV</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{currentHRV}</span>
                    <span className="text-sm text-zinc-500 mb-1">ms</span>
                  </div>
                  <div className="h-16 w-full flex items-end gap-1 mt-4">
                    {hrvData.map((val, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${(val / 120) * 100}%` }}
                        className="flex-1 bg-red-500/20 rounded-t-sm hover:bg-red-500/40 transition-colors"
                      />
                    ))}
                  </div>
                </Card>

                {/* SpO2 Card */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Droplets className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-zinc-400 text-sm font-medium">Blood Oxygen</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{spo2}</span>
                    <span className="text-sm text-zinc-500 mb-1">%</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Continuous Monitoring</span>
                      <span className="text-green-400">Normal Range</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[98%]" />
                    </div>
                  </div>
                </Card>

                {/* Steps Card */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Footprints className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-zinc-400 text-sm font-medium">Auto-Sync Steps</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{steps.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>Updated 2s ago via BLE</span>
                  </div>
                </Card>
              </div>

              {/* Main Visualization Area based on Tab */}
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <Card className="border-l-4 border-l-yellow-500">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white">System Status</h3>
                          <p className="text-zinc-400 text-sm">All sensors operational. Data bridge active.</p>
                        </div>
                        <Badge color="green">Active</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-medium text-zinc-300 mb-3">Sensor Health</h4>
                          <div className="space-y-3">
                            {[
                              { name: 'Optical Heart Rate', status: 'Optimal' },
                              { name: 'Accelerometer', status: 'Calibrated' },
                              { name: 'SpO2 Sensor', status: 'Active' },
                              { name: 'Skin Temp', status: 'Monitoring' }
                            ].map((sensor) => (
                              <div key={sensor.name} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded border border-zinc-800">
                                <span className="text-sm text-zinc-400">{sensor.name}</span>
                                <span className="text-xs text-green-400 font-mono">{sensor.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-zinc-300 mb-3">Data Bridge Logs</h4>
                          <div className="space-y-2 font-mono text-xs text-zinc-500 h-40 overflow-y-auto custom-scrollbar">
                            <p><span className="text-yellow-600">[10:42:01]</span> Sync initiated: Fitbit API</p>
                            <p><span className="text-yellow-600">[10:42:02]</span> Auth token refreshed</p>
                            <p><span className="text-yellow-600">[10:42:05]</span> Downloaded 142 records</p>
                            <p><span className="text-yellow-600">[10:42:06]</span> Processing HRV variance...</p>
                            <p><span className="text-yellow-600">[10:42:08]</span> Sleep stages imported successfully</p>
                            <p><span className="text-yellow-600">[10:42:10]</span> Local database updated</p>
                            <p><span className="text-green-600">[10:42:12]</span> Sync complete. Latency: 12ms</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'stress' && (
                  <motion.div
                    key="stress"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-yellow-500" />
                          Stress Analysis
                        </h3>
                        <span className="text-xs text-zinc-500">Based on HRV & Skin Conductance</span>
                      </div>
                      
                      <div className="h-64 w-full flex items-center justify-center relative">
                        {/* Abstract Visualization of Stress Level */}
                        <div className="absolute inset-0 flex items-center justify-center">
                           <motion.div 
                             animate={{ 
                               scale: [1, 1.1, 1],
                               rotate: [0, 5, -5, 0]
                             }}
                             transition={{ duration: 4, repeat: Infinity }}
                             className="w-32 h-32 rounded-full border-4 border-yellow-500/30 flex items-center justify-center"
                           >
                             <div className="w-24 h-24 rounded-full border-4 border-yellow-500/60 flex items-center justify-center">
                               <span className="text-2xl font-bold text-yellow-500">Low</span>
                             </div>
                           </motion.div>
                        </div>
                        <div className="absolute bottom-0 w-full flex justify-between text-xs text-zinc-500 px-4">
                          <span>00:00</span>
                          <span>06:00</span>
                          <span>12:00</span>
                          <span>18:00</span>
                          <span>Now</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-3 bg-zinc-900 rounded-lg">
                          <div className="text-2xl font-bold text-white">12</div>
                          <div className="text-xs text-zinc-500">Stress Events</div>
                        </div>
                        <div className="text-center p-3 bg-zinc-900 rounded-lg">
                          <div className="text-2xl font-bold text-white">45m</div>
                          <div className="text-xs text-zinc-500">Recovery Time</div>
                        </div>
                        <div className="text-center p-3 bg-zinc-900 rounded-lg">
                          <div className="text-2xl font-bold text-white">8.2</div>
                          <div className="text-xs text-zinc-500">Resilience Score</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'sleep' && (
                  <motion.div
                    key="sleep"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Moon className="w-5 h-5 text-indigo-400" />
                          Sleep Architecture
                        </h3>
                        <Badge color="indigo">Auto-Imported</Badge>
                      </div>

                      <div className="space-y-6">
                        {/* Sleep Stages Bar */}
                        <div>
                          <div className="flex h-8 w-full rounded-full overflow-hidden mb-2">
                            <div style={{ width: '20%' }} className="bg-indigo-900 h-full flex items-center justify-center text-[10px] text-white/50">Awake</div>
                            <div style={{ width: '45%' }} className="bg-indigo-700 h-full flex items-center justify-center text-[10px] text-white/50">Light</div>
                            <div style={{ width: '25%' }} className="bg-indigo-500 h-full flex items-center justify-center text-[10px] text-white font-bold">Deep</div>
                            <div style={{ width: '10%' }} className="bg-purple-500 h-full flex items-center justify-center text-[10px] text-white font-bold">REM</div>
                          </div>
                          <div className="flex justify-between text-xs text-zinc-400">
                            <span>11:30 PM</span>
                            <span>Wake Up: 7:15 AM</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <div className="text-indigo-400 text-sm mb-1">Total Sleep</div>
                            <div className="text-2xl font-bold text-white">7h 45m</div>
                          </div>
                          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <div className="text-indigo-400 text-sm mb-1">Deep Sleep</div>
                            <div className="text-2xl font-bold text-white">1h 56m</div>
                          </div>
                          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <div className="text-indigo-400 text-sm mb-1">REM Sleep</div>
                            <div className="text-2xl font-bold text-white">48m</div>
                          </div>
                          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <div className="text-indigo-400 text-sm mb-1">Sleep Score</div>
                            <div className="text-2xl font-bold text-yellow-500">88</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                   <motion.div
                   key="activity"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                 >
                   <Card>
                     <div className="flex items-center justify-between mb-6">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">
                         <TrendingUp className="w-5 h-5 text-orange-500" />
                         Activity History
                       </h3>
                     </div>
                     
                     <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm text-zinc-400">
                         <thead className="bg-zinc-900 text-zinc-200 uppercase text-xs">
                           <tr>
                             <th className="px-4 py-3 rounded-l-lg">Date</th>
                             <th className="px-4 py-3">Type</th>
                             <th className="px-4 py-3">Duration</th>
                             <th className="px-4 py-3">Calories</th>
                             <th className="px-4 py-3 rounded-r-lg">Source</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-800">
                           {[
                             { date: 'Today, 8:00 AM', type: 'Running', dur: '45 min', cal: '420', src: 'GPS' },
                             { date: 'Yesterday, 6:30 PM', type: 'Weight Training', dur: '60 min', cal: '310', src: 'HR Monitor' },
                             { date: 'Jun 23, 7:00 AM', type: 'Yoga', dur: '30 min', cal: '120', src: 'Manual' },
                             { date: 'Jun 22, 5:00 PM', type: 'Cycling', dur: '90 min', cal: '650', src: 'Power Meter' },
                           ].map((row, i) => (
                             <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                               <td className="px-4 py-3 font-medium text-white">{row.date}</td>
                               <td className="px-4 py-3">{row.type}</td>
                               <td className="px-4 py-3">{row.dur}</td>
                               <td className="px-4 py-3">{row.cal} kcal</td>
                               <td className="px-4 py-3">
                                 <span className="px-2 py-1 bg-zinc-800 rounded text-xs">{row.src}</span>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </Card>
                 </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
