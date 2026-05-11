// src/constants/languages.js
// ManifiX AI — Complete Language System
// 12 Indian Languages + 8 Global Languages
// Web Speech API codes + GPT language codes
// All Magic16 voice cues translated

/* ─────────────────────────────────────────────
   LANGUAGE DEFINITIONS
───────────────────────────────────────────── */
export const LANGUAGES = [

  /* ══════════════════════════════════════
     INDIAN LANGUAGES
  ══════════════════════════════════════ */
  {
    code:      "en-IN",
    gptCode:   "english",
    name:      "English",
    nativeName:"English",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "125M",
    voiceRate: 0.88,
    voicePitch:0.95,
  },
  {
    code:      "hi-IN",
    gptCode:   "hindi",
    name:      "Hindi",
    nativeName:"हिंदी",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "600M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "te-IN",
    gptCode:   "telugu",
    name:      "Telugu",
    nativeName:"తెలుగు",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "82M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "ta-IN",
    gptCode:   "tamil",
    name:      "Tamil",
    nativeName:"தமிழ்",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "77M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "mr-IN",
    gptCode:   "marathi",
    name:      "Marathi",
    nativeName:"मराठी",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "83M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "bn-IN",
    gptCode:   "bengali",
    name:      "Bengali",
    nativeName:"বাংলা",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "100M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "kn-IN",
    gptCode:   "kannada",
    name:      "Kannada",
    nativeName:"ಕನ್ನಡ",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "45M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "gu-IN",
    gptCode:   "gujarati",
    name:      "Gujarati",
    nativeName:"ગુજરાતી",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "60M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "ml-IN",
    gptCode:   "malayalam",
    name:      "Malayalam",
    nativeName:"മലയാളം",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "38M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "pa-IN",
    gptCode:   "punjabi",
    name:      "Punjabi",
    nativeName:"ਪੰਜਾਬੀ",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "30M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "or-IN",
    gptCode:   "odia",
    name:      "Odia",
    nativeName:"ଓଡ଼ିଆ",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "38M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "ur-IN",
    gptCode:   "urdu",
    name:      "Urdu",
    nativeName:"اردو",
    flag:      "🇮🇳",
    region:    "india",
    speakers:  "50M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },

  /* ══════════════════════════════════════
     GLOBAL LANGUAGES
  ══════════════════════════════════════ */
  {
    code:      "es-ES",
    gptCode:   "spanish",
    name:      "Spanish",
    nativeName:"Español",
    flag:      "🌍",
    region:    "global",
    speakers:  "500M",
    voiceRate: 0.88,
    voicePitch:0.95,
  },
  {
    code:      "ar-SA",
    gptCode:   "arabic",
    name:      "Arabic",
    nativeName:"العربية",
    flag:      "🌍",
    region:    "global",
    speakers:  "400M",
    voiceRate: 0.82,
    voicePitch:0.95,
  },
  {
    code:      "pt-BR",
    gptCode:   "portuguese",
    name:      "Portuguese",
    nativeName:"Português",
    flag:      "🌍",
    region:    "global",
    speakers:  "230M",
    voiceRate: 0.88,
    voicePitch:0.95,
  },
  {
    code:      "fr-FR",
    gptCode:   "french",
    name:      "French",
    nativeName:"Français",
    flag:      "🌍",
    region:    "global",
    speakers:  "280M",
    voiceRate: 0.88,
    voicePitch:0.95,
  },
  {
    code:      "de-DE",
    gptCode:   "german",
    name:      "German",
    nativeName:"Deutsch",
    flag:      "🌍",
    region:    "global",
    speakers:  "100M",
    voiceRate: 0.88,
    voicePitch:0.95,
  },
  {
    code:      "ja-JP",
    gptCode:   "japanese",
    name:      "Japanese",
    nativeName:"日本語",
    flag:      "🌍",
    region:    "global",
    speakers:  "125M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "ko-KR",
    gptCode:   "korean",
    name:      "Korean",
    nativeName:"한국어",
    flag:      "🌍",
    region:    "global",
    speakers:  "77M",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
  {
    code:      "zh-CN",
    gptCode:   "chinese",
    name:      "Chinese",
    nativeName:"中文",
    flag:      "🌍",
    region:    "global",
    speakers:  "1B",
    voiceRate: 0.85,
    voicePitch:0.95,
  },
];

/* ─────────────────────────────────────────────
   MAGIC16 VOICE CUES — TRANSLATED
   Used in Magic16.jsx speak() function
───────────────────────────────────────────── */
export const VOICE_CUES = {

  /* ── SESSION START ── */
  sessionStart: {
    "en-IN": (day) => `Day ${day}. Magic16 begins. Follow every cue.`,
    "hi-IN": (day) => `दिन ${day}। Magic16 शुरू होता है। हर संकेत का पालन करें।`,
    "te-IN": (day) => `రోజు ${day}. Magic16 ప్రారంభమవుతోంది. ప్రతి సూచనను అనుసరించండి.`,
    "ta-IN": (day) => `நாள் ${day}. Magic16 தொடங்குகிறது. ஒவ்வொரு குறிப்பையும் பின்பற்றுங்கள்.`,
    "mr-IN": (day) => `दिवस ${day}. Magic16 सुरू होतो. प्रत्येक सूचनेचे पालन करा.`,
    "bn-IN": (day) => `দিন ${day}। Magic16 শুরু হচ্ছে। প্রতিটি নির্দেশ অনুসরণ করুন।`,
    "kn-IN": (day) => `ದಿನ ${day}. Magic16 ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ. ಪ್ರತಿ ಸೂಚನೆಯನ್ನು ಅನುಸರಿಸಿ.`,
    "gu-IN": (day) => `દિવસ ${day}. Magic16 શરૂ થાય છે. દરેક સૂચના અનુસરો.`,
    "ml-IN": (day) => `ദിവസം ${day}. Magic16 ആരംഭിക്കുന്നു. ഓരോ നിർദ്ദേശവും പാലിക്കൂ.`,
    "pa-IN": (day) => `ਦਿਨ ${day}. Magic16 ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ। ਹਰ ਸੰਕੇਤ ਦੀ ਪਾਲਣਾ ਕਰੋ।`,
    "es-ES": (day) => `Día ${day}. Comienza Magic16. Sigue cada indicación.`,
    "ar-SA": (day) => `اليوم ${day}. يبدأ Magic16. اتبع كل تعليمة.`,
    "fr-FR": (day) => `Jour ${day}. Magic16 commence. Suivez chaque indication.`,
    "pt-BR": (day) => `Dia ${day}. Magic16 começa. Siga cada instrução.`,
    "zh-CN": (day) => `第${day}天。Magic16开始。跟随每个提示。`,
    "ja-JP": (day) => `${day}日目。Magic16が始まります。すべての指示に従ってください。`,
    "ko-KR": (day) => `${day}일차. Magic16 시작합니다. 모든 지시를 따르세요.`,
    "de-DE": (day) => `Tag ${day}. Magic16 beginnt. Folge jeder Anweisung.`,
  },

  /* ── SESSION COMPLETE ── */
  sessionComplete: {
    "en-IN": "Session complete. You are in the top one percent.",
    "hi-IN": "सत्र पूर्ण हुआ। आप शीर्ष एक प्रतिशत में हैं।",
    "te-IN": "సెషన్ పూర్తయింది. మీరు టాప్ ఒక శాతంలో ఉన్నారు.",
    "ta-IN": "அமர்வு முடிந்தது. நீங்கள் சிறந்த ஒரு சதவீதத்தில் இருக்கிறீர்கள்.",
    "mr-IN": "सत्र पूर्ण झाले. तुम्ही शीर्ष एक टक्केमध्ये आहात.",
    "bn-IN": "সেশন সম্পন্ন হয়েছে। আপনি শীর্ষ এক শতাংশে আছেন।",
    "kn-IN": "ಸೆಶನ್ ಪೂರ್ಣಗೊಂಡಿತು. ನೀವು ಅಗ್ರ ಒಂದು ಪ್ರತಿಶತದಲ್ಲಿದ್ದೀರಿ.",
    "gu-IN": "સત્ર પૂર્ણ થયું. તમે ટોચના એક ટકામાં છો.",
    "ml-IN": "സെഷൻ പൂർത്തിയായി. നിങ്ങൾ മുൻനിര ഒരു ശതമാനത്തിലാണ്.",
    "pa-IN": "ਸੈਸ਼ਨ ਪੂਰਾ ਹੋਇਆ। ਤੁਸੀਂ ਸਿਖਰਲੇ ਇੱਕ ਪ੍ਰਤੀਸ਼ਤ ਵਿੱਚ ਹੋ।",
    "es-ES": "Sesión completa. Estás en el uno por ciento superior.",
    "ar-SA": "اكتملت الجلسة. أنت في أفضل واحد بالمئة.",
    "fr-FR": "Séance terminée. Vous êtes dans le premier pourcent.",
    "pt-BR": "Sessão completa. Você está no top um por cento.",
    "zh-CN": "课程完成。你在前百分之一。",
    "ja-JP": "セッション完了。あなたは上位1%にいます。",
    "ko-KR": "세션 완료. 당신은 상위 1%에 있습니다.",
    "de-DE": "Sitzung abgeschlossen. Du bist in den Top ein Prozent.",
  },

  /* ── FIX FORM WARNING ── */
  fixForm: {
    "en-IN": "Fix your form. I see no movement.",
    "hi-IN": "अपनी मुद्रा सुधारें। मुझे कोई हलचल नहीं दिख रही।",
    "te-IN": "మీ భంగిమను సరిచేయండి. నాకు కదలిక కనిపించడం లేదు.",
    "ta-IN": "உங்கள் தோரணையை சரிசெய்யுங்கள். எந்த அசைவும் தெரியவில்லை.",
    "mr-IN": "तुमची मुद्रा सुधारा. मला कोणतीही हालचाल दिसत नाही.",
    "bn-IN": "আপনার ভঙ্গি ঠিক করুন। কোনো নড়াচড়া দেখতে পাচ্ছি না।",
    "kn-IN": "ನಿಮ್ಮ ಭಂಗಿಯನ್ನು ಸರಿಪಡಿಸಿ. ಯಾವುದೇ ಚಲನೆ ಕಾಣುತ್ತಿಲ್ಲ.",
    "gu-IN": "તમારી મુદ્રા સુધારો. મને કોઈ હલચલ દેખાતી નથી.",
    "ml-IN": "നിങ്ങളുടെ ഭാവം ശരിയാക്കൂ. ഒരു ചലനവും കാണുന്നില്ല.",
    "pa-IN": "ਆਪਣੀ ਮੁਦਰਾ ਠੀਕ ਕਰੋ। ਮੈਨੂੰ ਕੋਈ ਹਰਕਤ ਨਜ਼ਰ ਨਹੀਂ ਆਉਂਦੀ।",
    "es-ES": "Corrige tu forma. No veo ningún movimiento.",
    "ar-SA": "صحح وضعك. لا أرى أي حركة.",
    "fr-FR": "Corrigez votre posture. Je ne vois aucun mouvement.",
    "pt-BR": "Corrija sua postura. Não vejo nenhum movimento.",
    "zh-CN": "纠正你的姿势。我看不到任何动作。",
    "ja-JP": "フォームを直してください。動きが見えません。",
    "ko-KR": "자세를 교정하세요. 움직임이 보이지 않습니다.",
    "de-DE": "Korrigiere deine Haltung. Ich sehe keine Bewegung.",
  },

  /* ── PRO TIER UNLOCK ── */
  proUnlock: {
    "en-IN": "Accuracy elite. You have unlocked Discipline Pro Tier.",
    "hi-IN": "सटीकता उत्कृष्ट है। आपने Discipline Pro Tier अनलॉक किया है।",
    "te-IN": "ఖచ్చితత్వం అద్భుతం. మీరు Discipline Pro Tier అన్‌లాక్ చేశారు.",
    "ta-IN": "துல்லியம் சிறந்தது. நீங்கள் Discipline Pro Tier திறந்தீர்கள்.",
    "mr-IN": "अचूकता उत्कृष्ट आहे. तुम्ही Discipline Pro Tier अनलॉक केले आहे.",
    "bn-IN": "নির্ভুলতা অসাধারণ। আপনি Discipline Pro Tier আনলক করেছেন।",
    "kn-IN": "ನಿಖರತೆ ಅತ್ಯುತ್ತಮ. ನೀವು Discipline Pro Tier ಅನ್ಲಾಕ್ ಮಾಡಿದ್ದೀರಿ.",
    "gu-IN": "ચોકસાઈ ઉત્કૃષ્ટ છે. તમે Discipline Pro Tier અનલૉક કર્યું છે.",
    "ml-IN": "കൃത്യത മികച്ചതാണ്. നിങ്ങൾ Discipline Pro Tier അൺലോക്ക് ചെയ്തു.",
    "pa-IN": "ਸ਼ੁੱਧਤਾ ਸ਼ਾਨਦਾਰ ਹੈ। ਤੁਸੀਂ Discipline Pro Tier ਅਨਲੌਕ ਕੀਤਾ ਹੈ।",
    "es-ES": "Precisión elite. Has desbloqueado el Discipline Pro Tier.",
    "ar-SA": "دقة عالية. لقد فتحت مستوى Discipline Pro.",
    "fr-FR": "Précision élite. Vous avez débloqué le Discipline Pro Tier.",
    "pt-BR": "Precisão elite. Você desbloqueou o Discipline Pro Tier.",
    "zh-CN": "精准度极高。您已解锁Discipline Pro等级。",
    "ja-JP": "精度エリート。Discipline Pro Tierをアンロックしました。",
    "ko-KR": "정확도 엘리트. Discipline Pro Tier를 잠금 해제했습니다.",
    "de-DE": "Elite-Genauigkeit. Du hast die Discipline Pro Stufe freigeschaltet.",
  },

  /* ── WELCOME BACK ── */
  welcomeBack: {
    "en-IN": "Welcome to the one percent.",
    "hi-IN": "एक प्रतिशत में आपका स्वागत है।",
    "te-IN": "ఒక శాతానికి స్వాగతం.",
    "ta-IN": "ஒரு சதவீதத்திற்கு வரவேற்கிறோம்.",
    "mr-IN": "एक टक्केमध्ये आपले स्वागत आहे.",
    "bn-IN": "এক শতাংশে আপনাকে স্বাগতম।",
    "kn-IN": "ಒಂದು ಪ್ರತಿಶತಕ್ಕೆ ಸ್ವಾಗತ.",
    "gu-IN": "એક ટકામાં આપનું સ્વાગત છે.",
    "ml-IN": "ഒരു ശതമാനത്തിലേക്ക് സ്വാഗതം.",
    "pa-IN": "ਇੱਕ ਪ੍ਰਤੀਸ਼ਤ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।",
    "es-ES": "Bienvenido al uno por ciento.",
    "ar-SA": "مرحباً بك في أفضل واحد بالمئة.",
    "fr-FR": "Bienvenue dans le premier pourcent.",
    "pt-BR": "Bem-vindo ao um por cento.",
    "zh-CN": "欢迎加入前百分之一。",
    "ja-JP": "上位1%へようこそ。",
    "ko-KR": "상위 1%에 오신 것을 환영합니다.",
    "de-DE": "Willkommen im obersten Prozent.",
  },

  /* ── STREAK AT RISK ── */
  streakRisk: {
    "en-IN": "Your streak is at risk. Complete your session now.",
    "hi-IN": "आपकी स्ट्रीक खतरे में है। अभी अपना सत्र पूरा करें।",
    "te-IN": "మీ స్ట్రీక్ ప్రమాదంలో ఉంది. ఇప్పుడే మీ సెషన్ పూర్తి చేయండి.",
    "ta-IN": "உங்கள் தொடர் ஆபத்தில் உள்ளது. இப்போதே உங்கள் அமர்வை முடிக்கவும்.",
    "mr-IN": "तुमची स्ट्रीक धोक्यात आहे. आत्ताच तुमचे सत्र पूर्ण करा.",
    "bn-IN": "আপনার স্ট্রিক ঝুঁকিতে আছে। এখনই আপনার সেশন সম্পন্ন করুন।",
    "kn-IN": "ನಿಮ್ಮ ಸ್ಟ್ರೀಕ್ ಅಪಾಯದಲ್ಲಿದೆ. ಈಗಲೇ ನಿಮ್ಮ ಸೆಶನ್ ಪೂರ್ಣಗೊಳಿಸಿ.",
    "gu-IN": "તમારી સ્ટ્રીક જોખમમાં છે. અત્યારે જ તમારું સત્ર પૂર્ણ કરો.",
    "ml-IN": "നിങ്ങളുടെ സ്ട്രീക്ക് അപകടത്തിലാണ്. ഇപ്പോൾ തന്നെ സെഷൻ പൂർത്തിയാക്കൂ.",
    "pa-IN": "ਤੁਹਾਡੀ ਸਟ੍ਰੀਕ ਖ਼ਤਰੇ ਵਿੱਚ ਹੈ। ਹੁਣੇ ਆਪਣਾ ਸੈਸ਼ਨ ਪੂਰਾ ਕਰੋ।",
    "es-ES": "Tu racha está en riesgo. Completa tu sesión ahora.",
    "ar-SA": "سلسلتك في خطر. أكمل جلستك الآن.",
    "fr-FR": "Votre série est en danger. Terminez votre séance maintenant.",
    "pt-BR": "Sua sequência está em risco. Complete sua sessão agora.",
    "zh-CN": "你的连续记录面临风险。现在完成你的课程。",
    "ja-JP": "ストリークが危険です。今すぐセッションを完了してください。",
    "ko-KR": "스트릭이 위험합니다. 지금 바로 세션을 완료하세요.",
    "de-DE": "Deine Serie ist in Gefahr. Schließe jetzt deine Sitzung ab.",
  },
};

/* ─────────────────────────────────────────────
   MAGIC16 MODE DEFINITIONS
───────────────────────────────────────────── */
export const MODES = {
  morning: {
    id:          "morning",
    label:       "Morning",
    emoji:       "🌅",
    color:       "#ffc83c",
    colorDim:    "#2a2010",
    description: "Yoga + Meditation",
    detail:      "8 min yoga + 8 min meditation",
    voiceRate:   0.88,
    voicePitch:  0.95,
    modeLabels: {
      "en-IN": "Morning",
      "hi-IN": "सुबह",
      "te-IN": "ఉదయం",
      "ta-IN": "காலை",
      "mr-IN": "सकाळ",
      "bn-IN": "সকাল",
      "kn-IN": "ಬೆಳಿಗ್ಗೆ",
      "gu-IN": "સવાર",
      "ml-IN": "രാവിലെ",
      "pa-IN": "ਸਵੇਰ",
      "es-ES": "Mañana",
      "ar-SA": "الصباح",
      "fr-FR": "Matin",
      "pt-BR": "Manhã",
      "zh-CN": "早晨",
      "ja-JP": "朝",
      "ko-KR": "아침",
      "de-DE": "Morgen",
    },
  },
  sleep: {
    id:          "sleep",
    label:       "Sleep",
    emoji:       "🌙",
    color:       "#6b46c1",
    colorDim:    "#1a1028",
    description: "Wind down + Rest",
    detail:      "8 min wind down + 8 min sleep prep",
    voiceRate:   0.75,
    voicePitch:  0.85,
    modeLabels: {
      "en-IN": "Sleep",
      "hi-IN": "नींद",
      "te-IN": "నిద్ర",
      "ta-IN": "தூக்கம்",
      "mr-IN": "झोप",
      "bn-IN": "ঘুম",
      "kn-IN": "ನಿದ್ರೆ",
      "gu-IN": "ઊંઘ",
      "ml-IN": "ഉറക്കം",
      "pa-IN": "ਨੀਂਦ",
      "es-ES": "Sueño",
      "ar-SA": "النوم",
      "fr-FR": "Sommeil",
      "pt-BR": "Sono",
      "zh-CN": "睡眠",
      "ja-JP": "睡眠",
      "ko-KR": "수면",
      "de-DE": "Schlaf",
    },
  },
  focus: {
    id:          "focus",
    label:       "Focus",
    emoji:       "🎯",
    color:       "#378ADD",
    colorDim:    "#0d1e33",
    description: "Breathwork + Clarity",
    detail:      "8 min breathwork + 8 min clarity",
    voiceRate:   0.88,
    voicePitch:  1.0,
    modeLabels: {
      "en-IN": "Focus",
      "hi-IN": "फोकस",
      "te-IN": "ఫోకస్",
      "ta-IN": "கவனம்",
      "mr-IN": "फोकस",
      "bn-IN": "ফোকাস",
      "kn-IN": "ಗಮನ",
      "gu-IN": "ફોકસ",
      "ml-IN": "ശ്രദ്ധ",
      "pa-IN": "ਫੋਕਸ",
      "es-ES": "Enfoque",
      "ar-SA": "التركيز",
      "fr-FR": "Concentration",
      "pt-BR": "Foco",
      "zh-CN": "专注",
      "ja-JP": "集中",
      "ko-KR": "집중",
      "de-DE": "Fokus",
    },
  },
  posture: {
    id:          "posture",
    label:       "Posture",
    emoji:       "💻",
    color:       "#22c55e",
    colorDim:    "#0a1e12",
    description: "Desk stretch + Align",
    detail:      "8 min stretches + 8 min alignment",
    voiceRate:   0.88,
    voicePitch:  0.95,
    modeLabels: {
      "en-IN": "Posture",
      "hi-IN": "मुद्रा",
      "te-IN": "భంగిమ",
      "ta-IN": "தோரணை",
      "mr-IN": "मुद्रा",
      "bn-IN": "ভঙ্গি",
      "kn-IN": "ಭಂಗಿ",
      "gu-IN": "મુદ્રા",
      "ml-IN": "ഭാവം",
      "pa-IN": "ਮੁਦਰਾ",
      "es-ES": "Postura",
      "ar-SA": "الوضعية",
      "fr-FR": "Posture",
      "pt-BR": "Postura",
      "zh-CN": "姿势",
      "ja-JP": "姿勢",
      "ko-KR": "자세",
      "de-DE": "Haltung",
    },
  },
};

/* ─────────────────────────────────────────────
   GPT SYSTEM PROMPT — per language
───────────────────────────────────────────── */
export const GPT_SYSTEM_PROMPTS = {
  "en-IN": "You are ManifiX Strategist, an elite AI wellness coach. Respond in English. Be direct, powerful and concise.",
  "hi-IN": "आप ManifiX Strategist हैं, एक elite AI wellness coach। हिंदी में जवाब दें। सीधे, शक्तिशाली और संक्षिप्त रहें।",
  "te-IN": "మీరు ManifiX Strategist, ఒక elite AI wellness coach. తెలుగులో సమాధానం ఇవ్వండి. నేరుగా, శక్తివంతంగా మరియు సంక్షిప్తంగా ఉండండి.",
  "ta-IN": "நீங்கள் ManifiX Strategist, ஒரு elite AI wellness coach. தமிழில் பதிலளிக்கவும். நேரடியாக, சக்திவாய்ந்து மற்றும் சுருக்கமாக இருங்கள்.",
  "mr-IN": "तुम्ही ManifiX Strategist आहात, एक elite AI wellness coach. मराठीत उत्तर द्या. थेट, शक्तिशाली आणि संक्षिप्त असा.",
  "bn-IN": "আপনি ManifiX Strategist, একজন elite AI wellness coach। বাংলায় উত্তর দিন। সরাসরি, শক্তিশালী এবং সংক্ষিপ্ত থাকুন।",
  "kn-IN": "ನೀವು ManifiX Strategist, ಒಬ್ಬ elite AI wellness coach. ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ನೇರ, ಶಕ್ತಿಶಾಲಿ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತವಾಗಿರಿ.",
  "gu-IN": "તમે ManifiX Strategist છો, એક elite AI wellness coach. ગુજરાતીમાં જવાબ આપો. સીધા, શક્તિશાળી અને સંક્ષિપ્ત રહો.",
  "ml-IN": "നിങ്ങൾ ManifiX Strategist, ഒരു elite AI wellness coach ആണ്. മലയാളത്തിൽ മറുപടി നൽകൂ. നേരിട്ട്, ശക്തമായ, സംക്ഷിപ്തമായി ഇരിക്കൂ.",
  "pa-IN": "ਤੁਸੀਂ ManifiX Strategist ਹੋ, ਇੱਕ elite AI wellness coach। ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। ਸਿੱਧੇ, ਸ਼ਕਤੀਸ਼ਾਲੀ ਅਤੇ ਸੰਖੇਪ ਰਹੋ।",
  "es-ES": "Eres ManifiX Strategist, un coach de bienestar AI de élite. Responde en español. Sé directo, poderoso y conciso.",
  "ar-SA": "أنت ManifiX Strategist، مدرب صحة AI نخبوي. أجب باللغة العربية. كن مباشراً وقوياً وموجزاً.",
  "fr-FR": "Vous êtes ManifiX Strategist, un coach bien-être AI d'élite. Répondez en français. Soyez direct, puissant et concis.",
  "pt-BR": "Você é o ManifiX Strategist, um coach de bem-estar AI de elite. Responda em português. Seja direto, poderoso e conciso.",
  "zh-CN": "你是ManifiX Strategist，一位精英AI健康教练。用中文回答。保持直接、有力和简洁。",
  "ja-JP": "あなたはManifiX Strategistです。エリートAIウェルネスコーチ。日本語で返答してください。直接的で力強く簡潔に。",
  "ko-KR": "당신은 ManifiX Strategist, 엘리트 AI 웰니스 코치입니다. 한국어로 대답하세요. 직접적이고 강력하며 간결하게.",
  "de-DE": "Sie sind ManifiX Strategist, ein Elite-KI-Wellnesscoach. Antworten Sie auf Deutsch. Seien Sie direkt, kraftvoll und präzise.",
};

/* ─────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────── */

/**
 * Get language object by code
 */
export function getLanguage(code = "en-IN") {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

/**
 * Get mode object by id
 */
export function getMode(id = "morning") {
  return MODES[id] || MODES.morning;
}

/**
 * Get voice cue in selected language
 */
export function getCue(cueKey, langCode = "en-IN", ...args) {
  const cueObj = VOICE_CUES[cueKey];
  if (!cueObj) return "";
  const cue = cueObj[langCode] || cueObj["en-IN"];
  return typeof cue === "function" ? cue(...args) : cue;
}

/**
 * Get mode label in selected language
 */
export function getModeLabel(modeId, langCode = "en-IN") {
  const mode = getMode(modeId);
  return mode.modeLabels[langCode] || mode.label;
}

/**
 * Get GPT system prompt for language
 */
export function getSystemPrompt(langCode = "en-IN") {
  return GPT_SYSTEM_PROMPTS[langCode] || GPT_SYSTEM_PROMPTS["en-IN"];
}

/**
 * Save language preference
 */
export function saveLanguage(code) {
  localStorage.setItem("magic16_lang", code);
}

/**
 * Save mode preference
 */
export function saveMode(id) {
  localStorage.setItem("magic16_mode", id);
}

/**
 * Load saved language (default English)
 */
export function loadLanguage() {
  return localStorage.getItem("magic16_lang") || "en-IN";
}

/**
 * Load saved mode (default morning)
 */
export function loadMode() {
  return localStorage.getItem("magic16_mode") || "morning";
}

/**
 * Get all Indian languages only
 */
export function getIndianLanguages() {
  return LANGUAGES.filter((l) => l.region === "india");
}

/**
 * Get all global languages only
 */
export function getGlobalLanguages() {
  return LANGUAGES.filter((l) => l.region === "global");
}

/**
 * Create speak function with language + mode settings
 */
export function createSpeaker(langCode = "en-IN", modeId = "morning") {
  const lang = getLanguage(langCode);
  const mode = getMode(modeId);

  return (text, urgent = false) => {
    if (!("speechSynthesis" in window)) return;
    const msg       = new SpeechSynthesisUtterance(text);
    msg.lang        = langCode;
    msg.rate        = urgent ? 1.2 : (mode.voiceRate  || lang.voiceRate);
    msg.pitch       = urgent ? 1.1 : (mode.voicePitch || lang.voicePitch);
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    if (urgent) navigator.vibrate?.([80, 40, 80]);
  };
}

export default LANGUAGES;
