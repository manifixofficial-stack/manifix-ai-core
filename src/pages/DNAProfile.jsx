import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna, ShieldCheck, Activity, Pill, Leaf, Upload, Save, Trash2,
  AlertCircle, CheckCircle2, Lock, FileText, Info, Database, Download,
  ScanLine, Loader2, Search, BookOpen, ClipboardList, ChevronDown
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

/* ============================================================
   DATA MODEL
   This mirrors how real raw-data interpretation tools (Promethease,
   Genetic Genie, SNPedia-style services) work: a genotype from a
   consumer DNA file is matched to a curated reference entry and
   shown alongside a magnitude/confidence rating — never a diagnosis.
   Genotypes are computed from real allele letters, not hardcoded.
============================================================ */

const MARKERS = [
  {
    id: 'rs1801133', gene: 'MTHFR', trait: 'Folate Metabolism', chr: '1', category: 'Metabolic',
    description: 'Affects how efficiently the body converts dietary folate (vitamin B9) into its active form.',
    alleles: { ref: 'C', alt: 'T' },
    classify: (gt) => { const t = (gt.match(/T/g) || []).length; return t === 0 ? 'CC (Normal)' : t === 1 ? 'CT (Reduced)' : 'TT (Low)'; },
    options: ['CC (Normal)', 'CT (Reduced)', 'TT (Low)'],
    magnitude: { 'CC (Normal)': 0, 'CT (Reduced)': 2, 'TT (Low)': 3.5 }
  },
  {
    id: 'rs4680', gene: 'COMT', trait: 'Dopamine Clearance', chr: '22', category: 'Metabolic',
    description: 'Influences how quickly the body breaks down dopamine, linked to focus and stress response.',
    alleles: { ref: 'G', alt: 'A' },
    classify: (gt) => { const a = (gt.match(/A/g) || []).length; return a === 0 ? 'GG (Fast/Warrior)' : a === 1 ? 'GA (Intermediate)' : 'AA (Slow/Worrier)'; },
    options: ['GG (Fast/Warrior)', 'GA (Intermediate)', 'AA (Slow/Worrier)'],
    magnitude: { 'GG (Fast/Warrior)': 1, 'GA (Intermediate)': 1.5, 'AA (Slow/Worrier)': 2.5 }
  },
  {
    id: 'rs1799752', gene: 'ACE', trait: 'Cardiovascular Tone', chr: '17', category: 'Cardiovascular',
    description: 'Related to blood pressure regulation through the renin-angiotensin system.',
    alleles: { ref: 'I', alt: 'D' },
    classify: (gt) => { const d = (gt.match(/D/g) || []).length; return d === 0 ? 'II (Normal)' : d === 1 ? 'ID (Moderate)' : 'DD (High Risk)'; },
    options: ['II (Normal)', 'ID (Moderate)', 'DD (High Risk)'],
    magnitude: { 'II (Normal)': 0, 'ID (Moderate)': 2, 'DD (High Risk)': 3 }
  },
  {
    id: 'rs7903146', gene: 'TCF7L2', trait: 'Glucose Regulation', chr: '10', category: 'Metabolic',
    description: 'The variant most consistently replicated across genome-wide studies of type 2 diabetes risk.',
    alleles: { ref: 'C', alt: 'T' },
    classify: (gt) => { const c = (gt.match(/C/g) || []).length; return c > 0 ? 'TC/CC (Elevated Risk)' : 'TT (Normal)'; },
    options: ['TT (Normal)', 'TC/CC (Elevated Risk)'],
    magnitude: { 'TT (Normal)': 0, 'TC/CC (Elevated Risk)': 3 }
  },
  {
    id: 'rs10455872', gene: 'LPA', trait: 'Lipoprotein(a)', chr: '6', category: 'Cardiovascular',
    description: 'Affects levels of Lp(a), a cholesterol-carrying particle linked to cardiovascular risk largely independent of diet.',
    alleles: { ref: 'G', alt: 'A' },
    classify: (gt) => { const a = (gt.match(/A/g) || []).length; return a > 0 ? 'GA/AA (Elevated)' : 'GG (Normal)'; },
    options: ['GG (Normal)', 'GA/AA (Elevated)'],
    magnitude: { 'GG (Normal)': 0, 'GA/AA (Elevated)': 3.5 }
  },
  {
    id: 'rs762551', gene: 'CYP1A2', trait: 'Caffeine Metabolism', chr: '15', category: 'Pharmacogenomic',
    description: 'Determines how quickly the liver clears caffeine and several medications from the bloodstream.',
    alleles: { ref: 'A', alt: 'C' },
    classify: (gt) => { const c = (gt.match(/C/g) || []).length; return c === 0 ? 'AA (Fast Metabolizer)' : c === 1 ? 'AC (Intermediate)' : 'CC (Slow Metabolizer)'; },
    options: ['AA (Fast Metabolizer)', 'AC (Intermediate)', 'CC (Slow Metabolizer)'],
    magnitude: { 'AA (Fast Metabolizer)': 0, 'AC (Intermediate)': 1, 'CC (Slow Metabolizer)': 2 }
  },
  {
    id: 'rs9923231', gene: 'VKORC1', trait: 'Warfarin Sensitivity', chr: '16', category: 'Pharmacogenomic',
    description: 'One of the two genes (with CYP2C9) real clinical pharmacogenomic panels test before warfarin dosing.',
    alleles: { ref: 'C', alt: 'T' },
    classify: (gt) => { const t = (gt.match(/T/g) || []).length; return t === 0 ? 'GG (Normal Sensitivity)' : t === 1 ? 'AG (Increased Sensitivity)' : 'AA (High Sensitivity)'; },
    options: ['GG (Normal Sensitivity)', 'AG (Increased Sensitivity)', 'AA (High Sensitivity)'],
    magnitude: { 'GG (Normal Sensitivity)': 0, 'AG (Increased Sensitivity)': 3, 'AA (High Sensitivity)': 4 }
  },
  {
    id: 'rs1801282', gene: 'PPARG', trait: 'Insulin Sensitivity', chr: '3', category: 'Metabolic',
    description: 'The Pro12Ala variant studied for its association with insulin sensitivity and response to fat intake.',
    alleles: { ref: 'C', alt: 'G' },
    classify: (gt) => { const g = (gt.match(/G/g) || []).length; return g === 0 ? 'CC (Normal)' : g === 1 ? 'CG (Ala carrier)' : 'GG (Ala/Ala)'; },
    options: ['CC (Normal)', 'CG (Ala carrier)', 'GG (Ala/Ala)'],
    magnitude: { 'CC (Normal)': 0, 'CG (Ala carrier)': 1.5, 'GG (Ala/Ala)': 2 }
  },
  {
    id: 'rs5882', gene: 'CETP', trait: 'HDL Cholesterol & Longevity', chr: '16', category: 'Cardiovascular',
    description: 'Studied in longevity cohorts for its association with HDL particle size and cardiovascular aging.',
    alleles: { ref: 'A', alt: 'G' },
    classify: (gt) => { const g = (gt.match(/G/g) || []).length; return g === 0 ? 'AA (Typical)' : g === 1 ? 'AG (Favorable carrier)' : 'GG (Favorable)'; },
    options: ['AA (Typical)', 'AG (Favorable carrier)', 'GG (Favorable)'],
    magnitude: { 'AA (Typical)': 0, 'AG (Favorable carrier)': 1, 'GG (Favorable)': 1.5 }
  },
  {
    id: 'rs1815739', gene: 'ACTN3', trait: 'Muscle Fiber Type', chr: '11', category: 'Fitness',
    description: 'The "sprint gene" variant studied for its association with fast-twitch muscle fiber composition.',
    alleles: { ref: 'C', alt: 'T' },
    classify: (gt) => { const t = (gt.match(/T/g) || []).length; return t === 0 ? 'CC (Power/Sprint)' : t === 1 ? 'CT (Mixed)' : 'TT (Endurance)'; },
    options: ['CC (Power/Sprint)', 'CT (Mixed)', 'TT (Endurance)'],
    magnitude: { 'CC (Power/Sprint)': 1, 'CT (Mixed)': 1, 'TT (Endurance)': 1 }
  },
  {
    id: 'rs1800629', gene: 'TNF-alpha', trait: 'Inflammatory Response', chr: '6', category: 'Immune',
    description: 'Promoter variant studied for its association with baseline inflammatory cytokine production.',
    alleles: { ref: 'G', alt: 'A' },
    classify: (gt) => { const a = (gt.match(/A/g) || []).length; return a === 0 ? 'GG (Typical)' : a === 1 ? 'GA (Elevated tendency)' : 'AA (High tendency)'; },
    options: ['GG (Typical)', 'GA (Elevated tendency)', 'AA (High tendency)'],
    magnitude: { 'GG (Typical)': 0, 'GA (Elevated tendency)': 2, 'AA (High tendency)': 2.5 }
  },
  {
    id: 'rs12913832', gene: 'HERC2', trait: 'Eye Pigmentation', chr: '15', category: 'Cosmetic',
    description: 'The single strongest known predictor of blue versus brown eye color.',
    alleles: { ref: 'G', alt: 'A' },
    classify: (gt) => { const a = (gt.match(/A/g) || []).length; return a === 0 ? 'GG (Blue/Green)' : a === 1 ? 'AG (Mixed)' : 'AA (Brown)'; },
    options: ['GG (Blue/Green)', 'AG (Mixed)', 'AA (Brown)'],
    magnitude: { 'GG (Blue/Green)': 0, 'AG (Mixed)': 0, 'AA (Brown)': 0 }
  },
  {
    id: 'rs4988235', gene: 'MCM6/LCT', trait: 'Lactose Tolerance', chr: '2', category: 'Metabolic',
    description: 'The regulatory variant controlling whether lactase production persists into adulthood.',
    alleles: { ref: 'C', alt: 'T' },
    classify: (gt) => { const t = (gt.match(/T/g) || []).length; return t === 0 ? 'CC (Likely intolerant)' : t === 1 ? 'CT (Likely tolerant)' : 'TT (Tolerant)'; },
    options: ['CC (Likely intolerant)', 'CT (Likely tolerant)', 'TT (Tolerant)'],
    magnitude: { 'CC (Likely intolerant)': 2, 'CT (Likely tolerant)': 0, 'TT (Tolerant)': 0 }
  }
];

