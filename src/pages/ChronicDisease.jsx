/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Chronic Disease Prevention Module v1.0         ║
 * ║                                                                          ║
 * ║  Route: /app/chronic                                                    ║
 * ║                                                                          ║
 * ║  REAL FEATURES:                                                         ║
 * ║  • WHO-Aligned Risk Calculator (Diabetes, CVD, Hypertension, Obesity)  ║
 * ║  • Daily Health Habits — 8 checkable goals, auto-reset daily           ║
 * ║  • Biometric Logger — BP, Blood Glucose, Weight, SpO2                  ║
 * ║  • 7-Day Trend Chart — pure CSS sparklines, no recharts                ║
 * ║  • AI Prevention Plan — 3 personalized micro-goals, streak tracking    ║
 * ║  • Wellness Score — live calculated from habits + logs                 ║
 * ║  • Medication Reminder Bridge → /app/medication                        ║
 * ║  • All 20 Languages fully populated                                    ║
 * ║  • Crisis warnings for critically abnormal biometrics                  ║
 * ║  • localStorage persistence, offline-first                             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  useEffect, useRef, useState, useCallback, useMemo, useReducer,
} from "react";
import { useNavigate } from "react-router-dom";

/* ════════════════════════════════════════════════════════════
   1. DESIGN TOKENS
════════════════════════════════════════════════════════════ */
const A     = "#F87171";   // Medical red accent
const ADM   = "#B91C1C";   // dim red
const A2    = "#FCA5A5";   // light red
const BG    = "#0a0505";
const CARD  = "#110808";
const BOR   = "#2a0f0f";
const BOR2  = "#3d1515";
const FONT  = "'JetBrains Mono','Courier New',monospace";
const SYNE  = "'Syne','system-ui',sans-serif";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const BLUE  = "#60a5fa";
const INFO  = "#38bdf8";
const TX    = "#f0ede6";
const TM    = "#8a6060";
const TD    = "#3a1a1a";

