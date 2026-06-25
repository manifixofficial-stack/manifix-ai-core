import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dna, 
  ShieldCheck, 
  Activity, 
  Pill, 
  Leaf, 
  Globe, 
  Upload, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Lock,
  FileText,
  Info,
  Database
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';

// --- Constants & Data Models ---

const MARKERS = [
  { id: 'rs1801133', gene: 'MTHFR', trait: 'Folate Metabolism', options: ['CC (Normal)', 'CT (Reduced)', 'TT (Low)'] },
  { id: 'rs4680', gene: 'ACE', trait: 'Cardiovascular Health', options: ['II (Normal)', 'ID (Moderate)', 'DD (High Risk)'] },
  { id: 'rs7903456', gene: 'TCF7L2', trait: 'Glucose Regulation', options: ['TT (Normal)', 'TC/CC (Elevated Risk)'] },
  { id: 'rs10455872', gene: 'LPA', trait: 'Lipoprotein(a)', options: ['GG (Normal)', 'GA/AA (Elevated)'] },
  { id: 'rs12913832', gene: 'HERC2/OCA2', trait: 'Eye Color Prediction', options: ['GG (Blue/Green)', 'AG (Mixed)', 'AA (Brown)'] },
];

const DIET_RECS = {
  'MTHFR': {
    'CC (Normal)': { diet: 'Standard balanced diet.', supplements: 'Standard multivitamin.' },
    'CT (Reduced)': { diet: 'Increase leafy greens, legumes.', supplements: 'Consider Methylfolate (B9).' },
    'TT (Low)': { diet: 'Strictly avoid folic acid fortified foods. Eat natural folate sources.', supplements: 'Active B-Complex required.' }
  },
  'ACE': {
    'II (Normal)': { diet: 'Balanced sodium intake.', supplements: 'None specific.' },
    'ID (Moderate)': { diet: 'Monitor blood pressure regularly.', supplements: 'Omega-3s recommended.' },
    'DD (High Risk)': { diet: 'Low sodium diet. Limit caffeine.', supplements: 'CoQ10 and Magnesium.' }
  },
  'TCF7L2': {
    'TT (Normal)': { diet: 'Standard carb intake.', supplements: 'None specific.' },
    'TC/CC (Elevated Risk)': { diet: 'Low glycemic index diet. Avoid sugary drinks.', supplements: 'Chromium and Berberine.' }
  }
};

const DRUG_INTERACTIONS = {
  'MTHFR': {
    'TT (Low)': [
      { drug: 'Methotrexate', risk: 'High Toxicity', note: 'Reduced clearance.' },
      { drug: 'Nitrous Oxide', risk: 'Adverse Reaction', note: 'Can cause severe B12 deficiency.' }
    ]
  },
  'ACE': {
    'DD (High Risk)': [
      { drug: 'ACE Inhibitors', risk: 'Reduced Efficacy', note: 'May require higher dosage or alternative class.' }
    ]
  }
};

