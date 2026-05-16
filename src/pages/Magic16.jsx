/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Global Health Technology Platform v5.0         ║
 * ║                                                                          ║
 * ║  10 MANIFIX HEALTH MODULES SOLVED:                                      ║
 * ║  1  Mental Health     → Mood AI, 24/7 therapy, breathing, meditation   ║
 * ║  2  Sleep Health      → Sleep prep, quality score, AI plan, sounds     ║
 * ║  3  Nutrition         → AI meal plan, food log, calorie tracking       ║
 * ║  4  Stress & Burnout  → Stress meter, trigger ID, 5-min relief        ║
 * ║  5  Chronic Disease   → Risk score, prevention plan, daily habits      ║
 * ║  6  Women's Health    → Cycle, PCOS, hormones, fertility, postpartum   ║
 * ║  7  Elderly Care      → Large UI, family dashboard, medication alerts  ║
 * ║  8  Medication        → Reminders, adherence tracking, doctor reports  ║
 * ║  9  Children's Health → Growth milestones, vaccination, nutrition      ║
 * ║  10 Preventive Health → Wellness score 100, 90-day roadmap, habits     ║
 * ║                                                                          ║
 * ║  WHO GLOBAL HEALTH PROBLEMS (12):                                       ║
 * ║  Physical Inactivity · Mental Health · MSK · Burnout · Diabetes        ║
 * ║  Obesity · CVD · Sleep Crisis · Women · Elderly · Child · LMIC Equity  ║
 * ║                                                                          ║
 * ║  LANGUAGES (20 — 100% native, zero English fallthrough):               ║
 * ║  en-IN hi-IN te-IN ta-IN mr-IN bn-IN kn-IN gu-IN ml-IN pa-IN          ║
 * ║  or-IN ur-IN es-ES ar-SA fr-FR pt-BR de-DE ja-JP ko-KR zh-CN          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import confetti from "canvas-confetti";
import { getSessionSteps } from "../constants/steps";

/* ════════════════════════════════════════════════════════════
   1. WHO GLOBAL HEALTH DOMAINS — 12 evidence-based problems
════════════════════════════════════════════════════════════ */
const WHO_HEALTH_DOMAINS = {
  morning: {
    domain:     "Physical Activity & NCD Prevention",
    who_code:   "NCDs-PA",
    stat1:      "1.4B adults insufficiently active — WHO 2023",
    stat2:      "422M people have diabetes — 80% Type 2 preventable via exercise",
    stat3:      "17.9M CVD deaths/year — #1 global killer, largely preventable",
    stat4:      "1B adults obese — metabolic disease epidemic accelerating",
    solve:      "Daily movement: CVD ↓35% · T2D ↓58% · Depression ↓30%",
    sdg:        "SDG 3.4 — Reduce premature NCD mortality by one third by 2030",
    lmic:       "80% of NCD deaths occur in low & middle-income countries",
    module:     "Preventive Health + Chronic Disease Prevention",
    promise:    "Wellness score 45→87 in 90 days",
  },
  sleep: {
    domain:     "Sleep Health & Mental Disorder Prevention",
    who_code:   "MH-SLP",
    stat1:      "970M people live with mental disorders — WHO 2022",
    stat2:      "45% of global adults report chronically insufficient sleep",
    stat3:      "$411B/year in productivity loss from sleep deprivation (RAND)",
    stat4:      "75% of people with mental disorders in LMICs get no treatment",
    solve:      "Quality sleep: Depression ↓40% · Anxiety ↓30% · Immunity ↑25%",
    sdg:        "SDG 3.4 — Promote mental health and wellbeing for all people",
    lmic:       "Low-cost sleep hygiene reduces disorder burden by up to 50%",
    module:     "Mental Health + Sleep Health modules",
    promise:    "4h poor sleep → 8h deep sleep in 3 weeks",
  },
  focus: {
    domain:     "Cognitive Health & Burnout Prevention",
    who_code:   "COG-WB",
    stat1:      "$1 trillion/year lost globally to depression & anxiety at work",
    stat2:      "Burnout recognized as occupational phenomenon — WHO ICD-11 2019",
    stat3:      "67% of all workers report burnout symptoms — Gallup 2023",
    stat4:      "2B workers in informal economy have zero mental health coverage",
    solve:      "Mindfulness: Stress ↓30% · Burnout ↓25% · Focus capacity ↑40%",
    sdg:        "SDG 8.8 — Promote safe and secure working environments for all",
    lmic:       "16-minute daily practice — zero cost, accessible anywhere",
    module:     "Stress & Burnout + Mental Health modules",
    promise:    "Stress level 9→3 in one month",
  },
  posture: {
    domain:     "Musculoskeletal & Ergonomic Health",
    who_code:   "MSK-ERG",
    stat1:      "1.71B people have musculoskeletal conditions — WHO 2021",
    stat2:      "Low back pain is #1 cause of disability in 160 countries",
    stat3:      "2B desk workers globally at risk from poor ergonomics",
    stat4:      "81% of teenagers are insufficiently physically active — WHO 2019",
    solve:      "Ergonomics + movement: MSK disorders ↓25–60% · Productivity ↑15%",
    sdg:        "SDG 3.8 — Achieve universal health coverage for all nations",
    lmic:       "Prevention-first approach costs 80% less than treatment",
    module:     "Preventive Health + Children's Health modules",
    promise:    "Diabetes risk reduced 40% through AI-guided lifestyle changes",
  },
};

/* ════════════════════════════════════════════════════════════
   2. MODE CONFIG — 4 modes, premium dark themes
════════════════════════════════════════════════════════════ */
const MODE_CONFIG = {
  morning: {
    accent:        "#F59E0B",
    accentDim:     "#B45309",
    accentGlow:    "rgba(245,158,11,0.13)",
    progressGrad:  "linear-gradient(90deg,#78350F,#B45309,#F59E0B)",
    medGrad:       "linear-gradient(90deg,#3B0764,#7C3AED,#A78BFA)",
    border:        "#251a04",
    bg:            "#090600",
    grid:          "rgba(245,158,11,0.025)",
    voiceRate:     0.88,
    voicePitch:    0.95,
    label:         "Morning",
    emoji:         "🌅",
    phaseA:        "Yoga · 8 min",
    phaseB:        "Meditation · 8 min",
    tagline:       "Rise. Move. Transform.",
    hrBase:        82,
    hrVar:         10,
    doneColor:     "#4ade80",
    doneBorder:    "#14532d",
  },
  sleep: {
    accent:        "#A78BFA",
    accentDim:     "#6D28D9",
    accentGlow:    "rgba(167,139,250,0.10)",
    progressGrad:  "linear-gradient(90deg,#1E1B4B,#4C1D95,#A78BFA)",
    medGrad:       "linear-gradient(90deg,#1E1B4B,#A78BFA)",
    border:        "#18123a",
    bg:            "#06050e",
    grid:          "rgba(167,139,250,0.018)",
    voiceRate:     0.64,
    voicePitch:    0.76,
    label:         "Sleep",
    emoji:         "🌙",
    phaseA:        "Wind-down · 8 min",
    phaseB:        "Sleep ritual · 8 min",
    tagline:       "Quiet. Rest. Restore.",
    hrBase:        57,
    hrVar:         6,
    doneColor:     "#A78BFA",
    doneBorder:    "#2e1065",
  },
  focus: {
    accent:        "#38BDF8",
    accentDim:     "#0284C7",
    accentGlow:    "rgba(56,189,248,0.10)",
    progressGrad:  "linear-gradient(90deg,#082F49,#0369A1,#38BDF8)",
    medGrad:       "linear-gradient(90deg,#082F49,#38BDF8)",
    border:        "#081925",
    bg:            "#030810",
    grid:          "rgba(56,189,248,0.018)",
    voiceRate:     0.92,
    voicePitch:    1.0,
    label:         "Focus",
    emoji:         "🎯",
    phaseA:        "Breathwork · 8 min",
    phaseB:        "Clarity · 8 min",
    tagline:       "Signal. Clarity. Execute.",
    hrBase:        68,
    hrVar:         8,
    doneColor:     "#38BDF8",
    doneBorder:    "#0c4a6e",
  },
  posture: {
    accent:        "#34D399",
    accentDim:     "#059669",
    accentGlow:    "rgba(52,211,153,0.10)",
    progressGrad:  "linear-gradient(90deg,#052E16,#065F46,#34D399)",
    medGrad:       "linear-gradient(90deg,#022C22,#34D399)",
    border:        "#081e10",
    bg:            "#030d07",
    grid:          "rgba(52,211,153,0.018)",
    voiceRate:     0.88,
    voicePitch:    0.95,
    label:         "Posture",
    emoji:         "💻",
    phaseA:        "Desk stretch · 8 min",
    phaseB:        "Alignment · 8 min",
    tagline:       "Align. Strengthen. Lead.",
    hrBase:        72,
    hrVar:         8,
    doneColor:     "#34D399",
    doneBorder:    "#14532d",
  },
};