/* ════════════════════════════════════════════════════════════
   2. LANGUAGE MAP
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
   3. ALL 20 LANGUAGES — COMPLETE
════════════════════════════════════════════════════════════ */
const PHRASES = {
  "en-IN": {
    welcome:     "Welcome to Chronic Care. Prevention is the most powerful medicine.",
    habit_done:  "Habit completed! Consistency protects your future health.",
    log_saved:   "Reading saved. Tracking trends helps detect problems early.",
    risk_low:    "Your risk is low. Keep maintaining these healthy habits.",
    risk_mod:    "Moderate risk detected. Your prevention plan starts now.",
    risk_high:   "Elevated risk identified. Take action — your plan is ready.",
    plan_ready:  "Your personalised prevention plan is ready. Start today.",
    crisis_bp:   "URGENT: Blood pressure is critically high. Seek care now.",
    crisis_sugar:"URGENT: Blood sugar is dangerously high. Seek care now.",
    streak:      "You have a {days}-day healthy habit streak. Outstanding!",
    encourage:   "Every healthy choice builds a stronger tomorrow.",
  },
  "hi-IN": {
    welcome:     "क्रॉनिक केयर में स्वागत है। रोकथाम सबसे शक्तिशाली दवा है।",
    habit_done:  "आदत पूरी! निरंतरता आपके स्वास्थ्य की रक्षा करती है।",
    log_saved:   "रीडिंग सहेजी गई। ट्रेंड ट्रैकिंग समस्याओं को जल्दी पहचानती है।",
    risk_low:    "आपका जोखिम कम है। इन स्वस्थ आदतों को बनाए रखें।",
    risk_mod:    "मध्यम जोखिम पहचाना गया। आपकी रोकथाम योजना अब शुरू होती है।",
    risk_high:   "उच्च जोखिम पहचाना। कार्रवाई करें — आपकी योजना तैयार है।",
    plan_ready:  "आपकी व्यक्तिगत रोकथाम योजना तैयार है। आज शुरू करें।",
    crisis_bp:   "ज़रूरी: रक्तचाप गंभीर रूप से उच्च है। अभी चिकित्सा लें।",
    crisis_sugar:"ज़रूरी: रक्त शर्करा खतरनाक रूप से उच्च है। तुरंत देखभाल लें।",
    streak:      "आपकी {days} दिन की स्वस्थ आदत स्ट्रीक है। शानदार!",
    encourage:   "हर स्वस्थ चुनाव एक मजबूत कल बनाता है।",
  },
  "te-IN": {
    welcome:     "క్రానిక్ కేర్‌కు స్వాగతం. నివారణ అత్యంత శక్తివంతమైన వైద్యం.",
    habit_done:  "అలవాటు పూర్తయింది! స్థిరత్వం మీ ఆరోగ్యాన్ని కాపాడుతుంది.",
    log_saved:   "రీడింగ్ సేవ్ చేయబడింది. ట్రెండ్ ట్రాకింగ్ సమస్యలను ముందుగా గుర్తిస్తుంది.",
    risk_low:    "మీ రిస్క్ తక్కువగా ఉంది. ఈ ఆరోగ్యకరమైన అలవాట్లను కొనసాగించండి.",
    risk_mod:    "మధ్యస్థ రిస్క్ గుర్తించబడింది. మీ నివారణ ప్రణాళిక ఇప్పుడు ప్రారంభమవుతుంది.",
    risk_high:   "అధిక రిస్క్ గుర్తించబడింది. చర్య తీసుకోండి — మీ ప్రణాళిక సిద్ధంగా ఉంది.",
    plan_ready:  "మీ వ్యక్తిగత నివారణ ప్రణాళిక సిద్ధంగా ఉంది. ఈరోజు ప్రారంభించండి.",
    crisis_bp:   "అత్యవసరం: రక్తపోటు విమర్శనాత్మకంగా అధికంగా ఉంది. ఇప్పుడు వైద్యం తీసుకోండి.",
    crisis_sugar:"అత్యవసరం: రక్తంలో చక్కెర ప్రమాదకరంగా అధికంగా ఉంది. వెంటనే వైద్యం తీసుకోండి.",
    streak:      "మీకు {days} రోజుల ఆరోగ్యకరమైన అలవాటు స్ట్రీక్ ఉంది!",
    encourage:   "ప్రతి ఆరోగ్యకరమైన ఎంపిక బలమైన రేపటిని నిర్మిస్తుంది.",
  },
  "ta-IN": {
    welcome:     "நாள்பட்ட கவலைக்கு வரவேற்கிறோம். தடுப்பு மிகவும் சக்திவாய்ந்த மருந்து.",
    habit_done:  "பழக்கம் முடிந்தது! தொடர்ச்சி உங்கள் ஆரோக்கியத்தை பாதுகாக்கிறது.",
    log_saved:   "ரீடிங் சேமிக்கப்பட்டது. டிரெண்ட் கண்காணிப்பு பிரச்சினைகளை முன்கூட்டியே கண்டறிய உதவுகிறது.",
    risk_low:    "உங்கள் ஆபத்து குறைவாக உள்ளது. இந்த ஆரோக்கியமான பழக்கங்களை பராமரிக்கவும்.",
    risk_mod:    "மிதமான ஆபத்து கண்டறியப்பட்டது. உங்கள் தடுப்பு திட்டம் இப்போது தொடங்குகிறது.",
    risk_high:   "அதிக ஆபத்து அடையாளம் காணப்பட்டது. நடவடிக்கை எடுங்கள் — உங்கள் திட்டம் தயாராக உள்ளது.",
    plan_ready:  "உங்கள் தனிப்பயன் தடுப்பு திட்டம் தயாராக உள்ளது. இன்றே தொடங்குங்கள்.",
    crisis_bp:   "அவசரம்: இரத்த அழுத்தம் மிக அதிகமாக உள்ளது. இப்போதே மருத்துவ உதவி பெறுங்கள்.",
    crisis_sugar:"அவசரம்: இரத்த சர்க்கரை அபாயகரமாக அதிகமாக உள்ளது. உடனடியாக சிகிச்சை பெறுங்கள்.",
    streak:      "உங்களுக்கு {days} நாள் ஆரோக்கியமான பழக்கம் தொடர் உள்ளது!",
    encourage:   "ஒவ்வொரு ஆரோக்கியமான தேர்வும் வலுவான நாளையை உருவாக்குகிறது.",
  },
  "mr-IN": {
    welcome:     "क्रॉनिक केअरमध्ये स्वागत. प्रतिबंध हे सर्वात शक्तिशाली औषध आहे.",
    habit_done:  "सवय पूर्ण! सातत्य तुमच्या भविष्यातील आरोग्याचे संरक्षण करते.",
    log_saved:   "रीडिंग सहेजले. ट्रेंड ट्रॅकिंग समस्या लवकर ओळखण्यास मदत करते.",
    risk_low:    "तुमचा धोका कमी आहे. या निरोगी सवयी कायम ठेवा.",
    risk_mod:    "मध्यम धोका आढळला. तुमची प्रतिबंध योजना आता सुरू होते.",
    risk_high:   "उच्च धोका ओळखला. कारवाई करा — तुमची योजना तयार आहे.",
    plan_ready:  "तुमची वैयक्तिक प्रतिबंध योजना तयार आहे. आजच सुरुवात करा.",
    crisis_bp:   "तातडीचे: रक्तदाब गंभीरपणे उच्च आहे. आत्ता वैद्यकीय मदत घ्या.",
    crisis_sugar:"तातडीचे: रक्तातील साखर धोकादायकपणे उच्च आहे. तातडीने उपचार घ्या.",
    streak:      "तुमची {days} दिवसांची निरोगी सवय स्ट्रीक आहे!",
    encourage:   "प्रत्येक निरोगी निवड एक मजबूत उद्या घडवते.",
  },
  "bn-IN": {
    welcome:     "ক্রনিক কেয়ারে স্বাগতম। প্রতিরোধ হল সবচেয়ে শক্তিশালী ওষুধ।",
    habit_done:  "অভ্যাস সম্পন্ন! ধারাবাহিকতা আপনার ভবিষ্যৎ স্বাস্থ্য রক্ষা করে।",
    log_saved:   "রিডিং সংরক্ষিত হয়েছে। ট্রেন্ড ট্র্যাকিং সমস্যা আগে থেকে সনাক্ত করতে সাহায্য করে।",
    risk_low:    "আপনার ঝুঁকি কম। এই স্বাস্থ্যকর অভ্যাসগুলো বজায় রাখুন।",
    risk_mod:    "মাঝারি ঝুঁকি সনাক্ত হয়েছে। আপনার প্রতিরোধ পরিকল্পনা এখন শুরু হচ্ছে।",
    risk_high:   "উচ্চ ঝুঁকি চিহ্নিত। ব্যবস্থা নিন — আপনার পরিকল্পনা প্রস্তুত।",
    plan_ready:  "আপনার ব্যক্তিগতকৃত প্রতিরোধ পরিকল্পনা প্রস্তুত। আজই শুরু করুন।",
    crisis_bp:   "জরুরি: রক্তচাপ গুরুতরভাবে বেশি। এখনই চিকিৎসা নিন।",
    crisis_sugar:"জরুরি: রক্তের শর্করা বিপজ্জনকভাবে বেশি। তাৎক্ষণিক চিকিৎসা নিন।",
    streak:      "আপনার {days} দিনের সুস্থ অভ্যাসের স্ট্রিক রয়েছে!",
    encourage:   "প্রতিটি সুস্থ পছন্দ একটি শক্তিশালী আগামী তৈরি করে।",
  },
  "kn-IN": {
    welcome:     "ಕ್ರಾನಿಕ್ ಕೇರ್‌ಗೆ ಸ್ವಾಗತ. ತಡೆಗಟ್ಟುವಿಕೆ ಅತ್ಯಂತ ಶಕ್ತಿಶಾಲಿ ಔಷಧ.",
    habit_done:  "ಅಭ್ಯಾಸ ಪೂರ್ಣ! ಸ್ಥಿರತೆ ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.",
    log_saved:   "ರೀಡಿಂಗ್ ಉಳಿಸಲಾಗಿದೆ. ಟ್ರೆಂಡ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಸಮಸ್ಯೆಗಳನ್ನು ಮುಂಚಿತವಾಗಿ ಪತ್ತೆ ಮಾಡುತ್ತದೆ.",
    risk_low:    "ನಿಮ್ಮ ಅಪಾಯ ಕಡಿಮೆ. ಈ ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸಗಳನ್ನು ಮುಂದುವರಿಸಿ.",
    risk_mod:    "ಮಧ್ಯಮ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ. ನಿಮ್ಮ ತಡೆಗಟ್ಟುವ ಯೋಜನೆ ಈಗ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.",
    risk_high:   "ಹೆಚ್ಚಿನ ಅಪಾಯ ಗುರುತಿಸಲಾಗಿದೆ. ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳಿ — ನಿಮ್ಮ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ.",
    plan_ready:  "ನಿಮ್ಮ ವ್ಯಕ್ತಿಗತ ತಡೆಗಟ್ಟುವ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ. ಇಂದೇ ಪ್ರಾರಂಭಿಸಿ.",
    crisis_bp:   "ತುರ್ತು: ರಕ್ತದೊತ್ತಡ ಅಪಾಯಕಾರಿ ಮಟ್ಟದಲ್ಲಿ ಅಧಿಕವಾಗಿದೆ. ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    crisis_sugar:"ತುರ್ತು: ರಕ್ತದ ಸಕ್ಕರೆ ಅಪಾಯಕಾರಿಯಾಗಿ ಅಧಿಕವಾಗಿದೆ. ತಕ್ಷಣ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ.",
    streak:      "ನಿಮಗೆ {days} ದಿನಗಳ ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸ ಸ್ಟ್ರೀಕ್ ಇದೆ!",
    encourage:   "ಪ್ರತಿ ಆರೋಗ್ಯಕರ ಆಯ್ಕೆ ಬಲಿಷ್ಠ ನಾಳೆಯನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ.",
  },
  "gu-IN": {
    welcome:     "ક્રોનિક કેરમાં આપનું સ્વાગત છે. નિવારણ સૌથી શક્તિશાળી દવા છે.",
    habit_done:  "ટેવ પૂર્ણ! સાતત્ય તમારા ભવિષ્યના સ્વાસ્થ્યની રક્ષા કરે છે.",
    log_saved:   "રીડિંગ સેવ. ટ્રેન્ડ ટ્રેકિંગ સમસ્યા જલ્દી ઓળખવામાં મદદ કરે છે.",
    risk_low:    "તમારું જોખમ ઓછું છે. આ સ્વસ્થ ટેવો જાળવો.",
    risk_mod:    "મધ્યમ જોખમ મળ્યું. તમારી નિવારણ યોજના હવે શરૂ થાય છે.",
    risk_high:   "ઊંચું જોખમ ઓળખાયું. પગલાં લો — તમારી યોજના તૈયાર છે.",
    plan_ready:  "તમારી વ્યક્તિગત નિવારણ યોજના તૈયાર છે. આજે જ શરૂ કરો.",
    crisis_bp:   "તાત્કાલિક: બ્લડ પ્રેશર ગંભીર રીતે ઊંચું છે. અત્યારે જ ઇલાજ લો.",
    crisis_sugar:"તાત્કાલિક: બ્લડ સુગર ખતરનાક રીતે ઊંચી છે. તત્કાળ ઇલાજ લો.",
    streak:      "તમારી {days} દિવસની સ્વસ્થ ટેવ સ્ટ્રીક છે!",
    encourage:   "દરેક સ્વસ્થ પસંદગી મજબૂત ભવિષ્ય બનાવે છે.",
  },
  "ml-IN": {
    welcome:     "ക്രോണിക് കെയറിലേക്ക് സ്വാഗതം. പ്രതിരോധം ഏറ്റവും ശക്തമായ മരുന്നാണ്.",
    habit_done:  "ശീലം പൂർത്തിയായി! സ്ഥിരത നിങ്ങളുടെ ഭാവി ആരോഗ്യം സംരക്ഷിക്കുന്നു.",
    log_saved:   "റീഡിംഗ് സേവ് ചെയ്തു. ട്രെൻഡ് ട്രാക്കിംഗ് പ്രശ്നങ്ങൾ നേരത്തേ കണ്ടുപിടിക്കാൻ സഹായിക്കുന്നു.",
    risk_low:    "നിങ്ങളുടെ അപകടസാധ്യത കുറവാണ്. ഈ ആരോഗ്യകരമായ ശീലങ്ങൾ തുടരൂ.",
    risk_mod:    "മിതമായ അപകടസാധ്യത കണ്ടെത്തി. നിങ്ങളുടെ പ്രതിരോധ പദ്ധതി ഇപ്പോൾ ആരംഭിക്കുന്നു.",
    risk_high:   "ഉയർന്ന അപകടസാധ്യത തിരിച്ചറിഞ്ഞു. നടപടി എടുക്കൂ — നിങ്ങളുടെ പദ്ധതി തയ്യാർ.",
    plan_ready:  "നിങ്ങളുടെ വ്യക്തിഗത പ്രതിരോധ പദ്ധതി തയ്യാർ. ഇന്ന് ആരംഭിക്കൂ.",
    crisis_bp:   "അടിയന്തരം: രക്തസമ്മർദ്ദം ഗുരുതരമായി ഉയർന്നിരിക്കുന്നു. ഇപ്പോൾ ചികിത്സ തേടൂ.",
    crisis_sugar:"അടിയന്തരം: രക്തത്തിലെ പഞ്ചസാര അപകടകരമായി ഉയർന്നിരിക്കുന്നു. ഉടൻ ചികിത്സ തേടൂ.",
    streak:      "നിങ്ങൾക്ക് {days} ദിവസത്തെ ആരോഗ്യകരമായ ശീലം സ്ട്രീക്ക് ഉണ്ട്!",
    encourage:   "എല്ലാ ആരോഗ്യകരമായ തിരഞ്ഞെടുപ്പും ശക്തമായ നാളെ ഉണ്ടാക്കുന്നു.",
  },
  "pa-IN": {
    welcome:     "ਕ੍ਰੋਨਿਕ ਕੇਅਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਰੋਕਥਾਮ ਸਭ ਤੋਂ ਸ਼ਕਤੀਸ਼ਾਲੀ ਦਵਾਈ ਹੈ।",
    habit_done:  "ਆਦਤ ਪੂਰੀ! ਲਗਾਤਾਰਤਾ ਤੁਹਾਡੀ ਭਵਿੱਖ ਦੀ ਸਿਹਤ ਦੀ ਰੱਖਿਆ ਕਰਦੀ ਹੈ।",
    log_saved:   "ਰੀਡਿੰਗ ਸੇਵ ਕੀਤੀ। ਟ੍ਰੈਂਡ ਟ੍ਰੈਕਿੰਗ ਸਮੱਸਿਆਵਾਂ ਨੂੰ ਜਲਦੀ ਪਛਾਣਦੀ ਹੈ।",
    risk_low:    "ਤੁਹਾਡਾ ਜੋਖਮ ਘੱਟ ਹੈ। ਇਹਨਾਂ ਸਿਹਤਮੰਦ ਆਦਤਾਂ ਨੂੰ ਜਾਰੀ ਰੱਖੋ।",
    risk_mod:    "ਮੱਧਮ ਜੋਖਮ ਮਿਲਿਆ। ਤੁਹਾਡੀ ਰੋਕਥਾਮ ਯੋਜਨਾ ਹੁਣ ਸ਼ੁਰੂ ਹੁੰਦੀ ਹੈ।",
    risk_high:   "ਉੱਚ ਜੋਖਮ ਪਛਾਣਿਆ। ਕਦਮ ਚੁੱਕੋ — ਤੁਹਾਡੀ ਯੋਜਨਾ ਤਿਆਰ ਹੈ।",
    plan_ready:  "ਤੁਹਾਡੀ ਨਿੱਜੀ ਰੋਕਥਾਮ ਯੋਜਨਾ ਤਿਆਰ ਹੈ। ਅੱਜ ਹੀ ਸ਼ੁਰੂ ਕਰੋ।",
    crisis_bp:   "ਜ਼ਰੂਰੀ: ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਬਹੁਤ ਜ਼ਿਆਦਾ ਉੱਚਾ ਹੈ। ਹੁਣੇ ਇਲਾਜ ਕਰਵਾਓ।",
    crisis_sugar:"ਜ਼ਰੂਰੀ: ਬਲੱਡ ਸ਼ੂਗਰ ਖ਼ਤਰਨਾਕ ਤੌਰ 'ਤੇ ਉੱਚੀ ਹੈ। ਤੁਰੰਤ ਇਲਾਜ ਕਰਵਾਓ।",
    streak:      "ਤੁਹਾਡੀ {days} ਦਿਨਾਂ ਦੀ ਸਿਹਤਮੰਦ ਆਦਤ ਸਟ੍ਰੀਕ ਹੈ!",
    encourage:   "ਹਰ ਸਿਹਤਮੰਦ ਚੋਣ ਇੱਕ ਮਜ਼ਬੂਤ ਕੱਲ੍ਹ ਬਣਾਉਂਦੀ ਹੈ।",
  },
  "or-IN": {
    welcome:     "କ୍ରୋନିକ୍ କେୟାରରେ ସ୍ୱାଗତ। ପ୍ରତିରୋଧ ହେଉଛି ସବୁଠୁ ଶକ୍ତିଶାଳୀ ଔଷଧ।",
    habit_done:  "ଅଭ୍ୟାସ ସମ୍ପୂର୍ଣ! ଧାରାବାହିକତା ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ରକ୍ଷା କରେ।",
    log_saved:   "ରୀଡିଂ ସଂରକ୍ଷିତ। ଟ୍ରେଣ୍ଡ ଟ୍ରାକିଂ ସମସ୍ୟା ଆଗୁଆ ଚିହ୍ନଟ କରେ।",
    risk_low:    "ଆପଣଙ୍କ ଆଶଙ୍କା କମ। ଏହି ସ୍ୱାସ୍ଥ୍ୟକର ଅଭ୍ୟାସ ଜାରି ରଖନ୍ତୁ।",
    risk_mod:    "ମଧ୍ୟମ ଆଶଙ୍କା ମିଳିଛି। ଆପଣଙ୍କ ନିବାରଣ ଯୋଜନା ଏବ ଆ ଆରମ୍ଭ।",
    risk_high:   "ଉଚ୍ଚ ଆଶଙ୍କା ଚିହ୍ନଟ। ପଦକ୍ଷେପ ନିଅନ୍ତୁ — ଯୋଜନା ପ୍ରସ୍ତୁତ।",
    plan_ready:  "ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ନିବାରଣ ଯୋଜନା ପ୍ରସ୍ତୁତ। ଆଜି ଆରମ୍ଭ କରନ୍ତୁ।",
    crisis_bp:   "ଜରୁରି: ରକ୍ତଚାପ ଗମ୍ଭୀରରୂପେ ଉଚ୍ଚ। ଏବ ଆ ଚିକିତ୍ସା ଖୋଜନ୍ତୁ।",
    crisis_sugar:"ଜରୁରି: ରକ୍ତ ଶର୍କରା ବିପଜ୍ଜନକ ଉଚ୍ଚ। ତୁରନ୍ତ ଚିକିତ୍ସା ନିଅନ୍ତୁ।",
    streak:      "ଆପଣଙ୍କ {days} ଦିନ ସ୍ୱାସ୍ଥ୍ୟକର ଅଭ୍ୟାସ ଷ୍ଟ୍ରିକ୍ ଅଛି!",
    encourage:   "ପ୍ରତ୍ୟେକ ସ୍ୱାସ୍ଥ୍ୟକର ପସନ୍ଦ ଶକ୍ତିଶାଳୀ ଭବିଷ୍ୟତ ଗଢ଼େ।",
  },
  "ur-IN": {
    welcome:     "کرانک کیئر میں خوش آمدید۔ روک تھام سب سے طاقتور دوا ہے۔",
    habit_done:  "عادت مکمل! استقامت آپ کی مستقبل کی صحت کی حفاظت کرتی ہے۔",
    log_saved:   "ریڈنگ محفوظ ہوئی۔ ٹرینڈ ٹریکنگ مسائل کو جلدی پہچانتی ہے۔",
    risk_low:    "آپ کا خطرہ کم ہے۔ ان صحت مند عادتوں کو برقرار رکھیں۔",
    risk_mod:    "درمیانی خطرہ پایا گیا۔ آپ کی روک تھام کی منصوبہ بندی اب شروع ہوتی ہے۔",
    risk_high:   "زیادہ خطرہ پہچانا گیا۔ قدم اٹھائیں — آپ کی منصوبہ تیار ہے۔",
    plan_ready:  "آپ کی ذاتی روک تھام کی منصوبہ تیار ہے۔ آج ہی شروع کریں۔",
    crisis_bp:   "فوری: بلڈ پریشر خطرناک حد تک بلند ہے۔ ابھی طبی مدد لیں۔",
    crisis_sugar:"فوری: بلڈ شوگر خطرناک حد تک بلند ہے۔ فوری علاج کروائیں۔",
    streak:      "آپ کی {days} دن کی صحت مند عادت اسٹریک ہے!",
    encourage:   "ہر صحت مند انتخاب ایک مضبوط کل بناتا ہے۔",
  },
  "es-ES": {
    welcome:     "Bienvenido a Atención Crónica. La prevención es la medicina más poderosa.",
    habit_done:  "¡Hábito completado! La consistencia protege tu salud futura.",
    log_saved:   "Lectura guardada. El seguimiento de tendencias detecta problemas pronto.",
    risk_low:    "Tu riesgo es bajo. Sigue manteniendo estos hábitos saludables.",
    risk_mod:    "Riesgo moderado detectado. Tu plan de prevención comienza ahora.",
    risk_high:   "Riesgo elevado identificado. Actúa — tu plan está listo.",
    plan_ready:  "Tu plan de prevención personalizado está listo. Empieza hoy.",
    crisis_bp:   "URGENTE: Presión arterial críticamente alta. Busca atención ahora.",
    crisis_sugar:"URGENTE: Glucosa peligrosamente alta. Busca atención inmediata.",
    streak:      "¡Llevas {days} días de racha de hábitos saludables!",
    encourage:   "Cada elección saludable construye un mañana más fuerte.",
  },
  "ar-SA": {
    welcome:     "مرحباً في رعاية الأمراض المزمنة. الوقاية هي أقوى دواء.",
    habit_done:  "اكتملت العادة! الاتساق يحمي صحتك المستقبلية.",
    log_saved:   "تم حفظ القراءة. تتبع الاتجاهات يساعد على الكشف المبكر.",
    risk_low:    "خطرك منخفض. حافظ على هذه العادات الصحية.",
    risk_mod:    "تم الكشف عن خطر معتدل. خطة الوقاية تبدأ الآن.",
    risk_high:   "تم تحديد خطر مرتفع. تصرف — خطتك جاهزة.",
    plan_ready:  "خطة الوقاية الشخصية جاهزة. ابدأ اليوم.",
    crisis_bp:   "عاجل: ضغط الدم مرتفع بشكل خطير. اطلب الرعاية الآن.",
    crisis_sugar:"عاجل: السكر في الدم مرتفع بشكل خطير. اطلب الرعاية فوراً.",
    streak:      "لديك سلسلة {days} يوماً من العادات الصحية!",
    encourage:   "كل خيار صحي يبني غداً أقوى.",
  },
  "fr-FR": {
    welcome:     "Bienvenue dans les Soins Chroniques. La prévention est le médicament le plus puissant.",
    habit_done:  "Habitude accomplie ! La constance protège votre santé future.",
    log_saved:   "Lecture sauvegardée. Le suivi des tendances aide à détecter les problèmes tôt.",
    risk_low:    "Votre risque est faible. Maintenez ces bonnes habitudes.",
    risk_mod:    "Risque modéré détecté. Votre plan de prévention commence maintenant.",
    risk_high:   "Risque élevé identifié. Agissez — votre plan est prêt.",
    plan_ready:  "Votre plan de prévention personnalisé est prêt. Commencez aujourd'hui.",
    crisis_bp:   "URGENT : Tension artérielle dangereusement élevée. Consultez immédiatement.",
    crisis_sugar:"URGENT : Glycémie dangereusement élevée. Consultez immédiatement.",
    streak:      "Vous avez une série de {days} jours d'habitudes saines !",
    encourage:   "Chaque choix sain construit un demain plus fort.",
  },
  "pt-BR": {
    welcome:     "Bem-vindo ao Cuidado Crônico. A prevenção é o medicamento mais poderoso.",
    habit_done:  "Hábito concluído! A consistência protege sua saúde futura.",
    log_saved:   "Leitura salva. O rastreamento de tendências detecta problemas cedo.",
    risk_low:    "Seu risco é baixo. Continue mantendo esses hábitos saudáveis.",
    risk_mod:    "Risco moderado detectado. Seu plano de prevenção começa agora.",
    risk_high:   "Risco elevado identificado. Aja — seu plano está pronto.",
    plan_ready:  "Seu plano de prevenção personalizado está pronto. Comece hoje.",
    crisis_bp:   "URGENTE: Pressão arterial criticamente alta. Procure atendimento agora.",
    crisis_sugar:"URGENTE: Glicose perigosamente alta. Procure atendimento imediato.",
    streak:      "Você tem uma sequência de {days} dias de hábitos saudáveis!",
    encourage:   "Cada escolha saudável constrói um amanhã mais forte.",
  },
  "de-DE": {
    welcome:     "Willkommen bei der Chronischen Pflege. Prävention ist die wirksamste Medizin.",
    habit_done:  "Gewohnheit abgeschlossen! Konsequenz schützt Ihre zukünftige Gesundheit.",
    log_saved:   "Messwert gespeichert. Trendverfolgung hilft, Probleme früh zu erkennen.",
    risk_low:    "Ihr Risiko ist gering. Halten Sie diese gesunden Gewohnheiten aufrecht.",
    risk_mod:    "Mäßiges Risiko erkannt. Ihr Präventionsplan beginnt jetzt.",
    risk_high:   "Erhöhtes Risiko identifiziert. Handeln Sie — Ihr Plan ist bereit.",
    plan_ready:  "Ihr personalisierter Präventionsplan ist bereit. Beginnen Sie heute.",
    crisis_bp:   "DRINGEND: Blutdruck kritisch hoch. Suchen Sie sofort medizinische Hilfe.",
    crisis_sugar:"DRINGEND: Blutzucker gefährlich hoch. Sofort medizinische Hilfe suchen.",
    streak:      "Sie haben eine {days}-Tage-Serie gesunder Gewohnheiten!",
    encourage:   "Jede gesunde Entscheidung baut ein stärkeres Morgen auf.",
  },
  "ja-JP": {
    welcome:     "慢性病ケアへようこそ。予防が最も強力な薬です。",
    habit_done:  "習慣完了！一貫性があなたの将来の健康を守ります。",
    log_saved:   "測定値を保存しました。トレンド追跡で問題を早期発見できます。",
    risk_low:    "リスクは低いです。これらの健康習慣を維持してください。",
    risk_mod:    "中程度のリスクが検出されました。予防計画が今すぐ始まります。",
    risk_high:   "高いリスクが特定されました。行動を起こしましょう — 計画の準備ができています。",
    plan_ready:  "個人化された予防計画の準備ができています。今日から始めましょう。",
    crisis_bp:   "緊急：血圧が危険なほど高いです。すぐに医療を受けてください。",
    crisis_sugar:"緊急：血糖値が危険なほど高いです。直ちに治療を受けてください。",
    streak:      "{days}日間の健康的な習慣のストリークがあります！",
    encourage:   "すべての健康的な選択がより強い明日を作ります。",
  },
  "ko-KR": {
    welcome:     "만성 질환 케어에 오신 것을 환영합니다. 예방이 가장 강력한 약입니다.",
    habit_done:  "습관 완료! 꾸준함이 미래 건강을 보호합니다.",
    log_saved:   "수치가 저장되었습니다. 추세 추적으로 문제를 조기에 발견할 수 있습니다.",
    risk_low:    "위험이 낮습니다. 이 건강한 습관을 유지하세요.",
    risk_mod:    "중간 위험이 감지되었습니다. 예방 계획이 지금 시작됩니다.",
    risk_high:   "높은 위험이 확인되었습니다. 행동하세요 — 계획이 준비되었습니다.",
    plan_ready:  "개인화된 예방 계획이 준비되었습니다. 오늘 시작하세요.",
    crisis_bp:   "긴급: 혈압이 위험하게 높습니다. 지금 즉시 진료를 받으세요.",
    crisis_sugar:"긴급: 혈당이 위험하게 높습니다. 즉시 치료를 받으세요.",
    streak:      "{days}일 건강 습관 스트리크가 있습니다!",
    encourage:   "모든 건강한 선택이 더 강한 내일을 만듭니다.",
  },
  "zh-CN": {
    welcome:     "欢迎来到慢性病护理。预防是最强大的药物。",
    habit_done:  "习惯完成！坚持保护您的未来健康。",
    log_saved:   "读数已保存。趋势追踪有助于及早发现问题。",
    risk_low:    "您的风险较低。继续保持这些健康习惯。",
    risk_mod:    "检测到中等风险。您的预防计划现在开始。",
    risk_high:   "发现高风险。采取行动——您的计划已准备就绪。",
    plan_ready:  "您的个性化预防计划已准备就绪。今天就开始吧。",
    crisis_bp:   "紧急：血压危急性升高。请立即就医。",
    crisis_sugar:"紧急：血糖危险性升高。请立即寻求治疗。",
    streak:      "您已坚持{days}天健康习惯！",
    encourage:   "每一个健康的选择都在创造更强大的明天。",
  },
};

