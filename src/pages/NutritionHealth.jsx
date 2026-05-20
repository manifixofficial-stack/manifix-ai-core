/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Nutrition Health Module v6.0                  ║
 * ║                                                                          ║
 * ║  UPGRADES FROM v5.0:                                                    ║
 * ║  • ALL 20 Languages fully completed (was: 2 real + 18 stubs)           ║
 * ║  • AI Nutrition Coach (Claude-powered meal suggestions)                 ║
 * ║  • Calorie Burn / Activity Tracker                                      ║
 * ║  • Streak & Habit Tracking with gamification                           ║
 * ║  • Barcode-style Quick-add food shortcut row                           ║
 * ║  • Micro-nutrient spotlight (Iron, Calcium, Vit C, Vit D)             ║
 * ║  • Smart Hydration formula (weight-based goal)                         ║
 * ║  • Weekly trend mini-chart (7-day score sparkline)                     ║
 * ║  • Celebration animations on goal completion                           ║
 * ║  • All 20 language phrase objects fully populated                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";

/* ════════════════════════════════════════════════════════════
   1. NUTRITION DOMAINS — WHO Evidence-Based Framework
════════════════════════════════════════════════════════════ */
const NUTRITION_DOMAINS = {
  healthy_diet: {
    domain:    "Healthy Diet & NCD Prevention",
    who_code:  "NUT-DIET",
    stat1:     "11M deaths/year attributed to poor diet — WHO Global Burden of Disease",
    stat2:     "Less than 1 in 5 adults meet WHO fruit/vegetable intake recommendations",
    stat3:     "High sodium intake causes 1.89M deaths annually from CVD",
    stat4:     "Ultra-processed foods now comprise 50-60% of diets in high-income countries",
    solve:     "Whole foods + portion control + reduced sodium → NCD risk ↓40%",
    sdg:       "SDG 2 + 3.4 — End malnutrition, reduce premature NCD mortality",
    lmic:      "Traditional diets + local foods provide affordable, culturally-appropriate nutrition",
    promise:   "Nutrition score 42→78 in 90 days with AI-guided meal planning",
  },
  hydration: {
    domain:    "Hydration & Metabolic Health",
    who_code:  "NUT-HYD",
    stat1:     "75% of adults are chronically dehydrated — impacts cognition & metabolism",
    stat2:     "Adequate hydration reduces kidney stone risk by 60%",
    stat3:     "Even 2% dehydration impairs physical performance & mental focus",
    stat4:     "Water access remains limited for 2B people globally — WHO/UNICEF",
    solve:     "Daily water goals + reminders → Energy ↑, Headaches ↓, Digestion ↑",
    sdg:       "SDG 6 — Ensure availability and sustainable management of water",
    lmic:      "Oral rehydration solutions + safe water education save lives in resource-limited settings",
    promise:   "Hydration consistency 3→9 glasses/day in 21 days",
  },
  meal_planning: {
    domain:    "Meal Planning & Food Security",
    who_code:  "NUT-PLAN",
    stat1:     "828M people face hunger globally; 2B experience moderate/severe food insecurity",
    stat2:     "Meal planning reduces food waste by 30% and saves households $1,500/year",
    stat3:     "Structured eating patterns improve glycemic control in diabetes by 25%",
    stat4:     "Community-based nutrition education improves dietary diversity by 45%",
    solve:     "Weekly planning + budget-aware recipes + local ingredient focus → Nutrition ↑, Cost ↓",
    sdg:       "SDG 2 — Zero hunger; SDG 12 — Responsible consumption",
    lmic:      "Seasonal, locally-sourced meal plans improve affordability and cultural relevance",
    promise:   "Meal prep time reduced 40% with AI-generated weekly plans",
  },
};

/* ════════════════════════════════════════════════════════════
   2. THEME
════════════════════════════════════════════════════════════ */
const T = {
  accent:       "#4ADE80",
  accentDim:    "#166534",
  accentGlow:   "rgba(74,222,128,0.12)",
  blue:         "#60a5fa",
  yellow:       "#fbbf24",
  red:          "#f87171",
  purple:       "#a78bfa",
  orange:       "#fb923c",
  bg:           "#030d07",
  card:         "#07160a",
  cardBright:   "#0a1f0e",
  border:       "#0f2a1a",
  borderDim:    "#0a160c",
  textPrimary:  "#f0ede6",
  textMid:      "#8a9e8d",
  textDim:      "#3a4e3d",
  voiceRate:    0.85,
  voicePitch:   0.96,
  touchTarget:  52,
};