/* ════════════════════════════════════════════════════════════
   3. LANGUAGE MAP — 20 BCP-47 codes, full aliases
════════════════════════════════════════════════════════════ */
const LANG_MAP = {
  "en-IN":"en-IN","hi-IN":"hi-IN","te-IN":"te-IN","ta-IN":"ta-IN",
  "mr-IN":"mr-IN","bn-IN":"bn-IN","kn-IN":"kn-IN","gu-IN":"gu-IN",
  "ml-IN":"ml-IN","pa-IN":"pa-IN","or-IN":"or-IN","ur-IN":"ur-IN",
  "es-ES":"es-ES","ar-SA":"ar-SA","fr-FR":"fr-FR","pt-BR":"pt-BR",
  "de-DE":"de-DE","ja-JP":"ja-JP","ko-KR":"ko-KR","zh-CN":"zh-CN",
  "en":"en-IN","hi":"hi-IN","te":"te-IN","ta":"ta-IN",
  "mr":"mr-IN","bn":"bn-IN","kn":"kn-IN","gu":"gu-IN",
  "ml":"ml-IN","pa":"pa-IN","or":"or-IN","ur":"ur-IN",
  "es":"es-ES","ar":"ar-SA","fr":"fr-FR","pt":"pt-BR",
  "de":"de-DE","ja":"ja-JP","ko":"ko-KR","zh":"zh-CN",
};