function ph(lang, key, vars = {}) {
  const base = PHRASES[lang] || PHRASES["en-IN"];
  let text = base[key] || PHRASES["en-IN"][key] || "";
  Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
  return text;
}

/* ════════════════════════════════════════════════════════════
   4. WHO DOMAINS
════════════════════════════════════════════════════════════ */
const WHO_DOMAINS = {
  diabetes: {
    label: "Type 2 Diabetes Prevention", code: "NCD-DIAB",
    stats: [
      "422M people have diabetes globally — WHO 2023",
      "80% of Type 2 diabetes is preventable via lifestyle changes",
      "1.5M deaths directly attributed to diabetes annually",
      "Weight loss 5-7% + 150min/week activity → Risk ↓58% (DPP Trial)",
    ],
    sdg: "SDG 3.4",
    solve: "Daily movement + whole foods + weight management = diabetes prevention",
  },
  cvd: {
    label: "Cardiovascular Disease Prevention", code: "NCD-CVD",
    stats: [
      "17.9M CVD deaths/year — #1 global killer (WHO)",
      "80% of premature heart disease & stroke is preventable",
      "Hypertension affects 1.28B adults — 46% are unaware",
      "BP control + exercise + diet → CVD events ↓35%",
    ],
    sdg: "SDG 3.4",
    solve: "BP monitoring + DASH diet + daily movement = heart protection",
  },
  hypertension: {
    label: "Hypertension Management", code: "NCD-HTN",
    stats: [
      "1.28B adults have hypertension — WHO 2021",
      "Only 1 in 5 with hypertension have it under control",
      "High BP causes 10.4M deaths globally each year",
      "Salt reduction + exercise → BP ↓5-10 mmHg average",
    ],
    sdg: "SDG 3.8",
    solve: "DASH diet + daily monitoring + medication adherence = control",
  },
  obesity: {
    label: "Obesity & Metabolic Health", code: "NCD-OBS",
    stats: [
      "1 billion+ people live with obesity globally",
      "Obesity increases risk of 13+ cancer types",
      "Metabolic syndrome affects 1 in 4 adults worldwide",
      "Sustainable 5-10% weight loss → Metabolic health ↑60%",
    ],
    sdg: "SDG 2 + 3",
    solve: "Calorie awareness + activity + sleep + stress management = metabolic health",
  },
};