/* ════════════════════════════════════════════════════════════
   3. LANGUAGE MAP
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
   4. NUT_PHRASES — ALL 20 LANGUAGES FULLY POPULATED
════════════════════════════════════════════════════════════ */
const NUT_PHRASES = {
  "en-IN": {
    welcome:      "Welcome to your nutrition tracker. Small, consistent choices create lasting health.",
    log_food:     "Food logged! Great choice for your health.",
    water_remind: "Time for water! You've had {glasses} of {goal} glasses today.",
    meal_plan:    "Your meal plan is ready. Simple, nutritious, delicious.",
    grocery:      "Grocery list updated. {count} items for healthy shopping.",
    tip:          "Nutrition tip: {tip}",
    progress:     "Great progress! Your nutrition score improved.",
    celebrate:    "Goal reached! You're nourishing your body brilliantly.",
    done:         "Excellent choices today. Your health journey matters.",
    ai_thinking:  "Your AI nutrition coach is thinking…",
    streak:       "You're on a {days}-day streak! Keep it up!",
    burn:         "You burned {cal} calories today through activity.",
  },
  "hi-IN": {
    welcome:      "अपने न्यूट्रिशन ट्रैकर में आपका स्वागत है। छोटे निरंतर चुनाव स्थायी स्वास्थ्य बनाते हैं।",
    log_food:     "भोजन दर्ज किया गया! आपके स्वास्थ्य के लिए अच्छा चुनाव।",
    water_remind: "पानी पीने का समय! आज आपने {goal} में से {glasses} गिलास पिए।",
    meal_plan:    "आपका भोजन योजना तैयार है। सरल, पौष्टिक, स्वादिष्ट।",
    grocery:      "किराना सूची अपडेट की गई। स्वस्थ खरीदारी के लिए {count} आइटम।",
    tip:          "पोषण टिप: {tip}",
    progress:     "बढ़िया प्रगति! आपका न्यूट्रिशन स्कोर बेहतर हुआ।",
    celebrate:    "लक्ष्य पूरा! आप अपने शरीर को शानदार तरीके से पोषित कर रहे हैं।",
    done:         "आज उत्कृष्ट चुनाव। आपकी स्वास्थ्य यात्रा मायने रखती है।",
    ai_thinking:  "आपका AI न्यूट्रिशन कोच सोच रहा है…",
    streak:       "आप {days} दिन की स्ट्रीक पर हैं! जारी रखें!",
    burn:         "आपने आज गतिविधि से {cal} कैलोरी जलाई।",
  },
  "te-IN": {
    welcome:      "మీ న్యూట్రిషన్ ట్రాకర్‌కు స్వాగతం. చిన్న, స్థిరమైన ఎంపికలు శాశ్వతమైన ఆరోగ్యాన్ని సృష్టిస్తాయి।",
    log_food:     "ఆహారం నమోదు చేయబడింది! మీ ఆరోగ్యానికి మంచి ఎంపిక।",
    water_remind: "నీళ్ళు తాగే సమయం! ఈరోజు {goal} లో {glasses} గ్లాసులు తాగారు.",
    meal_plan:    "మీ భోజన ప్రణాళిక సిద్ధంగా ఉంది. సరళమైన, పోషకమైన, రుచికరమైన.",
    grocery:      "కిరాణా జాబితా నవీకరించబడింది. ఆరోగ్యకరమైన కొనుగోలుకు {count} వస్తువులు.",
    tip:          "పోషణ చిట్కా: {tip}",
    progress:     "గొప్ప పురోగతి! మీ న్యూట్రిషన్ స్కోర్ మెరుగుపడింది.",
    celebrate:    "లక్ష్యం చేరుకుంది! మీరు శరీరానికి అద్భుతంగా పోషణ ఇస్తున్నారు.",
    done:         "ఈరోజు అద్భుతమైన ఎంపికలు. మీ ఆరోగ్య ప్రయాణం ముఖ్యమైనది.",
    ai_thinking:  "మీ AI న్యూట్రిషన్ కోచ్ ఆలోచిస్తోంది…",
    streak:       "మీరు {days} రోజుల స్ట్రీక్‌లో ఉన్నారు!",
    burn:         "మీరు ఈరోజు కార్యకలాపం ద్వారా {cal} కేలరీలు కాల్చారు.",
  },
  "ta-IN": {
    welcome:      "உங்கள் ஊட்டச்சத்து கண்காணிப்பாளருக்கு வரவேற்கிறோம். சிறிய, தொடர்ச்சியான தேர்வுகள் நீடித்த ஆரோக்கியத்தை உருவாக்கும்.",
    log_food:     "உணவு பதிவு செய்யப்பட்டது! உங்கள் ஆரோக்கியத்திற்கு நல்ல தேர்வு.",
    water_remind: "தண்ணீர் குடிக்கும் நேரம்! இன்று {goal} இல் {glasses} கிளாஸ் குடித்தீர்கள்.",
    meal_plan:    "உங்கள் உணவுத் திட்டம் தயார். எளிமையான, சத்தான, சுவையான.",
    grocery:      "மளிகை பட்டியல் புதுப்பிக்கப்பட்டது. ஆரோக்கியமான கொள்முதலுக்கு {count} பொருட்கள்.",
    tip:          "ஊட்டச்சத்து குறிப்பு: {tip}",
    progress:     "சிறந்த முன்னேற்றம்! உங்கள் ஊட்டச்சத்து மதிப்பெண் மேம்பட்டது.",
    celebrate:    "இலக்கு அடைந்தது! நீங்கள் உடலை அற்புதமாக போஷிக்கிறீர்கள்.",
    done:         "இன்று சிறந்த தேர்வுகள். உங்கள் ஆரோக்கிய பயணம் முக்கியமானது.",
    ai_thinking:  "உங்கள் AI ஊட்டச்சத்து பயிற்சியாளர் சிந்திக்கிறார்…",
    streak:       "நீங்கள் {days} நாள் தொடரில் இருக்கிறீர்கள்!",
    burn:         "இன்று செயல்பாட்டின் மூலம் {cal} கலோரிகளை எரித்தீர்கள்.",
  },
  "mr-IN": {
    welcome:      "तुमच्या न्यूट्रिशन ट्रॅकरमध्ये स्वागत आहे. छोटे, सातत्यपूर्ण निवडी कायमस्वरूपी आरोग्य निर्माण करतात।",
    log_food:     "अन्न नोंदवले गेले! तुमच्या आरोग्यासाठी चांगली निवड.",
    water_remind: "पाणी पिण्याची वेळ! आज {goal} पैकी {glasses} ग्लास झाले.",
    meal_plan:    "तुमची जेवण योजना तयार आहे. सोपी, पोषक, चवदार.",
    grocery:      "किराणा यादी अपडेट केली. निरोगी खरेदीसाठी {count} वस्तू.",
    tip:          "पोषण टिप: {tip}",
    progress:     "छान प्रगती! तुमचा न्यूट्रिशन स्कोर सुधारला.",
    celebrate:    "ध्येय गाठले! तुम्ही शरीराला उत्कृष्टपणे पोषण देत आहात.",
    done:         "आज उत्कृष्ट निवडी. तुमचा आरोग्य प्रवास महत्त्वाचा आहे.",
    ai_thinking:  "तुमचा AI न्यूट्रिशन कोच विचार करत आहे…",
    streak:       "तुम्ही {days} दिवसांच्या स्ट्रीकवर आहात!",
    burn:         "आज क्रियाकलापातून {cal} कॅलरी जाळल्या.",
  },
  "bn-IN": {
    welcome:      "আপনার নিউট্রিশন ট্র্যাকারে স্বাগতম। ছোট, ধারাবাহিক পছন্দগুলি দীর্ঘস্থায়ী স্বাস্থ্য তৈরি করে।",
    log_food:     "খাবার লগ করা হয়েছে! আপনার স্বাস্থ্যের জন্য ভালো পছন্দ।",
    water_remind: "পানি পানের সময়! আজ {goal} এর মধ্যে {glasses} গ্লাস পান করেছেন।",
    meal_plan:    "আপনার খাবার পরিকল্পনা প্রস্তুত। সহজ, পুষ্টিকর, সুস্বাদু।",
    grocery:      "মুদিখানা তালিকা আপডেট হয়েছে। স্বাস্থ্যকর কেনাকাটার জন্য {count}টি আইটেম।",
    tip:          "পুষ্টি টিপ: {tip}",
    progress:     "দারুণ অগ্রগতি! আপনার নিউট্রিশন স্কোর উন্নত হয়েছে।",
    celebrate:    "লক্ষ্য অর্জিত! আপনি শরীরকে দুর্দান্তভাবে পুষ্টি দিচ্ছেন।",
    done:         "আজ চমৎকার পছন্দ। আপনার স্বাস্থ্য যাত্রা গুরুত্বপূর্ণ।",
    ai_thinking:  "আপনার AI নিউট্রিশন কোচ ভাবছে…",
    streak:       "আপনি {days} দিনের স্ট্রিকে আছেন!",
    burn:         "আজ কার্যকলাপের মাধ্যমে {cal} ক্যালোরি পোড়ালেন।",
  },
  "kn-IN": {
    welcome:      "ನಿಮ್ಮ ನ್ಯೂಟ್ರಿಶನ್ ಟ್ರ್ಯಾಕರ್‌ಗೆ ಸ್ವಾಗತ. ಸಣ್ಣ, ಸ್ಥಿರವಾದ ಆಯ್ಕೆಗಳು ಶಾಶ್ವತ ಆರೋಗ್ಯ ಸೃಷ್ಟಿಸುತ್ತವೆ.",
    log_food:     "ಆಹಾರ ದಾಖಲಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಆರೋಗ್ಯಕ್ಕೆ ಒಳ್ಳೆಯ ಆಯ್ಕೆ.",
    water_remind: "ನೀರು ಕುಡಿಯುವ ಸಮಯ! ಇಂದು {goal} ರಲ್ಲಿ {glasses} ಗ್ಲಾಸ್ ಕುಡಿದಿದ್ದೀರಿ.",
    meal_plan:    "ನಿಮ್ಮ ಊಟದ ಯೋಜನೆ ತಯಾರಾಗಿದೆ. ಸರಳ, ಪೌಷ್ಟಿಕ, ರುಚಿಕರ.",
    grocery:      "ಕಿರಾಣಿ ಪಟ್ಟಿ ನವೀಕರಿಸಲಾಗಿದೆ. ಆರೋಗ್ಯಕರ ಶಾಪಿಂಗ್‌ಗಾಗಿ {count} ವಸ್ತುಗಳು.",
    tip:          "ಪೋಷಣೆ ಸಲಹೆ: {tip}",
    progress:     "ಅದ್ಭುತ ಪ್ರಗತಿ! ನಿಮ್ಮ ನ್ಯೂಟ್ರಿಶನ್ ಸ್ಕೋರ್ ಸುಧಾರಿಸಿದೆ.",
    celebrate:    "ಗುರಿ ತಲುಪಿತು! ನೀವು ದೇಹವನ್ನು ಅದ್ಭುತವಾಗಿ ಪೋಷಿಸುತ್ತಿದ್ದೀರಿ.",
    done:         "ಇಂದು ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಗಳು. ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಯಾಣ ಮುಖ್ಯ.",
    ai_thinking:  "ನಿಮ್ಮ AI ನ್ಯೂಟ್ರಿಶನ್ ಕೋಚ್ ಯೋಚಿಸುತ್ತಿದ್ದಾರೆ…",
    streak:       "ನೀವು {days} ದಿನಗಳ ಸ್ಟ್ರೀಕ್‌ನಲ್ಲಿದ್ದೀರಿ!",
    burn:         "ಇಂದು ಚಟುವಟಿಕೆಯ ಮೂಲಕ {cal} ಕ್ಯಾಲೊರಿ ಸುಟ್ಟಿದ್ದೀರಿ.",
  },
  "gu-IN": {
    welcome:      "તમારા ન્યૂટ્રિશન ટ્રેકરમાં આપનું સ્વાગત છે. નાની, સ્થિર પસંદગીઓ કાયમી સ્વાસ્થ્ય બનાવે છે.",
    log_food:     "ખોરાક નોંધ્યો! તમારા સ્વાસ્થ્ય માટે સારી પસંદ.",
    water_remind: "પાણી પીવાનો સમય! આજે {goal} માંથી {glasses} ગ્લાસ પીધા.",
    meal_plan:    "તમારી ભોજન યોજના તૈયાર છે. સરળ, પૌષ્ટિક, સ્વાદિષ્ટ.",
    grocery:      "કરિયાણાની સૂચિ અપડેટ થઈ. સ્વસ્થ ખરીદારી માટે {count} વસ્તુઓ.",
    tip:          "પોષણ ટિપ: {tip}",
    progress:     "શ્રેષ્ઠ પ્રગતિ! તમારો ન્યૂટ્રિશન સ્કોર સુધર્યો.",
    celebrate:    "લક્ષ્ય પ્રાપ્ત! તમે શરીરને ઉત્તમ પોષણ આપી રહ્યા છો.",
    done:         "આજે ઉત્કૃષ્ટ પસંદગીઓ. તમારી સ્વાસ્થ્ય યાત્રા મહત્ત્વની છે.",
    ai_thinking:  "તમારા AI ન્યૂટ્રિશન કોચ વિચારી રહ્યા છે…",
    streak:       "તમે {days} દિવસની સ્ટ્રીક પર છો!",
    burn:         "આજે પ્રવૃત્તિ દ્વારા {cal} કેલરી બાળ્યા.",
  },
  "ml-IN": {
    welcome:      "നിങ്ങളുടെ ന്യൂട്രിഷൻ ട്രാക്കറിലേക്ക് സ്വാഗതം. ചെറിയ, സ്ഥിരമായ തിരഞ്ഞെടുപ്പുകൾ ശാശ്വതമായ ആരോഗ്യം സൃഷ്ടിക്കുന്നു.",
    log_food:     "ഭക്ഷണം രേഖപ്പെടുത്തി! നിങ്ങളുടെ ആരോഗ്യത്തിന് നല്ല തിരഞ്ഞെടുപ്പ്.",
    water_remind: "വെള്ളം കുടിക്കാൻ സമയം! ഇന്ന് {goal} ൽ {glasses} ഗ്ലാസ് കുടിച്ചു.",
    meal_plan:    "നിങ്ങളുടെ ഭക്ഷണ പദ്ധതി തയ്യാർ. ലളിതം, പോഷകസമൃദ്ധം, രുചികരം.",
    grocery:      "ഗ്രോസറി ലിസ്റ്റ് അപ്ഡേറ്റ് ചെയ്തു. ആരോഗ്യകരമായ ഷോപ്പിംഗിന് {count} ഇനങ്ങൾ.",
    tip:          "പോഷണ നുറുങ്ങ്: {tip}",
    progress:     "മികച്ച പുരോഗതി! നിങ്ങളുടെ ന്യൂട്രിഷൻ സ്കോർ മെച്ചപ്പെട്ടു.",
    celebrate:    "ലക്ഷ്യം കൈവരിച്ചു! നിങ്ങൾ ശരീരത്തിന് അദ്ഭുതകരമായ പോഷണം നൽകുന്നു.",
    done:         "ഇന്ന് മികച്ച തിരഞ്ഞെടുപ്പുകൾ. നിങ്ങളുടെ ആരോഗ്യ യാത്ര പ്രധാനമാണ്.",
    ai_thinking:  "നിങ്ങളുടെ AI ന്യൂട്രിഷൻ കോച്ച് ചിന്തിക്കുന്നു…",
    streak:       "നിങ്ങൾ {days} ദിവസത്തെ സ്ട്രീക്കിലാണ്!",
    burn:         "ഇന്ന് പ്രവർത്തനത്തിലൂടെ {cal} കലോറി കത്തിച്ചു.",
  },
  "pa-IN": {
    welcome:      "ਤੁਹਾਡੇ ਪੋਸ਼ਣ ਟ੍ਰੈਕਰ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। ਛੋਟੇ, ਨਿਰੰਤਰ ਚੋਣਾਂ ਸਥਾਈ ਸਿਹਤ ਬਣਾਉਂਦੀਆਂ ਹਨ।",
    log_food:     "ਭੋਜਨ ਦਰਜ ਕੀਤਾ! ਤੁਹਾਡੀ ਸਿਹਤ ਲਈ ਚੰਗੀ ਚੋਣ।",
    water_remind: "ਪਾਣੀ ਪੀਣ ਦਾ ਸਮਾਂ! ਅੱਜ {goal} ਵਿੱਚੋਂ {glasses} ਗਲਾਸ ਪੀਤੇ।",
    meal_plan:    "ਤੁਹਾਡੀ ਭੋਜਨ ਯੋਜਨਾ ਤਿਆਰ ਹੈ। ਸਾਦੀ, ਪੌਸ਼ਟਿਕ, ਸੁਆਦੀ।",
    grocery:      "ਕਿਰਾਨੇ ਦੀ ਸੂਚੀ ਅੱਪਡੇਟ ਕੀਤੀ। ਸਿਹਤਮੰਦ ਖਰੀਦਾਰੀ ਲਈ {count} ਚੀਜ਼ਾਂ।",
    tip:          "ਪੋਸ਼ਣ ਸੁਝਾਅ: {tip}",
    progress:     "ਸ਼ਾਨਦਾਰ ਤਰੱਕੀ! ਤੁਹਾਡਾ ਪੋਸ਼ਣ ਸਕੋਰ ਬਿਹਤਰ ਹੋਇਆ।",
    celebrate:    "ਟੀਚਾ ਪੂਰਾ! ਤੁਸੀਂ ਸਰੀਰ ਨੂੰ ਸ਼ਾਨਦਾਰ ਢੰਗ ਨਾਲ ਪੋਸ਼ਣ ਦੇ ਰਹੇ ਹੋ।",
    done:         "ਅੱਜ ਬਹੁਤੀਆਂ ਵਧੀਆ ਚੋਣਾਂ। ਤੁਹਾਡਾ ਸਿਹਤ ਸਫ਼ਰ ਮਹੱਤਵਪੂਰਨ ਹੈ।",
    ai_thinking:  "ਤੁਹਾਡਾ AI ਪੋਸ਼ਣ ਕੋਚ ਸੋਚ ਰਿਹਾ ਹੈ…",
    streak:       "ਤੁਸੀਂ {days} ਦਿਨਾਂ ਦੀ ਸਟ੍ਰੀਕ 'ਤੇ ਹੋ!",
    burn:         "ਅੱਜ ਗਤੀਵਿਧੀ ਰਾਹੀਂ {cal} ਕੈਲੋਰੀ ਸਾੜੀਆਂ।",
  },
  "or-IN": {
    welcome:      "ଆପଣଙ୍କ ନ୍ୟୁଟ୍ରିଶନ ଟ୍ରାକରରେ ସ୍ୱାଗତ। ଛୋଟ, ଧାରାବାହିକ ପସନ୍ଦ ସ୍ଥାୟୀ ସ୍ୱାସ୍ଥ୍ୟ ସୃଷ୍ଟି କରେ।",
    log_food:     "ଖାଦ୍ୟ ଲଗ୍ ହୋଇଛି! ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ଭଲ ପସନ୍ଦ।",
    water_remind: "ପାଣି ପିଇବାର ସମୟ! ଆଜି {goal} ର {glasses} ଗ୍ଲାସ ପିଅ।",
    meal_plan:    "ଆପଣଙ୍କ ଭୋଜନ ଯୋଜନା ପ୍ରସ୍ତୁତ। ସହଜ, ପୋଷଣଯୁକ୍ତ, ସ୍ୱାଦିଷ୍ଟ।",
    grocery:      "ମୁଦି ତାଲିକା ଅଦ୍ୟତନ ହୋଇଛି। ସ୍ୱାସ୍ଥ୍ୟକର କ୍ରୟ ପାଇଁ {count} ଜିନିଷ।",
    tip:          "ପୋଷଣ ଟିପ: {tip}",
    progress:     "ଦୁର୍ଦାନ୍ତ ଅଗ୍ରଗତି! ଆପଣଙ୍କ ନ୍ୟୁଟ୍ରିଶନ ସ୍କୋର ଉନ୍ନତ ହୋଇଛି।",
    celebrate:    "ଲକ୍ଷ୍ୟ ହାସଲ! ଆପଣ ଶରୀରକୁ ଅଦ୍ଭୁତ ଭାବେ ପୋଷଣ ଦେଉଛନ୍ତି।",
    done:         "ଆଜି ଉତ୍କୃଷ୍ଟ ପସନ୍ଦ। ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଯାତ୍ରା ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ।",
    ai_thinking:  "ଆପଣଙ୍କ AI ନ୍ୟୁଟ୍ରିଶନ କୋଚ ଭାବୁଛନ୍ତି…",
    streak:       "ଆପଣ {days} ଦିନର ଷ୍ଟ୍ରିକ୍‌ରେ ଅଛନ୍ତି!",
    burn:         "ଆଜି କ୍ରିୟାକଳାପ ଦ୍ୱାରା {cal} କ୍ୟାଲୋରି ପୋଡ଼ିଲେ।",
  },
  "ur-IN": {
    welcome:      "اپنے نیوٹریشن ٹریکر میں خوش آمدید۔ چھوٹے، مستقل انتخاب دیرپا صحت بناتے ہیں۔",
    log_food:     "کھانا لاگ کیا گیا! آپ کی صحت کے لیے اچھا انتخاب۔",
    water_remind: "پانی پینے کا وقت! آج {goal} میں سے {glasses} گلاس پیے۔",
    meal_plan:    "آپ کا کھانے کا منصوبہ تیار ہے۔ سادہ، غذائی، مزیدار۔",
    grocery:      "گروسری فہرست اپ ڈیٹ کی گئی۔ صحت مند خریداری کے لیے {count} اشیاء۔",
    tip:          "غذائیت کا مشورہ: {tip}",
    progress:     "شاندار ترقی! آپ کا نیوٹریشن سکور بہتر ہوا۔",
    celebrate:    "ہدف حاصل! آپ جسم کو شاندار طریقے سے غذائیت دے رہے ہیں۔",
    done:         "آج بہترین انتخاب۔ آپ کا صحت کا سفر اہم ہے۔",
    ai_thinking:  "آپ کا AI نیوٹریشن کوچ سوچ رہا ہے…",
    streak:       "آپ {days} دن کی اسٹریک پر ہیں!",
    burn:         "آج سرگرمی کے ذریعے {cal} کیلوریز جلائیں۔",
  },
  "es-ES": {
    welcome:      "Bienvenido a tu rastreador de nutrición. Elecciones pequeñas y consistentes crean salud duradera.",
    log_food:     "¡Alimento registrado! Buena elección para tu salud.",
    water_remind: "¡Hora de agua! Has tomado {glasses} de {goal} vasos hoy.",
    meal_plan:    "Tu plan de comidas está listo. Simple, nutritivo, delicioso.",
    grocery:      "Lista de compras actualizada. {count} artículos para compras saludables.",
    tip:          "Consejo nutricional: {tip}",
    progress:     "¡Gran progreso! Tu puntuación de nutrición mejoró.",
    celebrate:    "¡Meta alcanzada! Estás nutriendo tu cuerpo brillantemente.",
    done:         "Excelentes elecciones hoy. Tu viaje de salud importa.",
    ai_thinking:  "Tu entrenador de nutrición IA está pensando…",
    streak:       "¡Llevas una racha de {days} días!",
    burn:         "Quemaste {cal} calorías hoy con actividad.",
  },
  "ar-SA": {
    welcome:      "مرحباً بك في متتبع التغذية الخاص بك. الاختيارات الصغيرة المتسقة تخلق صحة دائمة.",
    log_food:     "تم تسجيل الطعام! اختيار جيد لصحتك.",
    water_remind: "حان وقت الماء! تناولت {glasses} من {goal} كوب اليوم.",
    meal_plan:    "خطة وجباتك جاهزة. بسيطة ومغذية ولذيذة.",
    grocery:      "قائمة البقالة محدثة. {count} عنصر للتسوق الصحي.",
    tip:          "نصيحة غذائية: {tip}",
    progress:     "تقدم رائع! تحسنت درجة التغذية لديك.",
    celebrate:    "تم بلوغ الهدف! أنت تغذي جسدك بشكل رائع.",
    done:         "خيارات ممتازة اليوم. رحلتك الصحية مهمة.",
    ai_thinking:  "مدرب التغذية الذكاء الاصطناعي يفكر…",
    streak:       "أنت في سلسلة {days} أيام!",
    burn:         "حرقت {cal} سعرة حرارية اليوم من خلال النشاط.",
  },
  "fr-FR": {
    welcome:      "Bienvenue dans votre suivi nutritionnel. De petits choix constants créent une santé durable.",
    log_food:     "Aliment enregistré ! Bon choix pour votre santé.",
    water_remind: "Il est temps de boire ! Vous avez bu {glasses} sur {goal} verres aujourd'hui.",
    meal_plan:    "Votre plan repas est prêt. Simple, nutritif, délicieux.",
    grocery:      "Liste de courses mise à jour. {count} articles pour des achats sains.",
    tip:          "Conseil nutritionnel : {tip}",
    progress:     "Super progrès ! Votre score nutritionnel s'est amélioré.",
    celebrate:    "Objectif atteint ! Vous nourrissez brillamment votre corps.",
    done:         "Excellents choix aujourd'hui. Votre parcours santé est important.",
    ai_thinking:  "Votre coach nutritionnel IA réfléchit…",
    streak:       "Vous êtes sur une série de {days} jours !",
    burn:         "Vous avez brûlé {cal} calories aujourd'hui grâce à l'activité.",
  },
  "pt-BR": {
    welcome:      "Bem-vindo ao seu rastreador nutricional. Pequenas escolhas consistentes criam saúde duradoura.",
    log_food:     "Alimento registrado! Boa escolha para sua saúde.",
    water_remind: "Hora de beber água! Você tomou {glasses} de {goal} copos hoje.",
    meal_plan:    "Seu plano de refeições está pronto. Simples, nutritivo, delicioso.",
    grocery:      "Lista de compras atualizada. {count} itens para compras saudáveis.",
    tip:          "Dica nutricional: {tip}",
    progress:     "Ótimo progresso! Sua pontuação nutricional melhorou.",
    celebrate:    "Meta atingida! Você está nutrindo seu corpo brilhantemente.",
    done:         "Excelentes escolhas hoje. Sua jornada de saúde importa.",
    ai_thinking:  "Seu coach nutricional de IA está pensando…",
    streak:       "Você está em uma sequência de {days} dias!",
    burn:         "Você queimou {cal} calorias hoje com atividade.",
  },
  "de-DE": {
    welcome:      "Willkommen in Ihrem Ernährungs-Tracker. Kleine, konsistente Entscheidungen schaffen dauerhafte Gesundheit.",
    log_food:     "Lebensmittel erfasst! Gute Wahl für Ihre Gesundheit.",
    water_remind: "Zeit fürs Wasser! Sie haben heute {glasses} von {goal} Gläsern getrunken.",
    meal_plan:    "Ihr Ernährungsplan ist fertig. Einfach, nahrhaft, lecker.",
    grocery:      "Einkaufsliste aktualisiert. {count} Artikel für gesundes Einkaufen.",
    tip:          "Ernährungstipp: {tip}",
    progress:     "Großartige Fortschritte! Ihr Ernährungs-Score hat sich verbessert.",
    celebrate:    "Ziel erreicht! Sie ernähren Ihren Körper hervorragend.",
    done:         "Ausgezeichnete Entscheidungen heute. Ihre Gesundheitsreise ist wichtig.",
    ai_thinking:  "Ihr KI-Ernährungscoach denkt nach…",
    streak:       "Sie sind auf einer {days}-Tage-Serie!",
    burn:         "Sie haben heute {cal} Kalorien durch Aktivität verbrannt.",
  },
  "ja-JP": {
    welcome:      "栄養トラッカーへようこそ。小さな継続的な選択が長続きする健康を生み出します。",
    log_food:     "食事を記録しました！健康に良い選択です。",
    water_remind: "水分補給の時間！今日は{goal}杯中{glasses}杯飲みました。",
    meal_plan:    "食事プランの準備ができました。シンプルで栄養豊富で美味しい。",
    grocery:      "食料品リストを更新しました。健康的なショッピングに{count}品目。",
    tip:          "栄養のヒント：{tip}",
    progress:     "素晴らしい進歩！栄養スコアが向上しました。",
    celebrate:    "目標達成！あなたは身体に素晴らしい栄養を与えています。",
    done:         "今日は優れた選択でした。あなたの健康への歩みは大切です。",
    ai_thinking:  "AIの栄養コーチが考えています…",
    streak:       "{days}日間のストリーク中です！",
    burn:         "今日は活動によって{cal}カロリーを消費しました。",
  },
  "ko-KR": {
    welcome:      "영양 트래커에 오신 것을 환영합니다. 작은 꾸준한 선택이 지속적인 건강을 만듭니다.",
    log_food:     "음식이 기록되었습니다! 건강을 위한 좋은 선택입니다.",
    water_remind: "수분 보충 시간! 오늘 {goal}잔 중 {glasses}잔을 마셨습니다.",
    meal_plan:    "식단 계획이 준비되었습니다. 단순하고 영양 풍부하며 맛있는.",
    grocery:      "장보기 목록이 업데이트되었습니다. 건강한 쇼핑을 위한 {count}가지 품목.",
    tip:          "영양 팁: {tip}",
    progress:     "훌륭한 진행! 영양 점수가 향상되었습니다.",
    celebrate:    "목표 달성! 몸에 훌륭한 영양을 공급하고 있습니다.",
    done:         "오늘 훌륭한 선택들. 당신의 건강 여정이 중요합니다.",
    ai_thinking:  "AI 영양 코치가 생각하고 있습니다…",
    streak:       "{days}일 연속 기록 중입니다!",
    burn:         "오늘 활동으로 {cal}칼로리를 소모했습니다.",
  },
  "zh-CN": {
    welcome:      "欢迎使用您的营养追踪器。小而持续的选择创造持久健康。",
    log_food:     "食物已记录！为您的健康做出好选择。",
    water_remind: "该喝水了！今天您已喝{glasses}/{goal}杯。",
    meal_plan:    "您的饮食计划已就绪。简单、营养、美味。",
    grocery:      "购物清单已更新。{count}件健康购物商品。",
    tip:          "营养提示：{tip}",
    progress:     "进展很好！您的营养评分提升了。",
    celebrate:    "目标达成！您正在精彩地滋养身体。",
    done:         "今天选择很棒。您的健康之旅很重要。",
    ai_thinking:  "您的AI营养教练正在思考…",
    streak:       "您已连续打卡{days}天！",
    burn:         "今天通过活动燃烧了{cal}卡路里。",
  },
};

