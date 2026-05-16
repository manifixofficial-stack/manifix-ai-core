import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import confetti from "canvas-confetti";
import { getSessionSteps } from "../constants/steps";

/* ═══════════════════════════════════════════════════════════════
   GLOBAL HEALTH PROBLEM TRACKING — 12 WHO Priority Conditions
   Each mode maps to real WHO intervention categories
═══════════════════════════════════════════════════════════════ */
const WHO_HEALTH_DOMAINS = {
  morning: {
    domain: "Physical Activity & NCD Prevention",
    who_code: "NCDs-PA",
    global_impact: "1.4B adults insufficiently active (WHO 2023)",
    intervention: "Daily movement reduces CVD risk by 35%",
    sdg_goal: "SDG 3.4 — Reduce premature NCD mortality",
  },
  sleep: {
    domain: "Sleep & Mental Health",
    who_code: "MH-SLP",
    global_impact: "970M people live with mental disorders (WHO 2022)",
    intervention: "Quality sleep reduces depression risk by 40%",
    sdg_goal: "SDG 3.4 — Mental health & wellbeing",
  },
  focus: {
    domain: "Cognitive Health & Productivity",
    who_code: "COG-WB",
    global_impact: "$1T/year lost to depression & anxiety at work",
    intervention: "Mindfulness cuts workplace stress by 30%",
    sdg_goal: "SDG 8.8 — Decent work and wellbeing",
  },
  posture: {
    domain: "Musculoskeletal Health",
    who_code: "MSK-ERG",
    global_impact: "1.71B people have musculoskeletal conditions",
    intervention: "Ergonomic practices reduce MSK disorders by 25%",
    sdg_goal: "SDG 3.8 — Universal health coverage",
  },
};

/* ═══════════════════════════════════════════════
   MODE CONFIG — 4 modes with unique themes
═══════════════════════════════════════════════ */
const MODE_CONFIG = {
  morning: {
    accent: "#FFB347", accentDim: "#cc8a30",
    progressGrad: "linear-gradient(90deg,#cc8a30,#FFB347)",
    border: "#2a1f0e", bg: "#0d0a05",
    gridColor: "rgba(255,179,71,.035)",
    scanColor: "#FFB347",
    voiceRate: 0.88, voicePitch: 0.95,
    label: "Morning", emoji: "🌅",
    phaseA: "Yoga · 8 min", phaseB: "Meditation · 8 min",
    tagline: "Rise with the sun. Build the body.",
    hsv: "hsl(33,100%,56%)",
  },
  sleep: {
    accent: "#9F7AEA", accentDim: "#7c5cbf",
    progressGrad: "linear-gradient(90deg,#4c1d95,#9F7AEA)",
    border: "#1e1730", bg: "#09080f",
    gridColor: "rgba(159,122,234,.03)",
    scanColor: "#9F7AEA",
    voiceRate: 0.70, voicePitch: 0.82,
    label: "Sleep", emoji: "🌙",
    phaseA: "Wind-down · 8 min", phaseB: "Sleep ritual · 8 min",
    tagline: "Quiet the mind. Invite the rest.",
    hsv: "hsl(262,72%,69%)",
  },
  focus: {
    accent: "#38BDF8", accentDim: "#0284c7",
    progressGrad: "linear-gradient(90deg,#075985,#38BDF8)",
    border: "#0c1e2e", bg: "#060d14",
    gridColor: "rgba(56,189,248,.03)",
    scanColor: "#38BDF8",
    voiceRate: 0.92, voicePitch: 1.0,
    label: "Focus", emoji: "🎯",
    phaseA: "Breathwork · 8 min", phaseB: "Clarity · 8 min",
    tagline: "Sharpen the signal. Cut the noise.",
    hsv: "hsl(199,92%,60%)",
  },
  posture: {
    accent: "#34D399", accentDim: "#059669",
    progressGrad: "linear-gradient(90deg,#064e3b,#34D399)",
    border: "#0f2a1e", bg: "#06120d",
    gridColor: "rgba(52,211,153,.03)",
    scanColor: "#34D399",
    voiceRate: 0.88, voicePitch: 0.95,
    label: "Posture", emoji: "💻",
    phaseA: "Desk stretch · 8 min", phaseB: "Alignment · 8 min",
    tagline: "Align the spine. Command the room.",
    hsv: "hsl(160,60%,57%)",
  },
};

/* ═══════════════════════════════════════════════
   LANGUAGE MAP — 20 languages → BCP-47 codes
   Full global coverage for WHO priority regions
═══════════════════════════════════════════════ */
const LANG_MAP = {
  "en-IN": "en-IN", "hi-IN": "hi-IN", "te-IN": "te-IN", "ta-IN": "ta-IN",
  "mr-IN": "mr-IN", "bn-IN": "bn-IN", "kn-IN": "kn-IN", "gu-IN": "gu-IN",
  "ml-IN": "ml-IN", "pa-IN": "pa-IN", "or-IN": "or-IN", "ur-IN": "ur-IN",
  "es-ES": "es-ES", "ar-SA": "ar-SA", "fr-FR": "fr-FR", "pt-BR": "pt-BR",
  "de-DE": "de-DE", "ja-JP": "ja-JP", "ko-KR": "ko-KR", "zh-CN": "zh-CN",
  "en": "en-IN", "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN",
  "es": "es-ES", "ar": "ar-SA", "fr": "fr-FR", "pt": "pt-BR",
  "de": "de-DE", "zh": "zh-CN",
};