const CATEGORIES = ['All', ...Array.from(new Set(MARKERS.map(m => m.category)))];

const FINDINGS = {
  MTHFR: {
    'CC (Normal)': { summary: 'Typical folate-pathway enzyme activity.', detail: 'Standard balanced diet covers folate needs; a standard multivitamin is generally sufficient.', source: 'Frosst et al., Nat Genet 1995; widely replicated' },
    'CT (Reduced)': { summary: 'Roughly intermediate enzyme activity reported in carriers of one copy.', detail: 'Diets richer in leafy greens, legumes, and whole-food folate are commonly discussed for this genotype; methylfolate (5-MTHF) is sometimes raised as an alternative to folic acid — a conversation for a doctor or dietitian, not a self-prescription.', source: 'Frosst et al., Nat Genet 1995; meta-analyses in Mol Genet Metab' },
    'TT (Low)': { summary: 'Substantially reduced enzyme activity reported in homozygous carriers.', detail: 'Avoiding folic-acid-fortified foods in favor of natural folate sources, and discussing methylated B-vitamins with a physician, are common talking points associated with this genotype.', source: 'Frosst et al., Nat Genet 1995; van der Put et al., Lancet 1995' }
  },
  COMT: {
    'GG (Fast/Warrior)': { summary: 'Faster dopamine clearance reported for this genotype.', detail: 'Generally well-tolerated caffeine and stimulant exposure is commonly discussed for this genotype.', source: 'Lachman et al., Pharmacogenetics 1996' },
    'GA (Intermediate)': { summary: 'Intermediate clearance rate.', detail: 'Moderate stimulant intake and attention to stress load are commonly discussed.', source: 'Lachman et al., Pharmacogenetics 1996' },
    'AA (Slow/Worrier)': { summary: 'Slower dopamine clearance reported for this genotype, associated in some studies with higher stimulant sensitivity.', detail: 'Lower stimulant tolerance and benefit from stress-modulation practices are commonly discussed; not a basis for self-medicating anxiety.', source: 'Lachman et al., Pharmacogenetics 1996; Stein et al., Am J Med Genet 2005' }
  },
  ACE: {
    'II (Normal)': { summary: 'Typical renin-angiotensin pathway activity.', detail: 'Standard sodium intake guidance applies.', source: 'Rigat et al., Nucleic Acids Res 1992' },
    'ID (Moderate)': { summary: 'Intermediate ACE activity reported.', detail: 'Many people with this genotype are advised to monitor blood pressure proactively.', source: 'Rigat et al., Nucleic Acids Res 1992' },
    'DD (High Risk)': { summary: 'Higher ACE activity associated with this genotype in cardiovascular cohort studies.', detail: 'Lower sodium approaches and routine blood pressure monitoring are common discussion points; medication response patterns should be reviewed with a physician.', source: 'Rigat et al., Nucleic Acids Res 1992; Staessen et al., J Hypertens 1997' }
  },
  TCF7L2: {
    'TT (Normal)': { summary: 'Baseline genetic risk for this locus.', detail: 'Standard carbohydrate guidance applies.', source: 'Grant et al., Nat Genet 2006' },
    'TC/CC (Elevated Risk)': { summary: 'The most replicated common variant associated with type 2 diabetes risk in genome-wide studies.', detail: 'Lower glycemic-index choices and routine glucose screening are commonly discussed for carriers — this is risk association, not a diagnosis.', source: 'Grant et al., Nat Genet 2006; cited in 100+ replication studies' }
  },
  LPA: {
    'GG (Normal)': { summary: 'Typical Lp(a) levels expected.', detail: 'No specific dietary adjustment typically indicated.', source: 'Clarke et al., NEJM 2009' },
    'GA/AA (Elevated)': { summary: 'Associated with elevated Lp(a), a risk factor largely unresponsive to diet and exercise.', detail: 'This is one of the few cardiovascular markers where clinicians recommend an actual blood Lp(a) test rather than relying on genotype alone — a good one to bring up with a cardiologist.', source: 'Clarke et al., NEJM 2009; Kamstrup et al., JAMA 2009' }
  },
  CYP1A2: {
    'AA (Fast Metabolizer)': { summary: 'Faster hepatic clearance of caffeine and CYP1A2 substrate drugs.', detail: 'Caffeine timing is usually flexible for this genotype.', source: 'Sachse et al., Br J Clin Pharmacol 1999' },
    'AC (Intermediate)': { summary: 'Intermediate clearance rate.', detail: 'Moderate caffeine timing, avoiding large late-day doses, is commonly discussed.', source: 'Sachse et al., Br J Clin Pharmacol 1999' },
    'CC (Slow Metabolizer)': { summary: 'Slower clearance reported; caffeine and certain drugs may linger longer.', detail: 'Morning-only caffeine and caution with stacked stimulant use are common discussion points.', source: 'Sachse et al., Br J Clin Pharmacol 1999; Cornelis et al., JAMA 2006' }
  },
  VKORC1: {
    'GG (Normal Sensitivity)': { summary: 'Typical warfarin dose-response expected.', detail: 'Standard dosing protocols generally apply, as determined by a prescriber.', source: 'Rieder et al., NEJM 2005' },
    'AG (Increased Sensitivity)': { summary: 'Increased warfarin sensitivity reported for carriers.', detail: 'This genotype is part of the real clinical VKORC1/CYP2C9 dosing algorithm used by prescribers — relevant to share with a physician before starting anticoagulant therapy, never to self-adjust a dose.', source: 'Rieder et al., NEJM 2005; FDA-cleared pharmacogenomic labeling' },
    'AA (High Sensitivity)': { summary: 'High warfarin sensitivity reported; often associated with a lower effective starting dose in clinical algorithms.', detail: 'Should be flagged to any prescriber before anticoagulant therapy — this is exactly the kind of variant real clinical dosing calculators use, but only a physician should act on it.', source: 'Rieder et al., NEJM 2005; FDA-cleared pharmacogenomic labeling' }
  },
  PPARG: {
    'CC (Normal)': { summary: 'Typical PPAR-gamma activity.', detail: 'No specific dietary fat adjustment typically indicated.', source: 'Altshuler et al., Nat Genet 2000' },
    'CG (Ala carrier)': { summary: 'Single-copy carriers studied for modestly improved insulin sensitivity in some cohorts.', detail: 'Findings are mixed across populations; not strong enough to change dietary fat recommendations on their own.', source: 'Altshuler et al., Nat Genet 2000' },
    'GG (Ala/Ala)': { summary: 'Double-copy carriers studied for insulin sensitivity association, though this genotype is uncommon.', detail: 'Same caveat — interesting research association, not an actionable dietary rule by itself.', source: 'Altshuler et al., Nat Genet 2000' }
  },
  CETP: {
    'AA (Typical)': { summary: 'Typical HDL particle profile expected.', detail: 'No specific adjustment indicated.', source: 'Barzilai et al., JAMA 2003' },
    'AG (Favorable carrier)': { summary: 'Studied in Ashkenazi centenarian cohorts for association with larger HDL particle size.', detail: 'An interesting longevity-research association rather than something actionable day-to-day.', source: 'Barzilai et al., JAMA 2003' },
    'GG (Favorable)': { summary: 'Same favorable-variant association, homozygous.', detail: 'Same caveat as above.', source: 'Barzilai et al., JAMA 2003' }
  },
  'ACTN3': {
    'CC (Power/Sprint)': { summary: 'Full-length alpha-actinin-3 protein produced; overrepresented in elite power/sprint athletes in some studies.', detail: 'Sometimes cited informally in training-style discussions; not predictive of athletic outcome on its own.', source: 'Yang et al., Am J Hum Genet 2003' },
    'CT (Mixed)': { summary: 'One functional copy; intermediate representation across athlete cohorts.', detail: 'No specific training implication established.', source: 'Yang et al., Am J Hum Genet 2003' },
    'TT (Endurance)': { summary: 'Loss-of-function variant; overrepresented in endurance-athlete cohorts in some studies.', detail: 'Sometimes raised in informal training discussions; evidence for individual training prescriptions is weak.', source: 'Yang et al., Am J Hum Genet 2003; MacArthur & North, FASEB J 2004' }
  },
  'TNF-alpha': {
    'GG (Typical)': { summary: 'Typical baseline cytokine production reported.', detail: 'No specific adjustment indicated.', source: 'Wilson et al., PNAS 1997' },
    'GA (Elevated tendency)': { summary: 'Studied for association with higher baseline inflammatory tone.', detail: 'Sometimes discussed alongside anti-inflammatory dietary patterns; not diagnostic of any condition.', source: 'Wilson et al., PNAS 1997' },
    'AA (High tendency)': { summary: 'Same association, homozygous; stronger effect size reported in some cohorts.', detail: 'Same caveat — a research association, not a clinical marker for any specific disease.', source: 'Wilson et al., PNAS 1997' }
  },
  HERC2: {
    'GG (Blue/Green)': { summary: 'Strongly predictive of blue or green eye color.', detail: 'Cosmetic trait only.', source: 'Eiberg et al., Hum Genet 2008' },
    'AG (Mixed)': { summary: 'Associated with intermediate/mixed eye coloring.', detail: 'Cosmetic trait only.', source: 'Eiberg et al., Hum Genet 2008' },
    'AA (Brown)': { summary: 'Strongly predictive of brown eye color.', detail: 'Cosmetic trait only.', source: 'Eiberg et al., Hum Genet 2008' }
  },
  'MCM6/LCT': {
    'CC (Likely intolerant)': { summary: 'Associated with reduced lactase persistence into adulthood.', detail: 'Often discussed alongside reported dairy sensitivity; clinical lactose intolerance testing is the definitive route if symptomatic.', source: 'Enattah et al., Nat Genet 2002' },
    'CT (Likely tolerant)': { summary: 'One copy of the persistence allele; lactase production typically continues.', detail: 'No specific dietary restriction usually indicated.', source: 'Enattah et al., Nat Genet 2002' },
    'TT (Tolerant)': { summary: 'Two copies of the persistence allele; lactase production typically continues robustly.', detail: 'No specific dietary restriction usually indicated.', source: 'Enattah et al., Nat Genet 2002' }
  }
};