/* ════════════════════════════════════════════════════════════
   5. DAILY HABITS — evidence-based NCD prevention
════════════════════════════════════════════════════════════ */
const DAILY_HABITS = [
  { id:"h_water",   icon:"💧", label:"Drink 8 glasses of water",       who:"WHO hydration baseline"           },
  { id:"h_steps",   icon:"🚶", label:"Walk 7,000+ steps",               who:"WHO 150min/week activity"         },
  { id:"h_veggies", icon:"🥦", label:"Eat 5 servings of vegetables",   who:"WHO fruit & veg 400g/day"         },
  { id:"h_sodium",  icon:"🧂", label:"Limit salt (< 5g/day)",          who:"WHO sodium reduction target"      },
  { id:"h_sleep",   icon:"😴", label:"Sleep 7-8 hours",                 who:"Sleep regulates insulin & BP"     },
  { id:"h_meds",    icon:"💊", label:"Take prescribed medications",     who:"Adherence reduces complications"  },
  { id:"h_stress",  icon:"🧘", label:"10-min mindfulness / breathing",  who:"Stress → cortisol → glucose ↑"   },
  { id:"h_screen",  icon:"📵", label:"No food after 8 PM",             who:"Metabolic rest window"            },
];

/* ════════════════════════════════════════════════════════════
   6. RISK CALCULATOR — WHO PEN guideline aligned
════════════════════════════════════════════════════════════ */
function calcRisk(profile) {
  let s = 0;
  const { age, bmi, activity, diet, smokes, family, bp, sugar } = profile;
  if (age >= 45) s += 15; else if (age >= 35) s += 8;
  if (bmi >= 30) s += 18; else if (bmi >= 25) s += 9;
  if (family)    s += 12;
  if (smokes)    s += 16;
  s += Math.max(0, 14 - activity * 1.4);
  s += Math.max(0, 12 - diet * 1.2);
  if (bp === "high")      s += 22;
  else if (bp === "elevated") s += 10;
  if (sugar === "diabetic")   s += 24;
  else if (sugar === "prediabetic") s += 14;
  return Math.min(100, Math.round(s));
}