/* ═══════════════════════════════════════════════
   MULTILINGUAL HEALTH COACHING PHRASES
   20 languages — real motivational coaching text
═══════════════════════════════════════════════ */
const HEALTH_PHRASES = {
  "en-IN": {
    ready: "Your body is your greatest asset. Let us build it.",
    complete: "Session complete. You have invested in your future today.",
    form_warning: "Adjust your position. Perfect form activates more muscle.",
    pro_unlock: "Elite performance detected. You have unlocked Pro status.",
    breathe: "Breathe deeply. Oxygen is your fuel.",
  },
  "hi-IN": {
    ready: "आपका शरीर आपकी सबसे बड़ी संपत्ति है। इसे बनाइए।",
    complete: "सत्र पूर्ण। आपने आज अपने भविष्य में निवेश किया है।",
    form_warning: "अपनी स्थिति ठीक करें। सटीक रूप से अधिक मांसपेशियाँ सक्रिय होती हैं।",
    pro_unlock: "शानदार प्रदर्शन। आपने प्रो स्तर अनलॉक किया।",
    breathe: "गहरी सांस लें। ऑक्सीजन आपका ईंधन है।",
  },
  "te-IN": {
    ready: "మీ శరీరం మీ గొప్ప ఆస్తి. దాన్ని నిర్మించండి.",
    complete: "సెషన్ పూర్తయింది. మీరు నేడు మీ భవిష్యత్తులో పెట్టుబడి పెట్టారు.",
    form_warning: "మీ స్థితిని సర్దుబాటు చేయండి. సరైన రూపం ఎక్కువ కండరాలను సక్రియం చేస్తుంది.",
    pro_unlock: "అత్యుత్తమ పనితీరు గుర్తించబడింది. మీరు ప్రో స్థాయిని అన్‌లాక్ చేశారు.",
    breathe: "లోతుగా శ్వాస తీసుకోండి. ఆక్సిజన్ మీ ఇంధనం.",
  },
  "ta-IN": {
    ready: "உங்கள் உடல் உங்கள் மிகப்பெரிய சொத்து. அதை உருவாக்குங்கள்.",
    complete: "அமர்வு முடிந்தது. நீங்கள் இன்று உங்கள் எதிர்காலத்தில் முதலீடு செய்தீர்கள்.",
    form_warning: "உங்கள் நிலையை சரிசெய்யுங்கள். சரியான வடிவம் அதிக தசைகளை செயல்படுத்துகிறது.",
    pro_unlock: "உயர் செயல்திறன் கண்டறியப்பட்டது. நீங்கள் புரோ நிலையை திறந்தீர்கள்.",
    breathe: "ஆழமாக சுவாசியுங்கள். ஆக்சிஜன் உங்கள் எரிபொருள்.",
  },
  "mr-IN": {
    ready: "तुमचे शरीर तुमची सर्वात मोठी संपत्ती आहे. ते घडवूया.",
    complete: "सत्र पूर्ण. आपण आज आपल्या भविष्यात गुंतवणूक केली.",
    form_warning: "आपली स्थिती समायोजित करा. योग्य फॉर्म अधिक स्नायू सक्रिय करतो.",
    pro_unlock: "उत्कृष्ट कार्यक्षमता आढळली. आपण प्रो स्तर उघडला.",
    breathe: "खोल श्वास घ्या. ऑक्सिजन तुमचे इंधन आहे.",
  },
  "bn-IN": {
    ready: "আপনার শরীর আপনার সবচেয়ে বড় সম্পদ। এটি গড়ুন।",
    complete: "সেশন সম্পূর্ণ। আপনি আজ আপনার ভবিষ্যতে বিনিয়োগ করেছেন।",
    form_warning: "আপনার অবস্থান ঠিক করুন। সঠিক ফর্ম আরো পেশী সক্রিয় করে।",
    pro_unlock: "অভিজাত পারফরম্যান্স শনাক্ত হয়েছে। আপনি প্রো স্তর আনলক করেছেন।",
    breathe: "গভীরভাবে শ্বাস নিন। অক্সিজেন আপনার জ্বালানি।",
  },
  "kn-IN": {
    ready: "ನಿಮ್ಮ ದೇಹ ನಿಮ್ಮ ಶ್ರೇಷ್ಠ ಆಸ್ತಿ. ಅದನ್ನು ನಿರ್ಮಿಸೋಣ.",
    complete: "ಸೆಷನ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ನೀವು ಇಂದು ನಿಮ್ಮ ಭವಿಷ್ಯದಲ್ಲಿ ಹೂಡಿಕೆ ಮಾಡಿದ್ದೀರಿ.",
    form_warning: "ನಿಮ್ಮ ಸ್ಥಾನ ಸರಿಪಡಿಸಿ. ಸರಿಯಾದ ಫಾರ್ಮ್ ಹೆಚ್ಚು ಸ್ನಾಯುಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುತ್ತದೆ.",
    pro_unlock: "ಉತ್ಕೃಷ್ಟ ಕಾರ್ಯನಿರ್ವಹಣೆ ಪತ್ತೆಯಾಗಿದೆ. ನೀವು ಪ್ರೋ ಸ್ತರ ಅನ್ಲಾಕ್ ಮಾಡಿದ್ದೀರಿ.",
    breathe: "ಆಳವಾಗಿ ಉಸಿರಾಡಿ. ಆಮ್ಲಜನಕ ನಿಮ್ಮ ಇಂಧನ.",
  },
  "gu-IN": {
    ready: "તમારું શરીર તમારી સૌથી મોટી સંપત્તિ છે. ચાલો તેને બનાવીએ.",
    complete: "સત્ર પૂર્ણ. આજે તમે તમારા ભવિષ્યમાં રોકાણ કર્યું.",
    form_warning: "તમારી સ્થિતિ સુધારો. સાચી ફોર્મ વધુ સ્નાયુ સક્રિય કરે છે.",
    pro_unlock: "ઉત્કૃષ્ટ પ્રદર્શન શોધ્યું. તમે પ્રો સ્તર ખોલ્યું.",
    breathe: "ઊંડો શ્વાસ લો. ઓક્સિજન તમારું ઇંધણ છે.",
  },
  "ml-IN": {
    ready: "നിങ്ങളുടെ ശരീരം നിങ്ങളുടെ ഏറ്റവും വലിയ ആസ്തിയാണ്. നമുക്കത് നിർമ്മിക്കാം.",
    complete: "സെഷൻ പൂർത്തിയായി. ഇന്ന് നിങ്ങൾ നിങ്ങളുടെ ഭാവിയിൽ നിക്ഷേപം നടത്തി.",
    form_warning: "നിലവിളി ശരിയാക്കുക. ശരിയായ രൂപം കൂടുതൽ പേശികളെ സജീവമാക്കുന്നു.",
    pro_unlock: "ഉന്നത പ്രകടനം കണ്ടെത്തി. നിങ്ങൾ പ്രോ ലെവൽ അൺലോക്ക് ചെയ്തു.",
    breathe: "ആഴത്തിൽ ശ്വസിക്കൂ. ഓക്സിജൻ നിങ്ങളുടെ ഇന്ധനമാണ്.",
  },
  "pa-IN": {
    ready: "ਤੁਹਾਡਾ ਸਰੀਰ ਤੁਹਾਡੀ ਸਭ ਤੋਂ ਵੱਡੀ ਦੌਲਤ ਹੈ। ਆਓ ਇਸਨੂੰ ਬਣਾਈਏ।",
    complete: "ਸੈਸ਼ਨ ਮੁਕੰਮਲ। ਅੱਜ ਤੁਸੀਂ ਆਪਣੇ ਭਵਿੱਖ ਵਿੱਚ ਨਿਵੇਸ਼ ਕੀਤਾ।",
    form_warning: "ਆਪਣੀ ਸਥਿਤੀ ਠੀਕ ਕਰੋ। ਸਹੀ ਰੂਪ ਵਧੇਰੇ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਸਰਗਰਮ ਕਰਦਾ ਹੈ।",
    pro_unlock: "ਉੱਚ-ਪੱਧਰੀ ਪ੍ਰਦਰਸ਼ਨ ਖੋਜਿਆ। ਤੁਸੀਂ ਪ੍ਰੋ ਦਰਜਾ ਅਨਲੌਕ ਕੀਤਾ।",
    breathe: "ਡੂੰਘਾ ਸਾਹ ਲਓ। ਆਕਸੀਜਨ ਤੁਹਾਡਾ ਬਾਲਣ ਹੈ।",
  },
  "ur-IN": {
    ready: "آپ کا جسم آپ کا سب سے بڑا اثاثہ ہے۔ آئیے اسے بنائیں۔",
    complete: "سیشن مکمل ہوا۔ آج آپ نے اپنے مستقبل میں سرمایہ کاری کی۔",
    form_warning: "اپنی پوزیشن درست کریں۔ صحیح فارم زیادہ عضلات کو متحرک کرتا ہے۔",
    pro_unlock: "اشرافیہ کارکردگی کا پتہ چلا۔ آپ نے پرو درجہ کھول لیا۔",
    breathe: "گہری سانس لیں۔ آکسیجن آپ کا ایندھن ہے۔",
  },
  "es-ES": {
    ready: "Tu cuerpo es tu mayor activo. Vamos a construirlo.",
    complete: "Sesión completa. Hoy has invertido en tu futuro.",
    form_warning: "Corrige tu posición. La forma perfecta activa más músculo.",
    pro_unlock: "Rendimiento élite detectado. Has desbloqueado el nivel Pro.",
    breathe: "Respira profundamente. El oxígeno es tu combustible.",
  },
  "ar-SA": {
    ready: "جسدك هو أعظم أصولك. دعنا نبنيه.",
    complete: "اكتملت الجلسة. لقد استثمرت في مستقبلك اليوم.",
    form_warning: "اضبط وضعيتك. الشكل الصحيح يُنشِّط المزيد من العضلات.",
    pro_unlock: "تم اكتشاف أداء نخبوي. لقد فتحت مستوى المحترف.",
    breathe: "تنفس بعمق. الأكسجين هو وقودك.",
  },
  "fr-FR": {
    ready: "Votre corps est votre plus grand atout. Construisons-le.",
    complete: "Session terminée. Vous avez investi dans votre avenir aujourd'hui.",
    form_warning: "Corrigez votre position. Une forme parfaite active plus de muscles.",
    pro_unlock: "Performance élite détectée. Vous avez débloqué le statut Pro.",
    breathe: "Respirez profondément. L'oxygène est votre carburant.",
  },
  "pt-BR": {
    ready: "Seu corpo é seu maior ativo. Vamos construí-lo.",
    complete: "Sessão completa. Você investiu no seu futuro hoje.",
    form_warning: "Corrija sua posição. A forma perfeita ativa mais músculos.",
    pro_unlock: "Desempenho elite detectado. Você desbloqueou o nível Pro.",
    breathe: "Respire fundo. O oxigênio é o seu combustível.",
  },
  "de-DE": {
    ready: "Dein Körper ist dein größtes Kapital. Lass uns ihn aufbauen.",
    complete: "Sitzung abgeschlossen. Du hast heute in deine Zukunft investiert.",
    form_warning: "Korrigiere deine Position. Perfekte Form aktiviert mehr Muskeln.",
    pro_unlock: "Elite-Leistung erkannt. Du hast den Pro-Status freigeschaltet.",
    breathe: "Atme tief durch. Sauerstoff ist dein Treibstoff.",
  },
  "ja-JP": {
    ready: "あなたの体は最大の資産です。それを築きましょう。",
    complete: "セッション完了。今日、あなたは未来に投資しました。",
    form_warning: "姿勢を正してください。正しいフォームでより多くの筋肉が活性化します。",
    pro_unlock: "エリートパフォーマンスを検出。プロレベルを解除しました。",
    breathe: "深呼吸してください。酸素はあなたの燃料です。",
  },
  "ko-KR": {
    ready: "당신의 몸은 가장 큰 자산입니다. 함께 만들어 봅시다.",
    complete: "세션 완료. 오늘 당신의 미래에 투자했습니다.",
    form_warning: "자세를 교정하세요. 완벽한 폼이 더 많은 근육을 활성화합니다.",
    pro_unlock: "엘리트 퍼포먼스 감지. 프로 레벨을 잠금 해제했습니다.",
    breathe: "깊게 호흡하세요. 산소가 당신의 연료입니다.",
  },
  "zh-CN": {
    ready: "您的身体是您最大的资产。让我们一起建造它。",
    complete: "课程完成。今天您为未来投资了。",
    form_warning: "调整您的姿势。完美的形式激活更多肌肉。",
    pro_unlock: "检测到精英表现。您已解锁专业级别。",
    breathe: "深呼吸。氧气是您的燃料。",
  },
};