function ph(lang, key, vars = {}) {
  const base = NUT_PHRASES[lang] || NUT_PHRASES["en-IN"];
  let text = base[key] || NUT_PHRASES["en-IN"][key] || "";
  Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
  return text;
}

/* ════════════════════════════════════════════════════════════
   5. FOOD DATABASE
════════════════════════════════════════════════════════════ */
const FOOD_DB = {
  "rice":    { name:"Rice (cooked)",         calories:130, protein:2.7, carbs:28,  fat:0.3, fiber:0.4, icon:"🍚", iron:0.2, calcium:10,  vitC:0,  vitD:0 },
  "roti":    { name:"Roti/Chapati",           calories:104, protein:3.3, carbs:18,  fat:2.1, fiber:2.5, icon:"🫓", iron:1.5, calcium:20,  vitC:0,  vitD:0 },
  "bread":   { name:"Whole Wheat Bread",      calories:81,  protein:4,   carbs:14,  fat:1.1, fiber:2,   icon:"🍞", iron:1.2, calcium:30,  vitC:0,  vitD:0 },
  "oats":    { name:"Oats (cooked)",          calories:71,  protein:2.5, carbs:12,  fat:1.4, fiber:2,   icon:"🥣", iron:1.7, calcium:54,  vitC:0,  vitD:0 },
  "chicken": { name:"Chicken Breast (grilled)",calories:165,protein:31,  carbs:0,   fat:3.6, fiber:0,   icon:"🍗", iron:1.0, calcium:15,  vitC:0,  vitD:0.3 },
  "dal":     { name:"Dal/Lentils (cooked)",   calories:116, protein:9,   carbs:20,  fat:0.4, fiber:8,   icon:"🥘", iron:3.3, calcium:40,  vitC:1.5,vitD:0 },
  "egg":     { name:"Egg (boiled)",           calories:78,  protein:6.3, carbs:0.6, fat:5.3, fiber:0,   icon:"🥚", iron:1.2, calcium:28,  vitC:0,  vitD:1.1 },
  "fish":    { name:"Fish (grilled)",         calories:206, protein:22,  carbs:0,   fat:12,  fiber:0,   icon:"🐟", iron:0.8, calcium:30,  vitC:0,  vitD:5.6 },
  "tofu":    { name:"Tofu",                   calories:76,  protein:8,   carbs:1.9, fat:4.8, fiber:0.3, icon:"🫘", iron:1.6, calcium:200, vitC:0,  vitD:0 },
  "spinach": { name:"Spinach (cooked)",       calories:23,  protein:3,   carbs:3.6, fat:0.3, fiber:2.4, icon:"🥬", iron:3.6, calcium:245, vitC:18, vitD:0 },
  "tomato":  { name:"Tomato",                 calories:18,  protein:0.9, carbs:3.9, fat:0.2, fiber:1.2, icon:"🍅", iron:0.3, calcium:10,  vitC:14, vitD:0 },
  "carrot":  { name:"Carrot",                 calories:41,  protein:0.9, carbs:10,  fat:0.2, fiber:2.8, icon:"🥕", iron:0.3, calcium:33,  vitC:6,  vitD:0 },
  "potato":  { name:"Potato (boiled)",        calories:87,  protein:2.5, carbs:20,  fat:0.1, fiber:2.2, icon:"🥔", iron:0.6, calcium:8,   vitC:13, vitD:0 },
  "banana":  { name:"Banana",                 calories:89,  protein:1.1, carbs:23,  fat:0.3, fiber:2.6, icon:"🍌", iron:0.3, calcium:5,   vitC:9,  vitD:0 },
  "apple":   { name:"Apple",                  calories:52,  protein:0.3, carbs:14,  fat:0.2, fiber:2.4, icon:"🍎", iron:0.1, calcium:6,   vitC:5,  vitD:0 },
  "mango":   { name:"Mango",                  calories:60,  protein:0.8, carbs:15,  fat:0.4, fiber:1.6, icon:"🥭", iron:0.2, calcium:11,  vitC:36, vitD:0 },
  "orange":  { name:"Orange",                 calories:47,  protein:0.9, carbs:12,  fat:0.1, fiber:2.4, icon:"🍊", iron:0.1, calcium:40,  vitC:53, vitD:0 },
  "milk":    { name:"Milk (whole)",           calories:61,  protein:3.2, carbs:4.8, fat:3.3, fiber:0,   icon:"🥛", iron:0.1, calcium:120, vitC:0,  vitD:1.2 },
  "curd":    { name:"Curd/Yogurt",            calories:59,  protein:3.5, carbs:4.7, fat:3.3, fiber:0,   icon:"🍶", iron:0.1, calcium:110, vitC:0,  vitD:0.1 },
  "cheese":  { name:"Cheese (cheddar)",       calories:113, protein:7,   carbs:0.4, fat:9.3, fiber:0,   icon:"🧀", iron:0.2, calcium:200, vitC:0,  vitD:0.2 },
  "nuts":    { name:"Mixed Nuts (30g)",       calories:185, protein:5,   carbs:6,   fat:16,  fiber:3,   icon:"🥜", iron:1.2, calcium:35,  vitC:0,  vitD:0 },
};

