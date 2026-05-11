import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Gpt.css";

const API_BASE = "https://manifix.up.railway.app";

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — LANGUAGE MAP
   Maps localStorage lang code → BCP-47 voice tag
   and display name for API + TTS
───────────────────────────────────────────── */
const LANG_MAP = {
  en: { bcp47: "en-IN", voice: "en-IN", label: "English"   },
  hi: { bcp47: "hi-IN", voice: "hi-IN", label: "हिन्दी"    },
  te: { bcp47: "te-IN", voice: "te-IN", label: "తెలుగు"    },
  ta: { bcp47: "ta-IN", voice: "ta-IN", label: "தமிழ்"     },
  es: { bcp47: "es-ES", voice: "es-ES", label: "Español"   },
  ar: { bcp47: "ar-SA", voice: "ar-SA", label: "العربية"   },
  fr: { bcp47: "fr-FR", voice: "fr-FR", label: "Français"  },
  pt: { bcp47: "pt-BR", voice: "pt-BR", label: "Português" },
  de: { bcp47: "de-DE", voice: "de-DE", label: "Deutsch"   },
  zh: { bcp47: "zh-CN", voice: "zh-CN", label: "中文"       },
};

/* ─────────────────────────────────────────────
   ✅ ADDITION 2 — STORAGE KEYS (mirrors Dashboard)
───────────────────────────────────────────── */
const STORAGE_KEYS = {
  streak:    "magic16_streak",
  xp:        "magic16_xp",
  level:     "magic16_level",
  totalSess: "magic16_total_sessions",
  rankSeed:  "magic16_rank_seed",
  lang:      "magic16_lang",
};

function readUserStats() {
  const streak    = Number(localStorage.getItem(STORAGE_KEYS.streak)    || 0);
  const xp        = Number(localStorage.getItem(STORAGE_KEYS.xp)        || 0);
  const level     = Number(localStorage.getItem(STORAGE_KEYS.level)     || 1);
  const totalSess = Number(localStorage.getItem(STORAGE_KEYS.totalSess) || 0);
  const rankSeed  = Number(localStorage.getItem(STORAGE_KEYS.rankSeed)  || 9999);
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);
  return { streak, xp, level, totalSess, globalRank };
}

function readLang() {
  const code = localStorage.getItem(STORAGE_KEYS.lang) || "en";
  return LANG_MAP[code] || LANG_MAP["en"];
}

/* ─────────────────────────────────────────────
   BUILD REPORT PROMPT
───────────────────────────────────────────── */
function buildReportPrompt(stats, lang) {
  const { streak, xp, level, totalSess, globalRank } = stats;
  const accuracy = Math.min(99, 70 + streak * 2);
  const weekSess = Math.min(7, streak);

  return `You are ManifiX AI Strategist. Generate a powerful, motivating weekly wellness report for this user.

User stats:
- Current streak: ${streak} days
- XP this week: ${weekSess * 120} (total XP: ${xp})
- Level: ${level}
- Sessions completed: ${totalSess}
- Accuracy score: ${accuracy}%
- Global rank: #${globalRank.toLocaleString()}
- Sessions this week: ${weekSess} / 7

Write the report in ${lang.label} language.

Format the report with these sections:
1. 🏆 Weekly Summary (2 sentences, powerful tone)
2. 📊 Your Numbers (bullet list of key stats)
3. 🧠 AI Insight (1 personalized observation based on their streak and accuracy)
4. 🎯 Next Week Goal (one specific, measurable target)
5. 💎 Closing line (short, punchy, motivational)

Keep it sharp. No fluff. This person is serious about discipline.`;
}

/* ─────────────────────────────────────────────
   DEFAULT WELCOME
───────────────────────────────────────────── */
const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Neural link established. **ManifiX Strategist** online. What is our objective today?",
};

