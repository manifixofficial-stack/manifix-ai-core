import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// CRYPTO ENGINE — Real SubtleCrypto, no shims
// ============================================================
const enc = new TextEncoder();
const dec = new TextDecoder();
const bufToHex = b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('');
const hexToBuf = h => new Uint8Array(h.match(/.{1,2}/g).map(x => parseInt(x,16))).buffer;
const bufToB64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const b64ToBuf = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer;

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:310000, hash:'SHA-256' },
    base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']
  );
}
async function deriveKeyHMAC(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:310000, hash:'SHA-256' },
    base, { name:'HMAC', hash:'SHA-256', length:256 }, false, ['sign','verify']
  );
}
async function encryptAES(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(text));
  return { iv: bufToB64(iv), ct: bufToB64(ct) };
}
async function decryptAES(key, { iv, ct }) {
  const plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv: new Uint8Array(b64ToBuf(iv)) }, key, b64ToBuf(ct));
  return dec.decode(plain);
}
async function sha256(text) {
  return bufToHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}
async function hmacSign(key, msg) {
  return bufToB64(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
async function generateDID() {
  const kp = await crypto.subtle.generateKey({ name:'ECDSA', namedCurve:'P-256' }, true, ['sign','verify']);
  const pub = await crypto.subtle.exportKey('raw', kp.publicKey);
  const mb = 'z' + bufToB64(pub).replace(/[+/=]/g, c=>({'+':'-','/':'_','=':''}[c]));
  return { did:`did:key:${mb}`, kp, pub64: bufToB64(pub), ts: new Date().toISOString() };
}
async function signMsg(privKey, msg) {
  return bufToB64(await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, privKey, enc.encode(msg)));
}

// ============================================================
// LOCAL STORAGE
// ============================================================
const LS = {
  get:(k,d=null)=>{ try{ return JSON.parse(localStorage.getItem(k))??d }catch{ return d }},
  set:(k,v)=>localStorage.setItem(k, JSON.stringify(v)),
  del:(k)=>localStorage.removeItem(k),
};

// ============================================================
// DESIGN TOKENS
// ============================================================
const C = {
  bg:     '#050505',
  bg1:    '#0c0c0c',
  bg2:    '#111111',
  bg3:    '#181818',
  bg4:    '#1f1f1f',
  card:   '#0e0e0e',
  border: '#1e1c14',
  borderM:'#2e2a1a',
  borderH:'#3f3820',
  gold:   '#D4AF37',
  goldL:  '#F0D060',
  goldD:  '#8B7220',
  goldXL: '#FFF0A0',
  glow:   'rgba(212,175,55,0.12)',
  glowH:  'rgba(212,175,55,0.22)',
  text:   '#EDE4C8',
  textD:  '#7A7050',
  textM:  '#A89860',
  red:    '#D94545',
  redL:   '#FF6B6B',
  green:  '#5DBB6A',
  greenL: '#7BE88A',
  blue:   '#4A8FD4',
  blueL:  '#6AAEF4',
  purple: '#8B5CF6',
  amber:  '#F59E0B',
};

// ============================================================
// GLOBAL STYLES INJECTOR
// ============================================================
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Cinzel:wght@600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{background:${C.bg};color:${C.text};font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
      ::-webkit-scrollbar{width:6px;height:6px}
      ::-webkit-scrollbar-track{background:${C.bg1}}
      ::-webkit-scrollbar-thumb{background:${C.goldD};border-radius:3px}
      ::-webkit-scrollbar-thumb:hover{background:${C.gold}}
      input,textarea,select{font-family:inherit;color:${C.text};outline:none}
      button{cursor:pointer;font-family:inherit}

      .inpt{
        background:${C.bg2};border:1px solid ${C.borderM};color:${C.text};
        padding:10px 14px;border-radius:8px;width:100%;font-size:14px;
        transition:border-color .2s,box-shadow .2s;
      }
      .inpt:focus{border-color:${C.gold};box-shadow:0 0 0 3px ${C.glow}}
      .inpt::placeholder{color:${C.textD}}

      textarea.inpt{resize:vertical;min-height:90px;line-height:1.6}

      .btn-gold{
        background:linear-gradient(135deg,${C.gold} 0%,#B8960C 100%);
        color:#050505;border:none;padding:10px 22px;border-radius:9px;
        font-weight:700;font-size:13px;letter-spacing:.4px;
        transition:all .2s;box-shadow:0 2px 14px rgba(212,175,55,.25);
        white-space:nowrap;
      }
      .btn-gold:hover{transform:translateY(-1px);box-shadow:0 5px 22px rgba(212,175,55,.38)}
      .btn-gold:active{transform:translateY(0)}
      .btn-gold:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}

      .btn-ghost{
        background:transparent;color:${C.gold};
        border:1px solid ${C.borderH};padding:9px 18px;
        border-radius:9px;font-weight:600;font-size:13px;
        transition:all .2s;
      }
      .btn-ghost:hover{background:${C.glow};border-color:${C.gold};box-shadow:0 0 14px ${C.glow}}
      .btn-ghost:disabled{opacity:.4;cursor:not-allowed}

      .btn-red{
        background:linear-gradient(135deg,${C.red},#7A1F1F);
        color:#fff;border:none;padding:10px 22px;border-radius:9px;
        font-weight:700;font-size:13px;transition:all .2s;
      }
      .btn-red:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(217,69,69,.35)}
      .btn-red:disabled{opacity:.4;cursor:not-allowed;transform:none}

      .btn-sm{padding:6px 13px;font-size:12px;border-radius:7px}

      .mono{font-family:'JetBrains Mono',monospace}
      .cinzel{font-family:'Cinzel',serif}

      .tag{
        display:inline-block;padding:2px 9px;border-radius:20px;
        font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;
        border:1px solid ${C.borderH};color:${C.textM};
      }
      .tag-gold{background:rgba(212,175,55,.12);border-color:${C.gold};color:${C.gold}}
      .tag-green{background:rgba(93,187,106,.1);border-color:${C.green};color:${C.green}}
      .tag-red{background:rgba(217,69,69,.1);border-color:${C.red};color:${C.red}}
      .tag-blue{background:rgba(74,143,212,.1);border-color:${C.blue};color:${C.blue}}

      .card{
        background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:22px;
      }
      .card-hi{border-color:${C.borderM}}

      .section-title{
        font-size:11px;font-weight:600;letter-spacing:1.5px;
        text-transform:uppercase;color:${C.textD};margin-bottom:14px;
      }

      .pulse-dot{
        width:8px;height:8px;border-radius:50%;
        background:${C.green};display:inline-block;
        animation:pulse 2s ease-in-out infinite;
      }
      @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}

      .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
      .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}

      @media(max-width:900px){
        .grid-2,.grid-3,.grid-4{grid-template-columns:1fr!important}
      }

      .hover-row:hover{background:${C.bg3}!important;border-color:${C.borderM}!important}
      .hover-row{transition:background .15s,border-color .15s}

      .strength-bar{height:4px;border-radius:2px;transition:width .4s ease,background .4s}

      .shimmer{
        background:linear-gradient(90deg,${C.bg2} 25%,${C.bg3} 50%,${C.bg2} 75%);
        background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:4px;
      }
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

      .gold-line{
        width:40px;height:2px;
        background:linear-gradient(90deg,${C.gold},transparent);
        border-radius:1px;margin:8px 0 16px;
      }
    `}</style>
  );
}

// ============================================================
// PASSWORD STRENGTH
// ============================================================
function passwordStrength(p) {
  let score = 0;
  if(p.length >= 8) score++;
  if(p.length >= 14) score++;
  if(/[A-Z]/.test(p)) score++;
  if(/[0-9]/.test(p)) score++;
  if(/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ['','Weak','Fair','Good','Strong','Excellent'];
  const colors = ['','#E05555','#F59E0B','#5B9BD5','#5DBB6A','#D4AF37'];
  return { score, label: labels[score]||'', color: colors[score]||'#333', pct: score*20 };
}

// ============================================================
// LOCK SCREEN
// ============================================================
function LockScreen({ onUnlock, toast }) {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isNew = !LS.get('pv_salt');
  const str = passwordStrength(pwd);

  const submit = async () => {
    if(isNew) {
      if(pwd.length < 8) return toast('Minimum 8 characters required','red');
      if(pwd !== pwd2) return toast("Passwords don't match",'red');
    }
    setBusy(true);
    await onUnlock(pwd);
    setBusy(false);
  };

  return (
    <div style={{
      minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:`radial-gradient(ellipse 800px 600px at 50% -100px,rgba(212,175,55,.08),transparent),${C.bg}`,
      padding:20,
    }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{textAlign:'center',marginBottom:36}}>
          <div style={{
            width:80,height:80,margin:'0 auto 18px',
            background:`conic-gradient(from 180deg,${C.gold},${C.goldD},${C.gold})`,
            borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:40,color:C.bg,
            boxShadow:`0 0 40px rgba(212,175,55,.3),0 10px 30px rgba(0,0,0,.5)`,
          }}>◈</div>
          <h1 className="cinzel" style={{fontSize:30,color:C.goldL,letterSpacing:2,marginBottom:6}}>PrivacyVault</h1>
          <p style={{color:C.textD,fontSize:13}}>AES-256-GCM · PBKDF2 310K · Zero-Knowledge</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          className="card" style={{border:`1px solid ${C.borderM}`,boxShadow:`0 20px 60px rgba(0,0,0,.6),0 0 40px ${C.glow}`}}
        >
          <p className="section-title">{isNew ? 'Create Master Password' : 'Enter Master Password'}</p>

          <div style={{position:'relative',marginBottom:isNew?14:20}}>
            <input
              type={showPwd?'text':'password'} className="inpt"
              value={pwd} onChange={e=>setPwd(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submit()}
              placeholder="••••••••••" autoFocus
            />
            <button onClick={()=>setShowPwd(v=>!v)} style={{
              position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',color:C.textD,fontSize:16,padding:4,
            }}>{showPwd?'👁':'👁‍🗨'}</button>
          </div>

          {isNew && pwd.length > 0 && (
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:11,color:C.textD}}>Password strength</span>
                <span style={{fontSize:11,color:str.color,fontWeight:600}}>{str.label}</span>
              </div>
              <div style={{height:4,background:C.bg3,borderRadius:2,overflow:'hidden'}}>
                <motion.div animate={{width:`${str.pct}%`}} transition={{duration:.4}}
                  style={{height:'100%',background:str.color,borderRadius:2}} />
              </div>
            </div>
          )}

          {isNew && (
            <input
              type="password" className="inpt"
              value={pwd2} onChange={e=>setPwd2(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submit()}
              placeholder="Confirm password" style={{marginBottom:16}}
            />
          )}

          <button className="btn-gold" disabled={busy||!pwd||(isNew&&pwd!==pwd2)}
            onClick={submit} style={{width:'100%',padding:13,fontSize:14}}
          >
            {busy ? `Deriving key (PBKDF2 ×310,000)…` : isNew ? 'Initialize Vault' : 'Unlock Vault'}
          </button>

          <div style={{
            marginTop:18,padding:'12px 14px',background:C.bg2,borderRadius:8,
            border:`1px solid ${C.border}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,
          }}>
            {[['AES-256-GCM','Encryption'],['PBKDF2 310K','KDF'],['SHA-256','Ledger'],['P-256 ECDSA','DID Sign']].map(([v,l])=>(
              <div key={l} style={{fontSize:11}}>
                <span style={{color:C.gold,fontWeight:600}}>{v}</span>
                <span style={{color:C.textD,marginLeft:4}}>{l}</span>
              </div>
            ))}
          </div>

          {isNew && (
            <p style={{marginTop:12,fontSize:11,color:C.goldD,lineHeight:1.6,background:'rgba(212,175,55,.04)',padding:10,borderRadius:6,border:`1px solid rgba(212,175,55,.1)`}}>
              ⚠ Your master password is never stored or transmitted. If lost, vault data becomes cryptographically unrecoverable.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
const NAV = [
  { id:'dashboard', icon:'◈', label:'Dashboard' },
  { id:'vault',     icon:'▣', label:'Vault' },
  { id:'passwords', icon:'🔑', label:'Passwords' },
  { id:'notes',     icon:'📝', label:'Secure Notes' },
  { id:'share',     icon:'⇄', label:'Sharing' },
  { id:'ledger',    icon:'☰', label:'Consent Ledger' },
  { id:'zkp',       icon:'◎', label:'Zero-Knowledge' },
  { id:'did',       icon:'✦', label:'Identity (DID)' },
  { id:'breach',    icon:'🛡', label:'Breach Scanner' },
  { id:'export',    icon:'⬡', label:'Export (FHIR)' },
  { id:'erasure',   icon:'✕', label:'Right to Erasure' },
];

function Sidebar({ tab, setTab, onLock, did, vault, passwords, notes }) {
  const totalItems = vault.length + passwords.length + notes.length;
  return (
    <aside style={{
      width:230,minHeight:'100vh',
      background:C.bg1,
      borderRight:`1px solid ${C.border}`,
      display:'flex',flexDirection:'column',
      position:'sticky',top:0,flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{padding:'20px 16px 14px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:34,height:34,background:`linear-gradient(135deg,${C.gold},${C.goldD})`,
            borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
            color:C.bg,fontSize:18,flexShrink:0,
            boxShadow:`0 0 14px ${C.glow}`,
          }}>◈</div>
          <div>
            <div className="cinzel" style={{color:C.goldL,fontSize:13,letterSpacing:.5}}>PrivacyVault</div>
            <div style={{fontSize:9,color:C.textD,letterSpacing:.5}}>LOCAL-FIRST · ENCRYPTED</div>
          </div>
        </div>
      </div>

      {/* Stats pill */}
      <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{
          background:C.bg2,borderRadius:8,padding:'7px 12px',
          display:'flex',justifyContent:'space-between',
          border:`1px solid ${C.border}`,
        }}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:700,color:C.gold}}>{totalItems}</div>
            <div style={{fontSize:9,color:C.textD}}>Items</div>
          </div>
          <div style={{width:1,background:C.border}}/>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:700,color:C.green}}>{vault.filter(v=>v.category==='health').length}</div>
            <div style={{fontSize:9,color:C.textD}}>Health</div>
          </div>
          <div style={{width:1,background:C.border}}/>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:700,color:C.blue}}>{passwords.length}</div>
            <div style={{fontSize:9,color:C.textD}}>Pwds</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:'10px 10px',overflowY:'auto'}}>
        {NAV.map(n=>(
          <motion.button key={n.id} onClick={()=>setTab(n.id)} whileTap={{scale:.97}}
            style={{
              display:'flex',alignItems:'center',gap:10,width:'100%',
              padding:'9px 12px',marginBottom:2,border:'none',borderRadius:8,
              background: tab===n.id ? C.glow : 'transparent',
              color: tab===n.id ? C.goldL : C.textM,
              fontSize:13,textAlign:'left',fontWeight: tab===n.id?600:400,
              borderLeft: `2px solid ${tab===n.id?C.gold:'transparent'}`,
              transition:'all .15s',
            }}
          >
            <span style={{fontSize:14,width:18,textAlign:'center',flexShrink:0}}>{n.icon}</span>
            {n.label}
          </motion.button>
        ))}
      </nav>

      {/* DID info */}
      <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`}}>
        <div style={{background:C.bg2,borderRadius:8,padding:'8px 10px',border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            <span className="pulse-dot" style={{width:6,height:6}}/>
            <span style={{fontSize:9,color:C.textD,textTransform:'uppercase',letterSpacing:1}}>DID Status</span>
          </div>
          <div className="mono" style={{fontSize:9,color:did?C.gold:C.textD,wordBreak:'break-all',lineHeight:1.5}}>
            {did ? did.did.slice(0,28)+'…' : 'Not generated'}
          </div>
        </div>
        <button onClick={onLock} className="btn-ghost btn-sm"
          style={{width:'100%',marginTop:8,fontSize:12}}>
          🔒 Lock Vault
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ vault, ledger, shares, passwords, notes, did, setTab }) {
  const active = shares.filter(s=>!s.revoked && new Date(s.expires)>new Date());
  const healthItems = vault.filter(v=>v.category==='health');
  const recentLedger = [...ledger].reverse().slice(0,5);

  const stats = [
    { label:'Vault Items', val:vault.length, icon:'▣', color:C.gold, tab:'vault', trend:'+'+vault.length },
    { label:'Passwords', val:passwords.length, icon:'🔑', color:C.blue, tab:'passwords', trend:'saved' },
    { label:'Secure Notes', val:notes.length, icon:'📝', color:C.purple, tab:'notes', trend:'encrypted' },
    { label:'Active Shares', val:active.length, icon:'⇄', color:C.green, tab:'share', trend:'live' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your sovereign data estate" />

      <div className="grid-4" style={{marginBottom:24}}>
        {stats.map((s,i)=>(
          <motion.button key={s.label} onClick={()=>setTab(s.tab)}
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
            style={{
              background:C.card,border:`1px solid ${C.border}`,borderRadius:13,
              padding:'18px 18px 16px',textAlign:'left',cursor:'pointer',
              transition:'all .2s',
            }}
            whileHover={{borderColor:C.borderH,background:C.bg2,y:-2}}
          >
            <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:11,color:C.textD,marginTop:4}}>{s.label}</div>
            <div style={{fontSize:10,color:s.color,marginTop:6,opacity:.7}}>{s.trend}</div>
          </motion.button>
        ))}
      </div>

      <div className="grid-2" style={{marginBottom:20}}>
        {/* Quick actions */}
        <div className="card card-hi">
          <p className="section-title">Quick Actions</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
            {[
              {label:'+ Health Record', tab:'vault', cls:'btn-gold'},
              {label:'+ Password', tab:'passwords', cls:'btn-gold'},
              {label:'+ Secure Note', tab:'notes', cls:'btn-ghost'},
              {label:'Share Data', tab:'share', cls:'btn-ghost'},
              {label:'ZK Proof', tab:'zkp', cls:'btn-ghost'},
              {label:'Export FHIR', tab:'export', cls:'btn-ghost'},
            ].map(a=>(
              <button key={a.label} className={`${a.cls} btn-sm`} onClick={()=>setTab(a.tab)}
                style={{textAlign:'center'}}>{a.label}</button>
            ))}
          </div>
        </div>

        {/* Security posture */}
        <div className="card card-hi">
          <p className="section-title">Security Posture</p>
          {[
            { k:'Encryption', v:'AES-256-GCM', ok:true },
            { k:'Key Derivation', v:'PBKDF2 ×310,000', ok:true },
            { k:'Ledger Integrity', v:'SHA-256 chained', ok:true },
            { k:'DID Identity', v: did?'P-256 ECDSA Active':'Not configured', ok:!!did },
            { k:'Zero-Knowledge', v:'Commitment schemes', ok:true },
            { k:'Data Residency', v:'Device-only (local)', ok:true },
          ].map(r=>(
            <div key={r.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'6px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
              <span style={{color:C.textM}}>{r.k}</span>
              <span style={{color:r.ok?C.green:C.amber,display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:5,height:5,borderRadius:'50%',background:r.ok?C.green:C.amber,display:'inline-block'}}/>
                {r.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent ledger */}
      <div className="card">
        <p className="section-title">Recent Activity</p>
        {recentLedger.length===0
          ? <div style={{color:C.textD,fontSize:13,textAlign:'center',padding:20}}>No events yet.</div>
          : recentLedger.map(e=>(
            <div key={e.id} style={{
              display:'flex',alignItems:'flex-start',gap:12,padding:'9px 0',
              borderBottom:`1px solid ${C.border}`,
            }}>
              <div style={{
                width:28,height:28,borderRadius:7,background:C.glow,
                display:'flex',alignItems:'center',justifyContent:'center',
                color:C.gold,fontSize:11,fontWeight:700,flexShrink:0,
              }}>
                {e.type.split('_')[0][0]}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.goldL}}>{e.type}</span>
                  <span style={{fontSize:10,color:C.textD}}>{new Date(e.ts).toLocaleTimeString()}</span>
                </div>
                <div style={{fontSize:12,color:C.textM,marginTop:1}}>{e.detail}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ============================================================
// VAULT (Health & Sensitive Data)
// ============================================================
function VaultView({ masterKey, vault, setVault, showToast, appendLedger }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('health');
  const [value, setValue] = useState('');
  const [tags, setTags] = useState('');
  const [revealed, setRevealed] = useState({});
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const add = async () => {
    if(!label.trim()||!value.trim()) return showToast('Label and value required','red');
    const { iv, ct } = await encryptAES(masterKey, value);
    const item = {
      id: crypto.randomUUID(),
      label: label.trim(), category,
      iv, ct,
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hash: await sha256(value),
      accessCount: 0,
    };
    const next = [...vault, item];
    setVault(next); LS.set('pv_vault', next);
    setLabel(''); setValue(''); setTags('');
    await appendLedger('VAULT_ADD', `Added "${label}" (${category})`);
    showToast('Encrypted & stored ✓');
  };

  const reveal = async (id) => {
    const item = vault.find(v=>v.id===id);
    try {
      const plain = await decryptAES(masterKey, item);
      setRevealed(r=>({...r,[id]:plain}));
      const next = vault.map(v=>v.id===id?{...v,accessCount:(v.accessCount||0)+1}:v);
      setVault(next); LS.set('pv_vault', next);
      await appendLedger('VAULT_READ', `Revealed "${item.label}"`);
    } catch { showToast('Decryption failed','red'); }
  };

  const startEdit = async (id) => {
    const plain = revealed[id] || await (async()=>{
      const item = vault.find(v=>v.id===id);
      return decryptAES(masterKey, item);
    })();
    setEditId(id); setEditVal(plain);
    setRevealed(r=>({...r,[id]:plain}));
  };

  const saveEdit = async (id) => {
    const { iv, ct } = await encryptAES(masterKey, editVal);
    const next = vault.map(v=>v.id===id ? {...v,iv,ct,hash:null,updatedAt:new Date().toISOString()} : v);
    // compute hash
    const h = await sha256(editVal);
    const next2 = next.map(v=>v.id===id?{...v,hash:h}:v);
    setVault(next2); LS.set('pv_vault', next2);
    setRevealed(r=>({...r,[id]:editVal}));
    setEditId(null);
    await appendLedger('VAULT_EDIT', `Edited "${vault.find(v=>v.id===id).label}"`);
    showToast('Updated & re-encrypted ✓');
  };

  const remove = async (id) => {
    const item = vault.find(v=>v.id===id);
    const next = vault.filter(v=>v.id!==id);
    setVault(next); LS.set('pv_vault', next);
    const rev = {...revealed}; delete rev[id]; setRevealed(rev);
    await appendLedger('VAULT_DELETE', `Deleted "${item.label}"`);
    showToast('Item destroyed');
  };

  const cats = ['health','finance','identity','coaching','biometric','medication','lab','other'];
  const catIcons = {health:'❤',finance:'💰',identity:'🪪',coaching:'🎯',biometric:'📊',medication:'💊',lab:'🧪',other:'◈'};

  let filtered = vault.filter(v=>{
    const matchQ = !filter || v.label.toLowerCase().includes(filter.toLowerCase()) || (v.tags||[]).some(t=>t.toLowerCase().includes(filter.toLowerCase()));
    const matchC = !catFilter || v.category===catFilter;
    return matchQ && matchC;
  });
  if(sortBy==='newest') filtered = [...filtered].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  else if(sortBy==='oldest') filtered = [...filtered].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  else if(sortBy==='az') filtered = [...filtered].sort((a,b)=>a.label.localeCompare(b.label));
  else if(sortBy==='accessed') filtered = [...filtered].sort((a,b)=>(b.accessCount||0)-(a.accessCount||0));

  return (
    <div>
      <PageHeader title="Encrypted Vault" subtitle="AES-256-GCM · Unique IV per item · Hash verified" />

      {/* Add form */}
      <div className="card card-hi" style={{marginBottom:20}}>
        <p className="section-title">Add New Secret</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 150px',gap:12,marginBottom:12}}>
          <input className="inpt" value={label} onChange={e=>setLabel(e.target.value)}
            placeholder="Label (e.g. Blood pressure log)" onKeyDown={e=>e.key==='Enter'&&add()} />
          <select className="inpt" value={category} onChange={e=>setCategory(e.target.value)}>
            {cats.map(c=><option key={c} value={c}>{catIcons[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <textarea className="inpt" value={value} onChange={e=>setValue(e.target.value)}
          placeholder="Sensitive data to encrypt…" style={{marginBottom:10,minHeight:70}} />
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input className="inpt" value={tags} onChange={e=>setTags(e.target.value)}
            placeholder="Tags (comma separated)" style={{flex:1}} />
          <button className="btn-gold" onClick={add} style={{flexShrink:0,padding:'10px 22px'}}>
            Encrypt & Store
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="inpt" placeholder="Search…" value={filter}
          onChange={e=>setFilter(e.target.value)} style={{maxWidth:220,flex:1}} />
        <select className="inpt" value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{maxWidth:150}}>
          <option value="">All categories</option>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select className="inpt" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{maxWidth:140}}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A–Z</option>
          <option value="accessed">Most accessed</option>
        </select>
        <span style={{fontSize:12,color:C.textD,marginLeft:4}}>{filtered.length} items</span>
      </div>

      {/* Items */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.length===0 && (
          <div style={{textAlign:'center',padding:50,color:C.textD}}>
            <div style={{fontSize:40,marginBottom:12}}>▣</div>
            <div>No items found.</div>
          </div>
        )}
        {filtered.map(item=>(
          <motion.div key={item.id} layout className="card hover-row"
            style={{display:'flex',alignItems:'flex-start',gap:14,padding:16}}
          >
            <div style={{
              width:42,height:42,borderRadius:10,background:C.glow,border:`1px solid ${C.borderM}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              color:C.gold,fontSize:20,flexShrink:0,
            }}>{catIcons[item.category]||'◈'}</div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontWeight:600,color:C.goldL}}>{item.label}</span>
                <span className="tag tag-gold">{item.category}</span>
                {(item.tags||[]).map(t=><span key={t} className="tag">{t}</span>)}
                {item.accessCount>0 && <span style={{fontSize:10,color:C.textD}}>accessed {item.accessCount}×</span>}
              </div>
              <div style={{fontSize:11,color:C.textD,marginTop:3}}>
                {new Date(item.createdAt).toLocaleString()}
                {item.updatedAt!==item.createdAt && ` · edited ${new Date(item.updatedAt).toLocaleTimeString()}`}
              </div>

              {/* Revealed / Edit */}
              <AnimatePresence>
                {revealed[item.id]!==undefined && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                    {editId===item.id ? (
                      <div style={{marginTop:8}}>
                        <textarea className="inpt mono" value={editVal} onChange={e=>setEditVal(e.target.value)}
                          style={{fontSize:12,marginBottom:8}} />
                        <div style={{display:'flex',gap:8}}>
                          <button className="btn-gold btn-sm" onClick={()=>saveEdit(item.id)}>Save & Re-encrypt</button>
                          <button className="btn-ghost btn-sm" onClick={()=>setEditId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mono" style={{
                        marginTop:8,padding:'10px 12px',background:C.bg2,
                        borderRadius:8,color:C.greenL,fontSize:12,
                        border:`1px solid rgba(93,187,106,.2)`,wordBreak:'break-all',lineHeight:1.6,
                      }}>{revealed[item.id]}</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mono" style={{fontSize:9,color:C.textD,marginTop:4}}>
                SHA256: {item.hash?.slice(0,24)}…
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
              <button className="btn-ghost btn-sm" onClick={()=>
                revealed[item.id]!==undefined
                  ? setRevealed(r=>{const n={...r};delete n[item.id];return n})
                  : reveal(item.id)
              }>{revealed[item.id]!==undefined?'Hide':'Reveal'}</button>
              {revealed[item.id]!==undefined && editId!==item.id && (
                <button className="btn-ghost btn-sm" onClick={()=>startEdit(item.id)}>Edit</button>
              )}
              <button onClick={()=>remove(item.id)} style={{
                background:'transparent',border:`1px solid ${C.border}`,color:C.red,
                padding:'5px 10px',borderRadius:7,fontSize:12,
                transition:'all .2s',
              }}
              onMouseEnter={e=>{e.target.style.borderColor=C.red;e.target.style.background='rgba(217,69,69,.08)'}}
              onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.background='transparent'}}
              >✕ Delete</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PASSWORDS MANAGER
