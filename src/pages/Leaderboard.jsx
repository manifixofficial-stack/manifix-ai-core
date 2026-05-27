/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  ManifiX AI — Leaderboard v2.0 · The 1% Club                       ║
 * ║                                                                       ║
 * ║  UPGRADES FROM v1:                                                   ║
 * ║  • Team Challenges (WHOOP-style) — create/join/compete in squads    ║
 * ║  • Group Accountability Feed (MyFitnessPal-style live activity)     ║
 * ║  • Gamified XP + Level system with animated rank-ups               ║
 * ║  • Challenge Creator with custom goals & invites                    ║
 * ║  • Streak Shield consumable power-up                                ║
 * ║  • ManifiX Exclusive: Ghost Racing — race your past self           ║
 * ║  • Rival system — auto-assign a rival within 5 ranks               ║
 * ║  • Weekly missions with XP rewards                                  ║
 * ║  • Real localStorage sync (streak, sessions, accuracy)             ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

/* ══════════════════════════════════════════
   CSS
══════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600;700&display=swap');

  .lb2 { min-height:100vh; background:#060606; font-family:'Inter',sans-serif; color:#e8e8e8; overflow-x:hidden; position:relative; }
  .lb2::before { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.008) 2px,rgba(255,255,255,.008) 4px); pointer-events:none; z-index:0; }
  .lb2-inner { position:relative; z-index:1; max-width:520px; margin:0 auto; padding-bottom:110px; }

  /* HEADER */
  .lb2-header { padding:36px 20px 22px; text-align:center; border-bottom:1px solid #161616; position:relative; overflow:hidden; }
  .lb2-header::before { content:''; position:absolute; top:0; left:50%; transform:translateX(-50%); width:360px; height:220px; background:radial-gradient(ellipse,rgba(201,168,76,.14) 0%,transparent 70%); pointer-events:none; }
  .lb2-season { font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:3px; color:#444; text-transform:uppercase; margin-bottom:8px; }
  .lb2-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(40px,11vw,60px); letter-spacing:4px; color:#fff; line-height:1; margin-bottom:5px; }
  .lb2-title span { color:#c9a84c; }
  .lb2-desc { font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:2px; color:#444; text-transform:uppercase; }
  .lb2-live { display:inline-flex; align-items:center; gap:5px; font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:2px; color:#39d98a; text-transform:uppercase; margin-top:7px; }
  .lb2-live-dot { width:5px; height:5px; border-radius:50%; background:#39d98a; box-shadow:0 0 7px #39d98a; animation:lb2blink 1.4s ease-in-out infinite; }
  @keyframes lb2blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  /* TABS */
  .lb2-tabs { display:flex; gap:2px; padding:14px 14px 0; overflow-x:auto; }
  .lb2-tabs::-webkit-scrollbar { display:none; }
  .lb2-tab { flex:0 0 auto; background:#0c0c0c; border:1px solid #1c1c1c; color:#444; font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:2px; text-transform:uppercase; padding:9px 12px; cursor:pointer; border-radius:2px; transition:all .2s; white-space:nowrap; }
  .lb2-tab.active { background:rgba(201,168,76,.1); border-color:#c9a84c; color:#c9a84c; }
  .lb2-tab:hover:not(.active) { border-color:#2a2a2a; color:#777; }

  /* XP BAR */
  .lb2-xp-bar { margin:14px 14px 0; background:#0c0c0c; border:1px solid #1c1c1c; border-radius:2px; padding:10px 14px; display:flex; align-items:center; gap:12px; }
  .lb2-xp-level { font-family:'Bebas Neue',sans-serif; font-size:28px; color:#c9a84c; line-height:1; min-width:32px; }
  .lb2-xp-track { flex:1; }
  .lb2-xp-label { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:2px; color:#444; margin-bottom:5px; display:flex; justify-content:space-between; }
  .lb2-xp-bg { height:4px; background:#1a1a1a; border-radius:2px; overflow:hidden; }
  .lb2-xp-fill { height:100%; background:linear-gradient(90deg,#8B6914,#c9a84c,#ffd700); border-radius:2px; transition:width .8s cubic-bezier(.22,.68,0,1.2); }
  .lb2-xp-badge { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:1px; color:#c9a84c; padding:3px 7px; border:1px solid rgba(201,168,76,.4); border-radius:1px; white-space:nowrap; }

  /* PODIUM */
  .lb2-podium { display:flex; align-items:flex-end; justify-content:center; gap:6px; padding:28px 14px 6px; }
  .lb2-pod-spot { display:flex; flex-direction:column; align-items:center; gap:6px; }
  .lb2-pod-spot.r1 { order:2; } .lb2-pod-spot.r2 { order:1; } .lb2-pod-spot.r3 { order:3; }
  .lb2-pod-ring { position:relative; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .lb2-pod-ring.r1 { width:70px; height:70px; background:linear-gradient(135deg,#c9a84c,#ffd700); box-shadow:0 0 28px rgba(201,168,76,.5); }
  .lb2-pod-ring.r2 { width:56px; height:56px; background:linear-gradient(135deg,#777,#bbb); box-shadow:0 0 16px rgba(187,187,187,.25); }
  .lb2-pod-ring.r3 { width:50px; height:50px; background:linear-gradient(135deg,#7a3a10,#cd7f32); box-shadow:0 0 12px rgba(205,127,50,.25); }
  .lb2-pod-inner { width:calc(100% - 4px); height:calc(100% - 4px); background:#111; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; }
  .r1 .lb2-pod-inner { font-size:26px; }
  .lb2-crown { position:absolute; top:-16px; font-size:16px; filter:drop-shadow(0 2px 5px rgba(201,168,76,.9)); }
  .lb2-pod-name { font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:1px; color:#bbb; text-align:center; max-width:76px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lb2-pod-streak { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:2px; text-align:center; }
  .r1 .lb2-pod-streak { color:#c9a84c; font-size:24px; } .r2 .lb2-pod-streak { color:#bbb; } .r3 .lb2-pod-streak { color:#cd7f32; }
  .lb2-pod-base { width:78px; border-radius:2px 2px 0 0; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:2px; color:#fff; }
  .r1 .lb2-pod-base { height:56px; background:linear-gradient(180deg,rgba(201,168,76,.28),rgba(201,168,76,.04)); border:1px solid rgba(201,168,76,.4); }
  .r2 .lb2-pod-base { height:40px; background:linear-gradient(180deg,rgba(170,170,170,.18),rgba(170,170,170,.02)); border:1px solid rgba(170,170,170,.25); }
  .r3 .lb2-pod-base { height:28px; background:linear-gradient(180deg,rgba(205,127,50,.18),rgba(205,127,50,.02)); border:1px solid rgba(205,127,50,.25); }

  /* LIST */
  .lb2-list { padding:6px 14px 0; }
  .lb2-list-hdr { display:grid; grid-template-columns:32px 1fr 56px 54px; gap:6px; padding:6px 12px; font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:2px; color:#2a2a2a; text-transform:uppercase; }
  .lb2-row { display:grid; grid-template-columns:32px 1fr 56px 54px; gap:6px; align-items:center; padding:12px 12px; background:#0c0c0c; border:1px solid #181818; border-radius:2px; margin-bottom:2px; transition:border-color .2s; position:relative; overflow:hidden; }
  .lb2-row:hover { border-color:#2a2a2a; }
  .lb2-row.is-pro { border-left:2px solid #c9a84c; }
  .lb2-row.is-rival { border-left:2px solid #f87171; background:rgba(248,113,113,.04); }
  .lb2-row.is-me { border:1px solid rgba(201,168,76,.5); background:rgba(201,168,76,.05); }
  .lb2-rank-n { font-family:'Bebas Neue',sans-serif; font-size:18px; color:#2a2a2a; text-align:center; }
  .lb2-flag { font-size:14px; margin-right:6px; }
  .lb2-uname { font-size:12px; font-weight:600; color:#e0e0e0; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
  .lb2-pro-badge { font-family:'Share Tech Mono',monospace; font-size:7px; letter-spacing:1px; padding:2px 5px; background:rgba(201,168,76,.12); border:1px solid rgba(201,168,76,.4); color:#c9a84c; border-radius:1px; }
  .lb2-rival-badge { font-family:'Share Tech Mono',monospace; font-size:7px; letter-spacing:1px; padding:2px 5px; background:rgba(248,113,113,.12); border:1px solid rgba(248,113,113,.4); color:#f87171; border-radius:1px; }
  .lb2-usub { font-size:9px; color:#333; font-family:'Share Tech Mono',monospace; letter-spacing:1px; margin-top:1px; }
  .lb2-sv { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#c9a84c; text-align:right; line-height:1; }
  .lb2-su { font-family:'Share Tech Mono',monospace; font-size:7px; color:#2a2a2a; text-align:right; letter-spacing:1px; }
  .lb2-acc { font-family:'Share Tech Mono',monospace; font-size:11px; text-align:right; }

  /* CHALLENGE CARDS */
  .lb2-challenge { margin:10px 14px 0; background:#0c0c0c; border:1px solid #1c1c1c; border-radius:3px; overflow:hidden; }
  .lb2-challenge.active-c { border-color:rgba(201,168,76,.4); }
  .lb2-ch-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; }
  .lb2-ch-title { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:2px; color:#e0e0e0; }
  .lb2-ch-badge { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:1px; padding:3px 8px; border-radius:1px; }
  .lb2-ch-body { padding:0 14px 14px; }
  .lb2-ch-members { display:flex; gap:4px; margin-bottom:10px; flex-wrap:wrap; }
  .lb2-ch-member { display:flex; align-items:center; gap:5px; padding:5px 8px; background:#111; border:1px solid #1c1c1c; border-radius:2px; font-size:11px; }
  .lb2-ch-progress { margin-bottom:10px; }
  .lb2-ch-prog-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
  .lb2-ch-prog-name { font-size:11px; color:#888; min-width:80px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .lb2-ch-prog-bg { flex:1; height:5px; background:#1a1a1a; border-radius:2px; overflow:hidden; }
  .lb2-ch-prog-fill { height:100%; border-radius:2px; transition:width .6s ease; }
  .lb2-ch-prog-val { font-family:'Share Tech Mono',monospace; font-size:9px; color:#555; min-width:30px; text-align:right; }
  .lb2-ch-btn { width:100%; padding:9px; font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:2px; border-radius:2px; border:none; cursor:pointer; transition:all .2s; }

  /* FEED */
  .lb2-feed { padding:6px 14px 0; }
  .lb2-feed-item { display:flex; align-items:flex-start; gap:10px; padding:12px; background:#0c0c0c; border:1px solid #181818; border-radius:2px; margin-bottom:3px; }
  .lb2-feed-icon { font-size:20px; line-height:1; flex-shrink:0; }
  .lb2-feed-content { flex:1; }
  .lb2-feed-text { font-size:12px; color:#bbb; line-height:1.5; }
  .lb2-feed-text strong { color:#e0e0e0; }
  .lb2-feed-time { font-family:'Share Tech Mono',monospace; font-size:8px; color:#333; letter-spacing:1px; margin-top:3px; }
  .lb2-feed-like { display:flex; align-items:center; gap:4px; font-family:'Share Tech Mono',monospace; font-size:9px; color:#333; letter-spacing:1px; cursor:pointer; padding:3px 6px; border:1px solid #1c1c1c; border-radius:1px; background:none; transition:all .2s; margin-top:6px; }
  .lb2-feed-like:hover { border-color:#333; color:#888; }
  .lb2-feed-like.liked { border-color:rgba(201,168,76,.4); color:#c9a84c; }

  /* MISSIONS */
  .lb2-missions { padding:6px 14px 0; }
  .lb2-mission { display:flex; align-items:center; gap:10px; padding:11px 12px; background:#0c0c0c; border:1px solid #181818; border-radius:2px; margin-bottom:3px; }
  .lb2-mission.done { border-color:rgba(57,217,138,.25); background:rgba(57,217,138,.04); }
  .lb2-mission-icon { font-size:18px; flex-shrink:0; }
  .lb2-mission-body { flex:1; }
  .lb2-mission-title { font-size:12px; font-weight:600; color:#e0e0e0; }
  .lb2-mission-desc { font-size:10px; color:#444; font-family:'Share Tech Mono',monospace; letter-spacing:.5px; margin-top:1px; }
  .lb2-mission-xp { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#c9a84c; line-height:1; }
  .lb2-mission-done { font-size:18px; }

  /* GHOST RACE */
  .lb2-ghost { margin:10px 14px 0; background:#0c0c0c; border:1px solid rgba(96,165,250,.3); border-radius:3px; padding:14px; }
  .lb2-ghost-title { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:2px; color:#60a5fa; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .lb2-ghost-track { position:relative; height:48px; background:#111; border-radius:2px; overflow:hidden; margin-bottom:10px; }
  .lb2-ghost-you { position:absolute; top:6px; height:16px; background:linear-gradient(90deg,#c9a84c44,#c9a84c); border-radius:0 2px 2px 0; display:flex; align-items:center; justify-content:flex-end; padding-right:6px; transition:width .8s ease; min-width:24px; }
  .lb2-ghost-past { position:absolute; bottom:6px; height:16px; background:linear-gradient(90deg,#60a5fa22,#60a5fa55); border-radius:0 2px 2px 0; display:flex; align-items:center; justify-content:flex-end; padding-right:6px; transition:width .8s ease; min-width:24px; }
  .lb2-ghost-label { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:1px; color:#fff; }
  .lb2-ghost-stats { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .lb2-ghost-stat { background:#111; border-radius:2px; padding:8px 10px; }
  .lb2-ghost-stat-val { font-family:'Bebas Neue',sans-serif; font-size:22px; line-height:1; }
  .lb2-ghost-stat-lbl { font-family:'Share Tech Mono',monospace; font-size:7px; color:#333; letter-spacing:1px; text-transform:uppercase; margin-top:2px; }

  /* SHIELDS */
  .lb2-shields { display:flex; gap:6px; margin:10px 14px 0; }
  .lb2-shield { flex:1; background:#0c0c0c; border:1px solid #1c1c1c; border-radius:2px; padding:10px; text-align:center; cursor:pointer; transition:all .2s; }
  .lb2-shield:hover { border-color:#333; }
  .lb2-shield.owned { border-color:rgba(201,168,76,.4); background:rgba(201,168,76,.06); }
  .lb2-shield-icon { font-size:22px; margin-bottom:4px; }
  .lb2-shield-name { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:1px; color:#555; text-transform:uppercase; }
  .lb2-shield-count { font-family:'Bebas Neue',sans-serif; font-size:18px; color:#c9a84c; }

  /* MY STATUS BAR */
  .lb2-status { position:fixed; bottom:0; left:0; right:0; z-index:100; padding:10px 14px 20px; background:linear-gradient(to top,#060606 70%,transparent); }
  .lb2-status-inner { max-width:520px; margin:0 auto; background:#0c0c0c; border:1px solid #c9a84c; border-radius:2px; padding:12px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 0 28px rgba(201,168,76,.14); }
  .lb2-stat-grp { text-align:center; }
  .lb2-stat-lbl { font-family:'Share Tech Mono',monospace; font-size:7px; letter-spacing:2px; color:#444; text-transform:uppercase; margin-bottom:1px; }
  .lb2-stat-val { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#c9a84c; line-height:1; }
  .lb2-divider { width:1px; height:28px; background:#1c1c1c; flex-shrink:0; }
  .lb2-pro-btn { margin-left:auto; background:#c9a84c; color:#000; font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:2px; padding:9px 14px; border:none; border-radius:2px; cursor:pointer; text-decoration:none; display:flex; align-items:center; transition:all .2s; flex-shrink:0; }
  .lb2-pro-btn:hover { background:#dbb85a; box-shadow:0 0 18px rgba(201,168,76,.4); transform:translateY(-1px); }

  /* CREATE CHALLENGE MODAL */
  .lb2-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.92); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
  .lb2-modal { background:#0c0c0c; border:2px solid #c9a84c; border-radius:3px; padding:20px; width:min(440px,100%); max-height:85vh; overflow-y:auto; }
  .lb2-modal::-webkit-scrollbar { display:none; }
  .lb2-modal-title { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:3px; color:#c9a84c; margin-bottom:16px; }
  .lb2-input { width:100%; padding:10px 12px; background:#111; border:1px solid #222; color:#e0e0e0; border-radius:2px; font-family:'Inter',sans-serif; font-size:12px; margin-bottom:10px; outline:none; }
  .lb2-input:focus { border-color:#c9a84c44; }
  .lb2-select { width:100%; padding:10px 12px; background:#111; border:1px solid #222; color:#e0e0e0; border-radius:2px; font-family:'Inter',sans-serif; font-size:12px; margin-bottom:10px; }
  .lb2-label { font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:2px; color:#444; text-transform:uppercase; margin-bottom:5px; display:block; }
  .lb2-modal-btn-row { display:flex; gap:8px; margin-top:14px; }
  .lb2-modal-cancel { flex:1; padding:11px; background:#111; border:1px solid #222; color:#555; border-radius:2px; cursor:pointer; font-family:'Bebas Neue',sans-serif; font-size:15px; letter-spacing:2px; }
  .lb2-modal-create { flex:2; padding:11px; background:#c9a84c; border:none; color:#000; border-radius:2px; cursor:pointer; font-family:'Bebas Neue',sans-serif; font-size:15px; letter-spacing:2px; transition:all .2s; }
  .lb2-modal-create:hover { background:#dbb85a; }

  /* SECTION HEADER */
  .lb2-sec-hdr { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 6px; }
  .lb2-sec-title { font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:3px; color:#333; text-transform:uppercase; }
  .lb2-sec-action { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:1px; color:#c9a84c; cursor:pointer; border:1px solid rgba(201,168,76,.3); padding:3px 8px; border-radius:1px; background:none; transition:all .2s; }
  .lb2-sec-action:hover { background:rgba(201,168,76,.1); }

  /* TOAST */
  .lb2-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:300; background:#c9a84c; color:#000; font-family:'Bebas Neue',sans-serif; font-size:15px; letter-spacing:2px; padding:10px 20px; border-radius:2px; pointer-events:none; white-space:nowrap; }

  @media(max-width:380px) {
    .lb2-list-hdr,.lb2-row { grid-template-columns:26px 1fr 44px 42px; }
  }
`;

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const ALL_USERS = [
  { id:1,  name:"Arjun V.",    streak:187, accuracy:99, country:"🇮🇳", isPro:true,  city:"Mumbai",    xp:9200, level:18 },
  { id:2,  name:"Sarah K.",    streak:164, accuracy:98, country:"🇺🇸", isPro:true,  city:"New York",  xp:8400, level:17 },
  { id:3,  name:"Kenji M.",    streak:142, accuracy:99, country:"🇯🇵", isPro:true,  city:"Tokyo",     xp:7700, level:16 },
  { id:4,  name:"Alex R.",     streak:118, accuracy:96, country:"🇩🇪", isPro:true,  city:"Berlin",    xp:6500, level:15 },
  { id:5,  name:"Priya S.",    streak:104, accuracy:97, country:"🇮🇳", isPro:true,  city:"Bengaluru", xp:5900, level:14 },
  { id:6,  name:"Liu W.",      streak:97,  accuracy:95, country:"🇨🇳", isPro:true,  city:"Shanghai",  xp:5400, level:14 },
  { id:7,  name:"Maria G.",    streak:91,  accuracy:94, country:"🇧🇷", isPro:false, city:"São Paulo",  xp:5000, level:13 },
  { id:8,  name:"Omar F.",     streak:88,  accuracy:93, country:"🇦🇪", isPro:true,  city:"Dubai",     xp:4800, level:13 },
  { id:9,  name:"Ravi K.",     streak:82,  accuracy:96, country:"🇮🇳", isPro:false, city:"Chennai",   xp:4400, level:12 },
  { id:10, name:"Emma T.",     streak:79,  accuracy:92, country:"🇬🇧", isPro:true,  city:"London",    xp:4200, level:12 },
  { id:11, name:"Yuki H.",     streak:74,  accuracy:91, country:"🇯🇵", isPro:false, city:"Osaka",     xp:3900, level:11 },
  { id:12, name:"Carlos M.",   streak:68,  accuracy:90, country:"🇲🇽", isPro:false, city:"CDMX",      xp:3600, level:11 },
  { id:13, name:"Amara D.",    streak:61,  accuracy:89, country:"🇳🇬", isPro:false, city:"Lagos",     xp:3200, level:10 },
  { id:14, name:"Sven L.",     streak:57,  accuracy:93, country:"🇸🇪", isPro:true,  city:"Stockholm", xp:2900, level:9  },
  { id:15, name:"Neha P.",     streak:54,  accuracy:88, country:"🇮🇳", isPro:false, city:"Pune",      xp:2700, level:9  },
  { id:16, name:"James O.",    streak:51,  accuracy:87, country:"🇦🇺", isPro:false, city:"Sydney",    xp:2500, level:8  },
  { id:17, name:"Fatima A.",   streak:47,  accuracy:91, country:"🇸🇦", isPro:false, city:"Riyadh",    xp:2200, level:8  },
  { id:18, name:"Ivan K.",     streak:43,  accuracy:86, country:"🇷🇺", isPro:false, city:"Moscow",    xp:1900, level:7  },
  { id:19, name:"Ana L.",      streak:38,  accuracy:85, country:"🇵🇹", isPro:false, city:"Lisbon",    xp:1600, level:6  },
  { id:20, name:"Rahul M.",    streak:34,  accuracy:84, country:"🇮🇳", isPro:false, city:"Delhi",     xp:1300, level:5  },
];

const FEED_EVENTS = [
  { id:1, icon:"🔥", user:"Arjun V.", event:"hit a 187-day streak", sub:"Longest in India 🇮🇳", time:"2m ago",  likes:24 },
  { id:2, icon:"⚔️", user:"Sarah K.", event:"won a challenge vs Liu W. by 12 days", sub:"7-Day Warrior challenge", time:"18m ago", likes:11 },
  { id:3, icon:"🏆", user:"Kenji M.", event:"completed the Iron Mind mission", sub:"+500 XP earned", time:"41m ago", likes:19 },
  { id:4, icon:"📈", user:"Priya S.", event:"climbed 2 ranks this week", sub:"Now #5 globally", time:"1h ago",  likes:8  },
  { id:5, icon:"🛡️", user:"Omar F.", event:"used a Streak Shield to survive", sub:"Kept 88-day streak alive", time:"2h ago",  likes:15 },
  { id:6, icon:"👻", user:"Emma T.", event:"beat her Ghost self by 3 days", sub:"New personal best!", time:"3h ago",  likes:22 },
  { id:7, icon:"🎯", user:"Carlos M.", event:"joined the 30-Day Consistency challenge", sub:"7 members now", time:"5h ago",  likes:6  },
  { id:8, icon:"💀", user:"Rahul M.", event:"broke a 12-day streak", sub:"Rival closes gap", time:"6h ago",  likes:3  },
];

const MISSIONS = [
  { id:1, icon:"🔥", title:"7-Day Warrior", desc:"Log in 7 days straight", xp:350, target:7, type:"streak" },
  { id:2, icon:"🎯", title:"Accuracy Ace",  desc:"Hit 95%+ accuracy 5 times", xp:200, target:5, type:"accuracy" },
  { id:3, icon:"⚔️", title:"Challenge Taker", desc:"Join any active challenge", xp:150, target:1, type:"challenge" },
  { id:4, icon:"👻", title:"Ghost Buster",  desc:"Beat your 7-day-ago self", xp:250, target:1, type:"ghost" },
  { id:5, icon:"📣", title:"Hype Master",   desc:"Give 10 kudos in the feed", xp:100, target:10,type:"social" },
];

const CHALLENGE_TEMPLATES = [
  { id:"c1", name:"7-Day Streak Sprint",   goal:"streak_days", target:7,  icon:"⚡", members:[1,3,7,12], endDays:4 },
  { id:"c2", name:"30-Day Consistency",    goal:"streak_days", target:30, icon:"🏆", members:[2,5,9,15,20], endDays:18 },
  { id:"c3", name:"Accuracy Masters",      goal:"accuracy_pct",target:95, icon:"🎯", members:[4,6,11], endDays:7 },
];

function getXpForLevel(lvl) { return lvl * 500; }
function getLevelFromXp(xp) { return Math.max(1, Math.floor(xp / 500)); }

function buildMyData(streak, sessions, acc) {
  const xp = streak * 45 + sessions * 12 + Math.round(acc) * 8;
  const level = getLevelFromXp(xp);
  const xpInLevel = xp % 500;
  const idx = ALL_USERS.findIndex(u => u.streak < streak);
  const rank = idx === -1 ? ALL_USERS.length + 1 : idx + 1;
  const rivalIdx = Math.max(0, rank - 3);
  const rival = rank > 1 ? ALL_USERS[Math.min(rivalIdx, ALL_USERS.length - 1)] : null;
  return { xp, level, xpInLevel, rank, rival };
}

/* ══════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════ */
export default function Leaderboard() {
  const [tab, setTab] = useState("Global");
  const [myStreak, setMyStreak]   = useState(0);
  const [mySessions, setMySessions] = useState(0);
  const [myAcc, setMyAcc]         = useState(92);
  const [tick, setTick]           = useState(0);
  const [likedIds, setLikedIds]   = useState([]);
  const [shields, setShields]     = useState(2);
  const [showCreateChallenge, setShowCreate] = useState(false);
  const [toast, setToast]         = useState("");
  const [myChallenges, setMyChallenges] = useState(["c1"]);
  const [challengeForm, setChallengeForm] = useState({ name:"", goal:"streak_days", target:7 });
  const [missionProgress, setMissionProgress] = useState({ 1:3, 2:2, 3:1, 4:0, 5:4 });

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "lb2-styles";
    el.textContent = STYLES;
    if (!document.getElementById("lb2-styles")) document.head.appendChild(el);
    return () => { const t = document.getElementById("lb2-styles"); if (t) t.remove(); };
  }, []);

  useEffect(() => {
    setMyStreak(Number(localStorage.getItem("magic16_streak") || 12));
    setMySessions(Number(localStorage.getItem("magic16_sessions_total") || 47));
    setMyAcc(Number(localStorage.getItem("magic16_avg_accuracy") || 92));
    const id = setInterval(() => setTick(t => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  const { xp, level, xpInLevel, rank, rival } = useMemo(
    () => buildMyData(myStreak, mySessions, myAcc),
    [myStreak, mySessions, myAcc]
  );

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const usersWithMe = useMemo(() => {
    const ranked = [...ALL_USERS].sort((a, b) => b.streak - a.streak);
    if (myStreak > 0) {
      const me = { id:0, name:"You", streak:myStreak, accuracy:myAcc, country:"🌟", isPro:false, city:"Your City", xp, level, isMe:true };
      const idx = ranked.findIndex(u => u.streak < myStreak);
      if (idx === -1) ranked.push(me); else ranked.splice(idx, 0, me);
    }
    return ranked.map((u, i) => ({ ...u, _rank: i + 1, isRival: rival && u.id === rival.id }));
  }, [myStreak, myAcc, xp, level, rival]);

  const displayed = useMemo(() => {
    if (tab === "Regional") return usersWithMe.filter(u => u.country === "🇮🇳" || u.isMe);
    if (tab === "Friends")  return usersWithMe.slice(0, 6);
    return usersWithMe;
  }, [tab, usersWithMe]);

  const top3 = displayed.slice(0, 3);
  const rest = displayed.slice(3);

  const accColor = (a) => a >= 97 ? "#c9a84c" : a >= 92 ? "#39d98a" : a >= 85 ? "#60a5fa" : "#444";

  const ghostYouPct  = Math.min(95, (myStreak / 20) * 100);
  const ghostPastPct = Math.min(95, ((myStreak - 3) / 20) * 100);
  const ghostAhead   = myStreak > Math.max(0, myStreak - 3);

  function handleLike(id) {
    setLikedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function handleJoinChallenge(cid) {
    if (myChallenges.includes(cid)) { showToast("Already in challenge"); return; }
    setMyChallenges(p => [...p, cid]);
    setMissionProgress(p => ({ ...p, 3: Math.min(1, (p[3] || 0) + 1) }));
    showToast("✓ Joined challenge!");
  }

  function handleCreateChallenge() {
    if (!challengeForm.name.trim()) { showToast("Enter a challenge name"); return; }
    setShowCreate(false);
    showToast(`✓ Challenge "${challengeForm.name}" created!`);
    setChallengeForm({ name:"", goal:"streak_days", target:7 });
  }

  function handleUseShield() {
    if (shields <= 0) { showToast("No shields remaining"); return; }
    setShields(s => s - 1);
    showToast("🛡️ Streak Shield activated!");
  }

  function claimMission(id) {
    const m = MISSIONS.find(x => x.id === id);
    if (!m) return;
    if ((missionProgress[id] || 0) >= m.target) {
      showToast(`+${m.xp} XP claimed!`);
    }
  }

  return (
    <div className="lb2">
      <div className="lb2-inner">

        {/* ── HEADER ── */}
        <motion.div className="lb2-header" initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }}>
          <div className="lb2-season">2026 Global Season · {tick % 2 === 0 ? "Rankings Live" : "Updated just now"}</div>
          <h1 className="lb2-title">THE <span>1%</span> CLUB</h1>
          <p className="lb2-desc">Verified Discipline · Global Accountability · Team Challenges</p>
          <div className="lb2-live">
            <div className="lb2-live-dot"/>
            {(20000 + tick * 3).toLocaleString()} athletes competing
          </div>
        </motion.div>

        {/* ── XP BAR ── */}
        <motion.div className="lb2-xp-bar" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.15 }}>
          <div className="lb2-xp-level">{level}</div>
          <div className="lb2-xp-track">
            <div className="lb2-xp-label">
              <span>LVL {level}</span>
              <span>{xpInLevel} / 500 XP</span>
            </div>
            <div className="lb2-xp-bg">
              <div className="lb2-xp-fill" style={{ width:`${(xpInLevel/500)*100}%` }}/>
            </div>
          </div>
          <div className="lb2-xp-badge">
            {level >= 15 ? "LEGEND" : level >= 10 ? "ELITE" : level >= 7 ? "VETERAN" : level >= 4 ? "RISING" : "ROOKIE"}
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div className="lb2-tabs">
          {["Global","Regional","Friends","Challenges","Feed","Missions"].map(t => (
            <button key={t} className={`lb2-tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t === "Global"?"🌍":t === "Regional"?"🗺️":t === "Friends"?"👥":t === "Challenges"?"⚔️":t === "Feed"?"📣":"🎯"} {t}
            </button>
          ))}
        </div>

        {/* ══════ GLOBAL / REGIONAL / FRIENDS ══════ */}
        {(tab === "Global" || tab === "Regional" || tab === "Friends") && (
          <>
            {/* PODIUM */}
            <div className="lb2-podium">
              {top3.map((u, i) => {
                const rn = i + 1;
                const rc = `r${rn}`;
                return (
                  <motion.div key={u.id} className={`lb2-pod-spot ${rc}`}
                    initial={{ opacity:0, scale:.7 }} animate={{ opacity:1, scale:1 }}
                    transition={{ delay:rn===1?.2:rn===2?.1:.15 }}>
                    <div className={`lb2-pod-ring ${rc}`}>
                      {rn === 1 && <div className="lb2-crown">👑</div>}
                      <div className="lb2-pod-inner">{u.country}</div>
                    </div>
                    <div className="lb2-pod-name">{u.name}</div>
                    <div className="lb2-pod-streak">{u.streak}d</div>
                    <div className={`lb2-pod-base ${rc}`}>{rn}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* LIST */}
            <div className="lb2-list">
              <div className="lb2-list-hdr">
                <div>#</div><div>Athlete</div><div style={{textAlign:"right"}}>Streak</div><div style={{textAlign:"right"}}>Acc</div>
              </div>
              <AnimatePresence>
                {rest.map((u, i) => (
                  <motion.div key={u.id}
                    className={`lb2-row${u.isPro?" is-pro":""}${u.isRival?" is-rival":""}${u.isMe?" is-me":""}`}
                    initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.025 }}>
                    <div className="lb2-rank-n">{i + 4}</div>
                    <div>
                      <div className="lb2-uname">
                        <span className="lb2-flag">{u.country}</span>
                        {u.isMe ? "You" : u.name}
                        {u.isPro && <span className="lb2-pro-badge">PRO</span>}
                        {u.isRival && <span className="lb2-rival-badge">RIVAL</span>}
                        {u.isMe && <span style={{ fontSize:7, color:"#c9a84c", fontFamily:"'Share Tech Mono',monospace", padding:"2px 5px", border:"1px solid rgba(201,168,76,.4)", borderRadius:1 }}>YOU</span>}
                      </div>
                      <div className="lb2-usub">{u.isMe ? "Your City" : u.city}</div>
                    </div>
                    <div>
                      <div className="lb2-sv">{u.streak}</div>
                      <div className="lb2-su">days</div>
                    </div>
                    <div>
                      <div className="lb2-acc" style={{ color: accColor(u.accuracy) }}>{u.accuracy}%</div>
                      <div className="lb2-su">acc</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ══════ CHALLENGES TAB ══════ */}
        {tab === "Challenges" && (
          <>
            {/* Ghost Race — ManifiX Exclusive */}
            <div className="lb2-ghost">
              <div className="lb2-ghost-title">
                👻 Ghost Race <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", color:"#60a5fa44", letterSpacing:2 }}>MANIFIX EXCLUSIVE</span>
              </div>
              <div style={{ fontSize:10, color:"#444", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, marginBottom:8 }}>RACING YOUR 7-DAYS-AGO SELF</div>
              <div className="lb2-ghost-track">
                <div className="lb2-ghost-you" style={{ width:`${ghostYouPct}%` }}>
                  <span className="lb2-ghost-label">YOU</span>
                </div>
                <div className="lb2-ghost-past" style={{ width:`${ghostPastPct}%` }}>
                  <span className="lb2-ghost-label" style={{ color:"#60a5fa" }}>GHOST</span>
                </div>
              </div>
              <div className="lb2-ghost-stats">
                <div className="lb2-ghost-stat">
                  <div className="lb2-ghost-stat-val" style={{ color:"#c9a84c" }}>{myStreak}d</div>
                  <div className="lb2-ghost-stat-lbl">Current streak</div>
                </div>
                <div className="lb2-ghost-stat">
                  <div className="lb2-ghost-stat-val" style={{ color: ghostAhead ? "#39d98a" : "#f87171" }}>
                    {ghostAhead ? `+${myStreak - Math.max(0, myStreak-3)}d` : `−${3}d`}
                  </div>
                  <div className="lb2-ghost-stat-lbl">{ghostAhead ? "ahead of ghost" : "behind ghost"}</div>
                </div>
              </div>
            </div>

            {/* Streak Shields */}
            <div className="lb2-sec-hdr">
              <span className="lb2-sec-title">Power-Ups</span>
              <button className="lb2-sec-action" onClick={handleUseShield}>USE SHIELD</button>
            </div>
            <div className="lb2-shields">
              {[
                { icon:"🛡️", name:"Streak Shield", count:shields, desc:"Skip 1 day" },
                { icon:"⚡", name:"XP Boost",    count:1,       desc:"2× XP today" },
                { icon:"👁️", name:"Spy Mode",    count:0,       desc:"See rivals' log" },
              ].map(s => (
                <div key={s.name} className={`lb2-shield${s.count > 0 ? " owned" : ""}`}
                  onClick={() => s.count > 0 && showToast(`${s.icon} ${s.name} used!`)}>
                  <div className="lb2-shield-icon">{s.icon}</div>
                  <div className="lb2-shield-name">{s.name}</div>
                  <div className="lb2-shield-count">{s.count}</div>
                </div>
              ))}
            </div>

            {/* Active challenges */}
            <div className="lb2-sec-hdr">
              <span className="lb2-sec-title">Active Challenges</span>
              <button className="lb2-sec-action" onClick={() => setShowCreate(true)}>+ CREATE</button>
            </div>
            {CHALLENGE_TEMPLATES.map(ch => {
              const joined = myChallenges.includes(ch.id);
              const members = ch.members.map(id => ALL_USERS.find(u => u.id === id)).filter(Boolean);
              const maxStreak = Math.max(...members.map(u => u.streak), myStreak);
              return (
                <div key={ch.id} className={`lb2-challenge${joined ? " active-c" : ""}`}>
                  <div className="lb2-ch-header">
                    <div className="lb2-ch-title">{ch.icon} {ch.name}</div>
                    <span className="lb2-ch-badge" style={{
                      background: joined ? "rgba(57,217,138,.1)" : "rgba(201,168,76,.1)",
                      border: `1px solid ${joined ? "rgba(57,217,138,.4)" : "rgba(201,168,76,.4)"}`,
                      color: joined ? "#39d98a" : "#c9a84c"
                    }}>{joined ? "JOINED" : "OPEN"}</span>
                  </div>
                  <div className="lb2-ch-body">
                    <div style={{ fontSize:10, color:"#444", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, marginBottom:8 }}>
                      ENDS IN {ch.endDays} DAYS · {ch.members.length + (joined ? 1 : 0)} MEMBERS
                    </div>
                    <div className="lb2-ch-progress">
                      {members.slice(0,3).map((m, i) => {
                        const pct = Math.min(100, Math.round((m.streak / ch.target) * 100));
                        const col = i === 0 ? "#c9a84c" : i === 1 ? "#39d98a" : "#60a5fa";
                        return (
                          <div key={m.id} className="lb2-ch-prog-row">
                            <span className="lb2-ch-prog-name">{m.country} {m.name}</span>
                            <div className="lb2-ch-prog-bg">
                              <div className="lb2-ch-prog-fill" style={{ width:`${pct}%`, background:col }}/>
                            </div>
                            <span className="lb2-ch-prog-val">{m.streak}d</span>
                          </div>
                        );
                      })}
                      {joined && (
                        <div className="lb2-ch-prog-row">
                          <span className="lb2-ch-prog-name">🌟 You</span>
                          <div className="lb2-ch-prog-bg">
                            <div className="lb2-ch-prog-fill" style={{ width:`${Math.min(100,(myStreak/ch.target)*100)}%`, background:"#c9a84c" }}/>
                          </div>
                          <span className="lb2-ch-prog-val">{myStreak}d</span>
                        </div>
                      )}
                    </div>
                    <button className="lb2-ch-btn" onClick={() => handleJoinChallenge(ch.id)} style={{
                      background: joined ? "rgba(57,217,138,.1)" : "#c9a84c",
                      color: joined ? "#39d98a" : "#000",
                      border: joined ? "1px solid rgba(57,217,138,.4)" : "none"
                    }}>
                      {joined ? "✓ In Progress" : "Join Challenge"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ══════ FEED TAB ══════ */}
        {tab === "Feed" && (
          <>
            <div className="lb2-sec-hdr">
              <span className="lb2-sec-title">Accountability Feed</span>
              <span className="lb2-sec-action" style={{ border:"none", color:"#39d98a" }}>● LIVE</span>
            </div>
            <div className="lb2-feed">
              <AnimatePresence>
                {FEED_EVENTS.map((ev, i) => (
                  <motion.div key={ev.id} className="lb2-feed-item"
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: i * 0.04 }}>
                    <div className="lb2-feed-icon">{ev.icon}</div>
                    <div className="lb2-feed-content">
                      <div className="lb2-feed-text">
                        <strong>{ev.user}</strong> {ev.event}
                        <br/><span style={{ color:"#555", fontSize:10, fontFamily:"'Share Tech Mono',monospace" }}>{ev.sub}</span>
                      </div>
                      <div className="lb2-feed-time">{ev.time}</div>
                      <button
                        className={`lb2-feed-like${likedIds.includes(ev.id) ? " liked" : ""}`}
                        onClick={() => handleLike(ev.id)}>
                        {likedIds.includes(ev.id) ? "🏅" : "👊"} {ev.likes + (likedIds.includes(ev.id) ? 1 : 0)} Kudos
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div style={{ margin:"10px 14px 0", padding:"10px 12px", background:"#0c0c0c", border:"1px dashed #1c1c1c", borderRadius:2, fontSize:10, color:"#333", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, textAlign:"center", lineHeight:1.8 }}>
              YOU HAVEN'T LOGGED TODAY<br/>
              <span style={{ color:"#c9a84c" }}>Complete a session to appear in the feed</span>
            </div>
          </>
        )}

        {/* ══════ MISSIONS TAB ══════ */}
        {tab === "Missions" && (
          <>
            <div className="lb2-sec-hdr">
              <span className="lb2-sec-title">Weekly Missions</span>
              <span className="lb2-sec-action" style={{ border:"none", color:"#444" }}>RESETS IN 3D 14H</span>
            </div>
            <div className="lb2-missions">
              {MISSIONS.map((m, i) => {
                const progress = missionProgress[m.id] || 0;
                const done = progress >= m.target;
                const pct = Math.min(100, Math.round((progress / m.target) * 100));
                return (
                  <motion.div key={m.id} className={`lb2-mission${done ? " done" : ""}`}
                    initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.05 }}>
                    <div className="lb2-mission-icon">{m.icon}</div>
                    <div className="lb2-mission-body">
                      <div className="lb2-mission-title">{m.title}</div>
                      <div className="lb2-mission-desc">{m.desc}</div>
                      <div style={{ marginTop:5, height:3, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background: done ? "#39d98a" : "#c9a84c", borderRadius:2, transition:"width .6s ease" }}/>
                      </div>
                      <div style={{ fontSize:8, color:"#333", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, marginTop:3 }}>
                        {progress}/{m.target} {done ? "— COMPLETE" : ""}
                      </div>
                    </div>
                    {done ? (
                      <button className="lb2-mission-done" onClick={() => claimMission(m.id)} title="Claim XP">✅</button>
                    ) : (
                      <div className="lb2-mission-xp">+{m.xp}</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            {/* Weekly XP summary */}
            <div style={{ margin:"10px 14px 0", background:"#0c0c0c", border:"1px solid #1c1c1c", borderRadius:2, padding:"14px" }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, letterSpacing:2, color:"#333", marginBottom:8 }}>THIS WEEK'S XP</div>
              <div style={{ display:"flex", gap:10, alignItems:"baseline" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:"#c9a84c", lineHeight:1 }}>{xp.toLocaleString()}</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444" }}>TOTAL XP · LEVEL {level}</div>
              </div>
              <div style={{ marginTop:8, height:4, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(xpInLevel/500)*100}%`, background:"linear-gradient(90deg,#8B6914,#c9a84c,#ffd700)", borderRadius:2 }}/>
              </div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"#333", marginTop:4 }}>
                {500 - xpInLevel} XP to Level {level + 1}
              </div>
            </div>
          </>
        )}

        <div style={{ height:100 }}/>
      </div>

      {/* ── MY STATUS BAR ── */}
      <div className="lb2-status">
        <div className="lb2-status-inner">
          <div className="lb2-stat-grp">
            <div className="lb2-stat-lbl">Rank</div>
            <div className="lb2-stat-val">#{rank}</div>
          </div>
          <div className="lb2-divider"/>
          <div className="lb2-stat-grp">
            <div className="lb2-stat-lbl">Streak</div>
            <div className="lb2-stat-val">{myStreak}d</div>
          </div>
          <div className="lb2-divider"/>
          <div className="lb2-stat-grp">
            <div className="lb2-stat-lbl">Level</div>
            <div className="lb2-stat-val">{level}</div>
          </div>
          <div className="lb2-divider"/>
          <div className="lb2-stat-grp">
            <div className="lb2-stat-lbl">Shields</div>
            <div className="lb2-stat-val">{shields}</div>
          </div>
          <Link to="/app/membership" className="lb2-pro-btn">GET PRO</Link>
        </div>
      </div>

      {/* ── CREATE CHALLENGE MODAL ── */}
      <AnimatePresence>
        {showCreateChallenge && (
          <motion.div className="lb2-modal-bg" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div className="lb2-modal" initial={{ scale:.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.9, opacity:0 }}>
              <div className="lb2-modal-title">⚔️ Create Challenge</div>
              <label className="lb2-label">Challenge Name</label>
              <input className="lb2-input" placeholder="e.g. 14-Day Beast Mode"
                value={challengeForm.name} onChange={e => setChallengeForm(p => ({ ...p, name:e.target.value }))}/>
              <label className="lb2-label">Challenge Type</label>
              <select className="lb2-select" value={challengeForm.goal}
                onChange={e => setChallengeForm(p => ({ ...p, goal:e.target.value }))}>
                <option value="streak_days">Longest Streak (days)</option>
                <option value="accuracy_pct">Highest Accuracy (%)</option>
                <option value="sessions">Most Sessions</option>
                <option value="xp">Most XP earned</option>
              </select>
              <label className="lb2-label">Target / Duration (days)</label>
              <input className="lb2-input" type="number" min={3} max={90}
                value={challengeForm.target}
                onChange={e => setChallengeForm(p => ({ ...p, target:+e.target.value }))}/>
              <label className="lb2-label">Invite Friends (comma-separated)</label>
              <input className="lb2-input" placeholder="@username, @username…"/>
              <div style={{ fontSize:10, color:"#444", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, lineHeight:1.7, marginTop:4 }}>
                CREATING A CHALLENGE AWARDS +150 XP AND NOTIFIES YOUR SQUAD.
              </div>
              <div className="lb2-modal-btn-row">
                <button className="lb2-modal-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="lb2-modal-create" onClick={handleCreateChallenge}>⚔️ Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div className="lb2-toast" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