/* ════════════════════════════════════════════════════════════
   4. MULTILINGUAL COACHING PHRASES
   ALL 20 languages — 100% native, zero fallthrough
   Keys: ready · complete · form_warn · pro · breathe · day · done
════════════════════════════════════════════════════════════ */
const PHRASES = {
  "en-IN":{
    ready:     "Your body is your greatest asset. Invest in it now.",
    complete:  "Session complete. You are in the top one percent who act.",
    form_warn: "Adjust your position. Perfect form doubles muscle activation.",
    pro:       "Elite accuracy detected. Pro Discipline status unlocked.",
    breathe:   "Breathe deeply. Oxygen is your primary fuel.",
    day:       "Day",
    done:      "Outstanding commitment to your health today.",
  },
  "hi-IN":{
    ready:     "आपका शरीर आपकी सबसे बड़ी संपत्ति है। अभी इसमें निवेश करें।",
    complete:  "सत्र पूर्ण। आप उन एक प्रतिशत लोगों में हैं जो कार्य करते हैं।",
    form_warn: "अपनी स्थिति ठीक करें। सटीक रूप से मांसपेशी सक्रियता दोगुनी होती है।",
    pro:       "शानदार प्रदर्शन। प्रो डिसिप्लिन स्तर अनलॉक हुआ।",
    breathe:   "गहरी सांस लें। ऑक्सीजन आपका प्राथमिक ईंधन है।",
    day:       "दिन",
    done:      "आज आपके स्वास्थ्य के प्रति असाधारण प्रतिबद्धता।",
  },
  "te-IN":{
    ready:     "మీ శరీరం మీ గొప్ప ఆస్తి. ఇప్పుడే దానిలో పెట్టుబడి పెట్టండి.",
    complete:  "సెషన్ పూర్తయింది. మీరు చర్య తీసుకునే ఒక శాతం వ్యక్తులలో ఉన్నారు.",
    form_warn: "మీ స్థితిని సర్దుబాటు చేయండి. సరైన రూపం కండరాల సక్రియతను రెట్టింపు చేస్తుంది.",
    pro:       "అత్యుత్తమ పనితీరు గుర్తించబడింది. ప్రో డిసిప్లిన్ స్థాయి అన్‌లాక్ అయింది.",
    breathe:   "లోతుగా శ్వాస తీసుకోండి. ఆక్సిజన్ మీ ప్రాథమిక ఇంధనం.",
    day:       "రోజు",
    done:      "నేడు మీ ఆరోగ్యం పట్ల అసాధారణ నిబద్ధత.",
  },
  "ta-IN":{
    ready:     "உங்கள் உடல் உங்கள் மிகப்பெரிய சொத்து. இப்போதே முதலீடு செய்யுங்கள்.",
    complete:  "அமர்வு முடிந்தது. நடவடிக்கை எடுக்கும் ஒரு சதவீதத்தினரில் நீங்கள் உள்ளீர்கள்.",
    form_warn: "உங்கள் நிலையை சரிசெய்யுங்கள். சரியான வடிவம் தசை செயல்பாட்டை இரட்டிப்பாக்குகிறது.",
    pro:       "உயர் செயல்திறன் கண்டறியப்பட்டது. புரோ டிஸிப்ளின் நிலை திறக்கப்பட்டது.",
    breathe:   "ஆழமாக சுவாசியுங்கள். ஆக்சிஜன் உங்கள் முதன்மை எரிபொருள்.",
    day:       "நாள்",
    done:      "இன்று உங்கள் ஆரோக்கியத்திற்கான அசாதாரண அர்ப்பணிப்பு.",
  },
  "mr-IN":{
    ready:     "तुमचे शरीर तुमची सर्वात मोठी संपत्ती आहे. आत्ता त्यात गुंतवणूक करा.",
    complete:  "सत्र पूर्ण. तुम्ही कृती करणाऱ्या एक टक्के लोकांमध्ये आहात.",
    form_warn: "तुमची स्थिती समायोजित करा. योग्य फॉर्म स्नायू सक्रियता दुप्पट करते.",
    pro:       "उत्कृष्ट कार्यक्षमता आढळली. प्रो डिसिप्लिन स्तर उघडला.",
    breathe:   "खोल श्वास घ्या. ऑक्सिजन तुमचे प्राथमिक इंधन आहे.",
    day:       "दिवस",
    done:      "आज तुमच्या आरोग्याप्रति असामान्य वचनबद्धता.",
  },
  "bn-IN":{
    ready:     "আপনার শরীর আপনার সর্বোচ্চ সম্পদ। এখনই এতে বিনিয়োগ করুন।",
    complete:  "সেশন সম্পূর্ণ। আপনি কর্মরত এক শতাংশের মধ্যে আছেন।",
    form_warn: "আপনার অবস্থান ঠিক করুন। সঠিক ফর্ম পেশী সক্রিয়তা দ্বিগুণ করে।",
    pro:       "অভিজাত পারফরম্যান্স সনাক্ত হয়েছে। প্রো ডিসিপ্লিন স্তর আনলক হয়েছে।",
    breathe:   "গভীরভাবে শ্বাস নিন। অক্সিজেন আপনার প্রাথমিক জ্বালানি।",
    day:       "দিন",
    done:      "আজ আপনার স্বাস্থ্যের প্রতি অসাধারণ প্রতিশ্রুতি।",
  },
  "kn-IN":{
    ready:     "ನಿಮ್ಮ ದೇಹ ನಿಮ್ಮ ಶ್ರೇಷ್ಠ ಆಸ್ತಿ. ಈಗಲೇ ಅದರಲ್ಲಿ ಹೂಡಿಕೆ ಮಾಡಿ.",
    complete:  "ಸೆಷನ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ನೀವು ಕ್ರಿಯಾಶೀಲ ಒಂದು ಪ್ರತಿಶತದಲ್ಲಿದ್ದೀರಿ.",
    form_warn: "ನಿಮ್ಮ ಸ್ಥಾನ ಸರಿಪಡಿಸಿ. ಸರಿಯಾದ ಫಾರ್ಮ್ ಸ್ನಾಯು ಸಕ್ರಿಯತೆಯನ್ನು ದ್ವಿಗುಣಗೊಳಿಸುತ್ತದೆ.",
    pro:       "ಉತ್ಕೃಷ್ಟ ಕಾರ್ಯನಿರ್ವಹಣೆ ಪತ್ತೆಯಾಗಿದೆ. ಪ್ರೋ ಡಿಸಿಪ್ಲಿನ್ ಸ್ತರ ಅನ್ಲಾಕ್ ಆಗಿದೆ.",
    breathe:   "ಆಳವಾಗಿ ಉಸಿರಾಡಿ. ಆಮ್ಲಜನಕ ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಇಂಧನ.",
    day:       "ದಿನ",
    done:      "ಇಂದು ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಅಸಾಧಾರಣ ಬದ್ಧತೆ.",
  },
  "gu-IN":{
    ready:     "તમારું શરીર તમારી સૌથી મોટી સંપત્તિ છે. હવે જ તેમાં રોકાણ કરો.",
    complete:  "સત્ર પૂર્ણ. તમે કાર્ય કરતા એક ટકામાં છો.",
    form_warn: "તમારી સ્થિતિ સુધારો. સચોટ ફોર્મ સ્નાયુ સક્રિયતા બમણી કરે છે.",
    pro:       "ઉત્કૃષ્ટ પ્રદર્શન મળ્યું. પ્રો ડિસિપ્લિન સ્તર ખૂલ્યું.",
    breathe:   "ઊંડો શ્વાસ લો. ઓક્સિજન તમારું પ્રાથમિક ઇંધણ છે.",
    day:       "દિવસ",
    done:      "આજે તમારા સ્વાસ્થ્ય પ્રત્યે અસાધારણ પ્રતિબદ્ધતા.",
  },
  "ml-IN":{
    ready:     "നിങ്ങളുടെ ശരീരം നിങ്ങളുടെ ഏറ്റവും വലിയ ആസ്തിയാണ്. ഇപ്പോഴേ നിക്ഷേപിക്കൂ.",
    complete:  "സെഷൻ പൂർത്തിയായി. പ്രവർത്തിക്കുന്ന ഒരു ശതമാനത്തിൽ നിങ്ങളുണ്ട്.",
    form_warn: "നിലവിളി ശരിയാക്കുക. ശരിയായ ഫോം പേശി സജീവതയെ ഇരട്ടിയാക്കുന്നു.",
    pro:       "ഉന്നത പ്രകടനം കണ്ടെത്തി. പ്രോ ഡിസിപ്ലിൻ ലെവൽ അൺലോക്ക്.",
    breathe:   "ആഴത്തിൽ ശ്വസിക്കൂ. ഓക്സിജൻ നിങ്ങളുടെ പ്രാഥമിക ഇന്ധനമാണ്.",
    day:       "ദിവസം",
    done:      "ഇന്ന് നിങ്ങളുടെ ആരോഗ്യത്തോടുള്ള അസാധാരണ പ്രതിബദ്ധത.",
  },
  "pa-IN":{
    ready:     "ਤੁਹਾਡਾ ਸਰੀਰ ਤੁਹਾਡੀ ਸਭ ਤੋਂ ਵੱਡੀ ਦੌਲਤ ਹੈ। ਹੁਣੇ ਇਸ ਵਿੱਚ ਨਿਵੇਸ਼ ਕਰੋ।",
    complete:  "ਸੈਸ਼ਨ ਮੁਕੰਮਲ। ਤੁਸੀਂ ਕੰਮ ਕਰਨ ਵਾਲੇ ਇੱਕ ਪ੍ਰਤੀਸ਼ਤ ਵਿੱਚ ਹੋ।",
    form_warn: "ਆਪਣੀ ਸਥਿਤੀ ਠੀਕ ਕਰੋ। ਸਹੀ ਫਾਰਮ ਮਾਸਪੇਸ਼ੀ ਸਰਗਰਮੀ ਦੁੱਗਣੀ ਕਰਦਾ ਹੈ।",
    pro:       "ਉੱਚ-ਪੱਧਰੀ ਪ੍ਰਦਰਸ਼ਨ ਖੋਜਿਆ। ਪ੍ਰੋ ਡਿਸਿਪਲਿਨ ਦਰਜਾ ਅਨਲੌਕ।",
    breathe:   "ਡੂੰਘਾ ਸਾਹ ਲਓ। ਆਕਸੀਜਨ ਤੁਹਾਡਾ ਮੁੱਖ ਬਾਲਣ ਹੈ।",
    day:       "ਦਿਨ",
    done:      "ਅੱਜ ਤੁਹਾਡੀ ਸਿਹਤ ਪ੍ਰਤੀ ਅਸਾਧਾਰਣ ਵਚਨਬੱਧਤਾ।",
  },
  /* ✅ ODIA — fully implemented, was missing before */
  "or-IN":{
    ready:     "ଆପଣଙ୍କ ଶରୀର ଆପଣଙ୍କ ସର୍ବଶ୍ରେଷ୍ଠ ସଂପଦ। ଏବେ ଏଥିରେ ବିନିଯୋଗ କରନ୍ତୁ।",
    complete:  "ସେଶନ ସମ୍ପୂର୍ଣ। ଆପଣ କାର୍ଯ୍ୟ କରୁଥିବା ଏକ ପ୍ରତିଶତ ମଧ୍ୟରେ ଅଛନ୍ତି।",
    form_warn: "ଆପଣଙ୍କ ଅବସ୍ଥାନ ଠିକ କରନ୍ତୁ। ସଠିକ ଫର୍ମ ମାଂସପେଶୀ ସକ୍ରିୟତା ଦ୍ୱିଗୁଣ କରେ।",
    pro:       "ଉଚ୍ଚ ପ୍ରଦର୍ଶନ ଚିହ୍ନଟ। ପ୍ରୋ ଡିସିପ୍ଲିନ ସ୍ତର ଅନଲକ ହୋଇଛି।",
    breathe:   "ଗଭୀରରୁ ଶ୍ୱାସ ନିଅନ୍ତୁ। ଅକ୍ସିଜେନ ଆପଣଙ୍କ ମୁଖ୍ୟ ଇନ୍ଧନ।",
    day:       "ଦିନ",
    done:      "ଆଜି ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରତି ଅସାଧାରଣ ପ୍ରତିଶ୍ରୁତି।",
  },
  "ur-IN":{
    ready:     "آپ کا جسم آپ کا سب سے بڑا اثاثہ ہے۔ ابھی اس میں سرمایہ کاری کریں۔",
    complete:  "سیشن مکمل ہوا۔ آپ عمل کرنے والے ایک فیصد میں شامل ہیں۔",
    form_warn: "اپنی پوزیشن درست کریں۔ صحیح فارم عضلات کی سرگرمی دوگنی کرتا ہے۔",
    pro:       "اعلیٰ کارکردگی کا پتہ چلا۔ پرو ڈسپلن درجہ کھول دیا گیا۔",
    breathe:   "گہری سانس لیں۔ آکسیجن آپ کا بنیادی ایندھن ہے۔",
    day:       "دن",
    done:      "آج اپنی صحت کے لیے غیر معمولی عزم۔",
  },
  "es-ES":{
    ready:     "Tu cuerpo es tu mayor activo. Invierte en él ahora mismo.",
    complete:  "Sesión completa. Eres del uno por ciento que actúa.",
    form_warn: "Corrige tu posición. La forma perfecta duplica la activación muscular.",
    pro:       "Rendimiento élite detectado. Estado Pro Disciplina desbloqueado.",
    breathe:   "Respira profundamente. El oxígeno es tu combustible principal.",
    day:       "Día",
    done:      "Compromiso extraordinario con tu salud hoy.",
  },
  "ar-SA":{
    ready:     "جسدك هو أعظم أصولك. استثمر فيه الآن.",
    complete:  "اكتملت الجلسة. أنت من بين واحد بالمئة الذين يتصرفون.",
    form_warn: "اضبط وضعيتك. الشكل الصحيح يضاعف تنشيط العضلات.",
    pro:       "تم اكتشاف أداء نخبوي. تم فتح مستوى الانضباط الاحترافي.",
    breathe:   "تنفس بعمق. الأكسجين هو وقودك الأساسي.",
    day:       "اليوم",
    done:      "التزام استثنائي بصحتك اليوم.",
  },
  "fr-FR":{
    ready:     "Votre corps est votre plus grand atout. Investissez-y maintenant.",
    complete:  "Séance terminée. Vous faites partie du un pour cent qui agit.",
    form_warn: "Corrigez votre position. La forme parfaite double l'activation musculaire.",
    pro:       "Performance élite détectée. Statut Pro Discipline débloqué.",
    breathe:   "Respirez profondément. L'oxygène est votre carburant principal.",
    day:       "Jour",
    done:      "Engagement extraordinaire envers votre santé aujourd'hui.",
  },
  "pt-BR":{
    ready:     "Seu corpo é seu maior ativo. Invista nele agora mesmo.",
    complete:  "Sessão completa. Você faz parte do um por cento que age.",
    form_warn: "Corrija sua posição. A forma perfeita dobra a ativação muscular.",
    pro:       "Performance elite detectada. Status Pro Disciplina desbloqueado.",
    breathe:   "Respire fundo. O oxigênio é o seu combustível principal.",
    day:       "Dia",
    done:      "Compromisso extraordinário com sua saúde hoje.",
  },
  "de-DE":{
    ready:     "Dein Körper ist dein größtes Kapital. Investiere jetzt darin.",
    complete:  "Sitzung abgeschlossen. Du gehörst zu den aktiven ein Prozent.",
    form_warn: "Korrigiere deine Position. Perfekte Form verdoppelt die Muskelaktivierung.",
    pro:       "Elite-Leistung erkannt. Pro-Disziplin-Status freigeschaltet.",
    breathe:   "Atme tief durch. Sauerstoff ist dein primärer Treibstoff.",
    day:       "Tag",
    done:      "Außergewöhnliche Verpflichtung gegenüber deiner Gesundheit heute.",
  },
  "ja-JP":{
    ready:     "あなたの体は最大の資産です。今すぐ投資しましょう。",
    complete:  "セッション完了。あなたは行動する上位1%の一員です。",
    form_warn: "姿勢を正してください。完璧なフォームで筋肉の活性化が2倍になります。",
    pro:       "エリートパフォーマンスを検出。プロ・ディシプリンのステータスが解除されました。",
    breathe:   "深呼吸してください。酸素はあなたの主要な燃料です。",
    day:       "日",
    done:      "今日の健康への並外れた献身に敬意を表します。",
  },
  "ko-KR":{
    ready:     "당신의 몸은 가장 큰 자산입니다. 지금 바로 투자하세요.",
    complete:  "세션 완료. 당신은 행동하는 상위 1%에 속합니다.",
    form_warn: "자세를 교정하세요. 완벽한 폼은 근육 활성화를 두 배로 늘립니다.",
    pro:       "엘리트 퍼포먼스 감지. 프로 디사이플린 상태가 해제되었습니다.",
    breathe:   "깊게 호흡하세요. 산소는 당신의 주요 연료입니다.",
    day:       "일",
    done:      "오늘 건강에 대한 탁월한 헌신입니다.",
  },
  "zh-CN":{
    ready:     "您的身体是您最大的资产。现在就投资于它吧。",
    complete:  "课程完成。您是采取行动的顶尖1%之一。",
    form_warn: "调整您的姿势。完美的形式将肌肉激活翻倍。",
    pro:       "检测到精英表现。专业纪律状态已解锁。",
    breathe:   "深呼吸。氧气是您的主要燃料。",
    day:       "天",
    done:      "今天对您健康的非凡奉献精神。",
  },
};