const DRUG_INTERACTIONS = {
  MTHFR: { 'TT (Low)': [ { drug: 'Methotrexate', risk: 'Elevated Toxicity Risk', note: 'Reduced folate-pathway clearance is commonly cited; requires physician oversight before any dose decision.' }, { drug: 'Nitrous Oxide', risk: 'Adverse Reaction Risk', note: 'Repeated exposure can compound B12/folate depletion in this genotype.' } ] },
  ACE: { 'DD (High Risk)': [ { drug: 'ACE Inhibitors', risk: 'Variable Efficacy', note: 'Response variability is discussed in pharmacogenomic literature; any dose change is a physician decision.' } ] },
  VKORC1: {
    'AA (High Sensitivity)': [ { drug: 'Warfarin', risk: 'High Sensitivity', note: 'Frequently associated with needing a lower starting dose in real clinical dosing algorithms — flag to a prescriber, never self-adjust.' } ],
    'AG (Increased Sensitivity)': [ { drug: 'Warfarin', risk: 'Increased Sensitivity', note: 'Dose-finding is typically more cautious in carriers; managed by a prescriber.' } ]
  },
  CYP1A2: { 'CC (Slow Metabolizer)': [ { drug: 'CYP1A2-metabolized drugs (e.g. clozapine, theophylline)', risk: 'Prolonged Exposure', note: 'Slow clearance can prolong half-life of CYP1A2 substrate drugs; relevant for a prescriber to know, not for self-dosing.' } ] }
};