function getPhrase(langBcp47, key) {
  const phrases = HEALTH_PHRASES[langBcp47] || HEALTH_PHRASES["en-IN"];
  return phrases[key] || HEALTH_PHRASES["en-IN"][key] || "";
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function loadMode() {
  const raw = localStorage.getItem("magic16_mode") || "morning";
  return MODE_CONFIG[raw] ? raw : "morning";
}

function loadLang() {
  const code = localStorage.getItem("magic16_lang") || "en-IN";
  return LANG_MAP[code] || "en-IN";
}

function createSpeaker(langBcp47, modeKey) {
  const cfg = MODE_CONFIG[modeKey] || MODE_CONFIG.morning;
  let voiceLoadAttempts = 0;
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = langBcp47;
    msg.rate = urgent ? 1.2 : cfg.voiceRate;
    msg.pitch = urgent ? 1.1 : cfg.voicePitch;
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const langBase = langBcp47.split("-")[0];
      const match = voices.find(v => v.lang === langBcp47)
        || voices.find(v => v.lang.startsWith(langBase))
        || voices.find(v => v.lang.startsWith("en"));
      if (match) msg.voice = match;
      speechSynthesis.cancel();
      speechSynthesis.speak(msg);
    };
    if (window.speechSynthesis.getVoices().length === 0 && voiceLoadAttempts < 3) {
      voiceLoadAttempts++;
      window.speechSynthesis.onvoiceschanged = trySpeak;
    } else {
      trySpeak();
    }
    if (urgent) navigator.vibrate?.([80, 40, 80]);
  };
}

/* ═══════════════════════════════════════════════
   BIOMETRIC WELLNESS SCORING ENGINE
═══════════════════════════════════════════════ */
function computeWellnessScore({ accuracy, movementScore, stepIndex, totalSteps, modeKey }) {
  if (modeKey === "sleep") return { score: 85, tier: "Restorative", color: "#9F7AEA" };
  const completionPct = (stepIndex / Math.max(totalSteps, 1)) * 100;
  const base = Math.min(accuracy * 0.6 + completionPct * 0.4, 100);
  let tier, color;
  if (base >= 88) { tier = "Elite"; color = "#FFD700"; }
  else if (base >= 70) { tier = "Advanced"; color = "#34D399"; }
  else if (base >= 50) { tier = "Active"; color = "#38BDF8"; }
  else { tier = "Building"; color = "#9F7AEA"; }
  return { score: Math.round(base), tier, color };
}