function riskTier(score) {
  if (score < 30) return { label: "Low",      color: GREEN,  key: "risk_low"  };
  if (score < 60) return { label: "Moderate", color: AMBER,  key: "risk_mod"  };
  return              { label: "Elevated", color: A,     key: "risk_high" };
}

/* ════════════════════════════════════════════════════════════
   7. PREVENTION PLAN GENERATOR
════════════════════════════════════════════════════════════ */
function makePlan(profile, score) {
  const goals = [];
  if (profile.bmi >= 25)
    goals.push({ id:"weight", title:"Gentle Weight Management", action:"Add 10-min walk after every meal", impact:"5% weight loss → Diabetes risk ↓58%", streak:0 });
  if (profile.activity < 5)
    goals.push({ id:"activity", title:"Daily Movement Foundation", action:"3 × 10-min activity bursts today", impact:"150min/wk → CVD risk ↓35%", streak:0 });
  if (profile.diet < 6)
    goals.push({ id:"nutrition", title:"Plate Balance Upgrade", action:"Fill ½ plate with vegetables at lunch", impact:"Fiber + nutrients → Metabolic health ↑", streak:0 });
  if (profile.bp !== "normal")
    goals.push({ id:"sodium", title:"Salt Awareness", action:"Check labels: <200mg sodium per serving", impact:"Salt ↓ → BP ↓5-10 mmHg", streak:0 });
  goals.push({ id:"mindful", title:"Stress Resilience", action:"4-7-8 breathing: 3 cycles right now", impact:"Stress management → Inflammation ↓", streak:0 });
  return goals.slice(0, 3);
}

/* ════════════════════════════════════════════════════════════
   8. BIOMETRIC REFERENCE RANGES
════════════════════════════════════════════════════════════ */
const BIO_RANGES = {
  systolic:  { low:90, high:140, critical:180, unit:"mmHg",  label:"Systolic BP"    },
  diastolic: { low:60, high:90,  critical:120, unit:"mmHg",  label:"Diastolic BP"   },
  glucose:   { low:70, high:140, critical:300, unit:"mg/dL", label:"Blood Glucose"  },
  weight:    { low:30, high:120, critical:200, unit:"kg",    label:"Body Weight"    },
  spo2:      { low:94, high:100, critical:88,  unit:"%",     label:"SpO₂"           },
};

function bioStatus(type, value) {
  const r = BIO_RANGES[type];
  if (!r || !value) return { color: TM, label: "—" };
  const v = parseFloat(value);
  if (type === "spo2") {
    if (v < r.critical) return { color: A,     label: "CRITICAL — seek care" };
    if (v < r.low)      return { color: AMBER, label: "Low — monitor closely" };
    return                     { color: GREEN, label: "Normal" };
  }
  if (v >= r.critical) return { color: A,     label: "CRITICAL — seek care" };
  if (v >= r.high)     return { color: AMBER, label: "Elevated" };
  if (v < r.low)       return { color: AMBER, label: "Low" };
  return                      { color: GREEN, label: "Normal" };
}

/* ════════════════════════════════════════════════════════════
   9. STORAGE HELPERS
════════════════════════════════════════════════════════════ */
function loadLang() {
  const c = localStorage.getItem("magic16_lang") || "en-IN";
  return LANG_MAP[c] || "en-IN";
}

function todayKey() { return new Date().toISOString().split("T")[0]; }

function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSave(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function loadProfile() {
  return ls("manifix_chronic_profile_v2", {
    age:35, bmi:24, activity:5, diet:6,
    smokes:false, family:false, bp:"normal", sugar:"normal",
  });
}
function loadHabitsToday() {
  return ls(`manifix_habits_${todayKey()}`, {});
}
function loadLogs() {
  return ls("manifix_chronic_logs_v2", []);
}
function loadStreak() {
  return ls("manifix_chronic_streak_v2", { count:0, lastDate:"" });
}

/* ════════════════════════════════════════════════════════════
   10. SPEAKER
════════════════════════════════════════════════════════════ */
function makeSpeaker(lang) {
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = urgent ? 1.05 : 0.86; u.pitch = 0.95;
      const vs = speechSynthesis.getVoices();
      const base = lang.split("-")[0];
      const v = vs.find(x => x.lang === lang) || vs.find(x => x.lang.startsWith(base)) || vs.find(x => x.lang.startsWith("en"));
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    if (urgent) navigator.vibrate?.([80, 40, 80, 40, 80]);
    if (speechSynthesis.getVoices().length) say();
    else speechSynthesis.onvoiceschanged = say;
  };
}

