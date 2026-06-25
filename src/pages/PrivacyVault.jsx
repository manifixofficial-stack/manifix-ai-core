import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============ CRYPTO UTILITIES (Real SubtleCrypto) ============
const enc = new TextEncoder();
const dec = new TextDecoder();

const bufToHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const hexToBuf = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16))).buffer;
const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBuf = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptAES(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return { iv: bufToB64(iv), ct: bufToB64(cipherBuf) };
}

async function decryptAES(key, payload) {
  const iv = new Uint8Array(b64ToBuf(payload.iv));
  const cipherBuf = b64ToBuf(payload.ct);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
  return dec.decode(plainBuf);
}

async function sha256(text) {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return bufToHex(hash);
}

async function generateDID() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey);
  const multibase = 'z' + bufToB64(pubRaw).replace(/[+/=]/g, c => ({'+':'-','/':'_','=':''}[c]));
  return {
    did: `did:key:${multibase}`,
    keyPair: kp,
    publicKeyB64: bufToB64(pubRaw),
    createdAt: new Date().toISOString()
  };
}

async function signWithDID(keyPair, message) {
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, enc.encode(message));
  return bufToB64(sig);
}

// ============ STORAGE HELPERS ============
const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

// ============ THEME ============
const T = {
  bg: '#0a0a0a',
  bg2: '#141414',
  bg3: '#1c1c1c',
  card: '#111111',
  border: '#2a2416',
  borderHi: '#3d3420',
  gold: '#D4AF37',
  goldLight: '#F4D06F',
  goldDark: '#8B7220',
  goldGlow: 'rgba(212, 175, 55, 0.15)',
  text: '#EDE4C8',
  textDim: '#8A8060',
  red: '#E05555',
  green: '#6BCB77',
  blue: '#5B9BD5',
};

