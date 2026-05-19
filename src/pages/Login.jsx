import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../services/auth.service";

/* ─────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────── */
const ACC = "#D4AF37";
const ACCDIM = "#B8941F";
const BG = "#030303";
const BG2 = "#0a0806";
const BORDER = "#1a1508";
const GRID = "rgba(212,175,55,0.015)";
const TEXT_MAIN = "#F5E6C8";
const TEXT_DIM = "#5a4a20";
const TEXT_MUTED = "#3a2e14";

const MANIFIX_LOGO_URL = "https://image.qwenlm.ai/public_source/80c2e724-ea58-449b-9ee2-a36c1abcb1f5/180238fae-0a6c-4c71-8a28-27e853aba7a2.png";

/* ─────────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────────── */
function injectCSS() {
  if (document.getElementById("loginpremiumcss")) return;
  const el = document.createElement("style");
  el.id = "loginpremiumcss";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&family=Playfair+Display:wght@400;700;900&display=swap');
    @keyframes lg-pulse{0%,100%{opacity:.03;transform:scale(1)}50%{opacity:.10;transform:scale(1.08)}}
    @keyframes lg-grid{0%,100%{opacity:.02}50%{opacity:.06}}
    @keyframes lg-scan{from{top:-2px}to{top:100%}}
    @keyframes lg-logoGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(212,175,55,0.3))}50%{filter:drop-shadow(0 0 24px rgba(212,175,55,0.6)) drop-shadow(0 0 48px rgba(212,175,55,0.15))}}
    @keyframes lg-rotateGlow{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @keyframes lg-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes lg-breathe{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.06);opacity:.7}}
    @keyframes lg-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes lg-fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lg-spin{to{transform:rotate(360deg)}}
    @keyframes lg-dash{to{stroke-dashoffset:0}}
    @keyframes lg-particleDrift{0%{transform:translateY(0) translateX(0)}100%{transform:translateY(-100vh) translateX(20px)}}
    @keyframes lg-glowPulse{0%,100%{box-shadow:0 0 20px rgba(212,175,55,0.15)}50%{box-shadow:0 0 40px rgba(212,175,55,0.3),0 0 60px rgba(212,175,55,0.1)}}
    .lg-fade-up{animation:lg-fadeUp .6s cubic-bezier(.22,.68,0,1.2) both}
    .lg-shimmer-text{background:linear-gradient(90deg,#D4AF37,#F5E6C8,#D4AF37,#F5E6C8);background-size:200% auto;animation:lg-shimmer 3s linear infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:rgba(212,175,55,0.3);color:#F5E6C8}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${BORDER};border-radius:2px}
    .glass{backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
    .gold-btn{transition:all .25s cubic-bezier(.22,.68,0,1.2);position:relative;overflow:hidden}
    .gold-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(212,175,55,0.2)}
    .gold-btn:active{transform:translateY(0) scale(0.98)}
    .google-btn{transition:all .3s cubic-bezier(.22,.68,0,1.2)}
    .google-btn:hover{background:rgba(212,175,55,0.08)!important;border-color:rgba(212,175,55,0.25)!important;transform:translateY(-2px);box-shadow:0 8px 32px rgba(212,175,55,0.1)}
    .google-btn:active{transform:translateY(0) scale(0.98)}
  `;
  document.head.appendChild(el);
}

/* ────────────────────────────────────────────
   PARTICLE CANVAS
───────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    particles.current = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.15 - 0.1,
      opacity: Math.random() * 0.4 + 0.05,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.x += p.dx; p.y += p.dy; p.pulse += 0.015;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0) p.y = canvas.height;
        const op = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op * 0.12})`; ctx.fill();
      });
      // Connection lines
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const dx = particles.current[i].x - particles.current[j].x;
          const dy = particles.current[i].y - particles.current[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles.current[i].x, particles.current[i].y);
            ctx.lineTo(particles.current[j].x, particles.current[j].y);
            ctx.strokeStyle = `rgba(212,175,55,${0.03 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

/* ────────────────────────────────────────────
   GOOGLE ICON
───────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

/* ────────────────────────────────────────────
   TRUST BADGE
───────────────────────────────────────────── */
const TrustBadge = ({ icon, label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <span style={{ fontSize:10, color:ACC, opacity:0.5 }}>{icon}</span>
    <span style={{ fontSize:7, letterSpacing:".14em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>{label}</span>
  </div>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function LoginPremium() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    injectCSS();
  }, []);

  const handleGoogle = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      if (authService?.loginWithGoogle) {
        await authService.loginWithGoogle();
      } else {
        // Fallback: simulate redirect or show message
        setError("Google authentication service not configured.");
      }
    } catch (err) {
      setError(err?.message || "Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      minHeight:"100dvh", background:BG,
      fontFamily:"'JetBrains Mono','Courier New',monospace",
      color:TEXT_MAIN, display:"flex", alignItems:"center",
      justifyContent:"center", position:"relative", overflow:"hidden",
    }}>

      {/* Particle background */}
      <ParticleCanvas />

      {/* Grid overlay */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:`linear-gradient(${GRID} 1px,transparent 1px),linear-gradient(90deg,${GRID} 1px,transparent 1px)`,
        backgroundSize:"48px 48px", animation:"lg-grid 6s ease-in-out infinite",
      }} />

      {/* Ambient glow */}
      <div style={{
        position:"fixed", top:"25%", left:"50%", transform:"translateX(-50%)",
        width:600, height:350,
        background:`radial-gradient(ellipse,${ACC}06 0%,transparent 70%)`,
        animation:"lg-pulse 6s ease-in-out infinite", pointerEvents:"none",
      }} />
      <div style={{
        position:"fixed", bottom:"10%", right:"15%",
        width:300, height:200,
        background:`radial-gradient(ellipse,${ACC}04 0%,transparent 70%)`,
        animation:"lg-pulse 8s ease-in-out infinite 2s", pointerEvents:"none",
      }} />

      {/* Scan line */}
      <div style={{
        position:"fixed", left:0, right:0, height:1,
        background:`linear-gradient(90deg,transparent,${ACC}08,${ACC}12,${ACC}08,transparent)`,
        animation:"lg-scan 4s linear infinite", pointerEvents:"none", zIndex:0,
      }} />

      {/* Corner marks */}
      {[{top:20,left:20,borderTopWidth:2,borderLeftWidth:2},{top:20,right:20,borderTopWidth:2,borderRightWidth:2},{bottom:20,left:20,borderBottomWidth:2,borderLeftWidth:2},{bottom:20,right:20,borderBottomWidth:2,borderRightWidth:2}].map((pos,i)=>(
        <div key={i} style={{ position:"fixed", width:28, height:28, borderColor:`${ACC}15`, borderStyle:"solid", borderWidth:0, pointerEvents:"none", zIndex:50, ...pos }} />
      ))}

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(3,3,3,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, flexDirection:"column", gap:20, backdropFilter:"blur(8px)" }}
          >
            <motion.div
              animate={{ rotate:360 }}
              transition={{ duration:1, repeat:Infinity, ease:"linear" }}
              style={{
                width:40, height:40,
                border:"2px solid rgba(212,175,55,0.1)",
                borderTopColor:ACC,
                borderRadius:"50%",
              }}
            />
            <div style={{ fontSize:9, letterSpacing:".3em", color:ACC, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
              Authenticating
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CARD ── */}
      <motion.div
        initial={{ opacity:0, y:30 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.7, ease:[.22,.68,0,1.2] }}
        className="glass"
        style={{
          position:"relative", zIndex:10,
          width:"min(440px,94vw)",
          background:"linear-gradient(135deg,rgba(10,8,6,0.95),rgba(8,6,5,0.85))",
          border:"1px solid rgba(212,175,55,0.1)",
          borderRadius:20,
          padding:"48px 40px 40px",
          backdropFilter:"blur(24px)",
          WebkitBackdropFilter:"blur(24px)",
          boxShadow:`0 20px 60px rgba(0,0,0,0.4),0 0 40px rgba(212,175,55,0.03)`,
        }}
      >
        {/* Inner glow */}
        <div style={{
          position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          width:"80%", height:1,
          background:`linear-gradient(90deg,transparent,${ACC}20,transparent)`,
        }} />

        {/* ── LOGO SECTION ── */}
        <div style={{ textAlign:"center", marginBottom:40 }}>

          {/* Status indicator */}
          <motion.div
            initial={{ opacity:0, scale:0.8 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay:0.2, duration:0.5 }}
            style={{
              display:"inline-flex", alignItems:"center", gap:8,
              border:"1px solid rgba(212,175,55,0.1)",
              padding:"6px 16px", borderRadius:20,
              marginBottom:28,
              background:"rgba(212,175,55,0.03)",
            }}
          >
            <motion.div
              animate={{ opacity:[0.4,1,0.4] }}
              transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
              style={{ width:6, height:6, borderRadius:"50%", background:ACC, boxShadow:`0 0 6px ${ACC}40` }}
            />
            <span style={{ fontSize:7, letterSpacing:".28em", color:`${ACC}50`, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>
              System Active
            </span>
          </motion.div>

          {/* ManifiX Logo */}
          <motion.div
            initial={{ opacity:0, scale:0.7 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay:0.4, duration:0.8, ease:[.22,.68,0,1.2] }}
            style={{ position:"relative", display:"inline-block", marginBottom:20 }}
          >
            <motion.div
              animate={{ scale:[1,1.02,1] }}
              transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}
              style={{
                width:100, height:100, borderRadius:"50%",
                overflow:"hidden",
                border:`2px solid ${ACC}25`,
                background:"radial-gradient(circle,rgba(212,175,55,0.05),rgba(3,3,3,0.9))",
                display:"flex", alignItems:"center", justifyContent:"center",
                animation:"lg-logoGlow 4s ease-in-out infinite",
              }}
            >
              <motion.img
                src={MANIFIX_LOGO_URL}
                alt="ManifiX"
                onLoad={() => setLogoLoaded(true)}
                style={{ width:72, height:72, objectFit:"contain", filter:"brightness(1.1) saturate(1.2)" }}
              />
              {/* Fallback text if image fails */}
              {!logoLoaded && (
                <div style={{
                  fontFamily:"'Syne',sans-serif", fontSize:28,
                  fontWeight:800, color:ACC, letterSpacing:".05em",
                }}>M</div>
              )}
            </motion.div>
            {/* Rotating ring */}
            <div style={{
              position:"absolute", inset:-8, borderRadius:"50%",
              border:`1px solid ${ACC}08`,
              animation:"lg-rotateGlow 15s linear infinite",
            }} />
            <div style={{
              position:"absolute", inset:-16, borderRadius:"50%",
              border:`1px dashed ${ACC}06`,
              animation:"lg-rotateGlow 25s linear infinite reverse",
            }} />
          </motion.div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.6 }}
          >
            <div style={{
              fontFamily:"'Syne',sans-serif", fontSize:36,
              fontWeight:800, letterSpacing:"-.02em", lineHeight:1, marginBottom:4,
            }}>
              <span className="lg-shimmer-text">MANIFIX</span>
            </div>
            <div style={{
              fontFamily:"'Playfair Display',serif", fontSize:14,
              fontStyle:"italic", letterSpacing:".15em", color:`${ACC}50`,
              marginBottom:8,
            }}>
              Wellness Platform
            </div>
            <div style={{
              fontSize:8, letterSpacing:".3em", color:TEXT_MUTED,
              textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace",
            }}>
              Intelligence Meets Intention
            </div>
          </motion.div>
        </div>

        {/* ── SECTION HEADER ── */}
        <motion.div
          initial={{ opacity:0, x:-10 }}
          animate={{ opacity:1, x:0 }}
          transition={{ delay:0.8 }}
          style={{
            display:"flex", alignItems:"center", gap:10, marginBottom:32,
            padding:"12px 16px",
            borderLeft:`2px solid ${ACC}30`,
            background:"rgba(212,175,55,0.02)",
            borderRadius:"0 8px 8px 0",
          }}
        >
          <div style={{ width:2, height:14, background:ACC, borderRadius:1, boxShadow:`0 0 6px ${ACC}40` }} />
          <span style={{
            fontSize:8, letterSpacing:".28em", color:`${ACC}50`,
            textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", fontWeight:500,
          }}>
            Welcome Back · Sign In
          </span>
        </motion.div>

        {/* ── ERROR MESSAGE ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity:0, height:0 }}
              animate={{ opacity:1, height:"auto" }}
              exit={{ opacity:0, height:0 }}
              transition={{ duration:0.3 }}
              style={{
                border:"1px solid rgba(248,113,113,0.15)",
                background:"rgba(248,113,113,0.05)",
                padding:"12px 16px", marginBottom:24, borderRadius:10,
                fontSize:9, letterSpacing:".1em", color:"#F87171",
                display:"flex", alignItems:"center", gap:10,
                fontFamily:"'JetBrains Mono',monospace",
              }}
            >
              <span style={{ fontSize:14 }}>⚠</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GOOGLE BUTTON ── */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.9 }}
        >
          <motion.button
            className="google-btn gold-btn"
            whileTap={{ scale:0.97 }}
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width:"100%", padding:"18px 24px",
              background:"rgba(212,175,55,0.04)",
              border:`1.5px solid rgba(212,175,55,0.15)`,
              borderRadius:14, cursor:loading?"wait":"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:14,
              color:ACC, fontSize:13, fontWeight:600,
              fontFamily:"'Syne',sans-serif", letterSpacing:".06em",
              boxShadow:"0 4px 20px rgba(212,175,55,0.05)",
            }}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </motion.button>
        </motion.div>

        {/* ── SECURITY NOTE ── */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:1 }}
          style={{
            display:"flex", justifyContent:"center", gap:6, alignItems:"center",
            marginTop:16, marginBottom:32,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="1.5" opacity="0.4">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{
            fontSize:7, letterSpacing:".16em", color:TEXT_MUTED,
            textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace",
          }}>
            Secure · 256-bit encrypted connection
          </span>
        </motion.div>

        {/* ── DIVIDER ── */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:1.1 }}
          style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}
        >
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${ACC}10,transparent)` }} />
          <span style={{ fontSize:7, letterSpacing:".25em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Trusted by thousands</span>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${ACC}10,transparent)` }} />
        </motion.div>

        {/* ── TRUST BADGES ── */}
        <motion.div
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:1.2 }}
          style={{
            display:"flex", justifyContent:"center", gap:24, flexWrap:"wrap", marginBottom:28,
          }}
        >
          <TrustBadge icon="🔒" label="256-bit Encrypted" />
          <TrustBadge icon="🛡" label="Zero Data Sold" />
          <TrustBadge icon="✓" label="SOC 2 Certified" />
        </motion.div>

        {/* ─ SIGNUP LINK ── */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:1.3 }}
          style={{ textAlign:"center", marginBottom:20 }}
        >
          <span style={{ fontSize:9, letterSpacing:".14em", color:TEXT_MUTED, fontFamily:"'JetBrains Mono',monospace" }}>
            New to ManifiX?{" "}
          </span>
          <motion.button
            whileHover={{ color:ACC }}
            onClick={() => navigate("/signup")}
            style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:9, letterSpacing:".14em", color:`${ACC}60`,
              fontFamily:"'JetBrains Mono',monospace", fontWeight:500,
              padding:0, transition:"color .2s",
            }}
          >
            Create your free account →
          </motion.button>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:1.4 }}
          style={{
            textAlign:"center", paddingTop:20,
            borderTop:`1px solid rgba(212,175,55,0.04)`,
          }}
        >
          <div style={{ fontSize:7, letterSpacing:".25em", color:"#1a1408", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
            ManifiX AI · {new Date().getFullYear()} · All Rights Reserved
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