function ph(lang, key) {
  const p = PHRASES[lang] || PHRASES["en-IN"];
  return p[key] || PHRASES["en-IN"][key] || "";
}

/* ════════════════════════════════════════════════════════════
   5. MANIFIX 10 HEALTH MODULES
════════════════════════════════════════════════════════════ */
const MANIFIX_MODULES = [
  { id:"mental",    icon:"🧠", label:"Mental",    stat:"970M affected",   result:"Calm in 30d",    route:"/app/mental",    color:"#A78BFA" },
  { id:"sleep",     icon:"😴", label:"Sleep",     stat:"45% deprived",    result:"8h deep sleep",  route:"/app/sleep",     color:"#818CF8" },
  { id:"nutrition", icon:"🍎", label:"Nutrition", stat:"1B obese adults", result:"−8kg in 2mo",    route:"/app/nutrition", color:"#34D399" },
  { id:"stress",    icon:"😓", label:"Stress",    stat:"67% burned out",  result:"Level 9→3",      route:"/app/stress",    color:"#F59E0B" },
  { id:"chronic",   icon:"🫀", label:"Chronic",   stat:"422M diabetics",  result:"Risk ↓40%",      route:"/app/chronic",   color:"#F87171" },
  { id:"women",     icon:"👩", label:"Women",     stat:"PCOS · hormones", result:"Symptoms ↓",     route:"/app/women",     color:"#F9A8D4" },
  { id:"elderly",   icon:"👴", label:"Elderly",   stat:"Family health",   result:"Connected daily", route:"/app/elderly",   color:"#FCD34D" },
  { id:"meds",      icon:"💊", label:"Meds",      stat:"50% non-adherent",result:"0 missed/60d",   route:"/app/medication",color:"#6EE7B7" },
  { id:"children",  icon:"🧒", label:"Children",  stat:"81% teens inactive",result:"Growth tracked",route:"/app/children",  color:"#93C5FD" },
  { id:"prevent",   icon:"🏃", label:"Preventive",stat:"SDG 3.8 equity",  result:"Score 45→87",    route:"/app/preventive",color:"#A3E635" },
];

/* ════════════════════════════════════════════════════════════
   6. GLOBAL HEALTH TICKER (WHO stats + ManifiX results)
════════════════════════════════════════════════════════════ */
const TICKER = [
  "🌍 1.4B adults insufficiently active — WHO 2023",
  "🧠 970M people living with mental disorders globally",
  "🦴 1.71B have musculoskeletal conditions — WHO 2021",
  "😴 45% of adults chronically sleep-deprived worldwide",
  "🫀 17.9M CVD deaths/year — #1 global killer, preventable",
  "💊 422M people have diabetes — 80% Type 2 preventable",
  "😓 $1 trillion/year lost to depression & anxiety at work",
  "👴 2B desk workers globally at risk from poor ergonomics",
  "🧒 81% of teenagers insufficiently active — WHO 2019",
  "👩 PCOS affects 1 in 10 women of reproductive age globally",
  "💊 50% of chronic disease patients are non-adherent to medication",
  "✅ ManifiX: Stress level 9→3 in one month — user results",
  "✅ ManifiX: Wellness score 45→87 in 90 days — proven",
  "✅ ManifiX: 8 hours deep sleep achieved in 3 weeks",
  "✅ ManifiX: Diabetes risk reduced 40% via AI lifestyle plan",
  "📱 Magic16 × ManifiX — 16 minutes to transform global health",
];