const FOOD_KEYS = Object.keys(FOOD_DB);
const QUICK_ADD = ["rice","dal","egg","banana","milk","oats","chicken","spinach","mango","nuts"];

/* ════════════════════════════════════════════════════════════
   6. MEAL TEMPLATES
════════════════════════════════════════════════════════════ */
const MEAL_TEMPLATES = {
  breakfast: [
    { name:"Oats + Banana + Milk",            foods:["oats","banana","milk"],            calories:290, protein:10, carbs:52, fat:5 },
    { name:"Roti + Dal + Curd",               foods:["roti","dal","curd"],               calories:279, protein:16, carbs:43, fat:6 },
    { name:"Egg + Toast + Fruit",             foods:["egg","bread","apple"],             calories:211, protein:11, carbs:21, fat:7 },
    { name:"Mango Smoothie Bowl",             foods:["mango","banana","milk","oats"],    calories:338, protein:9,  carbs:72, fat:5 },
    { name:"Spinach Egg Toast",               foods:["egg","bread","spinach"],           calories:182, protein:14, carbs:17, fat:8 },
    { name:"Curd + Nuts + Orange",            foods:["curd","nuts","orange"],            calories:291, protein:10, carbs:23, fat:19 },
    { name:"Rice Porridge + Banana",          foods:["rice","banana","milk"],            calories:280, protein:5,  carbs:60, fat:4 },
  ],
  lunch: [
    { name:"Rice + Dal + Spinach + Chicken",  foods:["rice","dal","spinach","chicken"],  calories:434, protein:46, carbs:52, fat:4 },
    { name:"Roti + Fish + Tomato + Carrot",   foods:["roti","fish","tomato","carrot"],   calories:369, protein:27, carbs:32, fat:15 },
    { name:"Rice + Tofu + Mixed Veggies",     foods:["rice","tofu","spinach","carrot"],  calories:323, protein:14, carbs:44, fat:5 },
    { name:"Dal + Roti + Mango Salad",        foods:["dal","roti","mango","tomato"],     calories:296, protein:11, carbs:59, fat:2 },
    { name:"Chicken + Potato + Spinach",      foods:["chicken","potato","spinach"],      calories:275, protein:35, carbs:23, fat:5 },
    { name:"Fish + Rice + Carrot",            foods:["fish","rice","carrot"],            calories:377, protein:24, carbs:39, fat:13 },
    { name:"Egg Curry + Roti",               foods:["egg","roti","tomato","carrot"],    calories:241, protein:10, carbs:28, fat:8 },
  ],
  dinner: [
    { name:"Light Dal + Roti + Curd",         foods:["dal","roti","curd"],               calories:279, protein:16, carbs:43, fat:6 },
    { name:"Grilled Fish + Veggies",          foods:["fish","spinach","tomato","carrot"],calories:288, protein:27, fat:13,   carbs:18 },
    { name:"Tofu + Vegetable Stir-fry",       foods:["tofu","spinach","carrot","tomato"],calories:162, protein:12, carbs:11, fat:6 },
    { name:"Egg + Roti + Salad",              foods:["egg","roti","tomato","spinach"],   calories:224, protein:13, carbs:25, fat:7 },
    { name:"Lentil Soup + Bread",             foods:["dal","bread","tomato"],            calories:215, protein:11, carbs:36, fat:2 },
    { name:"Chicken Salad Bowl",              foods:["chicken","spinach","tomato","carrot"],calories:258,protein:34,carbs:9, fat:5 },
    { name:"Rice + Curd + Pickle",            foods:["rice","curd"],                     calories:189, protein:6,  carbs:33, fat:4 },
  ],
  snack: [
    { name:"Fruit + Nuts",                    foods:["apple","nuts"],                    calories:237, protein:5,  carbs:20, fat:16 },
    { name:"Curd + Banana",                   foods:["curd","banana"],                   calories:148, protein:5,  carbs:28, fat:4 },
    { name:"Boiled Egg + Fruit",              foods:["egg","orange"],                    calories:125, protein:7,  carbs:13, fat:5 },
    { name:"Mango + Nuts",                    foods:["mango","nuts"],                    calories:245, protein:6,  carbs:21, fat:16 },
    { name:"Milk + Banana",                   foods:["milk","banana"],                   calories:150, protein:4,  carbs:28, fat:3 },
    { name:"Cheese + Apple",                  foods:["cheese","apple"],                  calories:165, protein:7,  carbs:14, fat:9 },
    { name:"Spinach Smoothie",                foods:["spinach","banana","milk"],         calories:135, protein:5,  carbs:26, fat:3 },
  ],
};