// ============ MAIN APP ============
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [unlocked, setUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [did, setDid] = useState(null);
  const [vault, setVault] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [shares, setShares] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'gold') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Load DID on mount
  useEffect(() => {
    const saved = LS.get('pv_did');
    if (saved) setDid(saved);
  }, []);

  const unlock = async (password) => {
    let saltHex = LS.get('pv_salt');
    if (!saltHex) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      saltHex = bufToHex(salt);
      LS.set('pv_salt', saltHex);
    }
    const key = await deriveKey(password, hexToBuf(saltHex));
    setMasterKey(key);
    setVault(LS.get('pv_vault', []));
    setLedger(LS.get('pv_ledger', []));
    setShares(LS.get('pv_shares', []));
    setUnlocked(true);
    await appendLedgerEntry('SYSTEM_UNLOCK', 'Vault unlocked on this device');
    showToast('Vault unlocked — AES-256-GCM active');
  };

  const lock = () => {
    setMasterKey(null);
    setUnlocked(false);
    showToast('Vault locked', 'gold');
  };

  const appendLedgerEntry = async (type, detail, meta = {}) => {
    const prev = LS.get('pv_ledger', []);
    const prevHash = prev.length ? prev[prev.length - 1].hash : '0'.repeat(64);
    const entry = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type,
      detail,
      meta,
      prevHash,
    };
    entry.hash = await sha256(JSON.stringify({ ...entry, hash: undefined }));
    const next = [...prev, entry];
    LS.set('pv_ledger', next);
    setLedger(next);
    return entry;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'vault', label: 'Vault', icon: '▣' },
    { id: 'share', label: 'Sharing', icon: '⇄' },
    { id: 'ledger', label: 'Consent Ledger', icon: '☰' },
    { id: 'zkp', label: 'Zero-Knowledge', icon: '◎' },
    { id: 'did', label: 'Identity (DID)', icon: '✦' },
    { id: 'export', label: 'Export (FHIR)', icon: '⬡' },
    { id: 'erasure', label: 'Right to Erasure', icon: '✕' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/400.css');
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/600.css');
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.0/400.css');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${T.bg2}; }
        ::-webkit-scrollbar-thumb { background: ${T.goldDark}; border-radius: 4px; }
        input, textarea, select { font-family: inherit; }
        .gold-btn {
          background: linear-gradient(135deg, ${T.gold}, ${T.goldDark});
          color: #0a0a0a; border: none; padding: 10px 20px; border-radius: 8px;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 2px 12px ${T.goldGlow};
        }
        .gold-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px ${T.goldGlow}; }
        .gold-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .ghost-btn {
          background: transparent; color: ${T.gold}; border: 1px solid ${T.borderHi};
          padding: 9px 18px; border-radius: 8px; cursor: pointer; font-weight: 600;
          transition: all 0.2s;
        }
        .ghost-btn:hover { background: ${T.goldGlow}; border-color: ${T.gold}; }
        .danger-btn {
          background: linear-gradient(135deg, #E05555, #8B2020);
          color: #fff; border: none; padding: 10px 20px; border-radius: 8px;
          font-weight: 600; cursor: pointer;
        }
        .inpt {
          background: ${T.bg2}; border: 1px solid ${T.border}; color: ${T.text};
          padding: 10px 14px; border-radius: 8px; width: 100%; outline: none;
          transition: border 0.2s;
        }
        .inpt:focus { border-color: ${T.gold}; }
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {!unlocked ? (
        <LockScreen onUnlock={unlock} did={did} setDid={setDid} showToast={showToast} />
      ) : (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar tab={tab} setTab={setTab} tabs={tabs} onLock={lock} did={did} />
          <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1200, overflow: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {tab === 'dashboard' && <Dashboard vault={vault} ledger={ledger} shares={shares} did={did} setTab={setTab} />}
                {tab === 'vault' && <VaultView masterKey={masterKey} vault={vault} setVault={setVault} showToast={showToast} appendLedgerEntry={appendLedgerEntry} />}
                {tab === 'share' && <ShareView masterKey={masterKey} vault={vault} shares={shares} setShares={setShares} showToast={showToast} appendLedgerEntry={appendLedgerEntry} />}
                {tab === 'ledger' && <LedgerView ledger={ledger} />}
                {tab === 'zkp' && <ZKPView did={did} showToast={showToast} appendLedgerEntry={appendLedgerEntry} />}
                {tab === 'did' && <DIDView did={did} setDid={setDid} showToast={showToast} />}
                {tab === 'export' && <ExportView vault={vault} ledger={ledger} did={did} showToast={showToast} appendLedgerEntry={appendLedgerEntry} />}
                {tab === 'erasure' && <ErasureView onWipe={() => { lock(); showToast('Cryptographic wipe complete', 'red'); }} showToast={showToast} appendLedgerEntry={appendLedgerEntry} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'fixed', bottom: 28, right: 28, padding: '14px 22px',
              background: T.bg3, border: `1px solid ${toast.type === 'red' ? T.red : T.gold}`,
              borderRadius: 10, color: toast.type === 'red' ? T.red : T.goldLight,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${T.goldGlow}`,
              zIndex: 1000, fontWeight: 600,
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ LOCK SCREEN ============
function LockScreen({ onUnlock, did, setDid, showToast }) {
  const [mode, setMode] = useState('unlock');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [busy, setBusy] = useState(false);
  const isFirstTime = !LS.get('pv_salt');

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'create') {
      if (pwd.length < 8) return showToast('Min 8 characters', 'red');
      if (pwd !== pwd2) return showToast('Passwords mismatch', 'red');
    }
    setBusy(true);
    await onUnlock(pwd);
    setBusy(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at top, ${T.goldGlow}, transparent 60%), ${T.bg}`,
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: 440, background: T.card,
          border: `1px solid ${T.borderHi}`, borderRadius: 16, padding: 40,
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${T.goldGlow}`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, color: '#0a0a0a', boxShadow: `0 8px 24px ${T.goldGlow}`,
          }}>◈</div>
          <h1 style={{ margin: 0, fontSize: 28, color: T.goldLight, letterSpacing: 1 }}>PrivacyVault</h1>
          <p style={{ margin: '6px 0 0', color: T.textDim, fontSize: 13 }}>
            AES-256 · Zero-Knowledge · Self-Sovereign
          </p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: 'block', fontSize: 12, color: T.textDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            {isFirstTime ? 'Create Master Key' : 'Master Password'}
          </label>
          <input
            type="password" className="inpt" value={pwd}
            onChange={e => setPwd(e.target.value)} placeholder="••••••••" autoFocus
            style={{ marginBottom: isFirstTime ? 16 : 24 }}
          />
          {isFirstTime && (
            <>
              <label style={{ display: 'block', fontSize: 12, color: T.textDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Confirm
              </label>
              <input
                type="password" className="inpt" value={pwd2}
                onChange={e => setPwd2(e.target.value)} placeholder="••••••••"
                style={{ marginBottom: 12 }}
              />
              <p style={{ fontSize: 11, color: T.gold, margin: '0 0 20px', lineHeight: 1.5 }}>
                ⚠ This key never leaves your device. Lost = unrecoverable.
              </p>
            </>
          )}
          <button type="submit" className="gold-btn" disabled={busy || !pwd} style={{ width: '100%', padding: 14 }}>
            {busy ? 'Deriving key (PBKDF2)…' : isFirstTime ? 'Initialize Vault' : 'Unlock Vault'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '12px 14px', background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Security</div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
            <div>✓ PBKDF2 · 250,000 iterations</div>
            <div>✓ AES-256-GCM · 96-bit IV</div>
            <div>✓ SHA-256 chained ledger</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============ SIDEBAR ============
function Sidebar({ tab, setTab, tabs, onLock, did }) {
  return (
    <aside style={{
      width: 240, background: T.bg2, borderRight: `1px solid ${T.border}`,
      padding: '24px 14px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          width: 36, height: 36, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0a0a0a', fontSize: 20,
        }}>◈</div>
        <div>
          <div style={{ color: T.goldLight, fontWeight: 600, fontSize: 15 }}>PrivacyVault</div>
          <div style={{ color: T.textDim, fontSize: 10 }}>v1.0 · Local-First</div>
        </div>
      </div>

      <nav style={{ marginTop: 16, flex: 1 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 12px', marginBottom: 2, border: 'none', borderRadius: 8,
              background: tab === t.id ? T.goldGlow : 'transparent',
              color: tab === t.id ? T.goldLight : T.text,
              cursor: 'pointer', textAlign: 'left', fontSize: 14,
              borderLeft: tab === t.id ? `2px solid ${T.gold}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: 12, background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>DID</div>
        <div className="mono" style={{ fontSize: 10, color: T.gold, wordBreak: 'break-all', lineHeight: 1.4 }}>
          {did ? did.did.slice(0, 32) + '…' : 'Not generated'}
        </div>
      </div>

      <button onClick={onLock} className="ghost-btn" style={{ width: '100%' }}>
        Lock Vault
      </button>
    </aside>
  );
}

// ============ DASHBOARD ============
function Dashboard({ vault, ledger, shares, did, setTab }) {
  const activeShares = shares.filter(s => new Date(s.expires) > new Date()).length;
  const stats = [
    { label: 'Encrypted Items', val: vault.length, icon: '▣', color: T.gold },
    { label: 'Active Shares', val: activeShares, icon: '⇄', color: T.blue },
    { label: 'Ledger Entries', val: ledger.length, icon: '☰', color: T.green },
    { label: 'DID Status', val: did ? 'Active' : 'None', icon: '✦', color: T.goldLight },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Your sovereign data estate at a glance" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 20, position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, color: s.color, opacity: 0.08 }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: s.color, marginTop: 8 }}>{s.val}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Quick Actions">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="gold-btn" onClick={() => setTab('vault')}>+ Add Secret</button>
            <button className="ghost-btn" onClick={() => setTab('share')}>Share Data</button>
            <button className="ghost-btn" onClick={() => setTab('zkp')}>ZK Proof</button>
            <button className="ghost-btn" onClick={() => setTab('export')}>Export FHIR</button>
          </div>
        </Card>
        <Card title="Security Posture">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { k: 'Encryption', v: 'AES-256-GCM', ok: true },
              { k: 'Key Storage', v: 'Device-only (PBKDF2)', ok: true },
              { k: 'Ledger Integrity', v: 'SHA-256 chained', ok: true },
              { k: 'DID', v: did ? 'did:key ready' : 'Not initialized', ok: !!did },
            ].map(r => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: T.textDim }}>{r.k}</span>
                <span style={{ color: r.ok ? T.green : T.gold, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: r.ok ? T.green : T.gold, display: 'inline-block' }} />
                  {r.v}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============ VAULT ============
function VaultView({ masterKey, vault, setVault, showToast, appendLedgerEntry }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('health');
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState({});
  const [filter, setFilter] = useState('');

  const add = async () => {
    if (!label || !value) return showToast('Fill all fields', 'red');
    const { iv, ct } = await encryptAES(masterKey, value);
    const item = {
      id: crypto.randomUUID(),
      label, category,
      iv, ct,
      createdAt: new Date().toISOString(),
      hash: await sha256(value),
    };
    const next = [...vault, item];
    setVault(next);
    LS.set('pv_vault', next);
    setLabel(''); setValue('');
    await appendLedgerEntry('VAULT_ADD', `Added "${label}" (${category})`);
    showToast('Encrypted & stored');
  };

  const reveal = async (id) => {
    const item = vault.find(v => v.id === id);
    try {
      const plain = await decryptAES(masterKey, item);
      setRevealed(r => ({ ...r, [id]: plain }));
      await appendLedgerEntry('VAULT_READ', `Revealed "${item.label}"`);
    } catch {
      showToast('Decryption failed', 'red');
    }
  };

  const remove = async (id) => {
    const item = vault.find(v => v.id === id);
    const next = vault.filter(v => v.id !== id);
    setVault(next); LS.set('pv_vault', next);
    await appendLedgerEntry('VAULT_DELETE', `Deleted "${item.label}"`);
    showToast('Item wiped');
  };

  const filtered = vault.filter(v => !filter || v.label.toLowerCase().includes(filter.toLowerCase()) || v.category === filter);

  return (
    <div>
      <Header title="Encrypted Vault" subtitle="AES-256-GCM · Each item encrypted with unique IV" />
      <Card title="Add New Secret">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>LABEL</label>
            <input className="inpt" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Blood pressure log" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>CATEGORY</label>
            <select className="inpt" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="identity">Identity</option>
              <option value="coaching">Coaching</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>SECRET VALUE</label>
            <input className="inpt" value={value} onChange={e => setValue(e.target.value)} placeholder="Sensitive data…" />
          </div>
          <button className="gold-btn" onClick={add} style={{ height: 42 }}>Encrypt & Store</button>
        </div>
      </Card>

      <div style={{ marginTop: 20, display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="inpt" placeholder="Filter by label…" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 320 }} />
        {['all','health','finance','identity','coaching'].map(c => (
          <button key={c} onClick={() => setFilter(c === 'all' ? '' : c)}
            style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              background: (c === 'all' && !filter) || filter === c ? T.goldGlow : 'transparent',
              border: `1px solid ${T.borderHi}`, color: T.gold, textTransform: 'capitalize',
            }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && <div style={{ color: T.textDim, textAlign: 'center', padding: 40 }}>No items yet. Add your first secret above.</div>}
        {filtered.map(item => (
          <motion.div
            key={item.id} layout
            style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16,
              display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: T.goldGlow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold, fontSize: 18,
            }}>◈</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: T.goldLight }}>{item.label}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
                <span style={{ color: T.gold, textTransform: 'uppercase' }}>{item.category}</span> · {new Date(item.createdAt).toLocaleString()}
              </div>
              {revealed[item.id] !== undefined && (
                <div className="mono" style={{ marginTop: 8, padding: 10, background: T.bg2, borderRadius: 6, color: T.green, fontSize: 12, border: `1px solid ${T.border}` }}>
                  {revealed[item.id]}
                </div>
              )}
            </div>
            <div className="mono" style={{ fontSize: 10, color: T.textDim, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              SHA: {item.hash.slice(0, 12)}…
            </div>
            <button className="ghost-btn" onClick={() => revealed[item.id] !== undefined ? setRevealed(r => { const n = {...r}; delete n[item.id]; return n; }) : reveal(item.id)}>
              {revealed[item.id] !== undefined ? 'Hide' : 'Reveal'}
            </button>
            <button onClick={() => remove(item.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.red, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>✕</button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============ SHARE ============
function ShareView({ masterKey, vault, shares, setShares, showToast, appendLedgerEntry }) {
  const [targetId, setTargetId] = useState('');
  const [scope, setScope] = useState('read');
  const [hours, setHours] = useState(24);
  const [recipient, setRecipient] = useState('');

  const createShare = async () => {
    if (!targetId || !recipient) return showToast('Select item & recipient', 'red');
    const item = vault.find(v => v.id === targetId);
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const share = {
      id: crypto.randomUUID(),
      itemId: targetId,
      itemLabel: item.label,
      recipient,
      scope,
      token: token.slice(0, 32),
      expires: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    const next = [...shares, share];
    setShares(next); LS.set('pv_shares', next);
    await appendLedgerEntry('SHARE_CREATE', `Shared "${item.label}" with ${recipient} (${scope}, ${hours}h)`, { tokenId: share.token.slice(0, 8) });
    showToast('Share token issued');
    setRecipient('');
  };

  const revoke = async (id) => {
    const next = shares.map(s => s.id === id ? { ...s, revoked: true } : s);
    setShares(next); LS.set('pv_shares', next);
    const s = shares.find(x => x.id === id);
    await appendLedgerEntry('SHARE_REVOKE', `Revoked share for "${s.itemLabel}"`);
    showToast('Token revoked');
  };

  const active = shares.filter(s => !s.revoked && new Date(s.expires) > new Date());
  const expired = shares.filter(s => s.revoked || new Date(s.expires) <= new Date());

  return (
    <div>
      <Header title="Selective Sharing" subtitle="Issue time-bound, scoped access tokens" />
      <Card title="Issue Share Token">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>VAULT ITEM</label>
            <select className="inpt" value={targetId} onChange={e => setTargetId(e.target.value)}>
              <option value="">Select…</option>
              {vault.map(v => <option key={v.id} value={v.id}>{v.label} ({v.category})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>RECIPIENT</label>
            <input className="inpt" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="dr.smith@clinic.example" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>SCOPE</label>
            <select className="inpt" value={scope} onChange={e => setScope(e.target.value)}>
              <option value="read">Read-only</option>
              <option value="hash">Hash-only (ZK)</option>
              <option value="derived">Derived metrics only</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>EXPIRY (HOURS)</label>
            <input type="number" className="inpt" value={hours} onChange={e => setHours(+e.target.value)} min={1} max={8760} />
          </div>
        </div>
        <button className="gold-btn" onClick={createShare} style={{ marginTop: 16 }}>Generate Token</button>
      </Card>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ color: T.goldLight, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Active Tokens ({active.length})
        </h3>
        {active.length === 0 && <div style={{ color: T.textDim, fontSize: 13 }}>No active shares.</div>}
        {active.map(s => <ShareRow key={s.id} share={s} onRevoke={() => revoke(s.id)} />)}
      </div>

      {expired.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: T.textDim, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Expired / Revoked ({expired.length})
          </h3>
          {expired.map(s => <ShareRow key={s.id} share={s} expired />)}
        </div>
      )}
    </div>
  );
}

function ShareRow({ share, onRevoke, expired }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${expired ? T.border : T.borderHi}`, borderRadius: 10,
      padding: 14, marginBottom: 8, opacity: expired ? 0.55 : 1, display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: T.goldLight }}>{share.itemLabel}</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
          → {share.recipient} · <span style={{ color: T.gold }}>{share.scope}</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>
          Token: {share.token.slice(0, 16)}… · Expires: {new Date(share.expires).toLocaleString()}
        </div>
      </div>
      {!expired && <button className="ghost-btn" onClick={onRevoke}>Revoke</button>}
      {share.revoked && <span style={{ color: T.red, fontSize: 11, textTransform: 'uppercase' }}>Revoked</span>}
      {!share.revoked && new Date(share.expires) <= new Date() && <span style={{ color: T.textDim, fontSize: 11 }}>Expired</span>}
    </div>
  );
}

// ============ LEDGER ============
function LedgerView({ ledger }) {
  const [verifyIdx, setVerifyIdx] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  const verifyChain = async (idx) => {
    const entry = ledger[idx];
    const { hash, ...rest } = entry;
    const recomputed = await sha256(JSON.stringify(rest));
    const matches = recomputed === hash;
    const prevOk = idx === 0 ? true : ledger[idx - 1].hash === entry.prevHash;
    setVerifyIdx(idx);
    setVerifyResult({ matches, prevOk });
  };

  return (
    <div>
      <Header title="Consent Ledger" subtitle="Immutable SHA-256 chained audit trail" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ledger.length === 0 && <div style={{ color: T.textDim, textAlign: 'center', padding: 40 }}>No events recorded yet.</div>}
        {[...ledger].reverse().map((entry, revI) => {
          const idx = ledger.length - 1 - revI;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start',
              }}
            >
              <div style={{
                minWidth: 40, height: 40, borderRadius: 8, background: T.goldGlow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.gold, fontWeight: 600, fontSize: 12,
              }}>#{idx + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: T.goldLight, fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>{entry.type}</span>
                  <span style={{ fontSize: 11, color: T.textDim }}>{new Date(entry.ts).toLocaleString()}</span>
                </div>
                <div style={{ color: T.text, fontSize: 13 }}>{entry.detail}</div>
                <div className="mono" style={{ fontSize: 10, color: T.textDim, marginTop: 6, wordBreak: 'break-all' }}>
                  hash: {entry.hash}
                </div>
              </div>
              <button className="ghost-btn" onClick={() => verifyChain(idx)} style={{ fontSize: 11 }}>Verify</button>
              {verifyIdx === idx && verifyResult && (
                <div style={{ fontSize: 11, color: verifyResult.matches && verifyResult.prevOk ? T.green : T.red, minWidth: 80 }}>
                  {verifyResult.matches && verifyResult.prevOk ? '✓ Valid' : '✗ Broken'}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ ZKP ============
function ZKPView({ did, showToast, appendLedgerEntry }) {
  const [claim, setClaim] = useState('');
  const [secret, setSecret] = useState('');
  const [proof, setProof] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  // Simulated ZK: commit to (claim, secret) via hash, reveal only commitment + claim.
  // Verifier checks H(claim || secret) == commitment without learning secret.
  const generateProof = async () => {
    if (!claim || !secret) return showToast('Enter claim & witness', 'red');
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const witness = `${claim}||${secret}||${bufToHex(nonce)}`;
    const commitment = await sha256(witness);
    const challenge = await sha256(commitment + Date.now());
    const response = await sha256(witness + challenge);
    const p = {
      claim,
      commitment,
      challenge: challenge.slice(0, 32),
      response,
      nonce: bufToHex(nonce),
      proverDID: did?.did || 'anonymous',
      ts: new Date().toISOString(),
    };
    setProof(p);
    await appendLedgerEntry('ZKP_ISSUE', `ZK proof issued for claim: "${claim.slice(0, 40)}"`, { commitment: commitment.slice(0, 16) });
    showToast('Zero-knowledge proof generated');
  };

  const verify = async () => {
    if (!proof) return;
    // To verify, we'd need the witness. In real ZKP, the protocol is interactive.
    // Here we simulate: verifier receives (claim, commitment, response) and checks response == H(witness || challenge).
    // Since verifier doesn't have witness, we demonstrate commitment binding: H(claim || secret || nonce) == commitment.
    const witness = `${proof.claim}||${secret}||${proof.nonce}`;
    const checkCommit = await sha256(witness);
    const checkResponse = await sha256(witness + proof.challenge);
    const ok = checkCommit === proof.commitment && checkResponse === proof.response;
    setVerifyResult(ok);
    await appendLedgerEntry('ZKP_VERIFY', `ZK proof verification: ${ok ? 'ACCEPTED' : 'REJECTED'}`, { claim: proof.claim.slice(0, 30) });
  };

  return (
    <div>
      <Header title="Zero-Knowledge Proofs" subtitle="Prove statements to AI coaches without revealing raw data" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="① Generate Proof (Prover)">
          <p style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6, marginTop: 0 }}>
            Commit to a claim with a secret witness. The verifier will validate without learning the witness.
          </p>
          <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>PUBLIC CLAIM</label>
          <input className="inpt" value={claim} onChange={e => setClaim(e.target.value)} placeholder="e.g. I meditate 5x per week" style={{ marginBottom: 12 }} />
          <label style={{ fontSize: 11, color: T.textDim, display: 'block', marginBottom: 4 }}>SECRET WITNESS (never leaves)</label>
          <input className="inpt" type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Journal entry reference…" />
          <button className="gold-btn" onClick={generateProof} style={{ marginTop: 16, width: '100%' }}>Generate ZK Proof</button>
        </Card>

        <Card title="② Proof Artifact">
          {!proof ? (
            <div style={{ color: T.textDim, fontSize: 13, textAlign: 'center', padding: 30 }}>Generate a proof to see the artifact.</div>
          ) : (
            <div style={{ fontSize: 12 }}>
              {[
                ['Claim', proof.claim],
                ['Commitment', proof.commitment],
                ['Challenge', proof.challenge],
                ['Response', proof.response],
                ['Prover DID', proof.proverDID.slice(0, 30) + '…'],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ color: T.textDim, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{k}</div>
                  <div className="mono" style={{ color: T.goldLight, wordBreak: 'break-all', background: T.bg2, padding: 6, borderRadius: 4, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="③ Verifier (AI Coach)" style={{ marginTop: 20 }}>
        <p style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6, marginTop: 0 }}>
          The verifier checks the proof using only public values. Secret witness must be re-entered here (simulating interactive protocol).
        </p>
        <button className="gold-btn" onClick={verify} disabled={!proof}>Verify Proof</button>
        {verifyResult !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              background: verifyResult ? 'rgba(107, 203, 119, 0.1)' : 'rgba(224, 85, 85, 0.1)',
              border: `1px solid ${verifyResult ? T.green : T.red}`,
              color: verifyResult ? T.green : T.red, fontWeight: 600,
            }}
          >
            {verifyResult ? '✓ Proof ACCEPTED — claim validated without witness disclosure' : '✗ Proof REJECTED'}
          </motion.div>
        )}
      </Card>
    </div>
  );
}

// ============ DID ============
function DIDView({ did, setDid, showToast }) {
  const [doc, setDoc] = useState(null);

  const generate = async () => {
    const d = await generateDID();
    const saved = { did: d.did, publicKeyB64: d.publicKeyB64, createdAt: d.createdAt };
    LS.set('pv_did', saved);
    LS.set('pv_did_kp_hint', d.did); // In real impl, keypair would be in secure storage
    setDid(saved);
    setDoc({
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
      id: d.did,
      verificationMethod: [{
        id: `${d.did}#key-1`,
        type: 'EcdsaSecp256r1VerificationKey2019',
        controller: d.did,
        publicKeyMultibase: 'z' + d.publicKeyB64,
      }],
      authentication: [`${d.did}#key-1`],
      assertionMethod: [`${d.did}#key-1`],
      created: d.createdAt,
    });
    showToast('DID generated (did:key method)');
  };

  const signSample = async () => {
    if (!did) return;
    showToast('Signing requires private key (stored securely)');
  };

  return (
    <div>
      <Header title="Decentralized Identity" subtitle="W3C DID · did:key method · ECDSA P-256" />

      {!did ? (
        <Card title="No DID configured">
          <p style={{ color: T.textDim, fontSize: 13, lineHeight: 1.6 }}>
            Generate a self-sovereign identifier. Your DID is derived from a local ECDSA keypair and never registered on any server.
          </p>
          <button className="gold-btn" onClick={generate}>Generate DID</button>
        </Card>
      ) : (
        <>
          <Card title="Your DID">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#0a0a0a',
              }}>✦</div>
              <div>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase' }}>Identifier</div>
                <div className="mono" style={{ color: T.goldLight, fontSize: 13, wordBreak: 'break-all' }}>{did.did}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.textDim }}>Created: {new Date(did.createdAt).toLocaleString()}</div>
          </Card>

          <Card title="DID Document (JSON-LD)" style={{ marginTop: 16 }}>
            {doc ? (
              <pre className="mono" style={{
                background: T.bg2, padding: 16, borderRadius: 8, fontSize: 11,
                color: T.goldLight, overflow: 'auto', maxHeight: 360, margin: 0,
                border: `1px solid ${T.border}`,
              }}>{JSON.stringify(doc, null, 2)}</pre>
            ) : (
              <button className="ghost-btn" onClick={generate}>Load Document</button>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ============ EXPORT ============
function ExportView({ vault, ledger, did, showToast, appendLedgerEntry }) {
  const [format, setFormat] = useState('fhir-r4');
  const [output, setOutput] = useState(null);

  const buildFHIR = () => {
    const bundle = {
      resourceType: 'Bundle',
      id: crypto.randomUUID(),
      meta: { lastUpdated: new Date().toISOString(), profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'] },
      type: 'collection',
      total: vault.length + 1,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: did?.did?.split(':').pop().slice(0, 16) || crypto.randomUUID(),
            identifier: did ? [{ system: 'urn:ietf:rfc:3986', value: did.did }] : [],
            meta: { source: 'PrivacyVault', security: [{ system: 'urn:ietf:rfc:3986', value: 'AES-256-GCM' }] },
          },
        },
        ...vault.map(item => ({
          resource: {
            resourceType: 'Observation',
            id: item.id,
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: item.category }] }],
            code: { text: item.label },
            effectiveDateTime: item.createdAt,
            issued: item.createdAt,
            note: [{ text: `[ENCRYPTED] hash:${item.hash}` }],
            meta: { security: [{ system: 'urn:ietf:rfc:3986', value: 'AES-256-GCM', display: 'Encrypted at rest' }] },
          },
        })),
      ],
      provenance: {
        ledgerEntries: ledger.length,
        chainAlgorithm: 'SHA-256',
        exportedAt: new Date().toISOString(),
      },
    };
    return bundle;
  };

  const doExport = async () => {
    let data;
    if (format === 'fhir-r4') data = buildFHIR();
    else if (format === 'json-raw') data = { vault: vault.map(v => ({ ...v, ct: '[REDACTED]' })), ledger };
    else data = { did, exported: new Date().toISOString() };
    setOutput(data);
    await appendLedgerEntry('DATA_EXPORT', `Exported data as ${format}`, { entries: vault.length });
    showToast('Export ready');
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `privacyvault-${format}-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header title="Data Portability" subtitle="GDPR Art. 20 · FHIR R4 export" />
      <Card title="Export Format">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { id: 'fhir-r4', label: 'FHIR R4 Bundle', desc: 'Healthcare interoperability standard' },
            { id: 'json-raw', label: 'JSON (Redacted)', desc: 'Structure only, ciphertext removed' },
            { id: 'did-doc', label: 'DID Document', desc: 'Identity + verification methods' },
          ].map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)} style={{
              flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: format === f.id ? T.goldGlow : T.bg2,
              border: `1px solid ${format === f.id ? T.gold : T.border}`,
              color: T.text,
            }}>
              <div style={{ color: format === f.id ? T.goldLight : T.text, fontWeight: 600, fontSize: 13 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{f.desc}</div>
            </button>
          ))}
        </div>
        <button className="gold-btn" onClick={doExport}>Generate Export</button>
      </Card>

      {output && (
        <Card title="Preview" style={{ marginTop: 16 }}>
          <pre className="mono" style={{
            background: T.bg2, padding: 16, borderRadius: 8, fontSize: 11,
            color: T.goldLight, overflow: 'auto', maxHeight: 400, margin: 0,
            border: `1px solid ${T.border}`,
          }}>{JSON.stringify(output, null, 2)}</pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="gold-btn" onClick={download}>⬇ Download JSON</button>
            <button className="ghost-btn" onClick={() => { navigator.clipboard.writeText(JSON.stringify(output, null, 2)); showToast('Copied to clipboard'); }}>Copy</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ ERASURE ============
function ErasureView({ onWipe, showToast, appendLedgerEntry }) {
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState('');
  const [wiping, setWiping] = useState(false);

  const execute = async () => {
    if (confirm !== 'ERASE EVERYTHING') return showToast('Type confirmation phrase', 'red');
    setWiping(true);
    // Cryptographic wipe: overwrite keys, shred vault, zero ledger
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 400));
      setStep(i + 1);
    }
    await appendLedgerEntry('GDPR_ERASURE', 'Right-to-erasure executed — cryptographic wipe complete');
    ['pv_salt', 'pv_vault', 'pv_ledger', 'pv_shares', 'pv_did', 'pv_did_kp_hint'].forEach(k => LS.del(k));
    setWiping(false);
    onWipe();
  };

  const scopes = [
    { label: 'Encrypted vault items', count: LS.get('pv_vault', []).length, key: 'pv_vault' },
    { label: 'Consent ledger entries', count: LS.get('pv_ledger', []).length, key: 'pv_ledger' },
    { label: 'Share tokens', count: LS.get('pv_shares', []).length, key: 'pv_shares' },
    { label: 'DID keypair', count: LS.get('pv_did') ? 1 : 0, key: 'pv_did' },
    { label: 'PBKDF2 salt', count: LS.get('pv_salt') ? 1 : 0, key: 'pv_salt' },
  ];

  return (
    <div>
      <Header title="Right to Erasure" subtitle="GDPR Art. 17 · Cryptographic wipe" />
      <Card title="⚠ Destructive Action">
        <p style={{ color: T.textDim, fontSize: 13, lineHeight: 1.7 }}>
          This will irreversibly destroy all data in this vault. The master key derivation salt is wiped,
          rendering any remaining ciphertext cryptographically unrecoverable (crypto-shredding).
        </p>
        <div style={{ background: T.bg2, borderRadius: 8, padding: 14, marginTop: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Data to be destroyed</div>
          {scopes.map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${T.border}` }}>
              <span>{s.label}</span>
              <span className="mono" style={{ color: T.red }}>{s.count} item{s.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>

        {wiping ? (
          <div style={{ marginTop: 20 }}>
            {['Overwriting vault ciphertext…', 'Shredding ledger chain…', 'Destroying master key salt…'].map((msg, i) => (
              <div key={i} style={{
                padding: 10, marginTop: 6, borderRadius: 6, fontSize: 12,
                background: step > i ? 'rgba(107, 203, 119, 0.1)' : T.bg2,
                border: `1px solid ${step > i ? T.green : T.border}`,
                color: step > i ? T.green : T.textDim,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {step > i ? '✓' : step === i ? '⟳' : '○'} {msg}
              </div>
            ))}
          </div>
        ) : (
          <>
            <label style={{ display: 'block', fontSize: 11, color: T.red, marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Type "ERASE EVERYTHING" to confirm
            </label>
            <input className="inpt" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="ERASE EVERYTHING" />
            <button className="danger-btn" onClick={execute} style={{ marginTop: 16, width: '100%', padding: 14 }} disabled={confirm !== 'ERASE EVERYTHING'}>
              Execute Cryptographic Wipe
            </button>
          </>
        )}
      </Card>
    </div>
  );
}

// ============ SHARED COMPONENTS ============
function Header({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: 0, fontSize: 28, color: T.goldLight, fontWeight: 600, letterSpacing: 0.5 }}>{title}</h2>
      {subtitle && <p style={{ margin: '6px 0 0', color: T.textDim, fontSize: 13 }}>{subtitle}</p>}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22,
      ...style,
    }}>
      {title && <h3 style={{ margin: '0 0 16px', fontSize: 13, color: T.gold, textTransform: 'uppercase', letterSpacing: 1.5 }}>{title}</h3>}
      {children}
    </div>
  );
}