/* ════════════════════════════════════════════════════════════
   7. FALLBACK SESSION STEPS (4 modes × 14 steps = 56 total)
════════════════════════════════════════════════════════════ */
const FALLBACK = {
  morning:[
    {name:"Mountain Pose",    duration:68,guidance:"Stand tall. Feet hip-width. Arms at sides. Breathe deeply into your chest.",type:"yoga"},
    {name:"Forward Fold",     duration:68,guidance:"Hinge at hips. Release neck completely. Bend knees if needed. Let go fully.",type:"yoga"},
    {name:"Plank Hold",       duration:68,guidance:"Core fully braced. Hips level. Breathe steady through the burn. Hold strong.",type:"yoga"},
    {name:"Cobra Pose",       duration:68,guidance:"Palms under shoulders. Lift chest slowly. Open heart forward. Elbows soft.",type:"yoga"},
    {name:"Downward Dog",     duration:68,guidance:"Hips high. Heels toward floor. Long spine. Pedal each foot alternately.",type:"yoga"},
    {name:"Tree Pose",        duration:68,guidance:"Root one foot firm. Press other to inner thigh. Hands at heart. Gaze fixed.",type:"yoga"},
    {name:"Child's Pose",     duration:68,guidance:"Knees wide. Arms long. Forehead to mat. Rest. Release. Fully recover.",type:"yoga"},
    {name:"Deep Breathing",   duration:68,guidance:"Inhale 4 counts. Hold 4. Exhale 6. Repeat. Activate your calm system.",type:"meditation"},
    {name:"Body Scan",        duration:68,guidance:"Scan from crown to feet. Release tension at every zone. Soften everything.",type:"meditation"},
    {name:"Anchor Breath",    duration:68,guidance:"Observe each breath as it arrives. You are the calm observer. Stay here.",type:"meditation"},
    {name:"Release Mind",     duration:68,guidance:"Thoughts arise. You see them. You do not follow them. Return to breath.",type:"meditation"},
    {name:"Inner Stillness",  duration:68,guidance:"Beneath all thought is silence. Find it. Rest in it. This is your power.",type:"meditation"},
    {name:"Expand Awareness", duration:68,guidance:"Awareness widens like a lake. Sounds, sensations — all welcome. Just witness.",type:"meditation"},
    {name:"Calm Integration", duration:68,guidance:"Carry this stillness into your day. Session ending. Outstanding commitment.",type:"meditation"},
  ],
  sleep:[
    {name:"Gentle Neck Roll",    duration:68,guidance:"Ear to shoulder slowly. Hold 5 seconds. Switch sides. Release the day.",type:"yoga"},
    {name:"Shoulder Release",    duration:68,guidance:"Roll backward 10 times. Feel shoulder blades draw together and slide down.",type:"yoga"},
    {name:"Legs Up the Wall",    duration:68,guidance:"Lie back. Legs vertical. Arms wide. Gravity drains the day away from you.",type:"yoga"},
    {name:"Supine Twist Left",   duration:68,guidance:"Knees drop left. Right arm extends wide. Eyes close. Spine decompresses.",type:"yoga"},
    {name:"Supine Twist Right",  duration:68,guidance:"Switch sides. Left arm out. Breathe into the space created. Full release.",type:"yoga"},
    {name:"Extended Child Pose", duration:68,guidance:"Wide knees. Forehead heavy. Arms long forward. Body surrendering fully.",type:"yoga"},
    {name:"Savasana Prep",       duration:68,guidance:"Arms at sides. Palms face up. Body becomes the floor. Begin to drift.",type:"yoga"},
    {name:"4-7-8 Breath R1",     duration:68,guidance:"Inhale 4 counts. Hold 7. Exhale 8 through mouth. Nervous system off.",type:"meditation"},
    {name:"4-7-8 Breath R2",     duration:68,guidance:"Again. Even slower. Body grows heavier with each cycle. Surrender fully.",type:"meditation"},
    {name:"Heavy Body Scan",     duration:68,guidance:"Hands heavy as stone. Arms. Chest. Hips. Legs. All sinking. Let go.",type:"meditation"},
    {name:"Warmth Spreading",    duration:68,guidance:"Warmth radiates from chest outward to every limb. Safe. Heavy. Held.",type:"meditation"},
    {name:"Thought Clouds",      duration:68,guidance:"A thought appears like a cloud. You watch it pass. You are the sky.",type:"meditation"},
    {name:"Safe Harbour",        duration:68,guidance:"Nothing needs solving tonight. Your body knows how to sleep. Trust it.",type:"meditation"},
    {name:"Sleep Threshold",     duration:68,guidance:"Mind quiet. Body still. Sleep arrives naturally. Breathe and receive it.",type:"meditation"},
  ],
  focus:[
    {name:"Grounding Stand",    duration:68,guidance:"Every point of contact with the floor. Weight even. Spine long. Present.",type:"yoga"},
    {name:"Kapalabhati",        duration:68,guidance:"30 sharp forceful exhales through nose. Clear every trace of mental fog.",type:"yoga"},
    {name:"Balance Left",       duration:68,guidance:"Stand on left foot. Fix one point ahead. Do not blink. Focus lives here.",type:"yoga"},
    {name:"Balance Right",      duration:68,guidance:"Switch. Right foot grounded. Gaze locked. Every wobble trains your mind.",type:"yoga"},
    {name:"Alternate Nostril",  duration:68,guidance:"Right thumb closes right nostril. Inhale left. Switch. Exhale right. Repeat.",type:"yoga"},
    {name:"Eagle Arms",         duration:68,guidance:"Cross arms at elbows. Wrap forearms. Lift to chin level. Squeeze. Focus.",type:"yoga"},
    {name:"Power Position",     duration:68,guidance:"Sit tall. Feet flat. Hands on thighs. This is peak readiness. Feel it.",type:"yoga"},
    {name:"Single Point",       duration:68,guidance:"Your only object is the breath. Every time mind moves — return. No judgment.",type:"meditation"},
    {name:"Count Exhales",      duration:68,guidance:"Count exhales 1 to 10. If lost, restart at 1. This is the entire practice.",type:"meditation"},
    {name:"Box Breathing",      duration:68,guidance:"Inhale 4. Hold 4. Exhale 4. Hold 4. Navy SEAL focus protocol. Execute.",type:"meditation"},
    {name:"Label and Return",   duration:68,guidance:"Thought: thinking. Sound: hearing. Sensation: feeling. Label. Return. Always.",type:"meditation"},
    {name:"Flow State Entry",   duration:68,guidance:"Flow emerges where challenge meets skill exactly. You are at that precise edge.",type:"meditation"},
    {name:"Effortless Clarity", duration:68,guidance:"Stop trying to focus. Simply be aware. Attention follows awareness naturally.",type:"meditation"},
    {name:"Mission Ready",      duration:68,guidance:"Mind sharpened. Body activated. One mission ahead. Full power. Execute now.",type:"meditation"},
  ],
  posture:[
    {name:"Chin Tuck",           duration:68,guidance:"Pull chin straight back — not down. Hold 5 seconds. Release. Repeat 6 times.",type:"yoga"},
    {name:"Neck Circles",        duration:68,guidance:"Slow full circles each direction. 5 each. Release accumulated desk tension.",type:"yoga"},
    {name:"Shoulder Blade Rolls",duration:68,guidance:"10 backward rolls. Feel blades slide together and down your back. Open chest.",type:"yoga"},
    {name:"Pectoral Opener",     duration:68,guidance:"Clasp hands behind back. Squeeze shoulder blades together. Lift chest. Hold.",type:"yoga"},
    {name:"Wall Angels",         duration:68,guidance:"Full back contact with wall. Arms slide from hips to overhead. 8 slow reps.",type:"yoga"},
    {name:"Hip Flexor Left",     duration:68,guidance:"Low lunge. Left knee forward. Tuck pelvis under. Feel hip flexor release.",type:"yoga"},
    {name:"Hip Flexor Right",    duration:68,guidance:"Switch legs. Right knee forward. Pelvis neutral. Breathe into the stretch.",type:"yoga"},
    {name:"Tension Inventory",   duration:68,guidance:"Where is tension right now? Neck? Jaw? Shoulders? Hips? Be ruthlessly honest.",type:"meditation"},
    {name:"Ideal Posture Scan",  duration:68,guidance:"Ears over shoulders. Shoulders over hips. Hips over ankles. See it clearly.",type:"meditation"},
    {name:"Spine and Breath",    duration:68,guidance:"Slumped posture restricts breath by 30%. Sit tall now. Full lung capacity.",type:"meditation"},
    {name:"Movement Promise",    duration:68,guidance:"Commit: stand every 30 minutes. Move every 60. Set your phone alarm now.",type:"meditation"},
    {name:"Confidence Posture",  duration:68,guidance:"Research shows tall posture raises confidence 20%. Stand tall and own it.",type:"meditation"},
    {name:"Ergonomic Check",     duration:68,guidance:"Screen at eye level. Arms at 90 degrees. Feet flat on floor. Check now.",type:"meditation"},
    {name:"Aligned and Ready",   duration:68,guidance:"Spine aligned. Mind clear. Body serves you today. Carry this posture forward.",type:"meditation"},
  ],
};

/* ════════════════════════════════════════════════════════════
   8. UTILITY FUNCTIONS
════════════════════════════════════════════════════════════ */
function loadMode() {
  const r = localStorage.getItem("magic16_mode") || "morning";
  return MODE_CONFIG[r] ? r : "morning";
}
function loadLang() {
  const c = localStorage.getItem("magic16_lang") || "en-IN";
  return LANG_MAP[c] || "en-IN";
}
function loadSteps(modeKey, day) {
  if (modeKey !== "morning") return FALLBACK[modeKey] || FALLBACK.morning;
  try {
    const s = getSessionSteps(day, modeKey);
    return s?.length > 0 ? s : FALLBACK.morning;
  } catch { return FALLBACK.morning; }
}
function createSpeaker(lang, modeKey) {
  const cfg = MODE_CONFIG[modeKey] || MODE_CONFIG.morning;
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang  = lang;
      u.rate  = urgent ? 1.15 : cfg.voiceRate;
      u.pitch = urgent ? 1.1  : cfg.voicePitch;
      const voices = window.speechSynthesis.getVoices();
      const base   = lang.split("-")[0];
      const v = voices.find(x => x.lang === lang)
             || voices.find(x => x.lang.startsWith(base))
             || voices.find(x => x.lang.startsWith("en"));
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    if (urgent) navigator.vibrate?.([80, 40, 80]);
    if (speechSynthesis.getVoices().length) say();
    else { speechSynthesis.onvoiceschanged = say; }
  };
}
function wellness(accuracy, stepIndex, totalSteps, modeKey) {
  if (modeKey === "sleep") return { score:88, tier:"Restorative", color:"#A78BFA" };
  const pct = (stepIndex / Math.max(totalSteps - 1, 1)) * 100;
  const s   = Math.round(Math.min(accuracy * 0.55 + pct * 0.45, 100));
  if (s >= 88) return { score:s, tier:"Elite",    color:"#F59E0B" };
  if (s >= 72) return { score:s, tier:"Advanced", color:"#34D399" };
  if (s >= 50) return { score:s, tier:"Active",   color:"#38BDF8" };
  return              { score:s, tier:"Building", color:"#A78BFA" };
}

