const chat = document.getElementById("chat-container");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const toggleVoiceBtn = document.getElementById("toggleVoiceBtn");
const fileInput = document.getElementById("fileInput");

let voiceEnabled = true;

// ---------- UI ----------
function addMessage(text, who = "bot") {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.margin = "8px";
  div.style.textAlign = who === "user" ? "right" : "left";
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ---------- INITIAL MESSAGE ----------
window.onload = () => {
  addMessage("Hi 👋 I’m ManifiX. How can I help you today ❤️");
};

// ---------- TTS ----------
function speak(text) {
  if (!voiceEnabled) return;
  if (!window.speechSynthesis) return;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- STT ----------
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recog = SpeechRecognition ? new SpeechRecognition() : null;

if (recog) {
  recog.lang = "en-IN";
  recog.onresult = e => {
    input.value = e.results[0][0].transcript;
  };
}

micBtn.onclick = () => {
  if (!recog) return alert("STT not supported");
  recog.start();
};

// ---------- SEND ----------
sendBtn.onclick = async () => {
  const msg = input.value.trim();
  if (!msg) return;

  addMessage(msg, "user");
  input.value = "";

  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");
    speak(data.reply);

  } catch (err) {
    addMessage("⚠️ Server error", "bot");
  }
};

// ---------- VOICE TOGGLE ----------
toggleVoiceBtn.onclick = () => {
  voiceEnabled = !voiceEnabled;
  toggleVoiceBtn.textContent = voiceEnabled
    ? "🔊 Voice ON"
    : "🔇 Voice OFF";
};

// ---------- FILE (UI ONLY) ----------
fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (file) {
    addMessage(`📎 File selected: ${file.name}`, "user");
  }
};