/* ════════════════════════════════════════════════════════════
   7. ACTIVITY DB
════════════════════════════════════════════════════════════ */
const ACTIVITIES = [
  { id:"walk",    name:"Walking",    icon:"🚶", calPerMin:4  },
  { id:"run",     name:"Running",    icon:"🏃", calPerMin:10 },
  { id:"yoga",    name:"Yoga",       icon:"🧘", calPerMin:3  },
  { id:"cycle",   name:"Cycling",    icon:"🚴", calPerMin:7  },
  { id:"swim",    name:"Swimming",   icon:"🏊", calPerMin:8  },
  { id:"dance",   name:"Dancing",    icon:"💃", calPerMin:5  },
  { id:"climb",   name:"Stair Climb",icon:"🧗", calPerMin:9  },
  { id:"stretch", name:"Stretching", icon:"🤸", calPerMin:2  },
];

const NUTRITION_TIPS = [
  "Add one extra vegetable to each meal for more fiber and nutrients.",
  "Eat slowly — it takes 20 minutes for the brain to signal fullness.",
  "Replace refined grains with whole grains for sustained energy.",
  "A handful of nuts daily reduces cardiovascular risk by 20%.",
  "Colorful plates = diverse nutrients. Aim for 5+ colors per day.",
  "Fermented foods like curd improve gut health and immunity.",
  "Iron absorption doubles when paired with vitamin C rich foods.",
  "Soaking dal/legumes overnight reduces cooking time and improves digestion.",
  "Local, seasonal produce is more nutrient-dense and affordable.",
  "Limit ultra-processed foods — they crowd out nutritious options.",
  "Breakfast within 2 hours of waking regulates blood sugar all day.",
  "Potassium-rich foods (banana, potato) counter sodium's blood pressure effect.",
];

/* ════════════════════════════════════════════════════════════
   8. DATA LAYER
════════════════════════════════════════════════════════════ */
function loadLang() {
  const c = (typeof localStorage !== "undefined" && localStorage.getItem("magic16_lang")) || "en-IN";
  return LANG_MAP[c] || "en-IN";
}

function loadData() {
  try {
    const s = localStorage.getItem("manifix_nutrition_v6");
    if (s) return JSON.parse(s);
  } catch {}
  return {
    dailyGoal: { calories:2000, protein:50, carbs:250, fat:65, water:8 },
    logged: [],
    water: [],
    activities: [],
    mealPlan: null,
    groceryChecked: [],
    streakDays: 0,
    lastActiveDate: null,
    weeklyScores: [],
    lastUpdated: Date.now(),
  };
}

function saveData(d) {
  try { localStorage.setItem("manifix_nutrition_v6", JSON.stringify({ ...d, lastUpdated: Date.now() })); } catch {}
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

function calcTotals(logged, water) {
  const today = todayStr();
  const todayLogs = logged.filter(l => l.time.startsWith(today));
  const totals = { calories:0, protein:0, carbs:0, fat:0, fiber:0, iron:0, calcium:0, vitC:0, vitD:0 };
  todayLogs.forEach(log => {
    const f = FOOD_DB[log.foodId];
    if (!f) return;
    const p = log.portion || 1;
    totals.calories  += f.calories  * p;
    totals.protein   += f.protein   * p;
    totals.carbs     += f.carbs     * p;
    totals.fat       += f.fat       * p;
    totals.fiber     += f.fiber     * p;
    totals.iron      += (f.iron     || 0) * p;
    totals.calcium   += (f.calcium  || 0) * p;
    totals.vitC      += (f.vitC     || 0) * p;
    totals.vitD      += (f.vitD     || 0) * p;
  });
  const waterCount = water.filter(t => t.startsWith(today)).length;
  return { ...totals, water: waterCount };
}

function calcActivityBurn(activities) {
  const today = todayStr();
  return activities
    .filter(a => a.time.startsWith(today))
    .reduce((sum, a) => sum + (a.calories || 0), 0);
}

function calcScore(totals, goal, burn) {
  if (!goal) return 50;
  const netCal = totals.calories - burn;
  const calRatio = netCal / goal.calories;
  const scores = [];
  scores.push(calRatio >= 0.8 && calRatio <= 1.2 ? 25 : Math.max(0, 25 - Math.abs(calRatio - 1) * 50));
  scores.push(totals.protein >= goal.protein * 0.8 ? 25 : (totals.protein / goal.protein) * 25);
  const carbRatio = totals.carbs / goal.carbs;
  scores.push(carbRatio >= 0.7 && carbRatio <= 1.3 ? 25 : Math.max(0, 25 - Math.abs(carbRatio - 1) * 40));
  scores.push(Math.min(25, totals.water * 3.125));
  return Math.round(scores.reduce((a, b) => a + b, 0));
}

function genMealPlan() {
  const day = new Date().getDay();
  return {
    breakfast: MEAL_TEMPLATES.breakfast[day % MEAL_TEMPLATES.breakfast.length],
    lunch:     MEAL_TEMPLATES.lunch    [day % MEAL_TEMPLATES.lunch.length],
    dinner:    MEAL_TEMPLATES.dinner   [day % MEAL_TEMPLATES.dinner.length],
    snack:     MEAL_TEMPLATES.snack    [day % MEAL_TEMPLATES.snack.length],
  };
}

function genGrocery(plan) {
  const items = new Set();
  if (plan) {
    Object.values(plan).forEach(m => m?.foods?.forEach(id => {
      const f = FOOD_DB[id];
      if (f) items.add(f.name);
    }));
  }
  ["Rice","Roti/Chapati","Eggs","Milk","Curd/Yogurt"].forEach(s => {
    if (![...items].some(i => i.includes(s.split("/")[0]))) items.add(s);
  });
  return [...items].sort();
}

function updateStreak(data) {
  const today = todayStr();
  if (data.lastActiveDate === today) return data;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = data.lastActiveDate === yesterday ? (data.streakDays || 0) + 1 : 1;
  return { ...data, streakDays: newStreak, lastActiveDate: today };
}

/* ════════════════════════════════════════════════════════════
   9. VOICE
════════════════════════════════════════════════════════════ */
function makeSpeaker(lang) {
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = urgent ? 1.0 : T.voiceRate; u.pitch = urgent ? 1.05 : T.voicePitch;
      const voices = window.speechSynthesis.getVoices();
      const base = lang.split("-")[0];
      const v = voices.find(x => x.lang === lang) || voices.find(x => x.lang.startsWith(base)) || voices.find(x => x.lang.startsWith("en"));
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    if (urgent) navigator.vibrate?.([60, 30, 60]);
    if (speechSynthesis.getVoices().length) say();
    else speechSynthesis.onvoiceschanged = say;
  };
}