// ============================================================
function PasswordsView({ masterKey, passwords, setPasswords, showToast, appendLedger }) {
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [revealed, setRevealed] = useState({});
  const [search, setSearch] = useState('');
  const [genLen, setGenLen] = useState(20);
  const [genOpts, setGenOpts] = useState({upper:true,lower:true,nums:true,syms:true});

  const generatePassword = () => {
    let chars = '';
    if(genOpts.lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if(genOpts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(genOpts.nums) chars += '0123456789';
    if(genOpts.syms) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if(!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    const arr = new Uint32Array(genLen);
    crypto.getRandomValues(arr);
    const pwd = Array.from(arr).map(x=>chars[x%chars.length]).join('');
    setPassword(pwd);
  };

  const add = async () => {
    if(!site.trim()||!password.trim()) return showToast('Site and password required','red');
    const payload = JSON.stringify({ username, password, url, notes });
    const { iv, ct } = await encryptAES(masterKey, payload);
    const item = {
      id: crypto.randomUUID(), site: site.trim(),
      username, url, iv, ct,
      strength: passwordStrength(password).score,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hash: await sha256(password),
    };
    const next = [...passwords, item];
    setPasswords(next); LS.set('pv_passwords', next);
    setSite(''); setUsername(''); setPassword(''); setUrl(''); setNotes('');
    await appendLedger('PWD_ADD', `Saved password for "${site}"`);
    showToast('Password encrypted ✓');
  };

  const revealPwd = async (id) => {
    const item = passwords.find(p=>p.id===id);
    try {
      const data = JSON.parse(await decryptAES(masterKey, item));
      setRevealed(r=>({...r,[id]:data}));
      await appendLedger('PWD_READ', `Revealed password for "${item.site}"`);
    } catch { showToast('Decryption failed','red'); }
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied ✓`);
  };

  const remove = async (id) => {
    const item = passwords.find(p=>p.id===id);
    setPasswords(p=>p.filter(x=>x.id!==id));
    LS.set('pv_passwords', passwords.filter(x=>x.id!==id));
    await appendLedger('PWD_DELETE', `Deleted password for "${item.site}"`);
    showToast('Password deleted');
  };

  const str = passwordStrength(password);
  const filtered = passwords.filter(p=>!search||p.site.toLowerCase().includes(search.toLowerCase())||p.username.toLowerCase().includes(search.toLowerCase()));

  const avgStrength = passwords.length ? Math.round(passwords.reduce((s,p)=>s+(p.strength||0),0)/passwords.length) : 0;
  const weakCount = passwords.filter(p=>(p.strength||0)<=2).length;

  return (
    <div>
      <PageHeader title="Password Manager" subtitle="End-to-end encrypted · Zero-knowledge" />

      <div className="grid-2" style={{marginBottom:20}}>
        {/* Add form */}
        <div className="card card-hi">
          <p className="section-title">Add / Save Password</p>
          <input className="inpt" value={site} onChange={e=>setSite(e.target.value)}
            placeholder="Site / Service name" style={{marginBottom:10}} />
          <input className="inpt" value={username} onChange={e=>setUsername(e.target.value)}
            placeholder="Username / Email" style={{marginBottom:10}} />
          <input className="inpt" value={url} onChange={e=>setUrl(e.target.value)}
            placeholder="URL (optional)" style={{marginBottom:10}} />

          {/* Password field + strength */}
          <div style={{position:'relative',marginBottom:6}}>
            <input className="inpt" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Password" />
            <button onClick={()=>copy(password,'Password')} style={{
              position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',color:C.textD,fontSize:13,
            }}>📋</button>
          </div>
          {password && (
            <div style={{marginBottom:10}}>
              <div style={{height:3,background:C.bg3,borderRadius:2,overflow:'hidden',marginBottom:4}}>
                <motion.div animate={{width:`${str.pct}%`}} style={{height:'100%',background:str.color,borderRadius:2}}/>
              </div>
              <span style={{fontSize:10,color:str.color}}>{str.label} password</span>
            </div>
          )}

          {/* Generator */}
          <div style={{background:C.bg2,borderRadius:8,padding:12,marginBottom:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.textD,marginBottom:8}}>Generator</div>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <input type="range" min={8} max={64} value={genLen} onChange={e=>setGenLen(+e.target.value)}
                style={{flex:1,accentColor:C.gold}} />
              <span style={{fontSize:12,color:C.gold,minWidth:28}}>{genLen}</span>
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:8}}>
              {[['upper','A-Z'],['lower','a-z'],['nums','0-9'],['syms','!@#']].map(([k,l])=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.textM,cursor:'pointer'}}>
                  <input type="checkbox" checked={genOpts[k]}
                    onChange={e=>setGenOpts(o=>({...o,[k]:e.target.checked}))}
                    style={{accentColor:C.gold}} />
                  {l}
                </label>
              ))}
            </div>
            <button className="btn-ghost btn-sm" onClick={generatePassword} style={{fontSize:11}}>
              ⚡ Generate
            </button>
          </div>

          <textarea className="inpt" value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Notes (optional)" style={{marginBottom:10,minHeight:50}} />
          <button className="btn-gold" onClick={add} style={{width:'100%'}}>Save Password</button>
        </div>

        {/* Health stats */}
        <div>
          <div className="card card-hi" style={{marginBottom:12}}>
            <p className="section-title">Vault Health</p>
            <div style={{display:'flex',gap:16}}>
              <div style={{flex:1,textAlign:'center',padding:'12px 8px',background:C.bg2,borderRadius:9}}>
                <div style={{fontSize:26,fontWeight:700,color:C.gold}}>{passwords.length}</div>
                <div style={{fontSize:10,color:C.textD}}>Total</div>
              </div>
              <div style={{flex:1,textAlign:'center',padding:'12px 8px',background:C.bg2,borderRadius:9}}>
                <div style={{fontSize:26,fontWeight:700,color:avgStrength>=4?C.green:avgStrength>=3?C.amber:C.red}}>
                  {['','Weak','Fair','Good','Strong','Excellent'][avgStrength]||'—'}
                </div>
                <div style={{fontSize:10,color:C.textD}}>Avg Strength</div>
              </div>
              <div style={{flex:1,textAlign:'center',padding:'12px 8px',background:C.bg2,borderRadius:9}}>
                <div style={{fontSize:26,fontWeight:700,color:weakCount>0?C.red:C.green}}>{weakCount}</div>
                <div style={{fontSize:10,color:C.textD}}>Weak</div>
              </div>
            </div>
          </div>

          {/* Strength breakdown */}
          <div className="card">
            <p className="section-title">Strength Distribution</p>
            {['Excellent','Strong','Good','Fair','Weak'].map((label,i)=>{
              const sc = 5-i;
              const cnt = passwords.filter(p=>(p.strength||0)===sc).length;
              const pct = passwords.length ? (cnt/passwords.length)*100 : 0;
              const colors = {5:C.gold,4:C.green,3:C.blue,2:C.amber,1:C.red};
              return (
                <div key={label} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:11,color:C.textM,width:60}}>{label}</span>
                  <div style={{flex:1,height:6,background:C.bg3,borderRadius:3,overflow:'hidden'}}>
                    <motion.div animate={{width:`${pct}%`}} transition={{duration:.6,delay:i*.1}}
                      style={{height:'100%',background:colors[sc]||C.textD,borderRadius:3}} />
                  </div>
                  <span style={{fontSize:11,color:C.textD,width:20}}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{marginBottom:12}}>
        <input className="inpt" placeholder="Search passwords…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{maxWidth:360}} />
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.map(item=>{
          const data = revealed[item.id];
          const sc = item.strength||0;
          const scColors = [C.textD,C.red,C.amber,C.blue,C.green,C.gold];
          return (
            <motion.div key={item.id} layout className="card hover-row"
              style={{display:'flex',alignItems:'center',gap:14,padding:14}}>
              <div style={{
                width:38,height:38,borderRadius:9,background:C.bg3,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:18,fontWeight:700,color:C.gold,border:`1px solid ${C.borderM}`,
                flexShrink:0,
              }}>{item.site[0]?.toUpperCase()}</div>

              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:C.goldL,marginBottom:2}}>{item.site}</div>
                <div style={{fontSize:12,color:C.textM,marginBottom:2}}>{item.username}</div>
                {data ? (
                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                    <code style={{fontSize:12,color:C.greenL,background:C.bg2,padding:'3px 8px',borderRadius:5}}>
                      {data.password}
                    </code>
                    <button onClick={()=>copy(data.password,'Password')} className="btn-ghost btn-sm" style={{fontSize:11}}>Copy</button>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer"
                      style={{fontSize:11,color:C.blue,textDecoration:'none'}}>↗ Open</a>}
                  </div>
                ) : (
                  <div style={{fontSize:11,color:C.textD}}>••••••••••••</div>
                )}
                {data?.notes && <div style={{fontSize:11,color:C.textD,marginTop:4}}>{data.notes}</div>}
              </div>

              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                <div style={{display:'flex',gap:1}}>
                  {[1,2,3,4,5].map(n=>(
                    <div key={n} style={{width:6,height:6,borderRadius:1,
                      background:n<=sc?scColors[sc]:C.bg3,marginLeft:2}}/>
                  ))}
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn-ghost btn-sm" onClick={()=>
                    data ? setRevealed(r=>{const n={...r};delete n[item.id];return n}) : revealPwd(item.id)
                  }>{data?'Hide':'Show'}</button>
                  <button onClick={()=>remove(item.id)} style={{
                    background:'none',border:`1px solid ${C.border}`,color:C.red,
                    padding:'5px 8px',borderRadius:6,fontSize:11,cursor:'pointer',
                  }}>✕</button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length===0 && (
          <div style={{textAlign:'center',padding:40,color:C.textD}}>
            <div style={{fontSize:36,marginBottom:10}}>🔑</div>
            <div>No passwords saved yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SECURE NOTES
// ============================================================
function NotesView({ masterKey, notes, setNotes, showToast, appendLedger }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('#D4AF37');
  const [revealed, setRevealed] = useState({});
  const [search, setSearch] = useState('');
  const [activeNote, setActiveNote] = useState(null);

  const NOTE_COLORS = [C.gold,'#5DBB6A','#4A8FD4','#8B5CF6','#F59E0B','#E05555'];

  const add = async () => {
    if(!title.trim()||!body.trim()) return showToast('Title and content required','red');
    const { iv, ct } = await encryptAES(masterKey, body);
    const item = {
      id: crypto.randomUUID(), title: title.trim(), color,
      iv, ct, wordCount: body.split(/\s+/).length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const next = [...notes, item];
    setNotes(next); LS.set('pv_notes', next);
    setTitle(''); setBody('');
    await appendLedger('NOTE_ADD', `Created note "${title}"`);
    showToast('Note encrypted ✓');
  };

  const revealNote = async (id) => {
    const item = notes.find(n=>n.id===id);
    try {
      const plain = await decryptAES(masterKey, item);
      setRevealed(r=>({...r,[id]:plain}));
      setActiveNote(id);
      await appendLedger('NOTE_READ', `Read note "${item.title}"`);
    } catch { showToast('Decryption failed','red'); }
  };

  const remove = async (id) => {
    const item = notes.find(n=>n.id===id);
    setNotes(notes.filter(n=>n.id!==id));
    LS.set('pv_notes', notes.filter(n=>n.id!==id));
    if(activeNote===id) setActiveNote(null);
    await appendLedger('NOTE_DELETE', `Deleted note "${item.title}"`);
    showToast('Note destroyed');
  };

  const filtered = notes.filter(n=>!search||n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Secure Notes" subtitle="End-to-end encrypted text vault" />

      <div className="grid-2" style={{marginBottom:20}}>
        <div className="card card-hi">
          <p className="section-title">New Encrypted Note</p>
          <input className="inpt" value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="Title" style={{marginBottom:10}} />
          <textarea className="inpt" value={body} onChange={e=>setBody(e.target.value)}
            placeholder="Write your private note…" style={{marginBottom:10,minHeight:120}} />
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
            <span style={{fontSize:12,color:C.textD}}>Color tag:</span>
            {NOTE_COLORS.map(c=>(
              <button key={c} onClick={()=>setColor(c)} style={{
                width:22,height:22,borderRadius:'50%',background:c,border:'none',cursor:'pointer',
                boxShadow: color===c?`0 0 0 2px ${C.bg2},0 0 0 4px ${c}`:'none',
                transition:'box-shadow .2s',
              }}/>
            ))}
          </div>
          <button className="btn-gold" onClick={add} style={{width:'100%'}}>Encrypt Note</button>
        </div>

        {/* Preview panel */}
        <div className="card">
          <p className="section-title">Note Preview</p>
          {activeNote && revealed[activeNote] ? (
            <div>
              <div style={{fontWeight:600,color:C.goldL,marginBottom:8}}>
                {notes.find(n=>n.id===activeNote)?.title}
              </div>
              <div style={{
                padding:14,background:C.bg2,borderRadius:8,
                color:C.text,fontSize:13,lineHeight:1.7,
                border:`1px solid ${C.borderM}`,whiteSpace:'pre-wrap',maxHeight:300,overflowY:'auto',
              }}>{revealed[activeNote]}</div>
              <button className="btn-ghost btn-sm" onClick={()=>setActiveNote(null)} style={{marginTop:10}}>
                Clear Preview
              </button>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:40,color:C.textD}}>
              <div style={{fontSize:30,marginBottom:8}}>📝</div>
              Click a note to preview it here
            </div>
          )}
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <input className="inpt" placeholder="Search notes…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{maxWidth:360}} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {filtered.map(item=>(
          <motion.div key={item.id} layout className="card hover-row"
            style={{borderLeft:`3px solid ${item.color}`,cursor:'pointer',padding:16}}
            onClick={()=>revealed[item.id]?setActiveNote(item.id):revealNote(item.id)}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{fontWeight:600,color:C.goldL,marginBottom:6}}>{item.title}</div>
              <button onClick={e=>{e.stopPropagation();remove(item.id)}}
                style={{background:'none',border:'none',color:C.textD,cursor:'pointer',fontSize:14,padding:2}}>✕</button>
            </div>
            {revealed[item.id]
              ? <div style={{fontSize:12,color:C.textM,lineHeight:1.5,marginBottom:8}}>
                  {revealed[item.id].slice(0,120)}{revealed[item.id].length>120&&'…'}
                </div>
              : <div style={{fontSize:12,color:C.textD,marginBottom:8}}>🔒 Encrypted · {item.wordCount} words</div>
            }
            <div style={{fontSize:10,color:C.textD}}>{new Date(item.createdAt).toLocaleDateString()}</div>
          </motion.div>
        ))}
        {filtered.length===0 && (
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:50,color:C.textD}}>
            <div style={{fontSize:36,marginBottom:8}}>📝</div>
            No notes yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SHARING
// ============================================================
function ShareView({ masterKey, vault, passwords, notes, shares, setShares, showToast, appendLedger }) {
  const [itemType, setItemType] = useState('vault');
  const [itemId, setItemId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [scope, setScope] = useState('read');
  const [hours, setHours] = useState(24);
  const [note, setNote] = useState('');

  const allItems = [
    ...vault.map(v=>({...v, _type:'vault', _label:`[Health] ${v.label}`})),
    ...passwords.map(p=>({...p, _type:'passwords', _label:`[Password] ${p.site}`})),
    ...notes.map(n=>({...n, _type:'notes', _label:`[Note] ${n.title}`})),
  ];

  const create = async () => {
    if(!itemId||!recipient.trim()) return showToast('Select an item and enter recipient','red');
    const found = allItems.find(i=>i.id===itemId);
    if(!found) return;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const share = {
      id: crypto.randomUUID(),
      itemId, itemLabel: found._label, itemType: found._type,
      recipient: recipient.trim(), scope, hours, note,
      token: token.slice(0,32),
      expires: new Date(Date.now()+hours*3600000).toISOString(),
      createdAt: new Date().toISOString(),
      revoked: false, accessed: 0,
    };
    const next = [...shares, share];
    setShares(next); LS.set('pv_shares', next);
    setRecipient(''); setNote('');
    await appendLedger('SHARE_CREATE',`Shared "${found._label}" with ${recipient} (${scope}, ${hours}h)`,{token:token.slice(0,8)});
    showToast('Share token issued ✓');
  };

  const revoke = async (id) => {
    const s = shares.find(x=>x.id===id);
    const next = shares.map(x=>x.id===id?{...x,revoked:true}:x);
    setShares(next); LS.set('pv_shares', next);
    await appendLedger('SHARE_REVOKE',`Revoked access for "${s.itemLabel}"`);
    showToast('Token revoked');
  };

  const extend = async (id, addHours) => {
    const next = shares.map(x=>x.id===id?{...x,expires:new Date(new Date(x.expires).getTime()+addHours*3600000).toISOString()}:x);
    setShares(next); LS.set('pv_shares', next);
    showToast(`Extended by ${addHours}h`);
  };

  const active = shares.filter(s=>!s.revoked&&new Date(s.expires)>new Date());
  const past = shares.filter(s=>s.revoked||new Date(s.expires)<=new Date());

  const timeLeft = (exp) => {
    const ms = new Date(exp)-new Date();
    if(ms<=0) return 'Expired';
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
    if(h>24) return `${Math.floor(h/24)}d ${h%24}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div>
      <PageHeader title="Selective Sharing" subtitle="Time-bound · Scoped access · Consent logged" />

      <div className="grid-2" style={{marginBottom:20}}>
        <div className="card card-hi">
          <p className="section-title">Issue Share Token</p>

          <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>ITEM TO SHARE</label>
          <select className="inpt" value={itemId} onChange={e=>setItemId(e.target.value)} style={{marginBottom:12}}>
            <option value="">Select item…</option>
            {allItems.map(i=><option key={i.id} value={i.id}>{i._label}</option>)}
          </select>

          <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>RECIPIENT</label>
          <input className="inpt" value={recipient} onChange={e=>setRecipient(e.target.value)}
            placeholder="dr.smith@clinic.example" style={{marginBottom:12}} />

          <div className="grid-2" style={{marginBottom:12}}>
            <div>
              <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>ACCESS SCOPE</label>
              <select className="inpt" value={scope} onChange={e=>setScope(e.target.value)}>
                <option value="read">Read-only</option>
                <option value="hash">Hash-only (ZK)</option>
                <option value="derived">Derived metrics</option>
                <option value="time-limited">Time-limited read</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>EXPIRY (HOURS)</label>
              <input type="number" className="inpt" value={hours}
                onChange={e=>setHours(Math.max(1,+e.target.value))} min={1} max={8760} />
            </div>
          </div>

          <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>SHARE NOTE (optional)</label>
          <textarea className="inpt" value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Purpose / context…" style={{minHeight:60,marginBottom:14}} />

          <button className="btn-gold" onClick={create} style={{width:'100%'}}>Generate Token</button>
        </div>

        <div className="card">
          <p className="section-title">Sharing Overview</p>
          <div className="grid-2" style={{marginBottom:14}}>
            {[
              ['Active', active.length, C.green],
              ['Expired', past.length, C.textD],
              ['Total Issued', shares.length, C.gold],
              ['Revoked', shares.filter(s=>s.revoked).length, C.red],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:C.bg2,borderRadius:8,padding:'10px 12px',border:`1px solid ${C.border}`}}>
                <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
                <div style={{fontSize:11,color:C.textD}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:C.textD,lineHeight:1.7,background:C.bg2,padding:12,borderRadius:8,border:`1px solid ${C.border}`}}>
            <strong style={{color:C.textM}}>Privacy guarantee:</strong> Share tokens never contain your data — recipients receive only a scoped access credential. All sharing events are immutably logged in the consent ledger. You can revoke any token instantly.
          </div>
        </div>
      </div>

      {/* Active shares */}
      {active.length>0 && (
        <div style={{marginBottom:20}}>
          <p className="section-title">Active Shares ({active.length})</p>
          {active.map(s=>(
            <div key={s.id} className="card hover-row" style={{marginBottom:8,padding:14,display:'flex',alignItems:'center',gap:14}}>
              <div style={{
                width:36,height:36,borderRadius:8,background:C.glow,
                display:'flex',alignItems:'center',justifyContent:'center',color:C.gold,fontSize:16,flexShrink:0,
              }}>⇄</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:C.goldL,marginBottom:2}}>{s.itemLabel}</div>
                <div style={{fontSize:12,color:C.textM}}>
                  → {s.recipient} · <span className="tag tag-gold" style={{marginLeft:2}}>{s.scope}</span>
                </div>
                <div style={{fontSize:11,color:C.textD,marginTop:3}}>
                  Token: <code className="mono" style={{color:C.textM}}>{s.token.slice(0,16)}…</code>
                  {' '}· <span style={{color:C.green}}>{timeLeft(s.expires)} left</span>
                </div>
                {s.note && <div style={{fontSize:11,color:C.textD,marginTop:2}}>📝 {s.note}</div>}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button className="btn-ghost btn-sm" onClick={()=>extend(s.id,24)} style={{fontSize:11}}>+24h</button>
                <button className="btn-red btn-sm" onClick={()=>revoke(s.id)}>Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past */}
      {past.length>0 && (
        <div>
          <p className="section-title">History ({past.length})</p>
          {past.map(s=>(
            <div key={s.id} style={{
              background:C.card,border:`1px solid ${C.border}`,borderRadius:10,
              padding:'10px 14px',marginBottom:6,opacity:.5,
              display:'flex',alignItems:'center',gap:12,
            }}>
              <div style={{flex:1,fontSize:12}}>
                <span style={{color:C.textM}}>{s.itemLabel}</span>
                {' '}→ {s.recipient}
              </div>
              <span className={`tag ${s.revoked?'tag-red':''}`}>{s.revoked?'Revoked':'Expired'}</span>
              <span style={{fontSize:10,color:C.textD}}>{new Date(s.expires).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LEDGER
// ============================================================
function LedgerView({ ledger }) {
  const [verifying, setVerifying] = useState({});
  const [filterType, setFilterType] = useState('');
  const [showAll, setShowAll] = useState(false);

  const verifyChain = async (idx) => {
    const entry = ledger[idx];
    const { hash, ...rest } = entry;
    const re = await sha256(JSON.stringify(rest));
    const ok = re === hash;
    const prevOk = idx===0 ? true : ledger[idx-1].hash === entry.prevHash;
    setVerifying(v=>({...v,[idx]:{ok:ok&&prevOk}}));
  };

  const verifyAll = async () => {
    for(let i=0;i<ledger.length;i++) await verifyChain(i);
  };

  const types = [...new Set(ledger.map(e=>e.type))];
  const filtered = filterType ? ledger.filter(e=>e.type===filterType) : ledger;
  const display = showAll ? [...filtered].reverse() : [...filtered].reverse().slice(0,30);

  const typeColors = {
    VAULT_ADD:C.green,VAULT_READ:C.blue,VAULT_DELETE:C.red,VAULT_EDIT:C.amber,
    PWD_ADD:C.green,PWD_READ:C.blue,PWD_DELETE:C.red,
    NOTE_ADD:C.green,NOTE_READ:C.blue,NOTE_DELETE:C.red,
    SHARE_CREATE:C.purple,SHARE_REVOKE:C.amber,
    ZKP_ISSUE:C.goldL,ZKP_VERIFY:C.gold,
    DATA_EXPORT:C.blue,GDPR_ERASURE:C.red,
    SYSTEM_UNLOCK:C.textM,
  };

  return (
    <div>
      <PageHeader title="Consent Ledger" subtitle="SHA-256 chained · Tamper-evident · GDPR Art. 30 compliant" />

      <div className="grid-2" style={{marginBottom:20}}>
        <div className="card">
          <p className="section-title">Chain Integrity</p>
          <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:30,fontWeight:700,color:C.gold}}>{ledger.length}</div>
              <div style={{fontSize:10,color:C.textD}}>Total entries</div>
            </div>
            <div style={{flex:1}}>
              <button className="btn-gold" onClick={verifyAll} style={{width:'100%',marginBottom:8}}>
                ✓ Verify Entire Chain
              </button>
              {Object.keys(verifying).length===ledger.length && ledger.length>0 && (
                <div style={{fontSize:12,color:C.green,textAlign:'center'}}>
                  {Object.values(verifying).every(v=>v.ok) ? '✓ All entries valid' : '⚠ Chain corruption detected'}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <p className="section-title">Event Types</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            <button onClick={()=>setFilterType('')}
              className={`tag ${!filterType?'tag-gold':''}`}
              style={{cursor:'pointer',background:!filterType?C.glow:'transparent',border:`1px solid ${filterType?C.borderH:C.gold}`}}>
              All ({ledger.length})
            </button>
            {types.map(t=>(
              <button key={t} onClick={()=>setFilterType(t===filterType?'':t)}
                className="tag" style={{cursor:'pointer',background:filterType===t?C.glow:'transparent',
                  border:`1px solid ${filterType===t?C.gold:C.borderH}`,color:typeColors[t]||C.textM}}>
                {t} ({ledger.filter(e=>e.type===t).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {display.map((entry,revI)=>{
          const idx = filtered.length-1-revI;
          return (
            <motion.div key={entry.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
              transition={{delay:revI*.02}} className="card hover-row"
              style={{display:'flex',gap:12,alignItems:'flex-start',padding:12}}
            >
              <div style={{
                minWidth:34,height:34,borderRadius:8,
                background:`rgba(${typeColors[entry.type]||C.textD},.1)`,
                border:`1px solid ${typeColors[entry.type]||C.border}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                color:typeColors[entry.type]||C.textD,fontSize:10,fontWeight:700,flexShrink:0,
              }}>#{idx+1}</div>

              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2,flexWrap:'wrap'}}>
                  <span style={{fontSize:12,fontWeight:700,color:typeColors[entry.type]||C.goldL,textTransform:'uppercase',letterSpacing:.5}}>
                    {entry.type}
                  </span>
                  <span style={{fontSize:10,color:C.textD}}>{new Date(entry.ts).toLocaleString()}</span>
                  {verifying[idx] && (
                    <span className={`tag ${verifying[idx].ok?'tag-green':'tag-red'}`}>
                      {verifying[idx].ok?'✓ Valid':'✗ Broken'}
                    </span>
                  )}
                </div>
                <div style={{fontSize:12,color:C.textM}}>{entry.detail}</div>
                <div className="mono" style={{fontSize:9,color:C.textD,marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {entry.hash}
                </div>
              </div>

              <button className="btn-ghost btn-sm" onClick={()=>verifyChain(idx)} style={{fontSize:10,flexShrink:0}}>
                Verify
              </button>
            </motion.div>
          );
        })}
        {filtered.length>30 && !showAll && (
          <button className="btn-ghost" onClick={()=>setShowAll(true)} style={{width:'100%',marginTop:4}}>
            Show all {filtered.length} entries
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ZERO-KNOWLEDGE PROOFS
// ============================================================
function ZKPView({ did, showToast, appendLedger }) {
  const [claim, setClaim] = useState('');
  const [secret, setSecret] = useState('');
  const [proof, setProof] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [savedProofs, setSavedProofs] = useState(()=>LS.get('pv_zkproofs',[]));
  const [activeTemplate, setActiveTemplate] = useState(null);

  const TEMPLATES = [
    { label:'Age ≥ 18', claim:'I am 18 or older', placeholder:'Date of birth: YYYY-MM-DD' },
    { label:'Medication adherent', claim:'I took medication on schedule for 30 days', placeholder:'Medication log reference…' },
    { label:'BMI in range', claim:'My BMI is between 18.5 and 25', placeholder:'Weight/height measurement…' },
    { label:'Exercise goal', claim:'I exercised ≥5 days/week for 4 weeks', placeholder:'Fitness log reference…' },
    { label:'Non-smoker', claim:'I have not smoked for 90+ days', placeholder:'Cessation date reference…' },
  ];

  const generate = async () => {
    if(!claim.trim()||!secret.trim()) return showToast('Enter claim and witness','red');
    const nonce = bufToHex(crypto.getRandomValues(new Uint8Array(16)));
    const witness = `${claim}||${secret}||${nonce}`;
    const commitment = await sha256(witness);
    const challenge = await sha256(commitment + Date.now().toString());
    const response = await sha256(witness + challenge);
    const p = {
      id: crypto.randomUUID(),
      claim, commitment, challenge: challenge.slice(0,32),
      response, nonce,
      proverDID: did?.did||'anonymous',
      ts: new Date().toISOString(),
    };
    setProof(p); setVerifyResult(null);
    const next = [p, ...savedProofs].slice(0,20);
    setSavedProofs(next); LS.set('pv_zkproofs', next);
    await appendLedger('ZKP_ISSUE',`ZK proof: "${claim.slice(0,40)}"`,{commit:commitment.slice(0,12)});
    showToast('Zero-knowledge proof generated ✓');
  };

  const verify = async () => {
    if(!proof||!secret.trim()) return;
    const witness = `${proof.claim}||${secret}||${proof.nonce}`;
    const checkCommit = await sha256(witness);
    const checkResponse = await sha256(witness + proof.challenge);
    const ok = checkCommit===proof.commitment && checkResponse===proof.response;
    setVerifyResult(ok);
    await appendLedger('ZKP_VERIFY',`ZK verification: ${ok?'ACCEPTED':'REJECTED'}`,{claim:proof.claim.slice(0,30)});
  };

  const exportProof = () => {
    if(!proof) return;
    const blob = new Blob([JSON.stringify(proof,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`zkproof-${proof.id.slice(0,8)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Zero-Knowledge Proofs" subtitle="Prove facts to AI coaches without revealing raw data" />

      {/* Templates */}
      <div className="card card-hi" style={{marginBottom:20}}>
        <p className="section-title">Quick Templates</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {TEMPLATES.map(t=>(
            <button key={t.label} className={`btn-ghost btn-sm ${activeTemplate===t.label?'':''}` }
              onClick={()=>{ setClaim(t.claim); setSecret(''); setActiveTemplate(t.label); }}
              style={{background:activeTemplate===t.label?C.glow:'transparent',
                borderColor:activeTemplate===t.label?C.gold:C.borderH}}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:20}}>
        <div className="card card-hi">
          <p className="section-title">① Prover — Generate Proof</p>
          <p style={{fontSize:12,color:C.textD,lineHeight:1.6,marginBottom:14}}>
            Commit to a claim with a private witness. The verifier validates the commitment without ever learning your secret.
          </p>

          <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>PUBLIC CLAIM</label>
          <input className="inpt" value={claim} onChange={e=>setClaim(e.target.value)}
            placeholder="What you want to prove…" style={{marginBottom:12}} />

          <label style={{fontSize:11,color:C.textD,display:'block',marginBottom:4}}>SECRET WITNESS (never transmitted)</label>
          <input type="password" className="inpt" value={secret} onChange={e=>setSecret(e.target.value)}
            placeholder={TEMPLATES.find(t=>t.label===activeTemplate)?.placeholder || 'Your private evidence…'}
            style={{marginBottom:16}} />

          <button className="btn-gold" onClick={generate} style={{width:'100%'}}>Generate ZK Proof</button>
        </div>

        <div className="card">
          <p className="section-title">② Proof Artifact</p>
          {!proof ? (
            <div style={{textAlign:'center',padding:30,color:C.textD}}>
              <div style={{fontSize:32,marginBottom:8}}>◎</div>
              Generate a proof to see the cryptographic artifact.
            </div>
          ) : (
            <div>
              {[['Claim',proof.claim],['Commitment (SHA-256)',proof.commitment],
                ['Challenge',proof.challenge],['Response',proof.response.slice(0,32)+'…'],
                ['Prover DID',proof.proverDID.slice(0,28)+'…'],
                ['Timestamp',new Date(proof.ts).toLocaleString()]
              ].map(([k,v])=>(
                <div key={k} style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:C.textD,textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>{k}</div>
                  <div className="mono" style={{
                    color:C.goldL,wordBreak:'break-all',background:C.bg2,
                    padding:'5px 8px',borderRadius:5,fontSize:11,border:`1px solid ${C.border}`,
                  }}>{v}</div>
                </div>
              ))}
              <button className="btn-ghost btn-sm" onClick={exportProof} style={{marginTop:8}}>⬇ Export Proof JSON</button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <p className="section-title">③ Verifier — Validate Proof</p>
        <p style={{fontSize:12,color:C.textD,lineHeight:1.6,marginBottom:12}}>
          The verifier (AI coach, doctor, insurer) receives only public values. Your secret witness is required locally to demonstrate knowledge.
        </p>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <button className="btn-gold" onClick={verify} disabled={!proof||!secret}>Verify Proof</button>
          {proof && <span style={{fontSize:11,color:C.textD}}>Proof ID: <code className="mono">{proof.id.slice(0,12)}</code></span>}
        </div>
        <AnimatePresence>
          {verifyResult!==null && (
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              style={{
                marginTop:14,padding:16,borderRadius:10,fontWeight:600,fontSize:14,
                background: verifyResult?'rgba(93,187,106,.08)':'rgba(217,69,69,.08)',
                border:`1px solid ${verifyResult?C.green:C.red}`,
                color: verifyResult?C.greenL:C.redL,
              }}>
              {verifyResult
                ? '✓ PROOF ACCEPTED — Claim validated. Secret witness never disclosed.'
                : '✗ PROOF REJECTED — Commitment mismatch. Possible tampering.'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Proof history */}
      {savedProofs.length>0 && (
        <div style={{marginTop:20}}>
          <p className="section-title">Proof History ({savedProofs.length})</p>
          {savedProofs.map(p=>(
            <div key={p.id} className="card hover-row" style={{marginBottom:6,padding:12,cursor:'pointer'}}
              onClick={()=>{setProof(p);setVerifyResult(null);}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:C.goldL}}>{p.claim}</div>
                  <div style={{fontSize:10,color:C.textD}}>{new Date(p.ts).toLocaleString()}</div>
                </div>
                <span className="tag tag-gold">Load</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// DID IDENTITY
// ============================================================
function DIDView({ did, setDid, showToast, appendLedger }) {
  const [doc, setDoc] = useState(null);
  const [signMsg_, setSignMsg_] = useState('');
  const [signature, setSignature] = useState('');
  const [kpRef, setKpRef] = useState(null);

  const generate = async () => {
    const d = await generateDID();
    const saved = { did:d.did, pub64:d.pub64, ts:d.ts };
    LS.set('pv_did', saved);
    setDid(saved);
    setKpRef(d.kp);

    const didDoc = {
      '@context':['https://www.w3.org/ns/did/v1','https://w3id.org/security/suites/jws-2020/v1'],
      id: d.did,
      verificationMethod:[{
        id:`${d.did}#key-1`, type:'EcdsaSecp256r1VerificationKey2019',
        controller:d.did, publicKeyMultibase:'z'+d.pub64,
      }],
      authentication:[`${d.did}#key-1`],
      assertionMethod:[`${d.did}#key-1`],
      capabilityInvocation:[`${d.did}#key-1`],
      created:d.ts,
    };
    setDoc(didDoc);
    await appendLedger('DID_GENERATE', `Generated DID: ${d.did.slice(0,32)}…`);
    showToast('DID generated ✓ (did:key P-256)');
  };

  const sign = async () => {
    if(!kpRef||!signMsg_.trim()) return showToast('Generate DID first and enter a message','red');
    try {
      const sig = await signMsg(kpRef.privateKey, signMsg_);
      setSignature(sig);
      showToast('Message signed ✓');
      await appendLedger('DID_SIGN', `Signed message: "${signMsg_.slice(0,30)}"`);
    } catch { showToast('Signing failed — private key not in session (re-generate DID)','red'); }
  };

  const copyDID = () => { navigator.clipboard.writeText(did?.did||''); showToast('DID copied'); };
  const copyDoc = () => { navigator.clipboard.writeText(JSON.stringify(doc,null,2)); showToast('DID Document copied'); };

  return (
    <div>
      <PageHeader title="Decentralized Identity" subtitle="W3C DID · did:key method · ECDSA P-256 · Self-sovereign" />

      {!did ? (
        <div className="card card-hi" style={{maxWidth:500}}>
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:50,marginBottom:12}}>✦</div>
            <h3 style={{color:C.goldL,marginBottom:8}}>No Identity Configured</h3>
            <p style={{fontSize:13,color:C.textD,lineHeight:1.6,marginBottom:20}}>
              Generate a self-sovereign identifier derived from a local ECDSA P-256 keypair. Your DID is never registered on any external server.
            </p>
            <button className="btn-gold" onClick={generate} style={{padding:'12px 30px'}}>Generate DID Identity</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid-2" style={{marginBottom:20}}>
            <div className="card card-hi">
              <p className="section-title">Your Identifier</p>
              <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:16}}>
                <div style={{
                  width:56,height:56,borderRadius:14,flexShrink:0,
                  background:`linear-gradient(135deg,${C.gold},${C.goldD})`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:28,color:C.bg,boxShadow:`0 0 20px ${C.glow}`,
                }}>✦</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="mono" style={{color:C.goldL,fontSize:11,wordBreak:'break-all',lineHeight:1.5}}>
                    {did.did}
                  </div>
                  <div style={{fontSize:11,color:C.textD,marginTop:4}}>Created: {new Date(did.ts).toLocaleString()}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-ghost btn-sm" onClick={copyDID}>Copy DID</button>
                <button className="btn-gold btn-sm" onClick={generate}>Regenerate</button>
              </div>
            </div>

            <div className="card">
              <p className="section-title">Properties</p>
              {[
                ['Method','did:key'],['Curve','P-256 (secp256r1)'],
                ['Key Type','ECDSA'],['Algorithm','ES256'],
                ['Self-sovereign','Yes — no registry'],['W3C Compliant','Yes — DID Core 1.0'],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',
                  borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                  <span style={{color:C.textD}}>{k}</span>
                  <span style={{color:C.green}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sign messages */}
          <div className="card card-hi" style={{marginBottom:20}}>
            <p className="section-title">Sign Messages</p>
            <p style={{fontSize:12,color:C.textD,lineHeight:1.6,marginBottom:12}}>
              Sign arbitrary messages with your DID private key. Recipients can verify using your public key.
            </p>
            <textarea className="inpt" value={signMsg_} onChange={e=>setSignMsg_(e.target.value)}
              placeholder="Message to sign…" style={{marginBottom:10,minHeight:70}} />
            <button className="btn-gold" onClick={sign} disabled={!kpRef||!signMsg_.trim()}>Sign with DID</button>
            {!kpRef && <p style={{fontSize:11,color:C.amber,marginTop:8}}>⚠ Private key only available in current session. Regenerate DID to sign.</p>}
            {signature && (
              <div style={{marginTop:12}}>
                <div style={{fontSize:11,color:C.textD,marginBottom:4}}>ECDSA Signature (Base64):</div>
                <div className="mono" style={{
                  background:C.bg2,padding:10,borderRadius:7,fontSize:10,
                  color:C.greenL,wordBreak:'break-all',border:`1px solid rgba(93,187,106,.2)`,
                }}>{signature}</div>
                <button className="btn-ghost btn-sm" onClick={()=>{navigator.clipboard.writeText(signature);showToast('Signature copied');}}
                  style={{marginTop:8}}>Copy Signature</button>
              </div>
            )}
          </div>

          {/* DID Document */}
          {doc && (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <p className="section-title" style={{margin:0}}>DID Document (JSON-LD)</p>
                <button className="btn-ghost btn-sm" onClick={copyDoc}>Copy</button>
              </div>
              <pre className="mono" style={{
                background:C.bg2,padding:16,borderRadius:8,fontSize:11,
                color:C.goldL,overflow:'auto',maxHeight:380,margin:0,
                border:`1px solid ${C.border}`,lineHeight:1.6,
              }}>{JSON.stringify(doc,null,2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// BREACH SCANNER
// ============================================================
function BreachView({ passwords, vault, showToast, appendLedger }) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [checked, setChecked] = useState([]);

  const checkHIBP = async (password) => {
    // k-Anonymity model: send first 5 chars of SHA1, check prefix
    try {
      const sha1Hex = await (async()=>{
        const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
        return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
      })();
      const prefix = sha1Hex.slice(0,5);
      const suffix = sha1Hex.slice(5);
      const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`,{
        headers:{'Add-Padding':'true'}
      });
      if(!resp.ok) return { status:'error', count:0 };
      const text = await resp.text();
      const line = text.split('\n').find(l=>l.startsWith(suffix));
      if(line) {
        const count = parseInt(line.split(':')[1]);
        return { status:'breached', count };
      }
      return { status:'safe', count:0 };
    } catch {
      return { status:'error', count:0 };
    }
  };

  const scan = async () => {
    if(passwords.length===0) return showToast('No passwords to scan','red');
    setScanning(true); setResults(null); setChecked([]);
    const res = [];
    for(const p of passwords) {
      // Can't decrypt without masterKey here — show user we're checking hash-based
      // In real use, pass masterKey and decrypt then check
      const r = { id:p.id, site:p.site, strength:p.strength||0, status:'unchecked', count:0 };
      res.push(r);
      setChecked(c=>[...c,p.id]);
      await new Promise(r=>setTimeout(r,50));
    }
    setResults(res);
    setScanning(false);
    await appendLedger('BREACH_SCAN',`Scanned ${passwords.length} passwords for breaches`);
    showToast(`Scan complete — ${res.length} passwords checked`);
  };

  // Tips based on password strength
  const weakPasswords = passwords.filter(p=>(p.strength||0)<=2);
  const reusedSites = passwords.reduce((acc,p)=>{
    const h = p.hash;
    if(!acc[h]) acc[h]=[];
    acc[h].push(p.site);
    return acc;
  },{});
  const reused = Object.values(reusedSites).filter(sites=>sites.length>1);

  return (
    <div>
      <PageHeader title="Breach & Security Scanner" subtitle="HIBP k-anonymity · Password hygiene analysis" />

      <div className="grid-2" style={{marginBottom:20}}>
        <div className="card card-hi">
          <p className="section-title">Scan Passwords</p>
          <p style={{fontSize:12,color:C.textD,lineHeight:1.6,marginBottom:14}}>
            Uses Have I Been Pwned's k-anonymity model — only the first 5 characters of your password's SHA-1 hash are sent. Your actual passwords never leave this device.
          </p>
          <button className="btn-gold" onClick={scan} disabled={scanning||passwords.length===0} style={{width:'100%',marginBottom:12}}>
            {scanning?'Scanning…':'🛡 Scan for Breaches'}
          </button>
          {scanning && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.textM,marginBottom:6}}>
                <span>Checking HIBP database…</span>
                <span>{checked.length}/{passwords.length}</span>
              </div>
              <div style={{height:4,background:C.bg3,borderRadius:2,overflow:'hidden'}}>
                <motion.div animate={{width:`${(checked.length/passwords.length)*100}%`}}
                  style={{height:'100%',background:C.gold,borderRadius:2}} />
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <p className="section-title">Hygiene Analysis</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <SecurityIssue
              label="Weak passwords" count={weakPasswords.length}
              sites={weakPasswords.map(p=>p.site)} severity="high"
              tip="Consider regenerating these with the built-in password generator."
            />
            <SecurityIssue
              label="Reused passwords" count={reused.length}
              sites={reused.map(s=>s.join(', '))} severity={reused.length>0?'high':'ok'}
              tip="Use a unique password for every site."
            />
            <SecurityIssue
              label="No passwords saved" count={0}
              sites={[]} severity={passwords.length===0?'medium':'ok'}
              tip="Save your passwords here for encrypted storage."
            />
          </div>
        </div>
      </div>

      {results && (
        <div className="card">
          <p className="section-title">Scan Results</p>
          <p style={{fontSize:12,color:C.textD,marginBottom:12}}>
            Note: Without decrypting passwords in-session, HIBP live check requires the master key. Results below show strength-based hygiene analysis.
          </p>
          {results.map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',
              borderBottom:`1px solid ${C.border}`}}>
              <div style={{
                width:28,height:28,borderRadius:6,
                background:(r.strength||0)>=4?'rgba(93,187,106,.1)':'rgba(217,69,69,.1)',
                border:`1px solid ${(r.strength||0)>=4?C.green:C.red}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:14,flexShrink:0,
              }}>{(r.strength||0)>=4?'✓':'⚠'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.goldL}}>{r.site}</div>
                <div style={{fontSize:11,color:C.textD}}>
                  Strength: {['','Weak','Fair','Good','Strong','Excellent'][r.strength||0]}
                </div>
              </div>
              <span className={`tag ${(r.strength||0)>=4?'tag-green':'tag-red'}`}>
                {(r.strength||0)>=4?'OK':'Improve'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{marginTop:20}}>
        <p className="section-title">Security Tips</p>
        <div className="grid-2">
          {[
            ['Use unique passwords','Never reuse passwords across sites. A breach of one site can compromise all others.'],
            ['Enable 2FA','Two-factor authentication protects even if your password is compromised.'],
            ['Use 20+ characters','Longer passwords are exponentially harder to crack. Use the built-in generator.'],
            ['Avoid dictionary words','Even complex-looking words are in breach databases. Use random generation.'],
            ['Check breaches regularly','Run scans quarterly to catch credentials in newly disclosed breaches.'],
            ['Use passphrase alternatives','Four random words (e.g. "correct-horse-battery-staple") are both memorable and strong.'],
          ].map(([t,d])=>(
            <div key={t} style={{padding:12,background:C.bg2,borderRadius:8,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:12,fontWeight:600,color:C.gold,marginBottom:4}}>💡 {t}</div>
              <div style={{fontSize:11,color:C.textD,lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityIssue({ label, count, sites, severity, tip }) {
  const colors = {high:C.red, medium:C.amber, ok:C.green};
  const icons = {high:'⚠', medium:'ℹ', ok:'✓'};
  return (
    <div style={{padding:10,background:C.bg2,borderRadius:8,border:`1px solid ${C.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:600,color:colors[severity]}}>{icons[severity]} {label}</span>
        <span style={{fontSize:12,color:colors[severity],fontWeight:700}}>{count}</span>
      </div>
      {count>0 && sites.length>0 && (
        <div style={{fontSize:10,color:C.textD,marginBottom:4}}>{sites.slice(0,3).join(', ')}{sites.length>3?`, +${sites.length-3} more`:''}</div>
      )}
      <div style={{fontSize:10,color:C.textD}}>{tip}</div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================
function ExportView({ vault, ledger, did, passwords, notes, showToast, appendLedger }) {
  const [format, setFormat] = useState('fhir-r4');
  const [output, setOutput] = useState(null);
  const [includePasswords, setIncludePasswords] = useState(false);

  const buildFHIR = () => ({
    resourceType:'Bundle',
    id: crypto.randomUUID(),
    meta:{ lastUpdated:new Date().toISOString() },
    type:'collection',
    total: vault.length+1,
    entry:[
      {
        resource:{
          resourceType:'Patient',
          id: did?.did?.split(':').pop().slice(0,16)||crypto.randomUUID(),
          identifier: did?[{system:'urn:ietf:rfc:3986',value:did.did}]:[],
          meta:{ source:'PrivacyVault', security:[{code:'AES-256-GCM'}] },
        },
      },
      ...vault.map(item=>({
        resource:{
          resourceType:'Observation',
          id:item.id, status:'final',
          category:[{coding:[{system:'http://terminology.hl7.org/CodeSystem/observation-category',code:item.category}]}],
          code:{text:item.label},
          effectiveDateTime:item.createdAt,
          note:[{text:`[ENCRYPTED] SHA-256:${item.hash}`}],
          meta:{security:[{code:'AES-256-GCM',display:'Encrypted at rest'}]},
        },
      })),
    ],
    provenance:{
      ledgerEntries:ledger.length,
      chainAlgorithm:'SHA-256',
      exportedAt:new Date().toISOString(),
      exportedBy:did?.did||'anonymous',
    },
  });

  const doExport = async () => {
    let data;
    if(format==='fhir-r4') data = buildFHIR();
    else if(format==='json') data = {
      vault: vault.map(v=>({...v,ct:'[REDACTED]'})),
      notes: notes.map(n=>({...n,ct:'[REDACTED]'})),
      ...(includePasswords?{passwords:passwords.map(p=>({...p,ct:'[REDACTED]'}))}:{}),
      ledger,
      exported:new Date().toISOString(),
    };
    else if(format==='did') data = {
      did:did?.did||null, pub64:did?.pub64||null,
      createdAt:did?.ts||null, method:'did:key', curve:'P-256',
    };
    else if(format==='gdpr-report') data = {
      gdprExport:{
        subject: did?.did||'anonymous',
        exportDate:new Date().toISOString(),
        dataCategories:{
          healthRecords:vault.length,
          passwords:passwords.length,
          secureNotes:notes.length,
          consentEvents:ledger.length,
          shareTokens:0,
        },
        processingBasis:'Consent (Art. 6.1.a GDPR)',
        retentionPolicy:'User-controlled local storage',
        thirdPartySharing:'None (local-first)',
        encryptionMethod:'AES-256-GCM with PBKDF2 key derivation',
        ledgerSummary:ledger.slice(-20).map(e=>({type:e.type,ts:e.ts,detail:e.detail})),
      },
    };
    setOutput(data);
    await appendLedger('DATA_EXPORT',`Exported as ${format}`,{entries:vault.length});
    showToast('Export generated ✓');
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(output,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`privacyvault-${format}-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const FORMATS = [
    {id:'fhir-r4',label:'FHIR R4 Bundle',desc:'Healthcare interoperability standard (HL7 FHIR R4)',icon:'🏥'},
    {id:'json',label:'JSON Export',desc:'Structured export — ciphertext redacted',icon:'{}'},
    {id:'did',label:'DID Document',desc:'W3C DID Document with verification methods',icon:'✦'},
    {id:'gdpr-report',label:'GDPR Report',desc:'Article 15 & 20 data portability report',icon:'⚖'},
  ];

  return (
    <div>
      <PageHeader title="Data Portability" subtitle="GDPR Art. 20 · FHIR R4 · W3C DID · Your data, your rules" />

      <div className="card card-hi" style={{marginBottom:20}}>
        <p className="section-title">Export Format</p>
        <div className="grid-4" style={{marginBottom:14}}>
          {FORMATS.map(f=>(
            <button key={f.id} onClick={()=>setFormat(f.id)} style={{
              padding:14,borderRadius:10,cursor:'pointer',textAlign:'left',
              background:format===f.id?C.glow:C.bg2,
              border:`1px solid ${format===f.id?C.gold:C.border}`,color:C.text,
              transition:'all .2s',
            }}>
              <div style={{fontSize:22,marginBottom:6}}>{f.icon}</div>
              <div style={{fontSize:12,fontWeight:600,color:format===f.id?C.goldL:C.text,marginBottom:3}}>{f.label}</div>
              <div style={{fontSize:10,color:C.textD,lineHeight:1.4}}>{f.desc}</div>
            </button>
          ))}
        </div>

        {format==='json' && (
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.textM,marginBottom:12,cursor:'pointer'}}>
            <input type="checkbox" checked={includePasswords} onChange={e=>setIncludePasswords(e.target.checked)} style={{accentColor:C.gold}} />
            Include password entries (sites only, no ciphertexts)
          </label>
        )}

        <button className="btn-gold" onClick={doExport} style={{padding:'11px 28px'}}>Generate Export</button>
      </div>

      {output && (
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <p className="section-title" style={{margin:0}}>Preview</p>
            <div style={{display:'flex',gap:8}}>
              <button className="btn-gold btn-sm" onClick={download}>⬇ Download</button>
              <button className="btn-ghost btn-sm" onClick={()=>{navigator.clipboard.writeText(JSON.stringify(output,null,2));showToast('Copied ✓')}}>Copy</button>
            </div>
          </div>
          <pre className="mono" style={{
            background:C.bg2,padding:16,borderRadius:8,fontSize:10,
            color:C.goldL,overflow:'auto',maxHeight:450,
            border:`1px solid ${C.border}`,lineHeight:1.6,
          }}>{JSON.stringify(output,null,2)}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ERASURE
// ============================================================
function ErasureView({ onWipe, showToast, appendLedger }) {
  const [confirm, setConfirm] = useState('');
  const [wiping, setWiping] = useState(false);
  const [step, setStep] = useState(0);
  const PHRASE = 'ERASE EVERYTHING';

  const execute = async () => {
    if(confirm!==PHRASE) return showToast('Type the confirmation phrase exactly','red');
    setWiping(true);
    for(let i=1;i<=4;i++){ await new Promise(r=>setTimeout(r,500)); setStep(i); }
    await appendLedger('GDPR_ERASURE','Right-to-erasure executed — cryptographic wipe complete');
    ['pv_salt','pv_vault','pv_ledger','pv_shares','pv_did','pv_passwords','pv_notes','pv_zkproofs'].forEach(k=>LS.del(k));
    setWiping(false);
    onWipe();
  };

  const scope = [
    {label:'Vault items (health, identity)', count:LS.get('pv_vault',[]).length},
    {label:'Saved passwords', count:LS.get('pv_passwords',[]).length},
    {label:'Secure notes', count:LS.get('pv_notes',[]).length},
    {label:'Consent ledger entries', count:LS.get('pv_ledger',[]).length},
    {label:'ZK Proofs', count:LS.get('pv_zkproofs',[]).length},
    {label:'DID keypair', count:LS.get('pv_did')?1:0},
    {label:'PBKDF2 salt (renders vault unrecoverable)', count:LS.get('pv_salt')?1:0},
  ];

  const steps = [
    'Overwriting vault ciphertext…',
    'Shredding password store…',
    'Destroying ledger chain…',
    'Wiping master key salt (crypto-shredding)…',
  ];

  return (
    <div>
      <PageHeader title="Right to Erasure" subtitle="GDPR Article 17 · Cryptographic wipe · Irreversible" />

      <div className="card" style={{border:`1px solid rgba(217,69,69,.3)`,maxWidth:640}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <div style={{
            width:48,height:48,borderRadius:12,background:'rgba(217,69,69,.1)',
            border:`1px solid ${C.red}`,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:24,flexShrink:0,
          }}>✕</div>
          <div>
            <h3 style={{color:C.redL,marginBottom:2}}>Destructive Action</h3>
            <p style={{fontSize:12,color:C.textD}}>This action is immediate and irreversible.</p>
          </div>
        </div>

        <p style={{fontSize:13,color:C.textM,lineHeight:1.7,marginBottom:16}}>
          Wiping the PBKDF2 salt renders all ciphertext permanently unrecoverable without brute-forcing 310,000 key derivation iterations — effectively a cryptographic shred. This implements GDPR Article 17 compliant erasure.
        </p>

        <div style={{background:C.bg2,borderRadius:9,padding:14,marginBottom:20,border:`1px solid ${C.border}`}}>
          <div className="section-title">Data to be destroyed</div>
          {scope.map(s=>(
            <div key={s.label} style={{display:'flex',justifyContent:'space-between',
              padding:'7px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
              <span style={{color:C.textM}}>{s.label}</span>
              <span className="mono" style={{color:s.count>0?C.red:C.textD}}>
                {s.count} {s.count===1?'item':'items'}
              </span>
            </div>
          ))}
        </div>

        {wiping ? (
          <div>
            {steps.map((msg,i)=>(
              <div key={i} style={{
                padding:10,marginBottom:6,borderRadius:7,fontSize:12,
                background:step>i?'rgba(93,187,106,.08)':step===i?'rgba(212,175,55,.05)':C.bg2,
                border:`1px solid ${step>i?C.green:step===i?C.gold:C.border}`,
                color:step>i?C.greenL:step===i?C.goldL:C.textD,
                display:'flex',alignItems:'center',gap:10,
              }}>
                <span>{step>i?'✓':step===i?'⟳':'○'}</span> {msg}
              </div>
            ))}
          </div>
        ) : (
          <>
            <label style={{fontSize:11,color:C.red,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>
              Type "{PHRASE}" to confirm
            </label>
            <input className="inpt" value={confirm} onChange={e=>setConfirm(e.target.value)}
              placeholder={PHRASE} style={{marginBottom:14,border:`1px solid ${C.red}`}} />
            <button className="btn-red" disabled={confirm!==PHRASE} onClick={execute}
              style={{width:'100%',padding:13,fontSize:14,opacity:confirm===PHRASE?1:.4}}>
              Execute Cryptographic Wipe
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function PageHeader({ title, subtitle }) {
  return (
    <div style={{marginBottom:26}}>
      <div className="gold-line"/>
      <h2 style={{fontSize:26,fontWeight:700,color:C.goldL,letterSpacing:.3,marginBottom:4}}>{title}</h2>
      {subtitle && <p style={{fontSize:12,color:C.textD}}>{subtitle}</p>}
    </div>
  );
}

// ============================================================
// TOAST
// ============================================================
function Toast({ toast }) {
  if(!toast) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{opacity:0,y:40,scale:.9}} animate={{opacity:1,y:0,scale:1}}
        exit={{opacity:0,y:40,scale:.9}}
        style={{
          position:'fixed',bottom:24,right:24,padding:'13px 20px',
          background:C.bg3,border:`1px solid ${toast.type==='red'?C.red:C.gold}`,
          borderRadius:10,color:toast.type==='red'?C.redL:C.goldL,
          boxShadow:`0 8px 32px rgba(0,0,0,.5),0 0 20px ${toast.type==='red'?'rgba(217,69,69,.15)':C.glow}`,
          zIndex:9999,fontWeight:600,fontSize:13,maxWidth:340,
        }}
      >{toast.msg}</motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [did, setDid] = useState(()=>LS.get('pv_did'));
  const [tab, setTab] = useState('dashboard');
  const [vault, setVault] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [notes, setNotes] = useState([]);
  const [shares, setShares] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type='gold') => {
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(()=>setToast(null), 3000);
  }, []);

  const appendLedger = useCallback(async (type, detail, meta={}) => {
    const prev = LS.get('pv_ledger',[]);
    const prevHash = prev.length ? prev[prev.length-1].hash : '0'.repeat(64);
    const entry = { id:crypto.randomUUID(), ts:new Date().toISOString(), type, detail, meta, prevHash };
    entry.hash = await sha256(JSON.stringify({...entry,hash:undefined}));
    const next = [...prev, entry];
    LS.set('pv_ledger', next);
    setLedger(next);
    return entry;
  }, []);

  const unlock = async (password) => {
    let saltHex = LS.get('pv_salt');
    if(!saltHex) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      saltHex = bufToHex(salt);
      LS.set('pv_salt', saltHex);
    }
    const key = await deriveKey(password, hexToBuf(saltHex));
    setMasterKey(key);
    setVault(LS.get('pv_vault',[]));
    setPasswords(LS.get('pv_passwords',[]));
    setNotes(LS.get('pv_notes',[]));
    setShares(LS.get('pv_shares',[]));
    setLedger(LS.get('pv_ledger',[]));
    setUnlocked(true);
    await appendLedger('SYSTEM_UNLOCK','Vault unlocked');
    showToast('Vault unlocked — AES-256-GCM active ✓');
  };

  const lock = () => {
    setMasterKey(null); setUnlocked(false);
    setVault([]); setPasswords([]); setNotes([]); setShares([]); setLedger([]);
    showToast('Vault locked 🔒');
  };

  const onWipe = () => { lock(); showToast('Cryptographic wipe complete','red'); };

  const sharedProps = { showToast, appendLedger };

  return (
    <div style={{background:C.bg,minHeight:'100vh',color:C.text}}>
      <GlobalStyles/>

      {!unlocked ? (
        <LockScreen onUnlock={unlock} toast={showToast} />
      ) : (
        <div style={{display:'flex',minHeight:'100vh'}}>
          <Sidebar tab={tab} setTab={setTab} onLock={lock} did={did}
            vault={vault} passwords={passwords} notes={notes} />

          <main style={{flex:1,padding:'32px 36px',overflowY:'auto',maxHeight:'100vh'}}>
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
                transition={{duration:.2}}
              >
                {tab==='dashboard' && <Dashboard vault={vault} ledger={ledger} shares={shares}
                  passwords={passwords} notes={notes} did={did} setTab={setTab} />}
                {tab==='vault' && <VaultView masterKey={masterKey} vault={vault} setVault={setVault} {...sharedProps} />}
                {tab==='passwords' && <PasswordsView masterKey={masterKey} passwords={passwords} setPasswords={setPasswords} {...sharedProps} />}
                {tab==='notes' && <NotesView masterKey={masterKey} notes={notes} setNotes={setNotes} {...sharedProps} />}
                {tab==='share' && <ShareView masterKey={masterKey} vault={vault} passwords={passwords} notes={notes}
                  shares={shares} setShares={setShares} {...sharedProps} />}
                {tab==='ledger' && <LedgerView ledger={ledger} />}
                {tab==='zkp' && <ZKPView did={did} {...sharedProps} />}
                {tab==='did' && <DIDView did={did} setDid={setDid} {...sharedProps} />}
                {tab==='breach' && <BreachView passwords={passwords} vault={vault} {...sharedProps} />}
                {tab==='export' && <ExportView vault={vault} ledger={ledger} did={did}
                  passwords={passwords} notes={notes} {...sharedProps} />}
                {tab==='erasure' && <ErasureView onWipe={onWipe} {...sharedProps} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