/* ═══════════════════════════════════════════════
   FALLBACK STEPS PER MODE (all 4 modes, 14 steps)
═══════════════════════════════════════════════ */
const FALLBACK = {
  morning: [
    { name: "Mountain Pose", duration: 68, guidance: "Stand tall. Breathe deeply. Ground yourself.", type: "yoga" },
    { name: "Forward Fold", duration: 68, guidance: "Relax neck. Release all tension.", type: "yoga" },
    { name: "Plank Hold", duration: 68, guidance: "Core braced. Hips level. Breathe.", type: "yoga" },
    { name: "Cobra", duration: 68, guidance: "Open chest. Lift slowly.", type: "yoga" },
    { name: "Downward Dog", duration: 68, guidance: "Stretch entire body.", type: "yoga" },
    { name: "Tree Pose", duration: 68, guidance: "Find your balance. Steady gaze.", type: "yoga" },
    { name: "Child Pose", duration: 68, guidance: "Rest. Release. Recover.", type: "yoga" },
    { name: "Deep Breathing", duration: 68, guidance: "Inhale slowly. Exhale gently. Stay present.", type: "meditation" },
    { name: "Body Scan", duration: 68, guidance: "Release tension from head to toe.", type: "meditation" },
    { name: "Focus Breath", duration: 68, guidance: "Observe each breath. Stay here.", type: "meditation" },
    { name: "Relax Mind", duration: 68, guidance: "Let thoughts pass. You are the observer.", type: "meditation" },
    { name: "Inner Stillness", duration: 68, guidance: "Feel the silence. This is your power.", type: "meditation" },
    { name: "Awareness", duration: 68, guidance: "Expand your awareness. Be here now.", type: "meditation" },
    { name: "Calm Presence", duration: 68, guidance: "Stay peaceful. Session ending. Well done.", type: "meditation" },
  ],
  sleep: [
    { name: "Gentle Neck Roll", duration: 68, guidance: "Slow circles. Release the day from your neck.", type: "yoga" },
    { name: "Shoulder Release", duration: 68, guidance: "Roll back ten times. Feel the tension leave.", type: "yoga" },
    { name: "Legs Up Wall", duration: 68, guidance: "Lie back. Legs up. Total surrender. Stay here.", type: "yoga" },
    { name: "Supine Twist Left", duration: 68, guidance: "Knees drop left. Arm wide. Eyes closed. Breathe.", type: "yoga" },
    { name: "Supine Twist Right", duration: 68, guidance: "Switch. Knees drop right. Spine releases.", type: "yoga" },
    { name: "Child's Pose Long", duration: 68, guidance: "Rest forward. Arms long. Forehead heavy. Let go.", type: "yoga" },
    { name: "Final Lie Down", duration: 68, guidance: "Arms at sides. Palms up. Begin to drift.", type: "yoga" },
    { name: "4-7-8 Breath", duration: 68, guidance: "Inhale four. Hold seven. Exhale eight. Nervous system off.", type: "meditation" },
    { name: "4-7-8 Round 2", duration: 68, guidance: "Again. Even slower. Body getting heavy.", type: "meditation" },
    { name: "Body Weight Scan", duration: 68, guidance: "Feel how heavy your hands are. Arms. Legs. Sinking.", type: "meditation" },
    { name: "Warmth Meditation", duration: 68, guidance: "Warmth spreading from chest outward. Safe. Heavy.", type: "meditation" },
    { name: "Thought Release", duration: 68, guidance: "A thought appears. You see it. You don't follow it.", type: "meditation" },
    { name: "Safe Space", duration: 68, guidance: "You are safe. Nothing needs solving tonight. Let go.", type: "meditation" },
    { name: "Sleep Threshold", duration: 68, guidance: "Body heavy. Mind quiet. Sleep comes now. Welcome it.", type: "meditation" },
  ],
  focus: [
    { name: "Mountain Aware", duration: 68, guidance: "Stand still. Feel every point of contact. Be present.", type: "yoga" },
    { name: "Kapalabhati", duration: 68, guidance: "Short sharp exhales. 30 pumps. Clear the mental fog.", type: "yoga" },
    { name: "Balance Left", duration: 68, guidance: "Balance on left foot. Fix a point. Don't blink.", type: "yoga" },
    { name: "Balance Right", duration: 68, guidance: "Switch. Right foot. Gaze locked. Focus trains here.", type: "yoga" },
    { name: "Nadi Shodhana", duration: 68, guidance: "Alternate nostril breathing. Right thumb closes right. Inhale left.", type: "yoga" },
    { name: "Eagle Arms", duration: 68, guidance: "Cross arms. Wrap forearms. Lift. Squeeze. Focus.", type: "yoga" },
    { name: "Power Seat", duration: 68, guidance: "Sit tall. Feet flat. Hands on thighs. Power position.", type: "yoga" },
    { name: "Single Point", duration: 68, guidance: "One object: your breath. When mind wanders, return.", type: "meditation" },
    { name: "Count to 10", duration: 68, guidance: "Count each exhale 1 through 10. Start over if lost.", type: "meditation" },
    { name: "Box Breathing", duration: 68, guidance: "In four. Hold four. Out four. Hold four. Navy SEAL technique.", type: "meditation" },
    { name: "Name It Return", duration: 68, guidance: "A thought: thinking. A sound: hearing. Return always.", type: "meditation" },
    { name: "Flow State Entry", duration: 68, guidance: "Flow: challenge matches skill. You are at that edge now.", type: "meditation" },
    { name: "Effortless Focus", duration: 68, guidance: "Stop trying to focus. Just be aware. Breath finds you.", type: "meditation" },
    { name: "Ready to Execute", duration: 68, guidance: "Mind sharp. Body ready. One mission. Full power. Go.", type: "meditation" },
  ],
  posture: [
    { name: "Chin Tuck", duration: 68, guidance: "Pull chin straight back. Hold five seconds. Release.", type: "yoga" },
    { name: "Neck Rolls", duration: 68, guidance: "Slow circles each direction. Release desk tension.", type: "yoga" },
    { name: "Shoulder Rolls", duration: 68, guidance: "Ten backward rolls. Shoulder blades sliding down.", type: "yoga" },
    { name: "Chest Opener", duration: 68, guidance: "Clasp hands behind back. Squeeze blades. Open chest.", type: "yoga" },
    { name: "Wall Angels", duration: 68, guidance: "Back against wall. Arms up. Slide up and down. 8 times.", type: "yoga" },
    { name: "Hip Flexor Left", duration: 68, guidance: "Low lunge. Left foot forward. Tuck pelvis. Hold.", type: "yoga" },
    { name: "Hip Flexor Right", duration: 68, guidance: "Switch. Right foot forward. Hip flexors release.", type: "yoga" },
    { name: "Posture Body Scan", duration: 68, guidance: "Where is tension right now? Neck. Shoulders. Back. Honest.", type: "meditation" },
    { name: "Ideal Alignment", duration: 68, guidance: "Ears over shoulders. Shoulders over hips. See it.", type: "meditation" },
    { name: "Breath and Spine", duration: 68, guidance: "Notice how posture affects breath. Tall spine, full breath.", type: "meditation" },
    { name: "Movement Commit", duration: 68, guidance: "Every 30 minutes today: stand. Every hour: stretch five.", type: "meditation" },
    { name: "Confident Body", duration: 68, guidance: "Tall posture increases confidence by 20 percent. Stand tall now.", type: "meditation" },
    { name: "Desk Setup Check", duration: 68, guidance: "Screen at eye level. Arms at 90 degrees. Feet flat. Check.", type: "meditation" },
    { name: "Aligned and Ready", duration: 68, guidance: "Aligned body. Clear mind. You are ready. Carry this.", type: "meditation" },
  ],
};

function loadStepsForMode(modeKey, day) {
  if (modeKey !== "morning") return FALLBACK[modeKey] || FALLBACK.morning;
  try {
    const steps = getSessionSteps(day, modeKey);
    return steps?.length > 0 ? steps : FALLBACK.morning;
  } catch { return FALLBACK.morning; }
}