/* ─────────────────────────────────────────────
   QUICK PROMPTS (Addition 2 — report button lives here)
───────────────────────────────────────────── */
const QUICK_PROMPTS = [
  { id: "report",   label: "📊 My Weekly Report", isReport: true  },
  { id: "sleep",    label: "😴 Help me sleep",     isReport: false },
  { id: "stress",   label: "🧘 I'm overwhelmed",   isReport: false },
  { id: "progress", label: "📈 How am I doing?",   isReport: false },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Gpt() {
  const [messages,  setMessages]  = useState(() => {
    try {
      const saved = localStorage.getItem("chatMessages");
      return saved ? JSON.parse(saved) : [defaultWelcome];
    } catch { return [defaultWelcome]; }
  });

  const [input,     setInput]     = useState("");
  const [generating,setGenerating]= useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn,   setVoiceOn]   = useState(true);

  // ✅ Addition 1 — read lang on mount and watch for changes
  const [lang, setLang] = useState(() => readLang());

  const chatRef        = useRef(null);
  const eventSourceRef = useRef(null);

  // Re-read lang when window gains focus (user may have changed it on Dashboard)
  useEffect(() => {
    const onFocus = () => setLang(readLang());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  /* ── SPEECH ENGINE ── */
  const speak = (text) => {
    if (!window.speechSynthesis || !voiceOn) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = 0.95;
    utter.pitch = 1;
    // ✅ Addition 1 — set voice language from localStorage lang
    utter.lang  = lang.voice;

    // Try to pick a matching voice for that language
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(lang.bcp47.split("-")[0]));
    if (match) utter.voice = match;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  /* ── STREAM MESSAGE ── */
  const sendMessage = (text) => {
    if (!text.trim() || generating) return;

    const userMsg = { id: Date.now(), role: "user", content: text };
    const msgId   = Date.now() + "-bot";

    setMessages(prev => [...prev, userMsg, { id: msgId, role: "assistant", content: "", streaming: true }]);
    setInput("");
    setGenerating(true);

    // ✅ Addition 1 — append &lang=te-IN (or whichever) to every API request
    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang.bcp47)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    let fullText = "";
    eventSource.onmessage = (event) => {
      const chunk = event.data;
      if (chunk === "[DONE]") {
        eventSource.close();
        setGenerating(false);
        if (fullText.length < 500) speak(fullText);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false } : m));
        return;
      }
      fullText += chunk;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: fullText } : m));
    };

    eventSource.onerror = () => {
      eventSource.close();
      setGenerating(false);
      setMessages(prev => prev.map(m =>
        m.id === msgId
          ? { ...m, content: "⚠️ System interference. Retry signal.", streaming: false }
          : m
      ));
    };
  };

  /* ── ✅ ADDITION 2 — REPORT MODE ── */
  const sendReport = () => {
    if (generating) return;
    const stats  = readUserStats();
    const prompt = buildReportPrompt(stats, lang);

    // Show a friendly user-facing message instead of the raw prompt
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: `📊 Generate my weekly report`,
    };
    const msgId = Date.now() + "-bot";

    setMessages(prev => [...prev, userMsg, { id: msgId, role: "assistant", content: "", streaming: true }]);
    setGenerating(true);

    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(prompt)}&lang=${encodeURIComponent(lang.bcp47)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    let fullText = "";
    eventSource.onmessage = (event) => {
      const chunk = event.data;
      if (chunk === "[DONE]") {
        eventSource.close();
        setGenerating(false);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false } : m));
        return;
      }
      fullText += chunk;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: fullText } : m));
    };

    eventSource.onerror = () => {
      eventSource.close();
      setGenerating(false);
      setMessages(prev => prev.map(m =>
        m.id === msgId
          ? { ...m, content: "⚠️ System interference. Retry signal.", streaming: false }
          : m
      ));
    };
  };

  /* ── QUICK PROMPT HANDLER ── */
  const handleQuickPrompt = (qp) => {
    if (qp.isReport) {
      sendReport();
    } else {
      const prompts = {
        sleep:    "Help me sleep better tonight. Give me a CBT-I protocol.",
        stress:   "I am overwhelmed right now. Give me a 5 minute protocol to reset.",
        progress: "How am I doing this week? Give me personalised feedback on my progress.",
      };
      sendMessage(prompts[qp.id] || qp.label);
    }
  };

  /* ── RENDER ── */
  return (
    <div className="gpt-elite-frame">

      {/* HEADER */}
      <header className="gpt-header">
        <div className="ai-badge">
          <div className="pulse-dot" />
          <span>STRATEGIST V.1 (ELITE)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* ✅ Addition 1 — live lang indicator */}
          <span style={{
            fontSize: 10,
            letterSpacing: ".12em",
            opacity: 0.4,
            fontFamily: "inherit",
            textTransform: "uppercase",
          }}>
            {lang.label}
          </span>
          <button className="clear-link" onClick={() => setMessages([defaultWelcome])}>
            Wipe Memory
          </button>
        </div>
      </header>

      {/* ✅ ADDITION 2 — QUICK PROMPTS ROW (includes report button) */}
      <div style={{
        display: "flex",
        gap: 6,
        padding: "8px 14px",
        overflowX: "auto",
        scrollbarWidth: "none",
        borderBottom: "1px solid #1a1a1a",
        flexShrink: 0,
      }}>
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.id}
            onClick={() => handleQuickPrompt(qp)}
            disabled={generating}
            style={{
              flexShrink: 0,
              background:     qp.isReport ? "#0c0c08" : "transparent",
              border:         qp.isReport ? "1px solid #2a2010" : "1px solid #1a1a1a",
              color:          qp.isReport ? "#c8a84b" : "#333",
              fontFamily:     "inherit",
              fontSize:       10,
              letterSpacing:  ".12em",
              textTransform:  "uppercase",
              padding:        "6px 12px",
              cursor:         generating ? "not-allowed" : "pointer",
              opacity:        generating ? 0.4 : 1,
              whiteSpace:     "nowrap",
              transition:     "border-color .2s, color .2s",
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* CHAT FLOW */}
      <main className="chat-flow" ref={chatRef}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message-wrapper ${msg.role}`}
            >
              <div className="message-bubble">
                {msg.streaming && !msg.content && (
                  <div className="ai-typing">Decoding Signal...</div>
                )}
                <ReactMarkdown>{msg.content}</ReactMarkdown>

                {msg.role === "assistant" && !msg.streaming && (
                  <div className="message-actions">
                    <button onClick={() => speak(msg.content)} title="Read aloud">🔊</button>
                    <button onClick={() => navigator.clipboard.writeText(msg.content)} title="Copy">📋</button>
                    {/* ✅ Addition 2 — share button on report messages */}
                    {msg.content.includes("Weekly Summary") && (
                      <button
                        title="Share report"
                        onClick={() => {
                          const text = msg.content.replace(/[*#_`]/g, "").substring(0, 600);
                          if (navigator.share) {
                            navigator.share({ title: "My ManifiX Weekly Report", text });
                          } else {
                            navigator.clipboard.writeText(text);
                          }
                        }}
                      >↗</button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* INPUT AREA */}
      <div className="glass-input-container">
        <div className="input-wrap">
          <textarea
            value={input}
            placeholder={`Input objective... (${lang.label})`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))
            }
          />
          <div className="controls">
            <button
              className={voiceOn ? "voice-on" : ""}
              onClick={() => setVoiceOn(!voiceOn)}
              title={voiceOn ? "Voice on" : "Voice off"}
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>
            <button
              className="send-btn"
              onClick={() => sendMessage(input)}
              disabled={generating || !input.trim()}
            >
              {generating ? "■" : "▲"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