/* ════════════════════════════════════════════════════════════
   11. CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("chron-css")) return;
  const el = document.createElement("style");
  el.id = "chron-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes ch-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ch-spin{to{transform:rotate(360deg)}}
    @keyframes ch-pulse{0%,100%{opacity:.06;transform:scale(1)}50%{opacity:.14;transform:scale(1.05)}}
    @keyframes ch-beat{0%,100%{transform:scale(1)}14%{transform:scale(1.2)}28%{transform:scale(1)}}
    @keyframes ch-blink{0%,100%{opacity:1}50%{opacity:.2}}
    .ch-fade{animation:ch-fade .4s cubic-bezier(.22,.68,0,1.2) both}
    .ch-btn:hover{filter:brightness(1.1);transform:translateY(-1px);transition:all .16s}
    .ch-btn:active{transform:translateY(0)}
    .ch-card:focus{outline:2px solid #F87171;outline-offset:2px}
    input[type=range]{accent-color:#F87171}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   12. SHARED UI ATOMS
════════════════════════════════════════════════════════════ */
const ChBtn = ({ children, onClick, color=A, disabled=false, variant="primary", small=false, style={} }) => {
  const bg = disabled ? "#1a0a0a" : variant === "primary" ? color : "transparent";
  const cl = disabled ? "#555" : variant === "primary" ? "#0a0505" : color;
  const br = disabled ? "#333" : variant === "primary" ? "#000" : `${color}66`;
  return (
    <button className="ch-btn ch-card" onClick={onClick} disabled={disabled}
      style={{ width:"100%", padding:small?"8px 12px":"13px 16px", background:bg,
        border:`1.5px solid ${br}`, color:cl, fontSize:small?11:13, fontWeight:700,
        fontFamily:SYNE, letterSpacing:".04em", borderRadius:10,
        cursor:disabled?"not-allowed":"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        minHeight:small?36:48, opacity:disabled?.5:1, transition:"all .16s", ...style }}>
      {children}
    </button>
  );
};

const MiniBar = ({ pct, color=A, height=5 }) => (
  <div style={{ height, background:"#1a0a0a", borderRadius:3, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:`linear-gradient(90deg,${ADM},${color})`,
      transition:"width .5s ease", borderRadius:3 }}/>
  </div>
);

/* ════════════════════════════════════════════════════════════
   13. RISK GAUGE
════════════════════════════════════════════════════════════ */
function RiskGauge({ score, color, label }) {
  const r=36, circ=2*Math.PI*r;
  const dash=(score/100)*circ;
  return (
    <div style={{ position:"relative", width:88, height:88, margin:"0 auto 8px" }}>
      <svg viewBox="0 0 88 88" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1a0a0a" strokeWidth="5"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition:"stroke-dasharray .9s ease-out", filter:`drop-shadow(0 0 6px ${color}66)` }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontFamily:SYNE, fontSize:24, fontWeight:800, color, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:7, letterSpacing:".14em", color:"#2a0f0f", textTransform:"uppercase" }}>{label}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   14. 7-DAY SPARKLINE — pure CSS
════════════════════════════════════════════════════════════ */
function Sparkline({ data, label, unit, color=A }) {
  const vals = data.slice(-7).map(d => parseFloat(d.value)).filter(Boolean);
  if (vals.length < 2) return (
    <div style={{ padding:"8px 0", textAlign:"center", fontSize:10, color:TD }}>No trend yet — log more readings</div>
  );
  const max = Math.max(...vals); const min = Math.min(...vals);
  const range = max - min || 1;
  const W = 200; const H = 36;
  const pts = vals.map((v, i) => `${(i/(vals.length-1))*W},${H-((v-min)/range)*H}`).join(" ");
  const latest = vals[vals.length-1];
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:TM, marginBottom:4 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight:700 }}>{latest} {unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H, overflow:"visible" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={(vals.length-1)/(vals.length-1)*W} cy={H-((latest-min)/range)*H} r="4" fill={color}/>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   15. BIOMETRIC LOG MODAL
════════════════════════════════════════════════════════════ */
function LogModal({ onClose, onSave }) {
  const [type,  setType]  = useState("bp");
  const [val1,  setVal1]  = useState("");
  const [val2,  setVal2]  = useState("");
  const [notes, setNotes] = useState("");

  const fields = {
    bp:      { label:"Blood Pressure", hint1:"Systolic (e.g. 120)", hint2:"Diastolic (e.g. 80)", twoVals:true  },
    glucose: { label:"Blood Glucose",  hint1:"mg/dL (e.g. 95)",   hint2:"",                     twoVals:false },
    weight:  { label:"Body Weight",    hint1:"kg (e.g. 68.5)",    hint2:"",                     twoVals:false },
    spo2:    { label:"SpO₂ Oxygen",   hint1:"% (e.g. 98)",       hint2:"",                     twoVals:false },
  };
  const f = fields[type];
  const valid = val1.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    const value = f.twoVals ? `${val1}/${val2}` : val1;
    onSave({ type, value, notes: notes.trim(), ts: Date.now() });
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.92)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:100, padding:16 }}>
      <div className="ch-fade" style={{ background:BG, border:`2px solid ${A}`, padding:22,
        width:"min(400px,100%)", borderRadius:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontFamily:SYNE, fontSize:17, fontWeight:700, color:TX }}>📊 Log Reading</span>
          <button onClick={onClose} style={{ fontSize:18, background:"none", border:"none", color:TM, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {Object.entries(fields).map(([k, fd]) => (
            <button key={k} onClick={() => { setType(k); setVal1(""); setVal2(""); }}
              style={{ padding:"10px", borderRadius:8, fontSize:12,
                background:type===k?`${A}22`:"#0e0808",
                border:`1.5px solid ${type===k?A:"#2a1010"}`,
                color:type===k?A:TM, cursor:"pointer", fontFamily:FONT }}>
              {fd.label}
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:f.twoVals?"1fr 1fr":"1fr", gap:8, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:10, color:TM, display:"block", marginBottom:4 }}>{f.hint1}</label>
            <input type="number" value={val1} onChange={e=>setVal1(e.target.value)}
              placeholder={f.hint1}
              style={{ width:"100%", padding:"10px 12px", fontSize:14, background:"#0e0808",
                border:`1.5px solid #2a1010`, color:TX, borderRadius:8, fontFamily:FONT }}/>
          </div>
          {f.twoVals && (
            <div>
              <label style={{ fontSize:10, color:TM, display:"block", marginBottom:4 }}>{f.hint2}</label>
              <input type="number" value={val2} onChange={e=>setVal2(e.target.value)}
                placeholder={f.hint2}
                style={{ width:"100%", padding:"10px 12px", fontSize:14, background:"#0e0808",
                  border:`1.5px solid #2a1010`, color:TX, borderRadius:8, fontFamily:FONT }}/>
            </div>
          )}
        </div>

        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Notes (optional)..." rows={2}
          style={{ width:"100%", padding:"9px 12px", fontSize:12, background:"#0e0808",
            border:`1.5px solid #2a1010`, color:TX, borderRadius:8, fontFamily:FONT,
            resize:"vertical", marginBottom:14 }}/>

        <div style={{ display:"flex", gap:10 }}>
          <ChBtn onClick={onClose} variant="secondary" small>Cancel</ChBtn>
          <ChBtn onClick={handleSave} disabled={!valid}>Save Reading</ChBtn>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   16. MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function ChronicDisease() {
  const navigate = useNavigate();
  const lang  = useMemo(loadLang, []);
  const speak = useMemo(() => makeSpeaker(lang), [lang]);

  /* ── State ── */
  const [profile,  setProfile]  = useState(loadProfile);
  const [habitsToday, setHabitsToday] = useState(loadHabitsToday);
  const [logs,     setLogs]     = useState(loadLogs);
  const [streak,   setStreak]   = useState(loadStreak);
  const [plan,     setPlan]     = useState([]);
  const [showLog,  setShowLog]  = useState(false);
  const [showWHO,  setShowWHO]  = useState(false);
  const [whoKey,   setWhoKey]   = useState("diabetes");
  const [showProfile, setShowProfile] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [offline,  setOffline]  = useState(!navigator.onLine);
  const [crisis,   setCrisis]   = useState(null);

  const riskScore  = useMemo(() => calcRisk(profile),            [profile]);
  const tier       = useMemo(() => riskTier(riskScore),          [riskScore]);
  const doneCount  = Object.values(habitsToday).filter(Boolean).length;
  const wellScore  = useMemo(() => {
    const base     = 100 - riskScore;
    const habBonus = (doneCount / DAILY_HABITS.length) * 20;
    const planBonus = plan.filter(g => g.streak > 0).length * 5;
    return Math.min(100, Math.round(base + habBonus + planBonus));
  }, [riskScore, doneCount, plan]);

  /* Boot */
  useEffect(() => {
    injectCSS();
    const p = loadProfile();
    const initial = makePlan(p, calcRisk(p));
    setPlan(initial);
    setTimeout(() => {
      setLoading(false);
      speak(ph(lang, "welcome"));
    }, 900);
  }, []);

  /* Offline */
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /* Persist */
  useEffect(() => { lsSave("manifix_chronic_profile_v2", profile); }, [profile]);
  useEffect(() => { lsSave(`manifix_habits_${todayKey()}`, habitsToday); }, [habitsToday]);
  useEffect(() => { lsSave("manifix_chronic_logs_v2", logs); }, [logs]);
  useEffect(() => { lsSave("manifix_chronic_streak_v2", streak); }, [streak]);

  /* ── Handlers ── */
  const toggleHabit = useCallback((id) => {
    setHabitsToday(prev => {
      const now = { ...prev, [id]: !prev[id] };
      if (!prev[id]) {
        speak(ph(lang, "habit_done"));
        // Update streak
        const today = todayKey();
        setStreak(s => {
          const yesterday = new Date(Date.now()-86400000).toISOString().split("T")[0];
          let count = s.count;
          if (s.lastDate === yesterday) count += 1;
          else if (s.lastDate !== today) count = 1;
          const ns = { count, lastDate: today };
          lsSave("manifix_chronic_streak_v2", ns);
          return ns;
        });
      }
      return now;
    });
  }, [lang, speak]);

  const saveLog = useCallback((entry) => {
    const newLog = { id: Date.now(), date: new Date().toLocaleDateString(), ...entry };
    setLogs(prev => [newLog, ...prev.slice(0, 59)]);
    speak(ph(lang, "log_saved"));
    // Check for crisis values
    if (entry.type === "bp") {
      const sys = parseFloat(entry.value);
      if (sys >= 180) { setCrisis("bp"); speak(ph(lang, "crisis_bp"), true); }
    }
    if (entry.type === "glucose") {
      const g = parseFloat(entry.value);
      if (g >= 300) { setCrisis("sugar"); speak(ph(lang, "crisis_sugar"), true); }
    }
  }, [lang, speak]);

  const incrementPlan = useCallback((goalId) => {
    setPlan(prev => prev.map(g => g.id === goalId ? { ...g, streak: (g.streak||0)+1 } : g));
  }, []);

  const refreshPlan = useCallback(() => {
    setPlan(makePlan(profile, riskScore));
    speak(ph(lang, "plan_ready"));
  }, [profile, riskScore, lang, speak]);

  const updateProfile = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setTimeout(() => setPlan(makePlan(profile, calcRisk(profile))), 100);
  }, [profile]);

  if (loading) return (
    <div style={{ minHeight:"100dvh", background:BG, color:TX, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", fontFamily:FONT }}>
      <div style={{ fontSize:52, marginBottom:16, animation:"ch-beat 1.5s infinite" }}>🫀</div>
      <div style={{ fontSize:13, letterSpacing:".14em", color:A, textTransform:"uppercase", marginBottom:14 }}>
        Loading Chronic Care…
      </div>
      <div style={{ width:26, height:26, border:`3px solid ${BOR}`, borderTopColor:A,
        borderRadius:"50%", animation:"ch-spin 1s linear infinite" }}/>
    </div>
  );

  const A_accent = A;

  return (
    <div style={{ minHeight:"100dvh", background:BG, color:TX, fontFamily:FONT,
      display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden", position:"relative" }}>

      {/* BG grid */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(248,113,113,0.02) 1px,transparent 1px),
          linear-gradient(90deg,rgba(248,113,113,0.02) 1px,transparent 1px)`,
        backgroundSize:"44px 44px" }}/>

      {/* Ambient glow */}
      <div style={{ position:"fixed", top:"22%", left:"50%", transform:"translateX(-50%)", width:440, height:220,
        background:`radial-gradient(ellipse,${A}0c 0%,transparent 70%)`,
        animation:"ch-pulse 6s ease-in-out infinite", pointerEvents:"none" }}/>

      {/* Crisis Banner */}
      {crisis && (
        <div style={{ width:"100%", background:"#3d0000", borderBottom:`2px solid ${A}`,
          padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center",
          zIndex:50, position:"sticky", top:0 }}>
          <span style={{ fontSize:13, fontWeight:700, color:A, animation:"ch-blink 1s infinite" }}>
            🚨 {crisis === "bp" ? ph(lang,"crisis_bp") : ph(lang,"crisis_sugar")}
          </span>
          <button onClick={()=>setCrisis(null)}
            style={{ fontSize:11, color:A, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Offline badge */}
      {offline && (
        <div style={{ width:"100%", background:"#1a0a0a", borderBottom:`1px solid ${A}44`,
          padding:"5px 20px", fontSize:10, color:A, letterSpacing:".12em", textTransform:"uppercase",
          textAlign:"center" }}>
          ⚡ Offline — all features work locally
        </div>
      )}

      {/* Modals */}
      {showLog && <LogModal onClose={()=>setShowLog(false)} onSave={saveLog} />}

      <div style={{ position:"relative", zIndex:2, width:"min(480px,98vw)",
        display:"flex", flexDirection:"column", gap:12, paddingTop:18, paddingBottom:52 }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          paddingBottom:12, borderBottom:`2px solid ${BOR}` }}>
          <div>
            <div style={{ fontFamily:SYNE, fontSize:28, fontWeight:800, lineHeight:1, color:TX }}>
              ManifiX <span style={{ color:A }}>Chronic</span>
            </div>
            <div style={{ fontSize:10, letterSpacing:".14em", color:A, textTransform:"uppercase",
              marginTop:4, opacity:.7 }}>Prevent · Manage · Thrive</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <button onClick={()=>navigate("/app/dashboard")}
              style={{ fontSize:11, color:TD, background:"none", border:"none",
                cursor:"pointer", fontFamily:FONT, textTransform:"uppercase" }}>← Dashboard</button>
            <button onClick={()=>setShowProfile(v=>!v)}
              style={{ fontSize:9, color:`${A}88`, background:"none", border:"none",
                cursor:"pointer", fontFamily:FONT, textTransform:"uppercase" }}>
              ⚙ {showProfile ? "Close" : "My Profile"}
            </button>
          </div>
        </div>

        {/* ── RISK ASSESSMENT CARD ── */}
        <div className="ch-fade" style={{ border:`2px solid ${tier.color}44`,
          background:`${tier.color}08`, padding:"16px 18px", borderRadius:12, textAlign:"center" }}>
          <div style={{ fontSize:9, letterSpacing:".2em", color:TD, textTransform:"uppercase", marginBottom:10 }}>
            AI Risk Score — WHO PEN Guideline
          </div>
          <RiskGauge score={riskScore} color={tier.color} label={tier.label} />
          <div style={{ fontSize:11, color:tier.color, fontWeight:700, marginBottom:4 }}>
            {ph(lang, tier.key).split(".")[0]}
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:12 }}>
            {[["Wellness Score", wellScore, GREEN], ["Habit Streak", streak.count+"d", AMBER]].map(([lbl,val,col]) => (
              <div key={lbl} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:SYNE, fontSize:20, fontWeight:800, color:col }}>{val}</div>
                <div style={{ fontSize:9, color:TD, letterSpacing:".1em" }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DOMAIN TABS ── */}
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:4 }}>
          {Object.entries(WHO_DOMAINS).map(([key, d]) => (
            <button key={key} onClick={() => { setWhoKey(key); setShowWHO(true); }}
              style={{ flex:"0 0 auto", padding:"7px 11px", fontSize:9, letterSpacing:".1em",
                textTransform:"uppercase", fontFamily:FONT, borderRadius:7, cursor:"pointer",
                background:whoKey===key&&showWHO?`${A}20`:"#0e0808",
                border:`1px solid ${whoKey===key&&showWHO?A:"#2a1010"}`,
                color:whoKey===key&&showWHO?A:TM, transition:"all .15s", whiteSpace:"nowrap" }}>
              {d.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* ── WHO PANEL ── */}
        {showWHO && (
          <div className="ch-fade" style={{ border:`1.5px solid ${A}22`, background:"#0e0808",
            padding:"14px 16px", borderRadius:10 }}>
            <div style={{ fontSize:9, letterSpacing:".18em", color:TD, textTransform:"uppercase", marginBottom:6 }}>
              WHO · {WHO_DOMAINS[whoKey].code}
            </div>
            <div style={{ fontSize:14, color:A, fontWeight:700, fontFamily:SYNE, marginBottom:10 }}>
              {WHO_DOMAINS[whoKey].label}
            </div>
            {WHO_DOMAINS[whoKey].stats.map((s, i) => (
              <div key={i} style={{ fontSize:11, color:i===0?TM:TD, lineHeight:1.7,
                borderLeft:`2px solid ${i===0?A:"#2a1010"}`, paddingLeft:10, marginBottom:5 }}>{s}</div>
            ))}
            <div style={{ marginTop:8, padding:"8px 12px", background:"#0a0505",
              border:`1px solid ${A}22`, borderRadius:6, fontSize:10, color:A }}>
              ✅ {WHO_DOMAINS[whoKey].solve}
            </div>
            <div style={{ fontSize:8, color:TD, marginTop:6, letterSpacing:".12em" }}>
              {WHO_DOMAINS[whoKey].sdg}
            </div>
          </div>
        )}

        {/* ── PROFILE (collapsible) ── */}
        {showProfile && (
          <div className="ch-fade" style={{ border:`1.5px solid ${BOR}`, background:"#0e0808",
            padding:"14px 16px", borderRadius:10 }}>
            <div style={{ fontSize:11, color:A, fontWeight:700, marginBottom:12, fontFamily:SYNE }}>
              ⚙ Risk Profile — updates your score live
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {[["Age", "age", 18, 80], ["BMI", "bmi", 15, 50]].map(([lbl, field, min, max]) => (
                <div key={field}>
                  <label style={{ fontSize:9, color:TM, display:"block", marginBottom:3 }}>{lbl}: {profile[field]}</label>
                  <input type="range" min={min} max={max} value={profile[field]}
                    onChange={e => updateProfile(field, +e.target.value)}
                    style={{ width:"100%" }} />
                </div>
              ))}
              {[["Activity Level 1-10", "activity", 1, 10], ["Diet Quality 1-10", "diet", 1, 10]].map(([lbl, field, min, max]) => (
                <div key={field}>
                  <label style={{ fontSize:9, color:TM, display:"block", marginBottom:3 }}>{lbl}: {profile[field]}</label>
                  <input type="range" min={min} max={max} value={profile[field]}
                    onChange={e => updateProfile(field, +e.target.value)}
                    style={{ width:"100%" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
              {[
                ["smokes", "🚬 Smoker"],
                ["family", "🧬 Family History"],
              ].map(([field, lbl]) => (
                <label key={field} style={{ display:"flex", alignItems:"center", gap:6,
                  fontSize:11, color:TM, cursor:"pointer" }}>
                  <input type="checkbox" checked={!!profile[field]}
                    onChange={e => updateProfile(field, e.target.checked)}
                    style={{ accentColor:A, width:14, height:14 }}/>
                  {lbl}
                </label>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <label style={{ fontSize:9, color:TM, display:"block", marginBottom:3 }}>Blood Pressure Status</label>
                <select value={profile.bp} onChange={e => updateProfile("bp", e.target.value)}
                  style={{ width:"100%", padding:"8px", fontSize:11, background:"#0a0505",
                    border:`1px solid #2a1010`, color:TX, borderRadius:6, fontFamily:FONT }}>
                  {["normal","elevated","high"].map(v => <option key={v} value={v} style={{ background:"#0a0505" }}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:9, color:TM, display:"block", marginBottom:3 }}>Blood Sugar Status</label>
                <select value={profile.sugar} onChange={e => updateProfile("sugar", e.target.value)}
                  style={{ width:"100%", padding:"8px", fontSize:11, background:"#0a0505",
                    border:`1px solid #2a1010`, color:TX, borderRadius:6, fontFamily:FONT }}>
                  {["normal","prediabetic","diabetic"].map(v => <option key={v} value={v} style={{ background:"#0a0505" }}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── PREVENTION PLAN ── */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:TX }}>🎯 Your Prevention Plan</div>
            <button onClick={refreshPlan}
              style={{ fontSize:10, color:A, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>
              ↻ Refresh
            </button>
          </div>
          {plan.map(goal => (
            <div key={goal.id} className="ch-fade" style={{ border:`1.5px solid ${A}22`,
              background:"#0e0808", padding:"12px 14px", borderRadius:10, marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:TX }}>{goal.title}</div>
                  <div style={{ fontSize:10, color:TM, marginTop:2 }}>{goal.action}</div>
                </div>
                <button onClick={()=>incrementPlan(goal.id)}
                  style={{ fontSize:10, padding:"4px 10px", background:goal.streak>0?`${A}22`:"#1a0a0a",
                    border:`1px solid ${goal.streak>0?A:"#2a1010"}`,
                    color:goal.streak>0?A:TD, borderRadius:5, cursor:"pointer", fontFamily:FONT }}>
                  {goal.streak>0?`🔥 ${goal.streak}`:"+1"}
                </button>
              </div>
              <div style={{ fontSize:9, color:TD, borderLeft:`2px solid ${A}33`, paddingLeft:8 }}>
                {goal.impact}
              </div>
            </div>
          ))}
        </div>

        {/* ── DAILY HABITS ── */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:TX }}>📋 Daily Health Habits</div>
            <div style={{ fontSize:10, color:tier.color }}>{doneCount}/{DAILY_HABITS.length} done</div>
          </div>
          <MiniBar pct={(doneCount/DAILY_HABITS.length)*100} color={tier.color} height={4} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:8 }}>
            {DAILY_HABITS.map(h => {
              const done = !!habitsToday[h.id];
              return (
                <button key={h.id} onClick={() => toggleHabit(h.id)}
                  className="ch-btn"
                  style={{ padding:"10px 12px", background:done?`${A}12`:"#0e0808",
                    border:`1.5px solid ${done?A:"#2a1010"}`,
                    borderRadius:9, display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                    textAlign:"left", width:"100%", transition:"all .18s" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{h.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:done?`${A}88`:TM, textDecoration:done?"line-through":"none",
                      lineHeight:1.3 }}>{h.label}</div>
                    <div style={{ fontSize:7, color:TD, marginTop:2 }}>{h.who}</div>
                  </div>
                  {done && <span style={{ fontSize:12, color:GREEN, flexShrink:0 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BIOMETRICS ── */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:TX }}>🩺 Biometric Log</div>
            <ChBtn onClick={()=>setShowLog(true)} small style={{ width:"auto", padding:"7px 14px" }}>
              + Log Reading
            </ChBtn>
          </div>

          {/* Latest values grid */}
          {(() => {
            const latest = {};
            logs.forEach(l => { if (!latest[l.type]) latest[l.type] = l; });
            return (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  { type:"bp",      icon:"❤️",  label:"Blood Pressure" },
                  { type:"glucose", icon:"🩸",  label:"Blood Glucose"  },
                  { type:"weight",  icon:"⚖️",  label:"Body Weight"    },
                  { type:"spo2",    icon:"🫁",  label:"SpO₂ Oxygen"   },
                ].map(({ type, icon, label }) => {
                  const entry = latest[type];
                  const isBP  = type === "bp";
                  const stat  = entry ? bioStatus(isBP ? "systolic" : type, isBP ? entry.value.split("/")[0] : entry.value) : null;
                  return (
                    <div key={type} style={{ border:`1.5px solid ${stat?stat.color+"33":"#2a1010"}`,
                      background:"#0e0808", padding:"10px 12px", borderRadius:9 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:9, color:TM, letterSpacing:".1em" }}>{icon} {label}</span>
                        {stat && <span style={{ fontSize:8, color:stat.color, fontWeight:700 }}>{stat.label}</span>}
                      </div>
                      <div style={{ fontFamily:SYNE, fontSize:20, fontWeight:800,
                        color:stat?stat.color:TD, lineHeight:1 }}>
                        {entry ? entry.value : "—"}
                      </div>
                      <div style={{ fontSize:8, color:TD, marginTop:2 }}>
                        {entry ? entry.date : "Not logged"}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Sparkline trends */}
          {logs.length >= 2 && (
            <div style={{ border:`1.5px solid ${BOR}`, background:"#0e0808",
              padding:"12px 14px", borderRadius:10 }}>
              <div style={{ fontSize:10, color:TM, marginBottom:10, letterSpacing:".1em" }}>
                📈 7-Day Trends
              </div>
              {[
                { type:"glucose", label:"Blood Glucose", unit:"mg/dL", color:AMBER  },
                { type:"spo2",    label:"SpO₂",          unit:"%",     color:BLUE   },
                { type:"weight",  label:"Weight",         unit:"kg",    color:A      },
              ].map(({ type, label, unit, color }) => {
                const data = logs.filter(l => l.type === type);
                return data.length >= 2 ? (
                  <div key={type} style={{ marginBottom:12 }}>
                    <Sparkline data={data} label={label} unit={unit} color={color} />
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* ── RECENT LOGS ── */}
        {logs.length > 0 && (
          <div style={{ border:`1.5px solid ${BOR}`, background:"#0e0808",
            padding:"12px 14px", borderRadius:10 }}>
            <div style={{ fontSize:10, color:TM, marginBottom:8, letterSpacing:".1em" }}>
              Recent Readings
            </div>
            {logs.slice(0, 5).map(l => {
              const isBP = l.type === "bp";
              const stat = bioStatus(isBP ? "systolic" : l.type, isBP ? l.value.split("/")[0] : l.value);
              return (
                <div key={l.id} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"8px 0", borderBottom:`1px solid #1a0a0a` }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:stat.color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:11, color:TX, textTransform:"uppercase", letterSpacing:".06em" }}>
                    {l.type}
                  </div>
                  <div style={{ fontFamily:SYNE, fontSize:14, fontWeight:700, color:stat.color }}>
                    {l.value}
                  </div>
                  <div style={{ fontSize:9, color:TD }}>{l.date}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── NAVIGATION SHORTCUTS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <ChBtn onClick={() => navigate("/app/nutrition")} variant="secondary" color={GREEN}>
            🥗 Nutrition Hub
          </ChBtn>
          <ChBtn onClick={() => navigate("/app/medication")} variant="secondary" color={BLUE}>
            💊 Medication Hub
          </ChBtn>
        </div>
        <ChBtn onClick={() => navigate("/app/stress")} variant="secondary" color={AMBER}>
          🧘 Stress & Burnout Hub
        </ChBtn>

        {/* ── ENCOURAGEMENT ── */}
        <div style={{ border:`1.5px solid ${A}22`, background:"#0e0808",
          padding:"12px 14px", borderRadius:10, textAlign:"center" }}>
          <div style={{ fontSize:13, color:TM, lineHeight:1.7 }}>
            {streak.count >= 3
              ? ph(lang, "streak", { days: streak.count })
              : ph(lang, "encourage")}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign:"center", fontSize:9, color:TD, textTransform:"uppercase",
          letterSpacing:".12em", paddingTop:6 }}>
          Voice: {lang} · WHO SDG 3.4 · {offline?"Offline":"Live"} · 20 Languages · v1.0
        </div>
      </div>
    </div>
  );
}