const ANCESTRY_BASELINE = [
  { name: 'Type 2 Diabetes', value: 38 }, { name: 'Hypertension', value: 32 },
  { name: 'Cardiovascular (Lp(a))', value: 18 }, { name: 'Anticoagulant Sensitivity', value: 10 },
  { name: 'Inflammatory Tendency', value: 24 }, { name: 'Lactose Intolerance', value: 30 }
];

const STORAGE_KEY = 'genoprime:profile:v2';

/* ============================================================
   FILE PARSING — real 23andMe / AncestryDNA-style raw text parser
   Expected line format: rsid<TAB>chromosome<TAB>position<TAB>genotype
   Lines starting with # are comments, per the real file spec.
============================================================ */
function parseRawGenomeFile(text) {
  const lines = text.split(/\r?\n/);
  const found = {};
  let dataLines = 0;
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.trim().split(/\t|,/).map(s => s.trim());
    if (parts.length < 4) continue;
    const [rsid, , , genotype] = parts;
    dataLines++;
    const marker = MARKERS.find(m => m.id === rsid);
    if (marker && genotype && genotype !== '--' && genotype !== '00') {
      found[marker.id] = marker.classify(genotype.toUpperCase());
    }
  }
  return { found, dataLines };
}

function generateSampleFile() {
  const header = `# GENOPRIME SAMPLE RAW DATA FILE — for testing the parser only\n# This is NOT real genetic data.\n# rsid\tchromosome\tposition\tgenotype\n`;
  const rows = MARKERS.map(m => {
    const alleles = [m.alleles.ref, m.alleles.alt];
    const gt = Math.random() > 0.5
      ? alleles[Math.floor(Math.random() * 2)] + alleles[Math.floor(Math.random() * 2)]
      : alleles.join('');
    return `${m.id}\t${m.chr}\t${Math.floor(Math.random() * 200000000)}\t${gt}`;
  });
  return header + rows.join('\n');
}

function buildTextReport(profileData) {
  const lines = [];
  lines.push('GENOPRIME — RAW DATA INTERPRETATION REPORT');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('IMPORTANT: This report summarizes statistical associations from');
  lines.push('published genetics literature, matched against the genotypes you');
  lines.push('provided. It is a research summary, not a medical diagnosis, and');
  lines.push('it has not been clinically validated. Consumer raw DNA data can');
  lines.push('contain errors. Share this with a doctor or genetic counselor');
  lines.push('rather than acting on it directly.');
  lines.push('');
  Object.entries(profileData).forEach(([id, value]) => {
    const m = MARKERS.find(x => x.id === id);
    if (!m) return;
    const finding = FINDINGS[m.gene]?.[value];
    lines.push('-'.repeat(60));
    lines.push(`${m.gene} (${m.id}) — ${m.trait}`);
    lines.push(`Genotype: ${value}`);
    if (finding) {
      lines.push(`Finding: ${finding.summary}`);
      lines.push(`Detail: ${finding.detail}`);
      lines.push(`Source: ${finding.source}`);
    }
    lines.push('');
  });
  const interactions = [];
  Object.entries(profileData).forEach(([id, value]) => {
    const m = MARKERS.find(x => x.id === id);
    const drugs = m && DRUG_INTERACTIONS[m.gene]?.[value];
    if (drugs) drugs.forEach(d => interactions.push({ ...d, gene: m.gene }));
  });
  if (interactions.length) {
    lines.push('='.repeat(60));
    lines.push('FLAGGED DRUG-INTERACTION NOTES (discuss with a pharmacist/physician)');
    lines.push('='.repeat(60));
    interactions.forEach(it => {
      lines.push(`- ${it.drug} (via ${it.gene}): ${it.risk} — ${it.note}`);
    });
  }
  return lines.join('\n');
}

/* ============================================================
   UI PRIMITIVES — gold-on-black ledger identity
============================================================ */

const Panel = ({ children, className = '', style }) => (
  <div className={`gp-panel ${className}`} style={style}>{children}</div>
);