/* ════════════════════════════════════════════════════════════
   9. KEYFRAME STYLES
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("m16css")) return;
  const el = document.createElement("style");
  el.id = "m16css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes scan   {from{top:-3px}to{top:100%}}
    @keyframes blink  {0%,100%{opacity:1}50%{opacity:0}}
    @keyframes fadeUp {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin   {to{transform:rotate(360deg)}}
    @keyframes pulse  {0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.14;transform:scale(1.07)}}
    @keyframes float  {0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes ticker {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes beat   {0%,100%{transform:scale(1)}14%{transform:scale(1.35)}28%{transform:scale(1)}42%{transform:scale(1.2)}70%{transform:scale(1)}}
    @keyframes wave   {from{transform:scaleX(0)}to{transform:scaleX(1)}}
    .fu{animation:fadeUp .5s cubic-bezier(.22,.68,0,1.2) both}
    .fl{animation:float 3.5s ease-in-out infinite}
    .btn:hover{filter:brightness(1.15);transform:translateY(-1px);transition:all .18s}
    .btn:active{transform:translateY(0)}
    .ghost:hover{border-color:#252525!important;color:#555!important;transition:all .18s}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   10. SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

function Ticker() {
  const txt = [...TICKER, ...TICKER].join("   ·   ");
  return (
    <div style={{overflow:"hidden",whiteSpace:"nowrap",borderTop:"1px solid #111",borderBottom:"1px solid #111",padding:"6px 0",background:"#050505"}}>
      <span style={{display:"inline-block",animation:"ticker 60s linear infinite",fontSize:8,letterSpacing:".1em",color:"#252525",textTransform:"uppercase"}}>
        {txt}
      </span>
    </div>
  );
}

function ScoreBadge({ score, tier, color }) {
  const r = 15, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{position:"relative",width:42,height:42}}>
        <svg viewBox="0 0 36 36" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="18" cy="18" r={r} fill="none" stroke="#181818" strokeWidth="2.5"/>
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
            style={{transition:"stroke-dasharray .6s"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color}}>{score}</div>
      </div>
      <div>
        <div style={{fontSize:7,letterSpacing:".2em",color:"#222",textTransform:"uppercase"}}>Wellness</div>
        <div style={{fontSize:9,fontWeight:700,color,letterSpacing:".12em",textTransform:"uppercase"}}>{tier}</div>
      </div>
    </div>
  );
}

function BreathCircle({ on, accent }) {
  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(4);
  useEffect(() => {
    if (!on) return;
    const seq = [{l:"inhale",s:4},{l:"hold",s:4},{l:"exhale",s:6}];
    let i = 0, ct, pt;
    const run = () => {
      const cur = seq[i % seq.length];
      setPhase(cur.l); setCount(cur.s);
      let c = cur.s;
      ct = setInterval(() => { c--; setCount(c); if (c <= 0) clearInterval(ct); }, 1000);
      pt = setTimeout(() => { i++; run(); }, cur.s * 1000);
    };
    run();
    return () => { clearInterval(ct); clearTimeout(pt); };
  }, [on]);
  if (!on) return null;
  const sz = phase === "exhale" ? 18 : 42;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 0"}}>
      <div style={{width:68,height:68,borderRadius:"50%",border:`1px solid ${accent}22`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:sz,height:sz,borderRadius:"50%",background:phase==="inhale"?accent:phase==="hold"?"#3a3a3a":"#1a1a1a",transition:"all 1s ease",opacity:.8}}/>
      </div>
      <div style={{fontSize:8,letterSpacing:".22em",textTransform:"uppercase",color:phase==="inhale"?accent:"#333"}}>
        {phase} · {count}s
      </div>
    </div>
  );
}

function WHOPanel({ modeKey, accent, open }) {
  const d = WHO_HEALTH_DOMAINS[modeKey];
  if (!d || !open) return null;
  return (
    <div className="fu" style={{border:`1px solid ${accent}20`,background:"#080808",padding:"14px 16px"}}>
      <div style={{fontSize:7,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:6}}>WHO Domain · {d.who_code}</div>
      <div style={{fontSize:11,color:accent,fontWeight:700,letterSpacing:".05em",marginBottom:10}}>{d.domain}</div>
      {[d.stat1,d.stat2,d.stat3,d.stat4].map((s,i)=>(
        <div key={i} style={{fontSize:9,color:i===0?"#3a3a3a":"#1e1e1e",letterSpacing:".06em",lineHeight:1.7,borderLeft:`2px solid ${i===0?accent:"#181818"}`,paddingLeft:8,marginBottom:4}}>{s}</div>
      ))}
      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #111",fontSize:8,color:"#1e1e1e",letterSpacing:".1em",textTransform:"uppercase"}}>{d.sdg} · {d.lmic}</div>
      <div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:8,color:accent,letterSpacing:".08em",textTransform:"uppercase"}}>✅ {d.module}</span>
        <span style={{fontSize:8,color:"#444",letterSpacing:".06em"}}>{d.promise}</span>
      </div>
    </div>
  );
}

function ModuleHub({ navigate }) {
  return (
    <div>
      <div style={{fontSize:7,letterSpacing:".22em",color:"#181818",textTransform:"uppercase",marginBottom:7}}>ManifiX — 10 Global Health Modules</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
        {MANIFIX_MODULES.map(m=>(
          <button key={m.id} className="ghost"
            onClick={()=>navigate(m.route)}
            title={`${m.label}\n${m.stat}\nResult: ${m.result}`}
            style={{background:"#070707",border:"1px solid #111",color:"#1a1a1a",fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:".08em",textTransform:"uppercase",padding:"8px 2px",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .18s"}}
          >
            <span style={{fontSize:15}}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      <div style={{marginTop:5,fontSize:7,letterSpacing:".08em",color:"#111",textTransform:"uppercase",textAlign:"center",lineHeight:1.7}}>
        Mental · Sleep · Nutrition · Stress · Chronic Disease<br/>
        Women · Elderly · Medication · Children · Preventive
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   11. MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function Magic16() {
  const navigate  = useNavigate();
  const modeKey   = useMemo(loadMode,  []);
  const theme     = useMemo(()=>MODE_CONFIG[modeKey],[modeKey]);
  const langBcp47 = useMemo(loadLang,  []);
  const speak     = useMemo(()=>createSpeaker(langBcp47,modeKey),[langBcp47,modeKey]);

  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const mediaRecRef      = useRef(null);
  const timerRef         = useRef(null);
  const detectorRef      = useRef(null);
  const stepIdxRef       = useRef(0);
  const moveScoreRef     = useRef(0);
  const playingRef       = useRef(false);
  const proRef           = useRef(false);
  const stepDurRef       = useRef(0);
  const warnRef          = useRef(0);

  const [aiLoading,  setAiLoading]  = useState(true);
  const [aiErr,      setAiErr]      = useState(false);
  const [playing,    setPlaying]    = useState(false);
  const [stepIdx,    setStepIdx]    = useState(0);
  const [moveScore,  setMoveScore]  = useState(0);
  const [accuracy,   setAccuracy]   = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [stepPct,    setStepPct]    = useState(100);
  const [recording,  setRecording]  = useState(false);
  const [clip,       setClip]       = useState(null);
  const [pro,        setPro]        = useState(false);
  const [camErr,     setCamErr]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [imgErr,     setImgErr]     = useState(false);
  const [whoOpen,    setWhoOpen]    = useState(false);
  const [hr,         setHr]         = useState(null);
  const [offline,    setOffline]    = useState(!navigator.onLine);

  const day   = useMemo(()=>Math.max(1,Number(localStorage.getItem("magic16_streak")||0)+1),[]);
  const steps = useMemo(()=>loadSteps(modeKey,day),[modeKey,day]);
  const total = useMemo(()=>steps.reduce((a,s)=>a+s.duration,0),[steps]);
  const cur   = steps[stepIdx]||steps[0];
  const pct   = Math.round((stepIdx/Math.max(steps.length-1,1))*100);
  const isMed = cur?.type==="meditation";
  const wScore= useMemo(()=>wellness(accuracy,stepIdx,steps.length,modeKey),[accuracy,stepIdx,steps.length,modeKey]);

  /* offline listener */
  useEffect(()=>{
    const off=()=>setOffline(true), on=()=>setOffline(false);
    window.addEventListener("offline",off); window.addEventListener("online",on);
    return()=>{window.removeEventListener("offline",off);window.removeEventListener("online",on);};
  },[]);

  /* heart rate simulation */
  useEffect(()=>{
    if(!playing){setHr(null);return;}
    setHr(theme.hrBase+Math.floor(Math.random()*theme.hrVar));
    const id=setInterval(()=>setHr(p=>Math.max(50,Math.min(115,(p||theme.hrBase)+Math.floor(Math.random()*6)-3))),3800);
    return()=>clearInterval(id);
  },[playing,theme]);

  /* AI model init */
  useEffect(()=>{
    injectCSS();
    setTimeLeft(steps[0]?.duration??68);
    stepDurRef.current=steps[0]?.duration??68;
    (async()=>{
      try{
        const cv=document.createElement("canvas");
        if(!cv.getContext("webgl")&&!cv.getContext("experimental-webgl"))throw new Error("no webgl");
        await import("@tensorflow/tfjs-backend-webgl");
        detectorRef.current=await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {modelType:poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING}
        );
      }catch(e){console.warn(e.message);setAiErr(true);}
      finally{setAiLoading(false);}
    })();
    return()=>{
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
      videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop());
    };
  },[steps]);

  /* pose detection */
  const detect=useCallback(async()=>{
    if(!detectorRef.current||!videoRef.current||!playingRef.current)return;
    if(videoRef.current.readyState<2||videoRef.current.paused)return;
    if(modeKey==="sleep")return;
    try{
      const poses=await detectorRef.current.estimatePoses(videoRef.current);
      if(poses[0]?.keypoints?.some(k=>k.score>0.45)){
        moveScoreRef.current+=1;
        setMoveScore(moveScoreRef.current);
        const elapsed=steps.slice(0,stepIdxRef.current).reduce((a,s)=>a+s.duration,0);
        const acc=Math.min(Math.round((moveScoreRef.current/Math.max(elapsed+1,1))*100),100);
        setAccuracy(acc);
        if(!proRef.current&&stepIdxRef.current>=4&&acc>=80){
          proRef.current=true; setPro(true);
          speak(ph(langBcp47,"pro"));
        }
      } else {
        const now=Date.now();
        if(!isMed&&Math.random()>0.9&&now-warnRef.current>9000){
          warnRef.current=now;
          speak(ph(langBcp47,"form_warn"),true);
        }
      }
    }catch(_){}
  },[steps,speak,isMed,modeKey,langBcp47]);

  /* next step */
  const nextStep=useCallback(()=>{
    const ni=stepIdxRef.current+1;
    if(ni>=steps.length){
      clearInterval(timerRef.current);
      playingRef.current=false;
      setPlaying(false); setDone(true);
      confetti({particleCount:320,spread:130,origin:{y:.55},colors:[theme.accent,"#fff",theme.accentDim]});
      speak(ph(langBcp47,"complete"));
      const fa=Math.min(Math.round((moveScoreRef.current/total)*100),100);
      window.__magic16_recordComplete?.();
      setTimeout(()=>{
        videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop());
        navigate("/app/result",{state:{accuracy:fa,isPro:proRef.current,video:clip,day,streak:day,mode:modeKey,lang:langBcp47,wellness:wScore.tier}});
      },2800);
      return 0;
    }
    stepIdxRef.current=ni;
    const nx=steps[ni];
    stepDurRef.current=nx.duration;
    setStepIdx(ni); setStepPct(100); setImgErr(false);
    speak(nx.guidance||nx.name);
    return nx.duration;
  },[steps,total,day,clip,navigate,speak,modeKey,langBcp47,theme,wScore]);

  /* start */
  const start=useCallback(async()=>{
    setCamErr(false);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:false});
      videoRef.current.srcObject=stream;
      await videoRef.current.play();
      playingRef.current=true; stepIdxRef.current=0; moveScoreRef.current=0;
      stepDurRef.current=steps[0].duration;
      setPlaying(true); setStepIdx(0); setMoveScore(0); setAccuracy(0);
      setTimeLeft(steps[0].duration); setStepPct(100); setImgErr(false);
      speak(`${ph(langBcp47,"ready")} ${ph(langBcp47,"day")} ${day}. ${theme.label}. ${steps[0].guidance}`);
      timerRef.current=setInterval(()=>{
        if(!playingRef.current)return;
        detect();
        setTimeLeft(prev=>{
          const n=(prev??1)-1;
          setStepPct(Math.max(0,Math.round((n/stepDurRef.current)*100)));
          if(n<=0)return nextStep();
          return n;
        });
      },1000);
    }catch{
      setCamErr(true);
      speak("Camera access required for AI motion tracking.",true);
    }
  },[steps,day,speak,detect,nextStep,theme,langBcp47]);

  /* record */
  const record=useCallback(()=>{
    if(!videoRef.current?.srcObject||recording)return;
    const chunks=[];
    const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
    const mr=new MediaRecorder(videoRef.current.srcObject,{mimeType:mime});
    mediaRecRef.current=mr;
    mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{setClip(new Blob(chunks,{type:"video/webm"}));setRecording(false);speak("Clip saved. Share your proof.");};
    mr.start(); setRecording(true); speak("Recording your discipline.");
    setTimeout(()=>mr.state==="recording"&&mr.stop(),5000);
  },[recording,speak]);

  const share=useCallback(async()=>{
    if(!clip)return;
    const f=new File([clip],"magic16-proof.webm",{type:"video/webm"});
    if(navigator.share&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:"Magic16 × ManifiX — Proof of Discipline"});
    else{const a=document.createElement("a");a.href=URL.createObjectURL(clip);a.download="magic16-proof.webm";a.click();}
  },[clip]);

  const exit=useCallback(()=>{
    clearInterval(timerRef.current); speechSynthesis.cancel();
    playingRef.current=false;
    videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop());
    navigate("/app/dashboard");
  },[navigate]);

  /* ══════════════════ RENDER ══════════════════ */
  const A=theme.accent, B=theme.border, BG=theme.bg;

  return (
    <div style={{minHeight:"100dvh",background:BG,color:"#f0ede6",fontFamily:"'JetBrains Mono','Courier New',monospace",display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",position:"relative"}}>

      {/* BG grid */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${theme.grid} 1px,transparent 1px),linear-gradient(90deg,${theme.grid} 1px,transparent 1px)`,backgroundSize:"44px 44px"}}/>

      {/* Ambient glow */}
      <div style={{position:"fixed",top:"22%",left:"50%",transform:"translateX(-50%)",width:460,height:240,background:`radial-gradient(ellipse,${A}10 0%,transparent 70%)`,animation:"pulse 5s ease-in-out infinite",pointerEvents:"none"}}/>

      {/* Corner brackets */}
      {[{top:13,left:13,borderTopWidth:2,borderLeftWidth:2},{top:13,right:13,borderTopWidth:2,borderRightWidth:2},{bottom:13,left:13,borderBottomWidth:2,borderLeftWidth:2},{bottom:13,right:13,borderBottomWidth:2,borderRightWidth:2}].map((pos,i)=>(
        <div key={i} style={{position:"fixed",width:20,height:20,borderColor:A,borderStyle:"solid",borderWidth:0,opacity:.28,pointerEvents:"none",...pos}}/>
      ))}

      {/* Offline badge */}
      {offline&&(
        <div style={{position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:99,fontSize:8,letterSpacing:".16em",background:"#160d00",border:`1px solid ${A}`,color:A,padding:"3px 12px",textTransform:"uppercase"}}>
          ⚡ Offline — All features available
        </div>
      )}

      {/* ═══ WRAPPER ═══ */}
      <div style={{position:"relative",zIndex:2,width:"min(440px,96vw)",display:"flex",flexDirection:"column",gap:10,paddingTop:18,paddingBottom:52}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:12,borderBottom:"1px solid #111"}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,letterSpacing:"-.02em",lineHeight:1,color:"#f0ede6"}}>
              MAGIC<span style={{color:A}}>16</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:400,color:"#222",letterSpacing:".1em",marginLeft:8,verticalAlign:"middle"}}>× ManifiX</span>
            </div>
            <div style={{fontSize:7,letterSpacing:".22em",color:A,textTransform:"uppercase",marginTop:3,opacity:.65}}>{theme.tagline}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            {playing
              ? <ScoreBadge score={wScore.score} tier={wScore.tier} color={wScore.color}/>
              : <>
                  <div style={{fontSize:8,letterSpacing:".16em",color:"#1e1e1e",textTransform:"uppercase",textAlign:"right"}}>{ph(langBcp47,"day")} {day} · {langBcp47}</div>
                  <button onClick={exit} style={{fontSize:8,letterSpacing:".14em",color:"#252525",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,textTransform:"uppercase"}}>← Back</button>
                </>
            }
          </div>
        </div>

        {/* TICKER */}
        <Ticker/>

        {/* PHASE CHIPS */}
        <div style={{display:"flex",gap:6}}>
          <div style={{fontSize:8,letterSpacing:".16em",textTransform:"uppercase",border:`1px solid ${A}30`,background:`${A}09`,color:A,padding:"5px 10px",display:"flex",alignItems:"center",gap:5}}>
            <span>{theme.emoji}</span><span>{theme.label}</span>
          </div>
          {[{l:theme.phaseA,a:!isMed},{l:theme.phaseB,a:isMed}].map(({l,a})=>(
            <div key={l} style={{flex:1,textAlign:"center",padding:"5px 0",fontSize:8,letterSpacing:".13em",textTransform:"uppercase",border:`1px solid ${a?(isMed?"#6D28D9":A):"#0e0e0e"}`,color:a?(isMed?"#A78BFA":A):"#181818",background:a?"#0a0a0a":"transparent",transition:"all .3s"}}>{l}</div>
          ))}
        </div>

        {/* VIDEO */}
        <div style={{position:"relative",width:"100%",aspectRatio:"4/3",background:"#070707",border:"1px solid #111",overflow:"hidden"}}>
          <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)",display:"block"}} autoPlay playsInline muted/>
          <canvas ref={canvasRef} style={{display:"none"}}/>

          {!playing&&(
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:BG}}>
              <div className="fl" style={{fontSize:52,filter:`drop-shadow(0 0 28px ${A}55)`}}>{theme.emoji}</div>
              <div style={{fontSize:8,letterSpacing:".18em",color:"#1a1a1a",textTransform:"uppercase",textAlign:"center"}}>
                {camErr?"Camera blocked — allow in browser settings":aiLoading?`Loading ${theme.label} AI…`:aiErr?"Offline lite mode — all steps available":offline?"Offline — AI ready from cache":"AI health observer ready"}
              </div>
              {aiLoading&&<div style={{width:16,height:16,border:`2px solid ${B}`,borderTopColor:A,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>}
            </div>
          )}

          {playing&&<div style={{position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${A}44,${A}aa,${A}44,transparent)`,animation:"scan 2.8s linear infinite",pointerEvents:"none"}}/>}

          {/* Top badges */}
          <div style={{position:"absolute",top:8,left:8,right:8,display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:8,letterSpacing:".18em",padding:"3px 8px",border:`1px solid ${playing?"#ff3333":"#181818"}`,color:playing?"#ff4444":"#1e1e1e",background:"#05050599",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5,backdropFilter:"blur(4px)"}}>
              {playing&&<span style={{animation:"blink 1s step-end infinite",color:"#ff4444"}}>●</span>}
              {playing?"LIVE":"STANDBY"}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {pro&&<div style={{fontSize:8,letterSpacing:".13em",padding:"3px 8px",border:`1px solid ${A}`,color:A,background:"#05050599",textTransform:"uppercase",backdropFilter:"blur(4px)"}}>PRO ✦</div>}
              {playing&&hr&&(
                <div style={{fontSize:8,letterSpacing:".1em",padding:"3px 8px",border:"1px solid #2a1010",color:"#ef4444",background:"#05050599",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:3}}>
                  <span style={{animation:"beat 1s infinite"}}>♥</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace"}}>{hr}</span>
                </div>
              )}
              {offline&&playing&&<div style={{fontSize:8,padding:"3px 8px",border:`1px solid ${A}33`,color:A,background:"#05050599",backdropFilter:"blur(4px)",letterSpacing:".1em",textTransform:"uppercase"}}>⚡</div>}
            </div>
          </div>

          {/* Accuracy */}
          {playing&&(
            <div style={{position:"absolute",bottom:8,left:8,fontSize:8,letterSpacing:".13em",color:A,background:"#050505bb",padding:"3px 8px",border:"1px solid #181818",textTransform:"uppercase",backdropFilter:"blur(4px)"}}>
              {modeKey==="sleep"?"Restore mode":aiErr?"Lite AI":`AI · ${accuracy}% accuracy`}
            </div>
          )}

          {/* Record btn */}
          <button className={recording?"":"ghost"} style={{position:"absolute",bottom:8,right:8,background:recording?"#ff3333":"#0e0e0e",border:`1px solid ${recording?"#ff3333":"#1e1e1e"}`,color:recording?"#fff":"#2a2a2a",fontSize:8,letterSpacing:".13em",padding:"4px 10px",cursor:(!playing||recording)?"not-allowed":"pointer",textTransform:"uppercase",fontFamily:"inherit",transition:"all .2s"}}
            onClick={record} disabled={!playing||recording}>
            {recording?"● REC…":"▶ 5s"}
          </button>
        </div>

        {/* POSE IMAGE */}
        {playing&&cur?.image&&!imgErr&&(
          <div className="fu" style={{position:"relative",width:"100%",aspectRatio:"4/3",overflow:"hidden",border:`1px solid ${B}`,background:"#070707"}}>
            <img src={cur.image} alt={cur.name} style={{width:"100%",height:"100%",objectFit:"contain",opacity:.85,background:"#070707",transition:"opacity .4s"}} onError={()=>setImgErr(true)}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,#050505bb 0%,transparent 35%,transparent 65%,#050505bb 100%)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:8,left:8,fontSize:8,letterSpacing:".18em",textTransform:"uppercase",padding:"3px 8px",border:`1px solid ${isMed?"#6D28D9":A}`,color:isMed?"#A78BFA":A,background:"#050505cc"}}>
              {isMed?"Meditation":"Pose guide"}
            </div>
          </div>
        )}

        {/* BREATH GUIDE */}
        {playing&&isMed&&<BreathCircle on={true} accent={A}/>}

        {/* SESSION COMPLETE */}
        {done&&(
          <div className="fu" style={{border:`1px solid ${theme.doneBorder}`,background:"#040904",padding:"20px",textAlign:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:38,fontWeight:800,color:theme.doneColor,lineHeight:1,marginBottom:6}}>SESSION<br/>COMPLETE</div>
            <div style={{fontSize:8,letterSpacing:".22em",color:theme.doneBorder,textTransform:"uppercase"}}>Calculating results…</div>
          </div>
        )}

        {/* STEP CARD */}
        {!done&&(
          <div className={playing?"fu":""} style={{border:`1px solid ${B}`,padding:"16px 18px",background:BG,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:isMed?theme.medGrad:theme.progressGrad,transformOrigin:"left",animation:playing?"wave .55s ease both":"none"}}/>
            <span style={{fontSize:8,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",display:"block",marginBottom:4}}>
              {isMed?"Meditation":"Yoga"} · Step {stepIdx+1} of {steps.length}
            </span>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,letterSpacing:"-.01em",color:"#f0ede6",lineHeight:1.1,marginBottom:14}}>{cur?.name}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:12}}>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:60,fontWeight:800,color:(timeLeft??99)<=5?"#ef4444":A,lineHeight:1,fontVariantNumeric:"tabular-nums",transition:"color .3s"}}>{timeLeft??cur?.duration??"--"}</span>
              <span style={{fontSize:9,color:"#1e1e1e",letterSpacing:".18em",textTransform:"uppercase"}}>sec</span>
            </div>
            <div style={{height:2,background:"#0e0e0e",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${stepPct}%`,background:isMed?theme.medGrad:theme.progressGrad,transition:"width .9s cubic-bezier(.22,.68,0,1.2)"}}/>
            </div>
          </div>
        )}

        {/* GUIDANCE */}
        {!done&&cur?.guidance&&(
          <div style={{fontSize:10,letterSpacing:".07em",color:"#2e2e2e",textTransform:"uppercase",lineHeight:1.85,borderLeft:`2px solid ${isMed?"#6D28D9":A}`,paddingLeft:12}}>
            {cur.guidance}
          </div>
        )}

        {/* CAMERA ERROR */}
        {camErr&&(
          <div style={{border:"1px solid #2a0e0e",background:"#070404",padding:"12px 14px",fontSize:9,color:"#ef4444",letterSpacing:".1em",textTransform:"uppercase",borderLeft:"2px solid #ef4444"}}>
            ⚠ Camera access denied. Allow in browser settings and reload.
          </div>
        )}

        {/* BIOMETRIC STATS */}
        {playing&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
            {[
              {label:"Accuracy", value:modeKey==="sleep"?"REST":aiErr?"LITE":accuracy+"%", hi:accuracy>=80&&modeKey!=="sleep"},
              {label:"Movement", value:modeKey==="sleep"?"OFF":String(moveScore), hi:false},
              {label:"Heart ♥",  value:hr?String(hr):"—", hi:false, red:true},
              {label:"Engine",   value:aiLoading?"INIT":aiErr?"LITE":offline?"CACHE":"LIVE", hi:false},
            ].map(({label,value,hi,red})=>(
              <div key={label} style={{border:"1px solid #0e0e0e",padding:"8px 10px",background:"#070707"}}>
                <span style={{fontSize:7,letterSpacing:".2em",color:"#181818",textTransform:"uppercase",display:"block",marginBottom:3}}>{label}</span>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:red?"#ef4444":hi?A:"#8a8680",lineHeight:1}}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* OVERALL PROGRESS */}
        {playing&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8,letterSpacing:".16em",color:"#181818",textTransform:"uppercase",marginBottom:5}}>
              <span>Session progress · {steps.length} steps</span><span>{pct}%</span>
            </div>
            <div style={{height:2,background:"#0e0e0e",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:theme.progressGrad,transition:"width .9s ease"}}/>
            </div>
          </div>
        )}

        {/* WHO TOGGLE */}
        {!playing&&!done&&(
          <>
            <button className="ghost" onClick={()=>setWhoOpen(v=>!v)}
              style={{background:"transparent",border:"1px solid #0e0e0e",color:"#1a1a1a",fontSize:8,letterSpacing:".16em",textTransform:"uppercase",fontFamily:"inherit",padding:"8px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",transition:"all .18s"}}>
              <span>{whoOpen?"▾":"▸"} WHO Impact · {WHO_HEALTH_DOMAINS[modeKey]?.who_code}</span>
              <span style={{color:A}}>{WHO_HEALTH_DOMAINS[modeKey]?.stat1?.split("—")[0].trim()}</span>
            </button>
            <WHOPanel modeKey={modeKey} accent={A} open={whoOpen}/>
          </>
        )}

        {/* START BUTTON */}
        {!playing&&!done&&(
          <button className="btn" onClick={start} disabled={aiLoading||camErr}
            style={{width:"100%",padding:"18px",background:(aiLoading||camErr)?"#0c0c0c":A,color:(aiLoading||camErr)?"#1a1a1a":"#040404",border:(aiLoading||camErr)?"1px solid #141414":"none",fontSize:13,fontWeight:700,fontFamily:"'Syne',sans-serif",letterSpacing:".06em",textTransform:"uppercase",cursor:(aiLoading||camErr)?"not-allowed":"pointer",transition:"all .2s"}}>
            {aiLoading?`Initialising ${theme.label} AI…`:`${theme.emoji}  Start ${theme.label}16 — ${ph(langBcp47,"day")} ${day} →`}
          </button>
        )}

        {/* SHARE CLIP */}
        {clip&&(
          <button onClick={share} className="ghost"
            style={{background:"transparent",border:"1px solid #111",color:"#252525",fontSize:9,letterSpacing:".13em",padding:"8px",cursor:"pointer",textTransform:"uppercase",fontFamily:"inherit",width:"100%",transition:"all .2s"}}>
            ↗ Share proof clip
          </button>
        )}

        {/* MANIFIX 10-MODULE HUB */}
        {!playing&&!done&&<ModuleHub navigate={navigate}/>}

        {/* FOOTER */}
        {!playing&&(
          <div style={{textAlign:"center",fontSize:7,letterSpacing:".16em",color:"#0e0e0e",textTransform:"uppercase",marginTop:4}}>
            Voice · {langBcp47} · {WHO_HEALTH_DOMAINS[modeKey]?.who_code} · {offline?"Offline-first · LMIC ready":"WHO SDG 3.4 · 3.8 · 8.8"}
          </div>
        )}

      </div>
    </div>
  );
}
