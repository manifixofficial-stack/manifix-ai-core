// src/pages/Gpt.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Confetti from "react-confetti";
import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import Header from "../components/Header";

// Floating Action Menu Component
const ActionMenu = ({ onClear, onUploadClick, voiceEnabled, toggleVoice }) => (
  <div className="floating-menu">
    <button title="New Chat" onClick={onClear}>🆕</button>
    <button title="Upload File" onClick={onUploadClick}>📎</button>
    <button title={voiceEnabled ? "Voice ON" : "Voice OFF"} onClick={toggleVoice}>
      {voiceEnabled ? "🔊" : "🔇"}
    </button>
  </div>
);

// Toast Component
const Toast = ({ message, onClose, retry }) => (
  <div className="toast">
    <span>{message}</span>
    {retry && <button onClick={retry} className="retry-btn">↻ Retry</button>}
    <button onClick={onClose}>×</button>
  </div>
);

const API_BASE = "https://manifix.up.railway.app";
const defaultWelcome = { content: "Hii ❤️ I’m ManifiX, I’m here with you ✨", role: "bot", id: "welcome", type: "text" };

export default function Gpt() {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || [defaultWelcome]);
  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [retryMsg, setRetryMsg] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const chatContainer = useRef(null);
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);
  const fileInputRef = useRef(null);

  // ---------- Speech Recognition ----------
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onerror = (e) => { setListening(false); showToast(`STT Error: ${e.error}`); if (voiceEnabled) speak(`Speech recognition failed. ${e.error}`); };
    rec.onend = () => setListening(false);
  }, [voiceEnabled]);

  // ---------- Scroll & Persist ----------
  useEffect(() => {
    if (chatContainer.current) chatContainer.current.scrollTo({ top: chatContainer.current.scrollHeight, behavior: "smooth" });
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // ---------- TTS ----------
  const speak = (text) => { if (!voiceEnabled || !window.speechSynthesis) return; const utterance = new SpeechSynthesisUtterance(text); utterance.lang="en-IN"; utterance.rate=1; utterance.pitch=1; window.speechSynthesis.speak(utterance); ttsRef.current=utterance; };
  const stopSpeaking = () => window.speechSynthesis?.cancel();

  // ---------- Toast ----------
  const showToast = (msg, retryFn=null) => { setToast(msg); setRetryMsg(() => retryFn); setTimeout(() => setToast(""), 5000); };

  // ---------- Mic ----------
  const handleMic = () => { const rec=recognitionRef.current; if(!rec) return showToast("STT not supported"); listening?rec.stop():rec.start(); };

  // ---------- Copy / Share / Delete ----------
  const copyMessage = (text) => { navigator.clipboard.writeText(text); showToast("✅ Copied"); };
  const deleteMessage = (id) => { setMessages(prev => prev.filter(msg => msg.id!==id)); showToast("🗑️ Deleted"); };
  const shareMessage = (text) => { navigator.share?.({text}).catch(()=>{copyMessage(text); showToast("🔗 Copied");}); };

  // ---------- Send Message ----------
  const sendMessage = async (msg, isFile=false) => {
    if(!msg) return; stopSpeaking();
    const userMsg={content: msg, role: "user", id: Math.random().toString(36).substring(2), type: isFile?"file":"text"};
    setMessages(prev=>[...prev,userMsg]); setInput("");
    const thinkingMsg={content: "ManifiX is thinking...", role:"bot", type:"thinking", id:Math.random().toString(36).substring(2)};
    setMessages(prev=>[...prev,thinkingMsg]);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, {message: msg});
      const replyText = response.data.reply || "Hmm… I have no response.";
      setMessages(prev=>prev.filter(m=>m.id!==thinkingMsg.id));
      const replyMsg={content:"", role:"bot", id:Math.random().toString(36).substring(2), type:"text"};
      setMessages(prev=>[...prev,replyMsg]);
      setShowConfetti(true);

      let idx=0;
      const interval=setInterval(()=>{
        if(idx<replyText.length){ replyMsg.content+=replyText[idx]; setMessages(prev=>[...prev.filter(m=>m.id!==replyMsg.id),{...replyMsg}]); idx++; }
        else{ clearInterval(interval); setShowConfetti(false); if(voiceEnabled)speak(replyText); }
      },20);

    } catch(err){
      console.error(err);
      setMessages(prev=>[...prev.filter(m=>m.id!==thinkingMsg.id),{content:"❌ Server Error", role:"bot", id:Math.random().toString(36).substring(2), type:"text"}]);
      if(voiceEnabled)speak("❌ Server Error");
    }
  };

  // ---------- File Upload ----------
  const handleUpload = async (e) => {
    const file=e.target.files[0]; if(!file) return; setUploading(true);
    const formData=new FormData(); formData.append("file",file);
    try{ const res=await axios.post(`${API_BASE}/api/upload`,formData,{headers:{"Content-Type":"multipart/form-data"}}); sendMessage(res.data.url,true); }
    catch{ showToast("❌ File upload failed"); if(voiceEnabled)speak("File upload failed"); }
    finally{ setUploading(false); e.target.value=null; }
  };

  const handleKeyDown=(e)=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(input.trim()); } };

  return (
    <div className="gpt-app theme-ultra" style={{backgroundImage:`url(${backgroundPurple})`}}>
      {showConfetti&&<Confetti />}
      {toast&&<Toast message={toast} onClose={()=>setToast("")} retry={retryMsg} />}
      <Header onNewChat={()=>{localStorage.removeItem("chatMessages"); setMessages([defaultWelcome]);}} />

      <ActionMenu
        onClear={()=>{localStorage.removeItem("chatMessages"); setMessages([defaultWelcome]);}}
        onUploadClick={()=>fileInputRef.current.click()}
        voiceEnabled={voiceEnabled}
        toggleVoice={()=>setVoiceEnabled(prev=>!prev)}
      />

      <main className="gpt-main" ref={chatContainer}>
        {messages.map(msg=>(
          <div key={msg.id} className={`message-row ${msg.role}`}>
            <div className={`message-bubble ${msg.role}-bubble`}>
              {msg.type==="thinking"?(<div className="typing-indicator">{msg.content}<span className="dots">...</span></div>)
              : msg.type==="file"?(<a href={msg.content} target="_blank" rel="noopener noreferrer">📎 {msg.content.split("/").pop()}</a>)
              : (<>
                  <ReactMarkdown children={msg.content} components={{
                    code({node,inline,className,children,...props}){
                      const match=/language-(\w+)/.exec(className||'');
                      return !inline&&match?(<SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" children={String(children).replace(/\n$/,'')} {...props} />)
                      :(<code className={className} {...props}>{children}</code>);
                    }
                  }}/>
                  <div className="message-actions">
                    <button onClick={()=>copyMessage(msg.content)}>📋</button>
                    <button onClick={()=>shareMessage(msg.content)}>🔗</button>
                    <button onClick={()=>deleteMessage(msg.id)}>🗑️</button>
                  </div>
                </>)
              }
            </div>
          </div>
        ))}
      </main>

      <footer className="gpt-footer">
        <button onClick={handleMic} className={listening?"recording":""}>{listening?"🛑":"🎤"}</button>
        <textarea rows={1} value={input} onChange={e=>{setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=`${e.target.scrollHeight}px`;}} onKeyDown={handleKeyDown} placeholder="Ask Your ManifiX Anything…" />
        <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={handleUpload} />
        <button onClick={()=>sendMessage(input.trim())} disabled={!input.trim()}>➤</button>
      </footer>
    </div>
  );
}