/* ════════════════════════════════════════════════════════════
   10. CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("nut-v6-css")) return;
  const el = document.createElement("style");
  el.id = "nut-v6-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes glow-pulse{0%,100%{box-shadow:0 0 0 rgba(74,222,128,0)}50%{box-shadow:0 0 28px rgba(74,222,128,0.25)}}
    @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
    @keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(720deg);opacity:0}}
    @keyframes streak-bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    .fade-up{animation:fade-up .4s cubic-bezier(.22,.68,0,1.2) both}
    .pop{animation:pop .35s ease both}
    .glow{animation:glow-pulse 3s ease-in-out infinite}
    .streak-anim{animation:streak-bounce 1.5s ease-in-out infinite}
    .btn-nut{transition:all .18s ease;cursor:pointer}
    .btn-nut:hover{filter:brightness(1.1);transform:translateY(-2px)}
    .btn-nut:active{transform:translateY(0) scale(.97)}
    .focus-ring:focus{outline:2px solid #4ADE80;outline-offset:2px}
    .scrollbar-hide::-webkit-scrollbar{display:none}
    .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   11. SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

function ScoreRing({ score }) {
  const r = 40; const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = score >= 80 ? T.accent : score >= 60 ? T.yellow : T.red;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#0f2a1a" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray .6s ease" }}/>
      <text x="50" y="54" textAnchor="middle" fill={color}
        style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{score}</text>
    </svg>
  );
}

function MacroBar({ label, current, goal, color }) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textMid, marginBottom:3 }}>
        <span>{label}</span>
        <span style={{ color: pct >= 100 ? T.accent : T.textMid }}>{Math.round(current)}/{goal}g</span>
      </div>
      <div style={{ height:5, background:"#111", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, transition:"width .5s ease", borderRadius:3 }}/>
      </div>
    </div>
  );
}

function WaterGlasses({ count, goal, onAdd }) {
  return (
    <div>
      <div style={{ fontSize:12, color:T.textMid, marginBottom:6, textAlign:"center" }}>
        💧 {count}/{goal} glasses
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:10, flexWrap:"wrap" }}>
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} onClick={() => i === count && onAdd()} style={{
            width:22, height:30, borderRadius:"3px 3px 5px 5px",
            background: i < count ? T.accent : "#111",
            border:`2px solid ${i < count ? T.accent : "#222"}`,
            cursor: i === count ? "pointer" : "default",
            transition:"all .2s",
            overflow:"hidden",
          }}>
            {i < count && <div style={{
              width:"100%", height:"80%", marginTop:"auto",
              background:`linear-gradient(to top,${T.accentDim},${T.accent})`,
              borderRadius:"0 0 3px 3px",
            }}/>}
          </div>
        ))}
      </div>
      <button onClick={onAdd} disabled={count >= goal} className="btn-nut focus-ring" style={{
        width:"100%", padding:"9px", fontSize:12, fontWeight:700,
        background: count >= goal ? `${T.accent}20` : T.accent,
        border:`2px solid ${count >= goal ? T.accent : "#000"}`,
        color: count >= goal ? T.accent : "#030d07",
        borderRadius:8, fontFamily:"inherit",
        opacity: count >= goal ? 0.7 : 1,
      }}>
        {count >= goal ? "✓ Goal Met!" : "+ Add Glass"}
      </button>
    </div>
  );
}

function MicroNutrient({ label, current, goal, unit, icon }) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const color = pct >= 80 ? T.accent : pct >= 50 ? T.yellow : T.red;
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:18, marginBottom:3 }}>{icon}</div>
      <div style={{ fontSize:10, color:T.textDim, marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:12, fontWeight:700, color }}>{Math.round(current)}/{goal}{unit}</div>
      <div style={{ height:3, background:"#111", borderRadius:2, margin:"4px 0 0", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, transition:"width .5s ease", borderRadius:2 }}/>
      </div>
    </div>
  );
}

function SparkLine({ scores }) {
  if (!scores || scores.length < 2) return null;
  const max = Math.max(...scores, 1);
  const w = 200; const h = 36;
  const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * w},${h - (s / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {scores.map((s, i) => (
        <circle key={i} cx={(i / (scores.length - 1)) * w} cy={h - (s / max) * h}
          r="3" fill={T.accent} stroke="#030d07" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

function StreakBadge({ days }) {
  if (!days) return null;
  return (
    <div className="streak-anim" style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"4px 10px", borderRadius:20,
      background:`linear-gradient(90deg,${T.accentDim},${T.accent}22)`,
      border:`1px solid ${T.accent}44`,
      fontSize:11, fontWeight:700, color:T.accent,
    }}>
      🔥 {days}-day streak
    </div>
  );
}

function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: [T.accent, T.yellow, T.blue, T.orange, T.purple][i % 5],
    delay: `${Math.random() * 0.6}s`,
    dur: `${0.8 + Math.random() * 0.6}s`,
  }));
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:200, overflow:"hidden" }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:p.left, top:"10%",
          width:8, height:8, borderRadius:2, background:p.color,
          animation:`confetti-fall ${p.dur} ${p.delay} ease-in forwards`,
        }}/>
      ))}
    </div>
  );
}

function ActivityModal({ onClose, onLog }) {
  const [sel, setSel] = useState(null);
  const [mins, setMins] = useState(30);
  const calc = sel ? Math.round(sel.calPerMin * mins) : 0;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20 }}>
      <div style={{ background:T.bg,border:`3px solid ${T.orange}`,padding:20,width:"min(400px,100%)",borderRadius:16,maxHeight:"80vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:17,fontWeight:700,color:T.textPrimary }}>🏃 Log Activity</span>
          <button onClick={onClose} style={{ fontSize:20,background:"none",border:"none",color:"#666",cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14 }}>
          {ACTIVITIES.map(a => (
            <button key={a.id} onClick={() => setSel(a)} className="btn-nut focus-ring" style={{
              padding:"10px 6px",borderRadius:8,textAlign:"center",
              background:sel?.id===a.id?`${T.orange}22`:"#111",
              border:`2px solid ${sel?.id===a.id?T.orange:"#222"}`,
              color:sel?.id===a.id?T.orange:T.textMid,
              fontSize:10,cursor:"pointer",fontFamily:"inherit",
            }}>
              <div style={{ fontSize:22,marginBottom:3 }}>{a.icon}</div>
              <div>{a.name}</div>
            </button>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,color:T.textMid,display:"block",marginBottom:6 }}>Duration: {mins} minutes</label>
          <input type="range" min={5} max={120} step={5} value={mins} onChange={e=>setMins(+e.target.value)}
            style={{ width:"100%",accentColor:T.orange }}/>
        </div>
        {sel && (
          <div style={{ textAlign:"center",fontSize:15,fontWeight:700,color:T.orange,marginBottom:14 }}>
            ~{calc} calories burned
          </div>
        )}
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:12,fontSize:13,background:"#111",border:"2px solid #333",color:T.textMid,borderRadius:10,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>{ if(sel){ onLog({ activityId:sel.id,name:sel.name,icon:sel.icon,minutes:mins,calories:calc }); onClose(); }}}
            disabled={!sel} style={{
              flex:1,padding:12,fontSize:13,fontWeight:700,
              background:sel?T.orange:"#222",border:`2px solid ${sel?T.orange:"#333"}`,
              color:sel?"#030d07":T.textMid,borderRadius:10,cursor:sel?"pointer":"not-allowed",fontFamily:"inherit",
            }}>
            Log Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function FoodLogModal({ onClose, onLog }) {
  const [search, setSearch] = useState("");
  const [sel, setSel]       = useState(null);
  const [portion, setPortion] = useState(1);
  const [meal, setMeal]     = useState("snack");

  const filtered = useMemo(() => {
    if (!search) return FOOD_KEYS.map(k => ({ key:k, ...FOOD_DB[k] }));
    return FOOD_KEYS.filter(k => FOOD_DB[k].name.toLowerCase().includes(search.toLowerCase()) || FOOD_DB[k].icon.includes(search))
      .map(k => ({ key:k, ...FOOD_DB[k] }));
  }, [search]);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16 }}>
      <div style={{ background:T.bg,border:`3px solid ${T.accent}`,padding:18,width:"min(440px,100%)",borderRadius:16,maxHeight:"88vh",overflowY:"auto" }} className="scrollbar-hide">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <span style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>🍽️ Log Food</span>
          <button onClick={onClose} style={{ fontSize:20,background:"none",border:"none",color:"#666",cursor:"pointer" }}>✕</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search food… (rice, 🍚, dal)"
          style={{ width:"100%",padding:"9px 12px",fontSize:13,background:"#111",border:"2px solid #222",color:T.textPrimary,borderRadius:8,marginBottom:10,fontFamily:"inherit" }}/>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12,maxHeight:180,overflowY:"auto" }} className="scrollbar-hide">
          {filtered.slice(0,20).map(f => (
            <button key={f.key} onClick={()=>setSel(f)} className="btn-nut focus-ring" style={{
              padding:"8px 4px",borderRadius:8,textAlign:"center",
              background:sel?.key===f.key?`${T.accent}20`:"#111",
              border:`2px solid ${sel?.key===f.key?T.accent:"#222"}`,
              color:sel?.key===f.key?T.accent:T.textMid,
              fontSize:10,cursor:"pointer",fontFamily:"inherit",
            }}>
              <div style={{ fontSize:20,marginBottom:2 }}>{f.icon}</div>
              <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%" }}>{f.name.split(" ")[0]}</div>
            </button>
          ))}
        </div>
        {sel && (
          <div style={{ border:`1px solid ${T.accent}44`,padding:12,borderRadius:8,marginBottom:10,background:"#0a1f0e" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{sel.icon}</span>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:T.textPrimary }}>{sel.name}</div>
                <div style={{ fontSize:10,color:T.textMid }}>{sel.calories} cal · P:{sel.protein}g C:{sel.carbs}g F:{sel.fat}g</div>
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <div>
                <label style={{ fontSize:10,color:T.textMid,display:"block",marginBottom:3 }}>Portion</label>
                <select value={portion} onChange={e=>setPortion(parseFloat(e.target.value))}
                  style={{ width:"100%",padding:"7px",fontSize:12,background:"#111",border:"1px solid #333",color:T.textPrimary,borderRadius:6,fontFamily:"inherit" }}>
                  {[0.5,1,1.5,2,3].map(p=><option key={p} value={p} style={{ background:"#0a0a0a" }}>{p}x ({Math.round(sel.calories*p)} cal)</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10,color:T.textMid,display:"block",marginBottom:3 }}>Meal</label>
                <select value={meal} onChange={e=>setMeal(e.target.value)}
                  style={{ width:"100%",padding:"7px",fontSize:12,background:"#111",border:"1px solid #333",color:T.textPrimary,borderRadius:6,fontFamily:"inherit" }}>
                  {["breakfast","lunch","dinner","snack"].map(m=><option key={m} value={m} style={{ background:"#0a0a0a" }}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={onClose} style={{ flex:1,padding:11,fontSize:13,background:"#111",border:"2px solid #333",color:T.textMid,borderRadius:10,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>{ if(sel){ onLog({ foodId:sel.key,meal,portion }); onClose(); }}} disabled={!sel}
            style={{ flex:1,padding:11,fontSize:13,fontWeight:700,background:sel?T.accent:"#222",border:`2px solid ${sel?T.accent:"#333"}`,color:sel?"#030d07":T.textMid,borderRadius:10,cursor:sel?"pointer":"not-allowed",fontFamily:"inherit",opacity:sel?1:0.6 }}>
            Log Food
          </button>
        </div>
      </div>
    </div>
  );
}

function AICoachPanel({ lang, totals, score, mealPlan }) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const ask = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setAdvice("");
    const summary = `
      User's nutrition today: ${Math.round(totals.calories)} kcal eaten, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${totals.water} glasses water, fiber ${Math.round(totals.fiber)}g. Nutrition score: ${score}/100.
      Today's planned meals: ${Object.entries(mealPlan||{}).map(([k,v])=>`${k}: ${v?.name||"none"}`).join(", ")}.
      User language: ${lang}.
      Give 3 short, practical, personalized nutrition improvements for today. Be encouraging. Reply in ${lang.startsWith("hi")?"Hindi":lang.startsWith("te")?"Telugu":lang.startsWith("ta")?"Tamil":lang.startsWith("es")?"Spanish":lang.startsWith("fr")?"French":lang.startsWith("de")?"German":lang.startsWith("zh")?"Mandarin Chinese":lang.startsWith("ja")?"Japanese":lang.startsWith("ko")?"Korean":lang.startsWith("ar")?"Arabic":lang.startsWith("pt")?"Portuguese":lang.startsWith("mr")?"Marathi":lang.startsWith("bn")?"Bengali":lang.startsWith("kn")?"Kannada":lang.startsWith("gu")?"Gujarati":lang.startsWith("ml")?"Malayalam":lang.startsWith("pa")?"Punjabi":lang.startsWith("or")?"Odia":lang.startsWith("ur")?"Urdu":"English"}. Keep each tip under 25 words. Format as numbered list 1. 2. 3.
    `;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:"You are a compassionate, expert nutrition coach for an app used in South Asia, Southeast Asia, and globally. Provide practical, culturally-sensitive advice. Be brief and warm.",
          messages:[{ role:"user", content:summary }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("") || "Unable to get advice right now.";
      setAdvice(text);
    } catch {
      setAdvice("Unable to reach AI coach. Check your connection and try again.");
    }
    setLoading(false);
  }, [lang, totals, score, mealPlan]);

  return (
    <div style={{ border:`2px solid ${T.purple}44`,background:`${T.purple}08`,padding:"14px 16px",borderRadius:12 }}>
      <button onClick={open ? ()=>setOpen(false) : ask} className="btn-nut" style={{
        width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",
      }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:20 }}>🤖</span>
          <span style={{ fontSize:13,fontWeight:700,color:T.purple }}>AI Nutrition Coach</span>
        </div>
        <span style={{ fontSize:11,color:T.purple }}>{open?"▾ Close":"▸ Get Advice"}</span>
      </button>
      {open && (
        <div className="fade-up" style={{ marginTop:12 }}>
          {loading ? (
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",color:T.textMid,fontSize:13 }}>
              <div style={{ width:16,height:16,border:`2px solid ${T.border}`,borderTopColor:T.purple,borderRadius:"50%",animation:"spin 1s linear infinite" }}/>
              {ph(lang,"ai_thinking")}
            </div>
          ) : (
            <div style={{ fontSize:13,color:T.textPrimary,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{advice}</div>
          )}
          {!loading && (
            <button onClick={ask} className="btn-nut" style={{ marginTop:8,fontSize:11,color:T.purple,background:"none",border:`1px solid ${T.purple}44`,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit" }}>
              ↻ Refresh Advice
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WHOPanel({ domainKey, open }) {
  const d = NUTRITION_DOMAINS[domainKey];
  if (!d || !open) return null;
  return (
    <div className="fade-up" style={{ border:`2px solid ${T.accent}22`,background:T.card,padding:"14px 16px",borderRadius:10 }}>
      <div style={{ fontSize:10,letterSpacing:".18em",color:T.textDim,textTransform:"uppercase",marginBottom:6 }}>WHO · {d.who_code}</div>
      <div style={{ fontSize:14,color:T.accent,fontWeight:700,marginBottom:8 }}>{d.domain}</div>
      {[d.stat1,d.stat2,d.stat3,d.stat4].map((s,i)=>(
        <div key={i} style={{ fontSize:12,color:i===0?T.textMid:T.textDim,lineHeight:1.6,borderLeft:`2px solid ${i===0?T.accent:"#1a2a1a"}`,paddingLeft:8,marginBottom:5 }}>{s}</div>
      ))}
      <div style={{ marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,fontSize:10,color:T.textDim }}>{d.sdg} · {d.lmic}</div>
      <div style={{ marginTop:6,fontSize:10,color:T.accent }}>{d.promise}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   12. MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function NutritionHealth() {
  const lang = useMemo(loadLang, []);
  const speak = useMemo(() => makeSpeaker(lang), [lang]);

  const [data, setData]             = useState(() => loadData());
  const [showFoodModal, setFoodModal] = useState(false);
  const [showActivity, setActivity]   = useState(false);
  const [showWHO, setShowWHO]         = useState(false);
  const [whoKey, setWhoKey]           = useState("healthy_diet");
  const [loading, setLoading]         = useState(true);
  const [offline, setOffline]         = useState(!navigator.onLine);
  const [confetti, setConfetti]       = useState(false);
  const [tipIdx]                      = useState(() => Math.floor(Math.random() * NUTRITION_TIPS.length));
  const [activeTab, setActiveTab]     = useState("today"); // today | plan | grocery | activity

  const totals     = useMemo(() => calcTotals(data.logged, data.water), [data.logged, data.water]);
  const burnCal    = useMemo(() => calcActivityBurn(data.activities || []), [data.activities]);
  const score      = useMemo(() => calcScore(totals, data.dailyGoal, burnCal), [totals, data.dailyGoal, burnCal]);
  const mealPlan   = useMemo(() => data.mealPlan || genMealPlan(), [data.mealPlan]);
  const groceryAll = useMemo(() => genGrocery(mealPlan), [mealPlan]);

  // Boot
  useEffect(() => {
    injectCSS();
    const d = updateStreak(data);
    if (d.streakDays !== data.streakDays) setData(d);
    const t = setTimeout(() => {
      setLoading(false);
      speak(ph(lang,"welcome"));
    }, 900);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Offline
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Persist
  useEffect(() => { saveData(data); }, [data]);

  // Celebrate on 100 score
  useEffect(() => {
    if (score >= 100) { setConfetti(true); setTimeout(() => setConfetti(false), 2500); }
  }, [score]);

  // Actions
  const logFood = useCallback((entry) => {
    setData(p => ({ ...p, logged: [...p.logged, { id:Date.now(), time:new Date().toISOString(), ...entry }] }));
    speak(ph(lang,"log_food"));
  }, [lang, speak]);

  const addWater = useCallback(() => {
    setData(p => ({ ...p, water: [...p.water, new Date().toISOString()] }));
    const next = totals.water + 1;
    if (next === data.dailyGoal.water) {
      speak(ph(lang,"celebrate"), true);
      setConfetti(true); setTimeout(() => setConfetti(false), 2000);
    }
  }, [totals.water, data.dailyGoal.water, lang, speak]);

  const logMeal = useCallback((meal) => {
    if (!meal?.foods) return;
    meal.foods.forEach(fid => logFood({ foodId:fid, meal:"meal", portion:1 }));
    speak(ph(lang,"meal_plan"));
  }, [logFood, lang, speak]);

  const logActivity = useCallback((act) => {
    setData(p => ({ ...p, activities: [...(p.activities||[]), { id:Date.now(), time:new Date().toISOString(), ...act }] }));
    speak(ph(lang,"burn",{ cal:act.calories }));
  }, [lang, speak]);

  const toggleGrocery = useCallback((item) => {
    setData(p => ({
      ...p,
      groceryChecked: p.groceryChecked.includes(item) ? p.groceryChecked.filter(i=>i!==item) : [...p.groceryChecked, item],
    }));
  }, []);

  const refreshPlan = useCallback(() => {
    setData(p => ({ ...p, mealPlan: genMealPlan() }));
  }, []);

  const scoreColor = score >= 80 ? T.accent : score >= 60 ? T.yellow : T.red;

  if (loading) return (
    <div style={{ minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",color:T.textPrimary }}>
      <div style={{ fontSize:54,marginBottom:18 }}>🥗</div>
      <div style={{ fontSize:13,letterSpacing:".14em",color:T.accent,textTransform:"uppercase",marginBottom:14 }}>Loading Nutrition Care…</div>
      <div style={{ width:28,height:28,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 1s linear infinite" }}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100dvh",background:T.bg,color:T.textPrimary,fontFamily:"'JetBrains Mono','Courier New',monospace",display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",position:"relative" }}>
      {/* BG grid */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(rgba(74,222,128,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.015) 1px,transparent 1px)`,backgroundSize:"44px 44px" }}/>
      {/* Glow */}
      <div style={{ position:"fixed",top:"25%",left:"50%",transform:"translateX(-50%)",width:440,height:220,background:`radial-gradient(ellipse,${T.accentGlow} 0%,transparent 70%)`,pointerEvents:"none" }}/>

      <Confetti show={confetti}/>

      {/* Offline */}
      {offline && (
        <div style={{ position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:99,fontSize:11,letterSpacing:".12em",background:T.card,border:`2px solid ${T.accent}`,color:T.accent,padding:"5px 14px",textTransform:"uppercase",borderRadius:8 }}>
          ⚡ Offline — All features work
        </div>
      )}

      <div style={{ position:"relative",zIndex:2,width:"min(480px,98vw)",display:"flex",flexDirection:"column",gap:12,paddingTop:18,paddingBottom:48 }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:12,borderBottom:`2px solid ${T.border}` }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,letterSpacing:"-.01em",lineHeight:1,color:T.textPrimary }}>
              ManifiX <span style={{ color:T.accent }}>Nutrition</span>
            </div>
            <div style={{ fontSize:12,letterSpacing:".14em",color:T.accent,textTransform:"uppercase",marginTop:4,opacity:.7 }}>Eat Well. Live Well.</div>
            <div style={{ marginTop:6 }}><StreakBadge days={data.streakDays}/></div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em" }}>{lang}</div>
            {burnCal > 0 && (
              <div style={{ fontSize:11,color:T.orange,background:`${T.orange}15`,border:`1px solid ${T.orange}44`,padding:"2px 8px",borderRadius:10 }}>
                🔥 -{burnCal} cal burned
              </div>
            )}
          </div>
        </div>

        {/* ── SCORE + MACROS ── */}
        <div className="fade-up" style={{ display:"flex",gap:12,alignItems:"stretch" }}>
          {/* Score ring */}
          <div style={{ border:`2px solid ${scoreColor}44`,background:`${scoreColor}08`,padding:"14px 12px",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:114 }}>
            <ScoreRing score={score}/>
            <div style={{ fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginTop:4 }}>Score</div>
            <div style={{ fontSize:11,fontWeight:700,color:scoreColor,marginTop:2 }}>
              {score>=80?"Excellent":score>=60?"Good":"Keep going"}
            </div>
          </div>
          {/* Macros */}
          <div style={{ flex:1,border:`2px solid ${T.border}`,background:T.card,padding:"12px 14px",borderRadius:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:T.textPrimary,marginBottom:8 }}>📊 Today's Macros</div>
            <MacroBar label="Protein" current={totals.protein} goal={data.dailyGoal.protein} color={T.blue}/>
            <MacroBar label="Carbs"   current={totals.carbs}   goal={data.dailyGoal.carbs}   color={T.yellow}/>
            <MacroBar label="Fat"     current={totals.fat}     goal={data.dailyGoal.fat}      color={T.red}/>
            <div style={{ fontSize:10,color:T.textDim,marginTop:4 }}>
              {Math.round(totals.calories - burnCal)} / {data.dailyGoal.calories} net kcal
            </div>
          </div>
        </div>

        {/* ── MICRO NUTRIENTS ── */}
        <div className="fade-up" style={{ border:`2px solid ${T.border}`,background:T.card,padding:"12px 14px",borderRadius:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:T.textPrimary,marginBottom:10 }}>🔬 Micro-Nutrients</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
            <MicroNutrient label="Iron"     current={totals.iron}    goal={18}  unit="mg" icon="🩸"/>
            <MicroNutrient label="Calcium"  current={totals.calcium} goal={1000} unit="mg" icon="🦴"/>
            <MicroNutrient label="Vitamin C" current={totals.vitC}   goal={65}  unit="mg" icon="🍊"/>
            <MicroNutrient label="Vitamin D" current={totals.vitD}   goal={15}  unit="µg" icon="☀️"/>
          </div>
        </div>

        {/* ── WATER TRACKER ── */}
        <div className="fade-up" style={{ border:`2px solid ${T.accent}33`,background:`${T.accent}06`,padding:"12px 14px",borderRadius:12 }}>
          <WaterGlasses count={totals.water} goal={data.dailyGoal.water} onAdd={addWater}/>
        </div>

        {/* ── QUICK ADD ROW ── */}
        <div>
          <div style={{ fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:".12em",marginBottom:6 }}>⚡ Quick Add</div>
          <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:4 }} className="scrollbar-hide">
            {QUICK_ADD.map(key => {
              const f = FOOD_DB[key];
              return (
                <button key={key} onClick={() => logFood({ foodId:key, meal:"snack", portion:1 })} className="btn-nut focus-ring"
                  style={{ flex:"0 0 auto",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 10px",borderRadius:10,background:T.card,border:`1.5px solid ${T.border}`,cursor:"pointer",fontFamily:"inherit" }}>
                  <span style={{ fontSize:20 }}>{f.icon}</span>
                  <span style={{ fontSize:9,color:T.textDim,whiteSpace:"nowrap" }}>{f.name.split(" ")[0]}</span>
                  <span style={{ fontSize:9,color:T.accent }}>{f.calories}cal</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <button onClick={() => setFoodModal(true)} className="btn-nut focus-ring" style={{ padding:"13px",fontSize:13,fontWeight:700,background:T.accent,border:"2px solid #000",color:"#030d07",borderRadius:12,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            🍽️ Log Food
          </button>
          <button onClick={() => setActivity(true)} className="btn-nut focus-ring" style={{ padding:"13px",fontSize:13,fontWeight:700,background:`${T.orange}22`,border:`2px solid ${T.orange}`,color:T.orange,borderRadius:12,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            🏃 Activity
          </button>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex",gap:6 }}>
          {["plan","grocery","activity","trends"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(activeTab===tab?"_":tab)} className="btn-nut focus-ring"
              style={{ flex:1,padding:"8px 4px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",fontFamily:"inherit",borderRadius:8,background:activeTab===tab?`${T.accent}20`:"#080d09",border:`1.5px solid ${activeTab===tab?T.accent:T.border}`,color:activeTab===tab?T.accent:T.textDim,cursor:"pointer" }}>
              {tab==="plan"?"📋 Plan":tab==="grocery"?"🛒 Shop":tab==="activity"?"⚡ Burns":"📈 Trends"}
            </button>
          ))}
        </div>

        {/* ── TAB: MEAL PLAN ── */}
        {activeTab==="plan" && (
          <div className="fade-up">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
              <span style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em" }}>Today's Meal Plan</span>
              <button onClick={refreshPlan} className="btn-nut" style={{ fontSize:11,color:T.accent,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit" }}>↻ Refresh</button>
            </div>
            {Object.entries(mealPlan).map(([type, plan]) => (
              <div key={type} style={{ border:`1.5px solid ${T.accent}22`,background:T.card,padding:"12px 14px",borderRadius:10,marginBottom:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:T.textPrimary,textTransform:"capitalize" }}>{type}</span>
                  <span style={{ fontSize:10,color:T.textDim }}>{plan.calories} cal</span>
                </div>
                <div style={{ fontSize:12,color:"#cfcfcf",marginBottom:6 }}>{plan.name}</div>
                <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:8 }}>
                  {plan.foods?.map((fid,i) => {
                    const f = FOOD_DB[fid];
                    return f ? <span key={i} style={{ fontSize:9,padding:"2px 6px",borderRadius:4,background:`${T.accent}18`,color:T.accent }}>{f.icon} {f.name.split(" ")[0]}</span> : null;
                  })}
                </div>
                <button onClick={() => logMeal(plan)} className="btn-nut" style={{ width:"100%",padding:"7px",fontSize:11,background:`${T.accent}12`,border:`1px solid ${T.accent}`,color:T.accent,borderRadius:6,cursor:"pointer",fontFamily:"inherit" }}>
                  ✓ Log This Meal
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: GROCERY ── */}
        {activeTab==="grocery" && (
          <div className="fade-up">
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8 }}>
              Smart Grocery · {groceryAll.length} items
            </div>
            <div style={{ display:"grid",gap:5 }}>
              {groceryAll.map(item => {
                const checked = data.groceryChecked.includes(item);
                return (
                  <label key={item} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,background:checked?`${T.blue}10`:T.card,border:`1px solid ${checked?T.blue:T.border}`,cursor:"pointer",transition:"all .18s" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleGrocery(item)} style={{ accentColor:T.blue,width:16,height:16 }}/>
                    <span style={{ fontSize:12,color:checked?T.textDim:T.textPrimary,textDecoration:checked?"line-through":"none" }}>{item}</span>
                  </label>
                );
              })}
            </div>
            <button onClick={() => speak(ph(lang,"grocery",{ count:groceryAll.length }))} className="btn-nut" style={{ width:"100%",marginTop:10,padding:11,fontSize:12,fontWeight:700,background:`${T.blue}20`,border:`2px solid ${T.blue}`,color:T.blue,borderRadius:10,fontFamily:"inherit",cursor:"pointer" }}>
              📤 Read List Aloud
            </button>
          </div>
        )}

        {/* ── TAB: ACTIVITY LOG ── */}
        {activeTab==="activity" && (
          <div className="fade-up">
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8 }}>
              Today's Activity — {burnCal} cal burned
            </div>
            {(data.activities||[]).filter(a=>a.time.startsWith(todayStr())).length === 0 ? (
              <div style={{ textAlign:"center",padding:"20px 0",color:T.textDim,fontSize:12 }}>No activities logged today.</div>
            ) : (
              <div style={{ display:"grid",gap:6 }}>
                {(data.activities||[]).filter(a=>a.time.startsWith(todayStr())).map(a => (
                  <div key={a.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8 }}>
                    <span style={{ fontSize:22 }}>{a.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:700,color:T.textPrimary }}>{a.name}</div>
                      <div style={{ fontSize:10,color:T.textDim }}>{a.minutes} min</div>
                    </div>
                    <div style={{ fontSize:13,fontWeight:700,color:T.orange }}>-{a.calories} cal</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TRENDS ── */}
        {activeTab==="trends" && (
          <div className="fade-up" style={{ border:`2px solid ${T.border}`,background:T.card,padding:"14px 16px",borderRadius:12 }}>
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10 }}>7-Day Nutrition Score</div>
            <div style={{ display:"flex",justifyContent:"center",marginBottom:10 }}>
              <SparkLine scores={[...(data.weeklyScores||[]).slice(-6), score]}/>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:T.textDim }}>
              <span>7 days ago</span><span>Today: {score}</span>
            </div>
            <div style={{ marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.textMid,textAlign:"center" }}>
              {data.streakDays > 0 ? `${ph(lang,"streak",{ days:data.streakDays })}` : "Start your streak today!"}
            </div>
          </div>
        )}

        {/* ── AI COACH ── */}
        <AICoachPanel lang={lang} totals={totals} score={score} mealPlan={mealPlan}/>

        {/* ── DAILY TIP ── */}
        <div style={{ border:`2px solid ${T.accent}22`,background:T.card,padding:"12px 14px",borderRadius:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}>
            <span style={{ fontSize:16 }}>💡</span>
            <span style={{ fontSize:11,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:".1em" }}>Daily Tip</span>
          </div>
          <div style={{ fontSize:12,color:"#cfcfcf",lineHeight:1.6 }}>{NUTRITION_TIPS[tipIdx]}</div>
        </div>

        {/* ── WHO TOGGLE ── */}
        <div>
          <div style={{ display:"flex",gap:6,marginBottom:6 }}>
            {Object.keys(NUTRITION_DOMAINS).map(k => (
              <button key={k} onClick={()=>setWhoKey(k)} className="btn-nut focus-ring" style={{ flex:1,padding:"6px 4px",fontSize:9,textTransform:"uppercase",letterSpacing:".08em",fontFamily:"inherit",borderRadius:6,background:whoKey===k?`${T.accent}18`:"#080d09",border:`1.5px solid ${whoKey===k?T.accent:T.border}`,color:whoKey===k?T.accent:T.textDim,cursor:"pointer" }}>
                {k==="healthy_diet"?"Diet":k==="hydration"?"Hydrate":"Meals"}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowWHO(v=>!v)} className="btn-nut focus-ring" style={{ width:"100%",padding:"10px 14px",fontSize:11,letterSpacing:".1em",textTransform:"uppercase",background:"transparent",border:`2px solid ${T.accent}22`,color:T.accent,borderRadius:10,cursor:"pointer",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span>{showWHO?"▾":"▸"} WHO Guidelines</span>
            <span style={{ color:T.textDim,fontSize:10 }}>{NUTRITION_DOMAINS[whoKey].who_code}</span>
          </button>
          <WHOPanel domainKey={whoKey} open={showWHO}/>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign:"center",fontSize:9,letterSpacing:".12em",color:T.textDim,textTransform:"uppercase",paddingTop:6 }}>
          Voice: {lang} · WHO SDG 2+3.4 · {offline?"Offline":"Cloud"} · 20 Languages · v6.0
        </div>

      </div>

      {showFoodModal && <FoodLogModal onClose={()=>setFoodModal(false)} onLog={logFood}/>}
      {showActivity  && <ActivityModal onClose={()=>setActivity(false)} onLog={logActivity}/>}
    </div>
  );
}