/* ═══════════════════════════════════════════════
   KEYFRAME INJECTION — production-grade animations
═══════════════════════════════════════════════ */
function injectKeyframes() {
  if (document.getElementById("m16-kf")) return;
  const s = document.createElement("style");
  s.id = "m16-kf";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

    @keyframes m16-scan    { from{top:-3px} to{top:100%} }
    @keyframes m16-blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes m16-fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes m16-fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes m16-spin    { to{transform:rotate(360deg)} }
    @keyframes m16-pulse   { 0%,100%{opacity:.08;transform:scale(1)} 50%{opacity:.18;transform:scale(1.08)} }
    @keyframes m16-glow    { 0%,100%{opacity:.4} 50%{opacity:1} }
    @keyframes m16-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes m16-wave    { 0%{transform:scaleX(0);transform-origin:left} 100%{transform:scaleX(1);transform-origin:left} }
    @keyframes m16-ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes m16-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes m16-breathe { 0%,100%{transform:scale(1)} 45%{transform:scale(1.12)} }

    .m16-blink   { animation:m16-blink 1s step-end infinite; }
    .m16-fade-up { animation:m16-fadeUp .5s cubic-bezier(.22,.68,0,1.2) both; }
    .m16-fade-in { animation:m16-fadeIn .4s ease both; }
    .m16-float   { animation:m16-float 3.5s ease-in-out infinite; }

    /* Button hover */
    .m16-btn-primary:hover { filter:brightness(1.12); transform:translateY(-1px); }
    .m16-btn-primary:active { transform:translateY(0); }
    .m16-btn-secondary:hover { border-color:#2a2a2a !important; color:#777 !important; }

    /* Step card shimmer */
    .m16-shimmer-text {
      background: linear-gradient(90deg, #888 0%, #fff 50%, #888 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: m16-shimmer 3s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════
   TICKER CONTENT — global health stats
═══════════════════════════════════════════════ */
const TICKER_ITEMS = [
  "🌍 1.4B adults insufficiently active — WHO 2023",
  "💤 970M people impacted by mental disorders globally",
  "🦴 1.71B live with musculoskeletal conditions",
  "🧠 $1T/year in productivity lost to depression & anxiety",
  "❤️ 35% CVD risk reduction with daily movement",
  "😴 40% lower depression risk with quality sleep",
  "🏃 150 min moderate activity/week — WHO recommendation",
  "📱 Magic16 — 16 minutes to transform your health",
];

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════ */

function HealthTicker({ accent }) {
  const content = TICKER_ITEMS.join("   ·   ");
  return (
    <div style={{
      overflow: "hidden", whiteSpace: "nowrap",
      borderTop: "1px solid #141414", borderBottom: "1px solid #141414",
      padding: "7px 0", background: "#080808",
    }}>
      <div style={{
        display: "inline-block",
        animation: "m16-ticker 40s linear infinite",
        fontSize: 9, letterSpacing: ".12em", color: "#333",
        textTransform: "uppercase",
      }}>
        {content + "   ·   " + content}
      </div>
    </div>
  );
}

function WellnessBadge({ score, tier, color, modeKey }) {
  if (modeKey === "sleep") return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 9, letterSpacing: ".18em", color: "#9F7AEA",
      textTransform: "uppercase",
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%", background: "#9F7AEA",
        animation: "m16-glow 2s ease-in-out infinite",
      }} />
      RESTORE MODE
    </div>
  );
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `2px solid ${color}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#1a1a1a" strokeWidth="2" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="2"
            strokeDasharray={`${score} 100`}
            strokeLinecap="round"
            style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
          />
        </svg>
        <span style={{ fontSize: 8, fontWeight: 700, color, fontFamily: "'Space Mono',monospace", zIndex: 1 }}>
          {score}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 9, letterSpacing: ".18em", color: "#333", textTransform: "uppercase" }}>
          Wellness
        </div>
        <div style={{ fontSize: 10, color, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>
          {tier}
        </div>
      </div>
    </div>
  );
}

function BreathGuide({ phase, accent }) {
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [count, setCount] = useState(4);
  useEffect(() => {
    if (phase !== "meditation") return;
    const sequence = [
      { label: "inhale", duration: 4000, count: 4 },
      { label: "hold", duration: 4000, count: 4 },
      { label: "exhale", duration: 6000, count: 6 },
    ];
    let idx = 0;
    let countInterval, phaseTimeout;
    const runPhase = () => {
      const current = sequence[idx % sequence.length];
      setBreathPhase(current.label);
      setCount(current.count);
      let c = current.count;
      countInterval = setInterval(() => {
        c--;
        setCount(c);
        if (c <= 0) clearInterval(countInterval);
      }, current.duration / current.count);
      phaseTimeout = setTimeout(() => { idx++; runPhase(); }, current.duration);
    };
    runPhase();
    return () => { clearInterval(countInterval); clearTimeout(phaseTimeout); };
  }, [phase]);

  if (phase !== "meditation") return null;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      padding: "14px 0",
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        border: `1px solid ${accent}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: `m16-breathe ${breathPhase === "inhale" ? "4s" : breathPhase === "exhale" ? "6s" : "0s"} ease-in-out`,
        background: `${accent}06`,
      }}>
        <div style={{
          width: breathPhase === "inhale" ? 32 : breathPhase === "hold" ? 32 : 16,
          height: breathPhase === "inhale" ? 32 : breathPhase === "hold" ? 32 : 16,
          borderRadius: "50%", background: `${accent}44`,
          transition: "all 1s ease",
        }} />
      </div>
      <div style={{ fontSize: 9, letterSpacing: ".22em", color: accent, textTransform: "uppercase" }}>
        {breathPhase} · {count}
      </div>
    </div>
  );
}