const Btn = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const styles = { primary: 'gp-btn-primary', secondary: 'gp-btn-secondary', danger: 'gp-btn-danger' };
  return (
    <button onClick={onClick} disabled={disabled} className={`gp-btn ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

const BasePairTicker = () => {
  const bases = 'ATCGGCTAACGTTAGCCGATACGGTTCAAGCTAGGCTTACGATCGGAATCC';
  return (
    <div className="gp-ticker" aria-hidden="true">
      <div className="gp-ticker-track">
        {[...bases, ...bases].map((b, i) => <span key={i} className={`gp-base gp-base-${b}`}>{b}</span>)}
      </div>
    </div>
  );
};

export default function GenoPrime() {
  const [activeTab, setActiveTab] = useState('input');
  const [profileData, setProfileData] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [notification, setNotification] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseSummary, setParseSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          setProfileData(JSON.parse(result.value));
          setIsSaved(true);
        }
      } catch (e) { /* nothing saved yet */ }
      finally { setStorageReady(true); }
    })();
  }, []);

  const showNotification = useCallback((msg, tone = 'ok') => {
    setNotification({ msg, tone });
    setTimeout(() => setNotification(null), 3400);
  }, []);

  const handleMarkerChange = (markerId, value) => {
    setProfileData(prev => ({ ...prev, [markerId]: value }));
    setIsSaved(false);
  };

  const saveProfile = async () => {
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(profileData), false);
      if (!result) throw new Error('no result');
      setIsSaved(true);
      showNotification('Profile saved to your private storage.');
    } catch (e) {
      setStorageError(true);
      showNotification('Could not save — storage is unavailable right now.', 'warn');
    }
  };

  const clearProfile = async () => {
    if (!window.confirm('Delete all genetic data from this profile? This cannot be undone.')) return;
    try { await window.storage.delete(STORAGE_KEY, false); } catch (e) {}
    setProfileData({});
    setIsSaved(false);
    setParseSummary(null);
    showNotification('All data cleared.');
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { found, dataLines } = parseRawGenomeFile(String(ev.target.result));
      const matchedCount = Object.keys(found).length;
      setProfileData(found);
      setIsSaved(false);
      setParseSummary({ dataLines, matchedCount, total: MARKERS.length });
      setParsing(false);
      showNotification(matchedCount === 0
        ? 'File read, but no recognized marker IDs were found.'
        : `Parsed ${dataLines.toLocaleString()} rows — matched ${matchedCount} of ${MARKERS.length} reference markers.`,
        matchedCount === 0 ? 'warn' : 'ok');
    };
    reader.onerror = () => { setParsing(false); showNotification('Could not read that file.', 'warn'); };
    reader.readAsText(file);
  };

  const downloadSampleFile = () => {
    const blob = new Blob([generateSampleFile()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'genoprime_sample_raw_data.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportProfileJSON = () => {
    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'genoprime_profile_export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFullReport = () => {
    const blob = new Blob([buildTextReport(profileData)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'genoprime_full_report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = Object.keys(profileData).length > 0;

  const filteredMarkers = useMemo(() => {
    return MARKERS.filter(m => {
      const inCategory = categoryFilter === 'All' || m.category === categoryFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || m.gene.toLowerCase().includes(q) || m.trait.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      return inCategory && matchesSearch;
    });
  }, [search, categoryFilter]);

  const adjustedRisks = ANCESTRY_BASELINE.map(r => {
    let v = r.value;
    if (r.name === 'Hypertension' && profileData['rs1799752']?.includes('DD')) v += 28;
    if (r.name === 'Type 2 Diabetes' && profileData['rs7903146']?.includes('CC')) v += 24;
    if (r.name === 'Cardiovascular (Lp(a))' && profileData['rs10455872']?.includes('A')) v += 30;
    if (r.name === 'Anticoagulant Sensitivity' && profileData['rs9923231']?.includes('AA')) v += 45;
    if (r.name === 'Inflammatory Tendency' && profileData['rs1800629']?.includes('AA')) v += 20;
    if (r.name === 'Lactose Intolerance' && profileData['rs4988235']?.includes('CC')) v += 35;
    return { ...r, value: Math.min(v, 100) };
  });

  const interactions = [];
  Object.entries(profileData).forEach(([markerId, value]) => {
    const m = MARKERS.find(x => x.id === markerId);
    const drugs = m && DRUG_INTERACTIONS[m.gene]?.[value];
    if (drugs) drugs.forEach(d => interactions.push({ ...d, gene: m.gene }));
  });

  const allFindings = Object.entries(profileData).map(([id, value]) => {
    const m = MARKERS.find(x => x.id === id);
    const f = m && FINDINGS[m.gene]?.[value];
    return m ? { marker: m, value, finding: f } : null;
  }).filter(Boolean).sort((a, b) => (b.marker.magnitude?.[b.value] || 0) - (a.marker.magnitude?.[a.value] || 0));

  const TABS = [
    { id: 'input', label: 'Sample Intake', icon: Upload },
    { id: 'findings', label: 'Literature Findings', icon: BookOpen },
    { id: 'nutrition', label: 'Nutrigenomics', icon: Leaf },
    { id: 'pharma', label: 'Drug Interactions', icon: Pill },
    { id: 'risk', label: 'Risk Ledger', icon: Activity },
    { id: 'report', label: 'Full Report', icon: ClipboardList }
  ];

  const EmptyState = ({ message }) => (
    <div className="gp-empty">
      <div className="gp-empty-icon"><Database size={28} /></div>
      <h3>No sample loaded</h3>
      <p>{message}</p>
      <Btn onClick={() => setActiveTab('input')}>Go to Sample Intake</Btn>
    </div>
  );

  const magnitudeBadge = (m, value) => {
    const mag = m.magnitude?.[value] ?? 0;
    const tone = mag >= 3 ? 'var(--red)' : mag >= 1.5 ? 'var(--amber)' : 'var(--phosphor)';
    return <span className="gp-mag" style={{ borderColor: tone, color: tone }}>mag {mag.toFixed(1)}</span>;
  };

  return (
    <div className="gp-root">
      <style>{`
        .gp-root {
          --ink: #0A0A0A; --panel: #161310; --panel-2: #1C1812; --line: #3A2F1A;
          --phosphor: #EAB308; --phosphor-dim: #A8790A; --amber: #FF9F43; --red: #FF6B6B;
          --text: #F1E9D8; --muted: #8A7C5E;
          min-height: 100vh; background: var(--ink); color: var(--text);
          font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif; position: relative;
        }
        .gp-root *{ box-sizing: border-box; }
        .gp-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .gp-display { font-family: 'Fraunces', Georgia, serif; }

        .gp-toast { position: fixed; top: 18px; right: 18px; z-index: 60; background: var(--panel-2); border: 1px solid var(--phosphor-dim); color: var(--phosphor); padding: 12px 18px; border-radius: 4px; display:flex; align-items:center; gap:10px; font-size: 13px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); max-width: 360px; }
        .gp-toast.warn { border-color: var(--amber); color: var(--amber); }

        .gp-header { border-bottom: 1px solid var(--line); background: rgba(10,10,10,0.92); backdrop-filter: blur(6px); position: sticky; top: 0; z-index: 40; }
        .gp-header-inner { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display:flex; align-items:center; justify-content:space-between; gap: 16px; }
        .gp-brand { display:flex; align-items:center; gap:12px; }
        .gp-brand-mark { width: 38px; height:38px; border-radius:4px; background: linear-gradient(135deg, var(--phosphor) 0%, var(--phosphor-dim) 100%); display:flex; align-items:center; justify-content:center; color: #0A0A0A; }
        .gp-brand h1 { font-size: 19px; margin:0; letter-spacing: 0.02em; }
        .gp-brand h1 span { color: var(--phosphor); }
        .gp-brand p { margin:0; font-size: 10px; letter-spacing: 0.16em; color: var(--muted); text-transform: uppercase; }

        .gp-ticker { flex: 1; max-width: 340px; overflow: hidden; height: 22px; border: 1px solid var(--line); border-radius: 3px; background: #060605; display: none; }
        @media (min-width: 780px) { .gp-ticker { display:block; } }
        .gp-ticker-track { display:flex; gap: 8px; padding: 3px 8px; animation: gp-scroll 14s linear infinite; width: max-content; }
        .gp-base { font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
        .gp-base-A { color: var(--phosphor); } .gp-base-T { color: #5FC9FF; } .gp-base-C { color: var(--amber); } .gp-base-G { color: #C792FF; }
        @keyframes gp-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .gp-privacy { display:flex; align-items:center; gap:8px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 20px; font-size: 11px; color: var(--muted); white-space: nowrap; }
        .gp-privacy svg { color: var(--phosphor); }

        .gp-main { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; }

        .gp-banner { display:flex; gap: 12px; align-items:flex-start; background: var(--panel-2); border: 1px solid var(--phosphor-dim); border-radius: 6px; padding: 14px 16px; margin-bottom: 22px; font-size: 12.5px; color: var(--muted); }
        .gp-banner svg { color: var(--phosphor); flex-shrink:0; margin-top: 1px; }

        .gp-tabs { display:flex; gap: 8px; overflow-x:auto; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid var(--line); }
        .gp-tab { display:flex; align-items:center; gap:8px; padding: 9px 16px; border-radius: 3px; font-size: 13px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); cursor:pointer; white-space:nowrap; transition: all .15s ease; }
        .gp-tab:hover { color: var(--text); border-color: var(--phosphor-dim); }
        .gp-tab.active { background: var(--phosphor); color: #0A0A0A; border-color: var(--phosphor); font-weight: 600; }

        .gp-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 22px; }
        .gp-section-title { display:flex; align-items:center; gap:10px; margin: 0 0 22px; font-size: 22px; }
        .gp-section-title svg { color: var(--phosphor); }

        .gp-intake-row { display:flex; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; align-items:center; justify-content:space-between; }

        .gp-filterbar { display:flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; align-items:center; }
        .gp-search { display:flex; align-items:center; gap:8px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 5px; padding: 8px 12px; flex: 1; min-width: 200px; }
        .gp-search input { background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; width: 100%; }
        .gp-search svg { color: var(--muted); flex-shrink:0; }
        .gp-chip { padding: 7px 13px; border-radius: 16px; font-size: 12px; border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); cursor:pointer; transition: all .12s ease; }
        .gp-chip:hover { border-color: var(--phosphor-dim); }
        .gp-chip.active { background: var(--phosphor); color: #0A0A0A; border-color: var(--phosphor); font-weight: 600; }

        .gp-marker-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 14px; }
        .gp-marker-card { background: var(--panel-2); border: 1px solid var(--line); border-radius: 5px; padding: 16px; transition: border-color .15s ease; }
        .gp-marker-card:hover { border-color: var(--phosphor-dim); }
        .gp-marker-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px; }
        .gp-marker-head h3 { margin:0; font-size: 16px; }
        .gp-marker-head p { margin:2px 0 0; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .gp-rsid-tag { font-size: 10px; background: #060605; border: 1px solid var(--line); color: var(--phosphor-dim); padding: 3px 7px; border-radius: 3px; }
        .gp-marker-desc { font-size: 12px; color: var(--muted); margin: 0 0 12px; line-height: 1.4; }

        .gp-option { display:flex; align-items:center; gap: 10px; padding: 9px 10px; border-radius: 4px; border: 1px solid var(--line); cursor:pointer; margin-bottom: 6px; font-size: 13px; transition: all .12s ease; }
        .gp-option:hover { border-color: var(--phosphor-dim); }
        .gp-option.selected { background: rgba(234,179,8,0.1); border-color: var(--phosphor); color: var(--phosphor); }
        .gp-radio { width: 13px; height: 13px; border-radius: 50%; border: 1px solid var(--muted); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .gp-option.selected .gp-radio { border-color: var(--phosphor); }
        .gp-radio-dot { width: 6px; height:6px; border-radius:50%; background: var(--phosphor); }

        .gp-empty { text-align:center; padding: 70px 20px; }
        .gp-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--panel-2); border: 1px solid var(--line); display:flex; align-items:center; justify-content:center; margin: 0 auto 16px; color: var(--muted); }
        .gp-empty h3 { margin: 0 0 8px; }
        .gp-empty p { color: var(--muted); max-width: 360px; margin: 0 auto 20px; }

        .gp-btn { display:inline-flex; align-items:center; gap:8px; padding: 9px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor:pointer; border: 1px solid transparent; transition: all .15s ease; }
        .gp-btn:disabled { opacity: .45; cursor:not-allowed; }
        .gp-btn-primary { background: var(--phosphor); color: #0A0A0A; }
        .gp-btn-primary:hover:not(:disabled) { background: #FFCB3D; }
        .gp-btn-secondary { background: transparent; color: var(--phosphor); border-color: var(--phosphor-dim); }
        .gp-btn-secondary:hover:not(:disabled) { background: rgba(234,179,8,0.08); }
        .gp-btn-danger { background: transparent; color: var(--red); border-color: rgba(255,107,107,0.4); }
        .gp-btn-danger:hover:not(:disabled) { background: rgba(255,107,107,0.08); }

        .gp-result-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap: 14px; }
        .gp-result-card { border-left: 3px solid var(--phosphor); }
        .gp-result-card h4 { display:flex; align-items:center; gap:6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--phosphor); margin: 0 0 4px; }
        .gp-result-card p { font-size: 13.5px; line-height: 1.5; color: var(--text); margin: 0 0 14px; }

        .gp-warn-card { border-left: 3px solid var(--red); background: rgba(255,107,107,0.05); }

        .gp-finding-card { border-left: 3px solid var(--phosphor-dim); margin-bottom: 12px; }
        .gp-finding-top { display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
        .gp-mag { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; border: 1px solid; border-radius: 3px; padding: 2px 7px; }
        .gp-source { font-size: 11px; color: var(--muted); margin-top: 8px; font-style: italic; }

        .gp-risk-bar-row { margin-bottom: 16px; }
        .gp-risk-bar-track { width: 100%; height: 8px; background: #060605; border-radius: 4px; overflow:hidden; border: 1px solid var(--line); }
        .gp-risk-bar-fill { height: 100%; border-radius: 4px; }

        .gp-footer { border-top: 1px solid var(--line); padding: 28px 24px; text-align:center; }
        .gp-footer p:first-child { color: var(--muted); font-size: 13px; margin: 0 0 8px; }
        .gp-footer p:last-child { color: #4A4030; font-size: 11.5px; max-width: 680px; margin: 0 auto; line-height: 1.5; }

        .gp-report-pre { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; line-height: 1.6; white-space: pre-wrap; background: #060605; border: 1px solid var(--line); border-radius: 5px; padding: 18px; max-height: 520px; overflow-y: auto; color: var(--text); }

        .gp-spin { animation: gp-spin-kf 0.9s linear infinite; }
        @keyframes gp-spin-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className={`gp-toast ${notification.tone === 'warn' ? 'warn' : ''}`}>
            {notification.tone === 'warn' ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
            <span>{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="gp-header">
        <div className="gp-header-inner">
          <div className="gp-brand">
            <div className="gp-brand-mark"><Dna size={20} /></div>
            <div>
              <h1 className="gp-display">GENO<span>PRIME</span></h1>
              <p>Raw DNA Literature Lookup</p>
            </div>
          </div>
          <BasePairTicker />
          <div className="gp-privacy"><Lock size={13} /> {storageReady ? 'Stored privately to your account' : 'Connecting to storage…'}</div>
        </div>
      </header>

      <main className="gp-main">
        <div className="gp-banner">
          <Info size={16} />
          <div>
            <strong style={{ color: 'var(--text)' }}>What this tool actually is:</strong> it works the same way as real raw-data interpretation services (the category Promethease and Genetic Genie occupy) — it matches genotypes from your raw DNA file against published research literature and shows you the association, with a source citation. It is <strong>not</strong> a diagnostic tool, has not been clinically validated, and consumer raw-data files can themselves contain errors. Treat findings as things to discuss with a doctor or genetic counselor, never as a basis for self-treatment or medication changes.
          </div>
        </div>

        <div className="gp-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`gp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {activeTab === 'input' && (
              <div>
                <h2 className="gp-section-title gp-display"><Upload size={20} /> Sample Intake</h2>

                <Panel className="gp-intake-row">
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>Load a raw data file</h3>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
                      Tab-delimited rsid / chromosome / position / genotype rows — the same shape exported by 23andMe, AncestryDNA, and similar services. The file is read entirely in your browser and never uploaded anywhere.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input ref={fileInputRef} type="file" accept=".txt,.csv,.tsv" onChange={handleFileSelected} style={{ display: 'none' }} />
                    <Btn variant="secondary" onClick={downloadSampleFile}><Download size={15} /> Get sample file</Btn>
                    <Btn onClick={() => fileInputRef.current?.click()} disabled={parsing}>
                      {parsing ? <Loader2 size={15} className="gp-spin" /> : <ScanLine size={15} />} {parsing ? 'Parsing…' : 'Upload raw data'}
                    </Btn>
                  </div>
                </Panel>

                {parseSummary && (
                  <div style={{ margin: '14px 0 4px', fontSize: 12.5, color: 'var(--phosphor-dim)' }} className="gp-mono">
                    ▸ scanned {parseSummary.dataLines.toLocaleString()} rows · matched {parseSummary.matchedCount}/{parseSummary.total} reference markers
                  </div>
                )}

                <div style={{ height: 1, background: 'var(--line)', margin: '24px 0' }} />

                <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or set genotypes manually</h3>

                <div className="gp-filterbar">
                  <div className="gp-search">
                    <Search size={14} />
                    <input placeholder="Search gene, trait, or rsID…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {CATEGORIES.map(c => (
                    <button key={c} className={`gp-chip ${categoryFilter === c ? 'active' : ''}`} onClick={() => setCategoryFilter(c)}>{c}</button>
                  ))}
                </div>

                <div className="gp-marker-grid">
                  {filteredMarkers.map(marker => (
                    <div className="gp-marker-card" key={marker.id}>
                      <div className="gp-marker-head">
                        <div>
                          <h3>{marker.gene}</h3>
                          <p>{marker.trait} · {marker.category}</p>
                        </div>
                        <span className="gp-rsid-tag gp-mono">{marker.id}</span>
                      </div>
                      <p className="gp-marker-desc">{marker.description}</p>
                      {marker.options.map(opt => {
                        const selected = profileData[marker.id] === opt;
                        return (
                          <label key={opt} className={`gp-option ${selected ? 'selected' : ''}`}>
                            <input type="radio" name={marker.id} value={opt} checked={selected} onChange={() => handleMarkerChange(marker.id, opt)} style={{ display: 'none' }} />
                            <span className="gp-radio">{selected && <span className="gp-radio-dot" />}</span>
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                  {filteredMarkers.length === 0 && (
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>No markers match that search/filter.</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                  <Btn onClick={saveProfile} disabled={!hasData || isSaved}><Save size={15} /> {isSaved ? 'Saved' : 'Save profile'}</Btn>
                  <Btn variant="secondary" onClick={exportProfileJSON} disabled={!hasData}><FileText size={15} /> Export JSON</Btn>
                  {hasData && <Btn variant="danger" onClick={clearProfile}><Trash2 size={15} /> Clear all data</Btn>}
                </div>
                {storageError && (
                  <p style={{ marginTop: 12, fontSize: 12, color: 'var(--amber)' }}>
                    Storage isn't reachable right now — your selections are still active this session, just not saved between visits.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'findings' && (
              hasData ? (
                <div>
                  <h2 className="gp-section-title gp-display"><BookOpen size={20} /> Literature Findings</h2>
                  <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: -10, marginBottom: 20 }}>
                    Sorted by magnitude — a rough indicator of how notable a finding is, the same convention real reports like Promethease use. Higher magnitude means more research attention, not greater certainty.
                  </p>
                  {allFindings.map(({ marker, value, finding }) => (
                    <Panel className="gp-finding-card" key={marker.id}>
                      <div className="gp-finding-top">
                        <div>
                          <strong>{marker.gene}</strong>
                          <span className="gp-mono" style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>{marker.id} · {value}</span>
                        </div>
                        {magnitudeBadge(marker, value)}
                      </div>
                      {finding ? (
                        <>
                          <p style={{ margin: '0 0 6px', fontSize: 13.5 }}>{finding.summary}</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{finding.detail}</p>
                          <p className="gp-source">Source: {finding.source}</p>
                        </>
                      ) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>No literature entry on file for this genotype yet.</p>}
                    </Panel>
                  ))}
                </div>
              ) : <EmptyState message="Load or enter genotypes in Sample Intake to surface literature findings." />
            )}

            {activeTab === 'nutrition' && (
              hasData ? (
                <div>
                  <h2 className="gp-section-title gp-display"><Leaf size={20} /> Nutrigenomics Notes</h2>
                  <div className="gp-result-grid">
                    {allFindings.map(({ marker, value, finding }) => {
                      if (!finding) return null;
                      return (
                        <Panel className="gp-result-card" key={marker.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <strong>{marker.gene}</strong>
                            <span className="gp-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{value}</span>
                          </div>
                          <h4><FileText size={12} /> Commonly discussed pattern</h4>
                          <p style={{ marginBottom: 0 }}>{finding.detail}</p>
                        </Panel>
                      );
                    })}
                  </div>
                  <p style={{ marginTop: 18, fontSize: 12, color: 'var(--muted)' }}>
                    <Info size={12} style={{ verticalAlign: -2 }} /> These are dietary patterns commonly discussed in genetics literature for each genotype — not a personalized meal plan, and not a substitute for a registered dietitian.
                  </p>
                </div>
              ) : <EmptyState message="Load or enter genotypes in Sample Intake to generate nutrigenomics notes." />
            )}

            {activeTab === 'pharma' && (
              hasData ? (
                <div>
                  <h2 className="gp-section-title gp-display"><Pill size={20} /> Drug Interaction Overlay</h2>
                  {interactions.length === 0 ? (
                    <Panel style={{ textAlign: 'center', padding: '50px 20px', borderStyle: 'dashed' }}>
                      <CheckCircle2 size={40} style={{ color: 'var(--phosphor)', marginBottom: 14 }} />
                      <h3 style={{ margin: '0 0 8px' }}>No flagged interactions</h3>
                      <p style={{ color: 'var(--muted)', maxWidth: 420, margin: '0 auto' }}>
                        None of the loaded markers hit a flagged genotype in this reference set. Always confirm with a pharmacist or physician before starting or changing any medication, regardless of what this tool shows.
                      </p>
                    </Panel>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {interactions.map((item, i) => (
                        <Panel className="gp-warn-card" key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <AlertCircle size={15} style={{ color: 'var(--red)' }} />
                            <strong>{item.drug}</strong>
                            <span className="gp-mono" style={{ fontSize: 10.5, color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 3, padding: '2px 6px' }}>via {item.gene}</span>
                          </div>
                          <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13, margin: '0 0 4px' }}>{item.risk}</p>
                          <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>{item.note}</p>
                        </Panel>
                      ))}
                    </div>
                  )}
                </div>
              ) : <EmptyState message="Load or enter genotypes in Sample Intake to check drug interactions." />
            )}

            {activeTab === 'risk' && (
              hasData ? (
                <div>
                  <h2 className="gp-section-title gp-display"><Activity size={20} /> Risk Ledger</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                    <Panel style={{ height: 360 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={adjustedRisks} outerRadius="75%">
                          <PolarGrid stroke="#3A2F1A" />
                          <PolarAngleAxis dataKey="name" tick={{ fill: '#8A7C5E', fontSize: 11 }} />
                          <Radar dataKey="value" stroke="#EAB308" fill="#EAB308" fillOpacity={0.25} strokeWidth={2} />
                          <RechartsTooltip contentStyle={{ background: '#161310', border: '1px solid #3A2F1A', color: '#F1E9D8' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Panel>
                    <Panel>
                      {adjustedRisks.map(r => (
                        <div className="gp-risk-bar-row" key={r.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                            <span>{r.name}</span>
                            <span className="gp-mono" style={{ color: r.value > 65 ? 'var(--red)' : r.value > 40 ? 'var(--amber)' : 'var(--phosphor)' }}>{r.value}%</span>
                          </div>
                          <div className="gp-risk-bar-track">
                            <motion.div className="gp-risk-bar-fill" initial={{ width: 0 }} animate={{ width: `${r.value}%` }} transition={{ duration: 0.8 }} style={{ background: r.value > 65 ? 'var(--red)' : r.value > 40 ? 'var(--amber)' : 'var(--phosphor)' }} />
                          </div>
                        </div>
                      ))}
                    </Panel>
                  </div>
                  <p style={{ marginTop: 18, fontSize: 12, color: 'var(--muted)' }}>
                    <Info size={12} style={{ verticalAlign: -2 }} /> Relative to a generic population baseline — illustrative weighting from the matched markers, not a clinical risk score. A real risk assessment needs family history and clinical labs, not genotype alone.
                  </p>
                </div>
              ) : <EmptyState message="Load or enter genotypes in Sample Intake to populate the risk ledger." />
            )}

            {activeTab === 'report' && (
              hasData ? (
                <div>
                  <h2 className="gp-section-title gp-display"><ClipboardList size={20} /> Full Report</h2>
                  <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: -10, marginBottom: 16 }}>
                    Everything above, compiled into one document — the kind of printout worth bringing to a doctor's appointment.
                  </p>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Btn onClick={downloadFullReport}><Download size={15} /> Download report (.txt)</Btn>
                    <Btn variant="secondary" onClick={() => window.print()}><FileText size={15} /> Print this page</Btn>
                  </div>
                  <pre className="gp-report-pre">{buildTextReport(profileData)}</pre>
                </div>
              ) : <EmptyState message="Load or enter genotypes in Sample Intake to generate a full report." />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="gp-footer">
        <p>GENOPRIME — Raw DNA literature lookup tool</p>
        <p>This tool matches genotypes from a raw data file against published research summaries, the same way Promethease and similar third-party tools work. It is not a diagnostic device, is not clinically validated, and is not a substitute for professional medical, dietary, or pharmacological advice. Data is stored only in your private, per-account storage — never transmitted to a third party.</p>
      </footer>
    </div>
  );
}