const ANCESTRY_RISKS = [
  { name: 'Type 2 Diabetes', value: 65, fullMark: 100 },
  { name: 'Hypertension', value: 40, fullMark: 100 },
  { name: 'Celiac Disease', value: 15, fullMark: 100 },
  { name: 'Alzheimer\'s', value: 30, fullMark: 100 },
  { name: 'Osteoporosis', value: 55, fullMark: 100 },
];

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900/80 border border-yellow-600/30 rounded-xl p-6 backdrop-blur-sm shadow-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
    secondary: "bg-zinc-800 text-yellow-500 border border-yellow-600/50 hover:bg-zinc-700 hover:border-yellow-500",
    danger: "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default function DNAProfile() {
  // State
  const [activeTab, setActiveTab] = useState('input');
  const [profileData, setProfileData] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('dna_profile_data');
    if (savedData) {
      try {
        setProfileData(JSON.parse(savedData));
        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to parse local storage data");
      }
    }
  }, []);

  // Handlers
  const handleMarkerChange = (markerId, value) => {
    setProfileData(prev => ({
      ...prev,
      [markerId]: value
    }));
  };

  const saveProfile = () => {
    localStorage.setItem('dna_profile_data', JSON.stringify(profileData));
    showNotification('Profile saved securely to local storage.');
    setIsLoaded(true);
  };

  const clearProfile = () => {
    if (window.confirm('Are you sure? This will delete all genetic data from this device.')) {
      localStorage.removeItem('dna_profile_data');
      setProfileData({});
      setIsLoaded(false);
      showNotification('All data cleared.');
    }
  };

  const simulateUpload = () => {
    // Simulate parsing a file
    const mockData = {
      'rs1801133': 'CT (Reduced)',
      'rs4680': 'DD (High Risk)',
      'rs7903456': 'TT (Normal)',
      'rs10455872': 'GG (Normal)',
      'rs12913832': 'AA (Brown)'
    };
    setProfileData(mockData);
    showNotification('Simulated DNA file parsed successfully.');
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Derived Data for Visualizations
  const getRiskScore = () => {
    let score = 50; // Base
    if (profileData['rs1801133']?.includes('TT')) score += 15;
    if (profileData['rs4680']?.includes('DD')) score += 20;
    if (profileData['rs7903456']?.includes('CC')) score += 10;
    return Math.min(score, 100);
  };

  const renderInputInterface = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
          <Dna className="w-6 h-6" /> Genetic Marker Input
        </h2>
        <Button variant="secondary" onClick={simulateUpload} className="text-sm">
          <Upload className="w-4 h-4" /> Simulate File Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MARKERS.map((marker) => (
          <Card key={marker.id} className="hover:border-yellow-500/50 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{marker.gene}</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">{marker.trait}</p>
              </div>
              <span className="text-xs bg-zinc-800 text-yellow-600 px-2 py-1 rounded border border-yellow-900/50">
                {marker.id}
              </span>
            </div>
            
            <div className="space-y-2">
              {marker.options.map((opt) => (
                <label 
                  key={opt} 
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    profileData[marker.id] === opt 
                      ? 'bg-yellow-900/20 border-yellow-500 text-yellow-100' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <input 
                    type="radio" 
                    name={marker.id} 
                    value={opt}
                    checked={profileData[marker.id] === opt}
                    onChange={() => handleMarkerChange(marker.id, opt)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                    profileData[marker.id] === opt ? 'border-yellow-500' : 'border-zinc-600'
                  }`}>
                    {profileData[marker.id] === opt && <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
                  </div>
                  <span className="text-sm font-medium">{opt}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <Button onClick={saveProfile} className="flex-1">
          <Save className="w-4 h-4" /> Save Profile Locally
        </Button>
        {isLoaded && (
          <Button variant="danger" onClick={clearProfile}>
            <Trash2 className="w-4 h-4" /> Clear Data
          </Button>
        )}
      </div>
    </motion.div>
  );

  const renderNutrigenomics = () => {
    const hasData = Object.keys(profileData).length > 0;
    
    if (!hasData) return <EmptyState message="Please input genetic markers first." />;

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2 mb-6">
          <Leaf className="w-6 h-6" /> Nutrigenomics Recommendations
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(profileData).map(([markerId, value]) => {
            const markerInfo = MARKERS.find(m => m.id === markerId);
            const recs = DIET_RECS[markerInfo?.gene]?.[value];

            if (!recs) return null;

            return (
              <Card key={markerId} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                
                <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
                  <div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{markerInfo?.gene} Analysis</h3>
                    <p className="text-xs text-zinc-400">{value}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-600 mb-1 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Dietary Protocol
                    </h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">{recs.diet}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-600 mb-1 flex items-center gap-2">
                      <Pill className="w-3 h-3" /> Supplementation
                    </h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">{recs.supplements}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderPharmacogenomics = () => {
    const hasData = Object.keys(profileData).length > 0;
    if (!hasData) return <EmptyState message="Please input genetic markers first." />;

    const interactions = [];
    Object.entries(profileData).forEach(([markerId, value]) => {
      const markerInfo = MARKERS.find(m => m.id === markerId);
      const drugs = DRUG_INTERACTIONS[markerInfo?.gene]?.[value];
      if (drugs) {
        drugs.forEach(d => interactions.push({ ...d, gene: markerInfo.gene }));
      }
    });

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2 mb-6">
          <Pill className="w-6 h-6" /> Pharmacogenomics Overlay
        </h2>

        {interactions.length === 0 ? (
          <Card className="text-center py-12 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Major Interactions Detected</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Based on your current markers, there are no high-risk pharmacogenomic warnings in our database. Always consult your doctor.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {interactions.map((item, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-500 bg-red-950/10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-white">{item.drug}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded ml-2">Via {item.gene}</span>
                    </div>
                    <p className="text-red-400 font-medium text-sm mb-1">{item.risk}</p>
                    <p className="text-zinc-400 text-sm">{item.note}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderAncestryRisks = () => {
    const hasData = Object.keys(profileData).length > 0;
    if (!hasData) return <EmptyState message="Please input genetic markers first." />;

    // Adjust risks based on markers for demo purposes
    const adjustedRisks = ANCESTRY_RISKS.map(risk => {
      let newValue = risk.value;
      if (risk.name === 'Hypertension' && profileData['rs4680']?.includes('DD')) newValue += 30;
      if (risk.name === 'Type 2 Diabetes' && profileData['rs7903456']?.includes('CC')) newValue += 25;
      return { ...risk, value: Math.min(newValue, 100) };
    });

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2 mb-6">
          <Globe className="w-6 h-6" /> Ancestry & Disease Risk Factors
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="h-[400px] w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 relative">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={adjustedRisks}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Radar
                  name="Genetic Risk"
                  dataKey="value"
                  stroke="#eab308"
                  strokeWidth={2}
                  fill="#eab308"
                  fillOpacity={0.3}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                  itemStyle={{ color: '#eab308' }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-zinc-500">
              *Relative risk compared to general population
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Risk Breakdown</h3>
            {adjustedRisks.map((risk) => (
              <div key={risk.name} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-300 font-medium">{risk.name}</span>
                  <span className={`font-bold ${risk.value > 70 ? 'text-red-500' : risk.value > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {risk.value}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.value}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${
                      risk.value > 70 ? 'bg-red-500' : risk.value > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
        <Database className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
      <p className="text-zinc-400 max-w-md">{message}</p>
      <Button onClick={() => setActiveTab('input')} className="mt-6">
        Go to Input Interface
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-yellow-500/30">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-zinc-900 border border-yellow-500/50 text-yellow-500 px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
              <Dna className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">GENO<span className="text-yellow-500">PRIME</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Secure Local Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
              <Lock className="w-3 h-3 text-green-500" />
              <span className="text-xs text-zinc-400">Privacy Mode Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
          {[
            { id: 'input', label: 'Input Markers', icon: Upload },
            { id: 'nutrition', label: 'Nutrigenomics', icon: Leaf },
            { id: 'pharma', label: 'Pharmacogenomics', icon: Pill },
            { id: 'ancestry', label: 'Risk Factors', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'input' && renderInputInterface()}
              {activeTab === 'nutrition' && renderNutrigenomics()}
              {activeTab === 'pharma' && renderPharmacogenomics()}
              {activeTab === 'ancestry' && renderAncestryRisks()}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-12 py-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-600 text-sm mb-2">
            GENOPRIME • Secure Local Genetic Profiling System
          </p>
          <p className="text-zinc-700 text-xs max-w-2xl mx-auto">
            Disclaimer: This tool is for educational and informational purposes only. It does not provide medical advice, diagnosis, or treatment. 
            All data is stored locally on your device using browser LocalStorage. No data is ever transmitted to external servers.
          </p>
        </div>
      </footer>
    </div>
  );
}