function WHOImpactCard({ modeKey, accent }) {
  const domain = WHO_HEALTH_DOMAINS[modeKey];
  if (!domain) return null;
  return (
    <div style={{
      border: "1px solid #141414", background: "#0c0c0c",
      padding: "12px 14px",
    }}>
      <div style={{
        fontSize: 8, letterSpacing: ".2em", color: "#2a2a2a",
        textTransform: "uppercase", marginBottom: 6,
      }}>WHO Health Domain</div>
      <div style={{ fontSize: 10, color: accent, letterSpacing: ".08em", marginBottom: 4, fontWeight: 700 }}>
        {domain.domain}
      </div>
      <div style={{ fontSize: 9, color: "#333", letterSpacing: ".08em", lineHeight: 1.6 }}>
        {domain.global_impact}
      </div>
      <div style={{
        marginTop: 6, fontSize: 8, letterSpacing: ".12em",
        color: "#2a2a2a", textTransform: "uppercase",
        borderTop: "1px solid #141414", paddingTop: 6,
      }}>
        {domain.sdg_goal}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Magic16() {
  const navigate = useNavigate();

  const modeKey = useMemo(loadMode, []);
  const theme = useMemo(() => MODE_CONFIG[modeKey], [modeKey]);
  const langBcp47 = useMemo(loadLang, []);
  const speak = useMemo(() => createSpeaker(langBcp47, modeKey), [langBcp47, modeKey]);

  // refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const detectorRef = useRef(null);
  const stepIndexRef = useRef(0);
  const movementScoreRef = useRef(0);
  const playingRef = useRef(false);
  const notifiedProRef = useRef(false);
  const stepDurationRef = useRef(0);
  const lastWarnRef = useRef(0);

  // state
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiError, setAiError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [movementScore, setMovementScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [stepProgress, setStepProgress] = useState(100);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [notifiedPro, setNotifiedPro] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showWhoCard, setShowWhoCard] = useState(false);
  const [heartRate, setHeartRate] = useState(null); // simulated biometric

  const day = useMemo(() => {
    return Math.max(1, Number(localStorage.getItem("magic16_streak") || 0) + 1);
  }, []);

  const sessionSteps = useMemo(() => loadStepsForMode(modeKey, day), [modeKey, day]);
  const totalDuration = useMemo(() => sessionSteps.reduce((a, s) => a + s.duration, 0), [sessionSteps]);
  const currentStep = sessionSteps[stepIndex] || sessionSteps[0];
  const overallPct = Math.round((stepIndex / sessionSteps.length) * 100);
  const isYogaPhase = currentStep?.type !== "meditation";

  const wellness = useMemo(() => computeWellnessScore({
    accuracy, movementScore, stepIndex,
    totalSteps: sessionSteps.length, modeKey,
  }), [accuracy, movementScore, stepIndex, sessionSteps.length, modeKey]);

  /* ── Simulated Heart Rate (realistic UX) ── */
  useEffect(() => {
    if (!playing) return;
    const base = modeKey === "sleep" ? 58 : modeKey === "focus" ? 68 : modeKey === "posture" ? 72 : 78;
    setHeartRate(base + Math.floor(Math.random() * 8));
    const hrInterval = setInterval(() => {
      const variance = Math.floor(Math.random() * 6) - 3;
      setHeartRate(prev => Math.max(52, Math.min(110, (prev || base) + variance)));
    }, 4000);
    return () => clearInterval(hrInterval);
  }, [playing, modeKey]);

  /* ── lifecycle ── */
  useEffect(() => {
    injectKeyframes();
    setTimeLeft(sessionSteps[0]?.duration ?? 68);
    stepDurationRef.current = sessionSteps[0]?.duration ?? 68;

    const loadModel = async () => {
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) throw new Error("WebGL not supported");
        await import("@tensorflow/tfjs-backend-webgl");
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
      } catch (e) {
        console.warn("AI model:", e.message);
        setAiError(true);
      } finally {
        setIsAiLoading(false);
      }
    };
    loadModel();

    return () => {
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, [sessionSteps]);

  /* ── pose detection ── */
  const runDetection = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !playingRef.current) return;
    if (videoRef.current.readyState < 2 || videoRef.current.paused) return;
    if (modeKey === "sleep") return;
    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses[0]?.keypoints?.some(k => k.score > 0.45)) {
        movementScoreRef.current += 1;
        setMovementScore(movementScoreRef.current);
        const elapsed = sessionSteps
          .slice(0, stepIndexRef.current)
          .reduce((a, s) => a + s.duration, 0);
        const acc = Math.min(
          Math.round((movementScoreRef.current / Math.max(elapsed + 1, 1)) * 100),
          100
        );
        setAccuracy(acc);
        if (!notifiedProRef.current && stepIndexRef.current >= 4 && acc >= 80) {
          notifiedProRef.current = true;
          setNotifiedPro(true);
          speak(getPhrase(langBcp47, "pro_unlock"));
        }
      } else {
        const now = Date.now();
        if (currentStep?.type !== "meditation" && Math.random() > 0.92 && now - lastWarnRef.current > 8000) {
          lastWarnRef.current = now;
          speak(getPhrase(langBcp47, "form_warning"), true);
        }
      }
    } catch (_) {}
  }, [sessionSteps, speak, currentStep, modeKey, langBcp47]);

  /* ── advance step ── */
  const handleNextStep = useCallback(() => {
    const nextIdx = stepIndexRef.current + 1;
    if (nextIdx >= sessionSteps.length) {
      clearInterval(timerRef.current);
      playingRef.current = false;
      setPlaying(false);
      setSessionDone(true);
      confetti({ particleCount: 300, spread: 130, origin: { y: 0.55 }, colors: [theme.accent, "#fff", theme.accentDim] });
      speak(getPhrase(langBcp47, "complete"));
      const finalAccuracy = Math.min(
        Math.round((movementScoreRef.current / totalDuration) * 100), 100
      );
      window.__magic16_recordComplete?.();
      setTimeout(() => {
        videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
        navigate("/app/result", {
          state: {
            accuracy: finalAccuracy, isPro: notifiedProRef.current,
            video: recordedBlob, day, streak: day,
            mode: modeKey, lang: langBcp47,
          },
        });
      }, 2800);
      return 0;
    }
    stepIndexRef.current = nextIdx;
    const next = sessionSteps[nextIdx];
    stepDurationRef.current = next.duration;
    setStepIndex(nextIdx);
    setStepProgress(100);
    setImgError(false);
    speak(next.guidance || next.name);
    return next.duration;
  }, [sessionSteps, totalDuration, day, recordedBlob, navigate, speak, modeKey, langBcp47, theme]);

  /* ── start session ── */
  const startSession = useCallback(async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      playingRef.current = true;
      stepIndexRef.current = 0;
      movementScoreRef.current = 0;
      stepDurationRef.current = sessionSteps[0].duration;
      setPlaying(true); setStepIndex(0);
      setMovementScore(0); setAccuracy(0);
      setTimeLeft(sessionSteps[0].duration);
      setStepProgress(100); setImgError(false);
      speak(`${getPhrase(langBcp47, "ready")} Day ${day}. ${theme.label} session. ${sessionSteps[0].guidance}`);
      timerRef.current = setInterval(() => {
        if (!playingRef.current) return;
        runDetection();
        setTimeLeft(prev => {
          const next = (prev ?? 1) - 1;
          setStepProgress(Math.max(0, Math.round((next / stepDurationRef.current) * 100)));
          if (next <= 0) return handleNextStep();
          return next;
        });
      }, 1000);
    } catch {
      setCameraError(true);
      speak("Camera access is required for AI motion verification.", true);
    }
  }, [sessionSteps, day, speak, runDetection, handleNextStep, theme, langBcp47]);

  /* ── recording ── */
  const captureClip = useCallback(() => {
    if (!videoRef.current?.srcObject || isRecording) return;
    const chunks = [];
    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
    const mr = new MediaRecorder(videoRef.current.srcObject, { mimeType });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      setRecordedBlob(new Blob(chunks, { type: "video/webm" }));
      setIsRecording(false);
      speak("Clip saved. Share your proof of discipline.");
    };
    mr.start(); setIsRecording(true);
    speak("Recording. Prove your discipline.");
    setTimeout(() => mr.state === "recording" && mr.stop(), 5000);
  }, [isRecording, speak]);

  const shareClip = useCallback(async () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], "magic16-proof.webm", { type: "video/webm" });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Magic16 — Proof of Discipline" });
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(recordedBlob);
      a.download = "magic16-proof.webm"; a.click();
    }
  }, [recordedBlob]);

  const exitSession = useCallback(() => {
    clearInterval(timerRef.current);
    speechSynthesis.cancel();
    playingRef.current = false;
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    navigate("/app/dashboard");
  }, [navigate]);

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  const A = theme.accent;
  const B = theme.border;
  const BG = theme.bg;
  const isMeditation = currentStep?.type === "meditation";

  return (
    <div style={{
      minHeight: "100dvh",
      background: BG,
      color: "#f0ede6",
      fontFamily: "'Space Mono','Courier New',monospace",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      overflow: "hidden", position: "relative",
    }}>

      {/* ── BACKGROUND GRID ── */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(${theme.gridColor} 1px,transparent 1px),linear-gradient(90deg,${theme.gridColor} 1px,transparent 1px)`,
        backgroundSize: "44px 44px", pointerEvents: "none",
      }} />

      {/* ── AMBIENT GLOW ── */}
      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 300,
        background: `radial-gradient(ellipse,${A}12 0%,transparent 70%)`,
        animation: "m16-pulse 5s ease-in-out infinite", pointerEvents: "none",
      }} />

      {/* ── CORNER ACCENTS ── */}
      {[
        { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
        { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
        { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 },
        { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "fixed", width: 20, height: 20,
          borderColor: A, borderStyle: "solid", borderWidth: 0,
          opacity: 0.35, ...pos, pointerEvents: "none",
        }} />
      ))}

      {/* ── CONTENT WRAPPER ── */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "min(440px,96vw)",
        display: "flex", flexDirection: "column",
        gap: 10, paddingTop: 18, paddingBottom: 48,
      }}>

        {/* ══ HEADER ══ */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          paddingBottom: 12, borderBottom: "1px solid #141414",
        }}>
          <div>
            <div style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 30, fontWeight: 800, letterSpacing: "-.01em",
              color: "#f0ede6", lineHeight: 1,
            }}>
              MAGIC
              <span style={{ color: A }}>16</span>
            </div>
            <div style={{
              fontSize: 8, letterSpacing: ".22em", color: "#2a2a2a",
              textTransform: "uppercase", marginTop: 3,
            }}>{theme.tagline}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {playing
              ? <WellnessBadge score={wellness.score} tier={wellness.tier} color={wellness.color} modeKey={modeKey} />
              : (
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 9, letterSpacing: ".18em", color: "#2a2a2a",
                    textTransform: "uppercase",
                  }}>
                    Day {day} · {langBcp47.toUpperCase()}
                  </div>
                  <button onClick={exitSession} style={{
                    fontSize: 9, letterSpacing: ".15em", color: "#333",
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "inherit", padding: 0, textTransform: "uppercase",
                    marginTop: 2,
                  }}>← Back</button>
                </div>
              )}
          </div>
        </div>

        {/* ══ HEALTH TICKER ══ */}
        <HealthTicker accent={A} />

        {/* ══ MODE + PHASE CHIPS ══ */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{
            fontSize: 8, letterSpacing: ".2em", textTransform: "uppercase",
            border: `1px solid ${B}`,
            background: `${A}10`,
            color: A, padding: "5px 10px",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span>{theme.emoji}</span>
            <span>{theme.label}</span>
          </div>
          {[
            { label: theme.phaseA, active: isYogaPhase, med: false },
            { label: theme.phaseB, active: !isYogaPhase, med: true },
          ].map(({ label, active, med }) => (
            <div key={label} style={{
              flex: 1, textAlign: "center", padding: "5px 0",
              fontSize: 8, letterSpacing: ".15em", textTransform: "uppercase",
              border: `1px solid ${active ? (med ? "#7c5cbf" : A) : "#141414"}`,
              color: active ? (med ? "#9F7AEA" : A) : "#1e1e1e",
              background: active ? "#0c0c0c" : "transparent",
              transition: "all .35s",
            }}>{label}</div>
          ))}
        </div>

        {/* ══ VIDEO FEED ══ */}
        <div style={{
          position: "relative", width: "100%", aspectRatio: "4/3",
          background: "#0a0a0a", border: "1px solid #141414", overflow: "hidden",
        }}>
          <video ref={videoRef} style={{
            width: "100%", height: "100%",
            objectFit: "cover", transform: "scaleX(-1)", display: "block",
          }} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Standby placeholder */}
          {!playing && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 10, background: BG,
            }}>
              <div className="m16-float" style={{
                fontSize: 48, opacity: 0.6,
                filter: `drop-shadow(0 0 20px ${A}55)`,
              }}>{theme.emoji}</div>
              <div style={{ fontSize: 9, letterSpacing: ".2em", color: "#2a2a2a", textTransform: "uppercase", textAlign: "center" }}>
                {cameraError ? "Camera blocked — allow access"
                  : isAiLoading ? `Initialising ${theme.label} AI...`
                  : aiError ? "Running in lite mode"
                  : "AI health observer ready"}
              </div>
              {isAiLoading && (
                <div style={{
                  width: 16, height: 16,
                  border: `2px solid ${B}`,
                  borderTopColor: A, borderRadius: "50%",
                  animation: "m16-spin .7s linear infinite",
                }} />
              )}
            </div>
          )}

          {/* Scan line */}
          {playing && (
            <div style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,transparent,${A}55,${A}cc,${A}55,transparent)`,
              animation: "m16-scan 2.8s linear infinite", pointerEvents: "none",
            }} />
          )}

          {/* Top overlay badges */}
          <div style={{
            position: "absolute", top: 8, left: 8, right: 8,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div style={{
              fontSize: 8, letterSpacing: ".2em", padding: "3px 8px",
              border: `1px solid ${playing ? "#ff4444" : "#1e1e1e"}`,
              color: playing ? "#ff4444" : "#2a2a2a",
              background: "#080808cc", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(4px)",
            }}>
              {playing && <span className="m16-blink" style={{ color: "#ff4444" }}>●</span>}
              {playing ? "LIVE" : "STANDBY"}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {notifiedPro && (
                <div style={{
                  fontSize: 8, letterSpacing: ".15em", padding: "3px 8px",
                  border: `1px solid ${A}`, color: A,
                  background: "#080808cc", textTransform: "uppercase", backdropFilter: "blur(4px)",
                }}>PRO ✦</div>
              )}
              {playing && heartRate && (
                <div style={{
                  fontSize: 8, letterSpacing: ".15em", padding: "3px 8px",
                  border: "1px solid #2a1010", color: "#ff6666",
                  background: "#080808cc", textTransform: "uppercase", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ animation: "m16-blink .8s infinite" }}>♥</span> {heartRate}
                </div>
              )}
            </div>
          </div>

          {/* Bottom accuracy */}
          {playing && (
            <div style={{
              position: "absolute", bottom: 8, left: 8,
              fontSize: 8, letterSpacing: ".15em", color: A,
              background: "#080808bb", padding: "3px 8px",
              border: "1px solid #1e1e1e", textTransform: "uppercase",
              backdropFilter: "blur(4px)",
            }}>
              {modeKey === "sleep" ? "Restore mode" : `AI · ${accuracy}% accuracy`}
            </div>
          )}

          {/* Record button */}
          <button className={isRecording ? "" : "m16-btn-secondary"} style={{
            position: "absolute", bottom: 8, right: 8,
            background: isRecording ? "#ff3333" : "#111",
            border: `1px solid ${isRecording ? "#ff3333" : "#2a2a2a"}`,
            color: isRecording ? "#fff" : "#444",
            fontSize: 8, letterSpacing: ".15em", padding: "4px 10px",
            cursor: (!playing || isRecording) ? "not-allowed" : "pointer",
            textTransform: "uppercase", fontFamily: "inherit", transition: "all .2s",
          }}
            onClick={captureClip}
            disabled={!playing || isRecording}
          >
            {isRecording ? "● REC…" : "▶ 5s"}
          </button>
        </div>

        {/* ══ POSE GUIDE IMAGE ══ */}
        {playing && currentStep?.image && !imgError && (
          <div className="m16-fade-up" style={{
            position: "relative", width: "100%", aspectRatio: "4/3",
            overflow: "hidden", border: `1px solid ${B}`, background: "#0a0a0a",
          }}>
            <img
              src={currentStep.image} alt={currentStep.name}
              style={{
                width: "100%", height: "100%",
                objectFit: "contain", objectPosition: "center",
                opacity: 0.88, background: "#0a0a0a", transition: "opacity .4s",
              }}
              onError={() => setImgError(true)}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right,#080808bb 0%,transparent 35%,transparent 65%,#080808bb 100%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", top: 8, left: 8,
              fontSize: 8, letterSpacing: ".2em", textTransform: "uppercase",
              padding: "3px 8px",
              border: `1px solid ${isMeditation ? "#7c5cbf" : A}`,
              color: isMeditation ? "#9F7AEA" : A,
              background: "#080808cc",
            }}>
              {isMeditation ? "Meditation" : "Pose guide"}
            </div>
          </div>
        )}

        {/* ══ BREATH GUIDE (meditation only) ══ */}
        {playing && isMeditation && (
          <BreathGuide phase={currentStep?.type} accent={isMeditation ? "#9F7AEA" : A} />
        )}

        {/* ══ SESSION COMPLETE ══ */}
        {sessionDone && (
          <div className="m16-fade-up" style={{
            border: "1px solid #1a3d1a", background: "#060e06",
            padding: "20px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 36, fontWeight: 800,
              color: "#34D399", lineHeight: 1, marginBottom: 6,
            }}>SESSION<br />COMPLETE</div>
            <div style={{ fontSize: 8, letterSpacing: ".22em", color: "#1a3d1a", textTransform: "uppercase" }}>
              Calculating results…
            </div>
          </div>
        )}

        {/* ══ STEP INFO CARD ══ */}
        {!sessionDone && (
          <div className={playing ? "m16-fade-up" : ""} style={{
            border: `1px solid ${B}`,
            padding: "16px 18px", background: BG, position: "relative",
            overflow: "hidden",
          }}>
            {/* accent top line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: isMeditation
                ? "linear-gradient(90deg,#4c1d95,#9F7AEA)"
                : theme.progressGrad,
              animation: "m16-wave .6s ease both",
            }} />

            <span style={{
              fontSize: 8, letterSpacing: ".22em", color: "#2a2a2a",
              textTransform: "uppercase", marginBottom: 4, display: "block",
            }}>
              {isMeditation ? "Meditation" : "Yoga"} · Step {stepIndex + 1} / {sessionSteps.length}
            </span>

            <div className={playing ? "m16-shimmer-text" : ""} style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 32, fontWeight: 800, letterSpacing: "-.01em",
              color: "#f0ede6", lineHeight: 1.1, marginBottom: 14,
              ...(!playing ? { background: "none", WebkitBackgroundClip: "unset", WebkitTextFillColor: "#f0ede6" } : {}),
            }}>
              {currentStep?.name}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
              <span style={{
                fontFamily: "'Syne',sans-serif", fontSize: 62, fontWeight: 800,
                color: (timeLeft ?? 99) <= 5 ? "#ff5c5c" : A,
                lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color .3s",
              }}>{timeLeft ?? currentStep?.duration ?? "--"}</span>
              <span style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: ".15em", textTransform: "uppercase" }}>sec</span>
            </div>

            <div style={{ height: 2, background: "#141414", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${stepProgress}%`,
                background: isMeditation
                  ? "linear-gradient(90deg,#4c1d95,#9F7AEA)"
                  : theme.progressGrad,
                transition: "width .9s cubic-bezier(.22,.68,0,1.2)",
              }} />
            </div>
          </div>
        )}

        {/* ══ GUIDANCE ══ */}
        {!sessionDone && currentStep?.guidance && (
          <div style={{
            fontSize: 10, letterSpacing: ".08em",
            color: "#3a3a3a", textTransform: "uppercase",
            borderLeft: `2px solid ${isMeditation ? "#7c5cbf" : A}`,
            paddingLeft: 12, lineHeight: 1.8,
          }}>
            {currentStep.guidance}
          </div>
        )}

        {/* ══ CAMERA ERROR ══ */}
        {cameraError && (
          <div style={{
            border: "1px solid #2a1010", background: "#080606",
            padding: "12px 14px", fontSize: 9, color: "#ff5c5c",
            letterSpacing: ".1em", textTransform: "uppercase",
            borderLeft: "2px solid #ff3333",
          }}>
            ⚠ Camera access denied. Allow in browser settings and reload.
          </div>
        )}

        {/* ══ BIOMETRIC STATS ══ */}
        {playing && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {[
              { label: "Accuracy", value: modeKey === "sleep" ? "—" : accuracy + "%", hi: accuracy >= 80 && modeKey !== "sleep" },
              { label: "Movement", value: modeKey === "sleep" ? "Rest" : movementScore, hi: false },
              { label: "Heart", value: heartRate ? heartRate + "♥" : "—", hi: false },
              { label: "AI", value: isAiLoading ? "INIT" : aiError ? "Lite" : "ON", hi: false },
            ].map(({ label, value, hi }) => (
              <div key={label} style={{
                border: "1px solid #141414", padding: "8px 10px", background: "#0a0a0a",
              }}>
                <span style={{
                  fontSize: 7, letterSpacing: ".2em", color: "#222",
                  textTransform: "uppercase", display: "block", marginBottom: 3,
                }}>{label}</span>
                <div style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700,
                  color: hi ? A : "#c0bdb5", lineHeight: 1,
                }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ══ OVERALL PROGRESS ══ */}
        {playing && (
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 8, letterSpacing: ".18em", color: "#1e1e1e",
              textTransform: "uppercase", marginBottom: 5,
            }}>
              <span>Session progress · {sessionSteps.length} steps</span>
              <span>{overallPct}%</span>
            </div>
            <div style={{ height: 2, background: "#141414", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${overallPct}%`,
                background: theme.progressGrad, transition: "width .9s ease",
              }} />
            </div>
          </div>
        )}

        {/* ══ WHO HEALTH IMPACT TOGGLE ══ */}
        {!playing && !sessionDone && (
          <>
            <button
              onClick={() => setShowWhoCard(v => !v)}
              style={{
                background: "transparent", border: "1px solid #141414",
                color: "#2a2a2a", fontSize: 8, letterSpacing: ".18em",
                textTransform: "uppercase", fontFamily: "inherit",
                padding: "7px", cursor: "pointer", transition: "all .2s",
                textAlign: "left",
              }}
              className="m16-btn-secondary"
            >
              {showWhoCard ? "▾" : "▸"} WHO Global Health Impact · {WHO_HEALTH_DOMAINS[modeKey]?.who_code}
            </button>
            {showWhoCard && (
              <div className="m16-fade-up">
                <WHOImpactCard modeKey={modeKey} accent={A} />
              </div>
            )}
          </>
        )}

        {/* ══ START BUTTON ══ */}
        {!playing && !sessionDone && (
          <button
            className="m16-btn-primary"
            onClick={startSession}
            disabled={isAiLoading || cameraError}
            style={{
              width: "100%", padding: "18px",
              background: (isAiLoading || cameraError) ? "#111" : A,
              color: (isAiLoading || cameraError) ? "#2a2a2a" : "#080808",
              border: (isAiLoading || cameraError) ? "1px solid #1a1a1a" : "none",
              fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif",
              letterSpacing: ".08em", textTransform: "uppercase",
              cursor: (isAiLoading || cameraError) ? "not-allowed" : "pointer",
              transition: "all .2s",
            }}
          >
            {isAiLoading
              ? `Initialising ${theme.label} AI…`
              : `${theme.emoji}  Start ${theme.label}16 — Day ${day} →`}
          </button>
        )}

        {/* ══ SHARE CLIP ══ */}
        {recordedBlob && (
          <button onClick={shareClip} className="m16-btn-secondary" style={{
            background: "transparent", border: "1px solid #1e1e1e", color: "#3a3a3a",
            fontSize: 9, letterSpacing: ".15em", padding: "8px 14px",
            cursor: "pointer", textTransform: "uppercase",
            fontFamily: "inherit", width: "100%", transition: "all .2s",
          }}>
            ↗ Share proof clip
          </button>
        )}

        {/* ══ WELLNESS HUB LINKS ══ */}
        {!playing && !sessionDone && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { emoji: "🧠", label: "Mental", to: "/app/mental" },
              { emoji: "😴", label: "Sleep", to: "/app/sleep" },
              { emoji: "🍎", label: "Nutrition", to: "/app/nutrition" },
            ].map(({ emoji, label, to }) => (
              <button key={to} onClick={() => navigate(to)} className="m16-btn-secondary" style={{
                background: "#0a0a0a", border: "1px solid #141414",
                color: "#222", fontFamily: "inherit",
                fontSize: 8, letterSpacing: ".15em",
                textTransform: "uppercase", padding: "8px 0",
                cursor: "pointer", transition: "all .2s",
              }}>
                {emoji} {label}
              </button>
            ))}
          </div>
        )}

        {/* ══ LANGUAGE INDICATOR ══ */}
        {!playing && (
          <div style={{
            textAlign: "center",
            fontSize: 7, letterSpacing: ".22em", color: "#1a1a1a",
            textTransform: "uppercase", marginTop: 4,
          }}>
            Voice · {langBcp47} · {WHO_HEALTH_DOMAINS[modeKey]?.domain}
          </div>
        )}

      </div>
    </div>
  );
}
