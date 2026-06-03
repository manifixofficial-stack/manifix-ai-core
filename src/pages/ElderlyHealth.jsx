import { useEffect, useRef, useState, useCallback, useMemo } from "react";

const T = {
  accent:"#FCD34D", accentDim:"#92400E", accentGlow:"rgba(252,211,77,0.14)",
  bg:"#0c0802", card:"#130f04", cardBright:"#1c1608",
  border:"#2a1f08", borderBright:"#3d2e0e",
  red:"#ef4444", green:"#22c55e", blue:"#38bdf8",
  purple:"#a78bfa", orange:"#fb923c", pink:"#f472b6",
  teal:"#2dd4bf", indigo:"#6366f1", cyan:"#22d3ee",
  textPrimary:"#fef3c7", textMid:"#a08050", textDim:"#4a3820",
  voiceRate:0.75, voicePitch:0.95, touchTarget:58, fontSize:16,
};

const LANG_MAP={
  "en-IN":"en-IN","hi-IN":"hi-IN","te-IN":"te-IN","ta-IN":"ta-IN",
  "mr-IN":"mr-IN","bn-IN":"bn-IN","kn-IN":"kn-IN","gu-IN":"gu-IN",
  "ml-IN":"ml-IN","pa-IN":"pa-IN","or-IN":"or-IN","ur-IN":"ur-IN",
  "es-ES":"es-ES","ar-SA":"ar-SA","fr-FR":"fr-FR","pt-BR":"pt-BR",
  "de-DE":"de-DE","ja-JP":"ja-JP","ko-KR":"ko-KR","zh-CN":"zh-CN",
  "en":"en-IN","hi":"hi-IN","te":"te-IN","ta":"ta-IN","mr":"mr-IN",
  "bn":"bn-IN","kn":"kn-IN","gu":"gu-IN","ml":"ml-IN","pa":"pa-IN",
  "or":"or-IN","ur":"ur-IN","es":"es-ES","ar":"ar-SA","fr":"fr-FR",
  "pt":"pt-BR","de":"de-DE","ja":"ja-JP","ko":"ko-KR","zh":"zh-CN",
};

const PHRASES={
  "en-IN":{
    welcome:"Hello! I am here to help you stay healthy and safe today.",
    med_remind:"Time for your medicine. Please take it now.",
    med_done:"Wonderful! Medicine taken. You are doing great.",
    vitals_log:"Health numbers saved. You are taking good care of yourself.",
    fall_tip:"Remember: stand up slowly. Hold onto something stable first.",
    emergency:"Calling for help now. Please stay calm and stay where you are.",
    mood_prompt:"How are you feeling right now?",
    med_streak:"Amazing! {days} days medicine streak!",
    sleep_done:"Sleep logged. Rest is vital for your health.",
    readiness_good:"Excellent readiness today! You are well recovered.",
    readiness_low:"Take it easy today. Your body needs more rest.",
    telehealth_booked:"Appointment booked. Your doctor will see you soon.",
    hrv_good:"Your heart rate variability looks healthy today.",
    activity_goal:"Great job meeting your activity goal today!",
  },
  "hi-IN":{
    welcome:"नमस्ते! मैं आज आपको स्वस्थ और सुरक्षित रखने के लिए यहाँ हूँ।",
    med_remind:"दवा लेने का समय हो गया है। कृपया अभी लें।",
    med_done:"बहुत अच्छे! दवा ले ली।",
    vitals_log:"स्वास्थ्य संख्याएं सहेज ली गईं।",
    fall_tip:"याद रखें: धीरे-धीरे खड़े हों।",
    emergency:"अभी मदद के लिए कॉल हो रही है। शांत रहें।",
    mood_prompt:"आप अभी कैसा महसूस कर रहे हैं?",
    med_streak:"अद्भुत! {days} दिनों से लगातार दवा!",
    sleep_done:"नींद दर्ज की गई।",
    readiness_good:"आज उत्कृष्ट तैयारी!",
    readiness_low:"आज आराम करें।",
    telehealth_booked:"अपॉइंटमेंट बुक हो गई।",
    hrv_good:"आपकी हृदय गति परिवर्तनशीलता आज स्वस्थ दिखती है।",
    activity_goal:"आज आपने गतिविधि लक्ष्य पूरा किया!",
  },
  "te-IN":{
    welcome:"నమస్కారం! నేను ఈరోజు మీరు ఆరోగ్యంగా ఉండటానికి ఇక్కడ ఉన్నాను.",
    med_remind:"మందు తీసుకునే సమయం అయింది.",
    med_done:"అద్భుతం! మందు తీసుకున్నారు.",
    vitals_log:"ఆరోగ్య సంఖ్యలు సేవ్ చేయబడ్డాయి.",
    fall_tip:"నెమ్మదిగా లేవండి.",
    emergency:"ఇప్పుడు సహాయం కోసం కాల్ చేస్తున్నారు.",
    mood_prompt:"మీరు ఇప్పుడు ఎలా అనుభవిస్తున్నారు?",
    med_streak:"{days} రోజులు వరుసగా మందు!",
    sleep_done:"నిద్ర నమోదు చేయబడింది.",
    readiness_good:"ఈరోజు అద్భుతమైన సన్నద్ధత!",
    readiness_low:"ఈరోజు విశ్రాంతి తీసుకోండి.",
    telehealth_booked:"అపాయింట్‌మెంట్ బుక్ అయింది.",
    hrv_good:"మీ హృదయ స్పందన వ్యత్యాసం ఆరోగ్యంగా ఉంది.",
    activity_goal:"ఈరోజు కార్యాచరణ లక్ష్యం చేరుకున్నారు!",
  },
  "ta-IN":{
    welcome:"வணக்கம்! இன்று நீங்கள் ஆரோக்கியமாக இருக்க நான் இங்கே இருக்கிறேன்.",
    med_remind:"மருந்து எடுக்கும் நேரம் வந்தது.",
    med_done:"அருமை! மருந்து எடுத்தாயிற்று.",
    vitals_log:"உடல்நல எண்கள் சேமிக்கப்பட்டன.",
    fall_tip:"மெதுவாக எழுந்திருங்கள்.",
    emergency:"இப்போது உதவிக்கு அழைக்கிறோம்.",
    mood_prompt:"நீங்கள் இப்போது எப்படி உணர்கிறீர்கள்?",
    med_streak:"{days} நாட்கள் தொடர்ந்து மருந்து!",
    sleep_done:"தூக்கம் பதிவு செய்யப்பட்டது.",
    readiness_good:"இன்று சிறந்த தயார்நிலை!",
    readiness_low:"இன்று ஓய்வெடுங்கள்.",
    telehealth_booked:"சந்திப்பு பதிவு செய்யப்பட்டது.",
    hrv_good:"உங்கள் இதய துடிப்பு மாறுபாடு இன்று ஆரோக்கியமாக உள்ளது.",
    activity_goal:"இன்று உடல் செயல்பாட்டு இலக்கை அடைந்தீர்கள்!",
  },
  "es-ES":{
    welcome:"¡Hola! Estoy aquí para ayudarte a mantenerte sano hoy.",
    med_remind:"Hora de tu medicina. Por favor, tómala ahora.",
    med_done:"¡Maravilloso! Medicina tomada.",
    vitals_log:"Datos de salud guardados.",
    fall_tip:"Recuerda: levántate despacio.",
    emergency:"Llamando por ayuda ahora. Quédate tranquilo.",
    mood_prompt:"¿Cómo te sientes ahora mismo?",
    med_streak:"¡{days} días seguidos de medicina!",
    sleep_done:"Sueño registrado.",
    readiness_good:"¡Excelente disposición hoy!",
    readiness_low:"Descansa hoy.",
    telehealth_booked:"Cita reservada.",
    hrv_good:"Tu variabilidad de frecuencia cardíaca hoy parece saludable.",
    activity_goal:"¡Buen trabajo cumpliendo tu objetivo de actividad!",
  },
  "fr-FR":{
    welcome:"Bonjour ! Je suis là pour vous aider à rester en bonne santé aujourd'hui.",
    med_remind:"C'est l'heure de votre médicament.",
    med_done:"Merveilleux ! Médicament pris.",
    vitals_log:"Données de santé enregistrées.",
    fall_tip:"Levez-vous lentement.",
    emergency:"Appel d'urgence en cours.",
    mood_prompt:"Comment vous sentez-vous en ce moment ?",
    med_streak:"{days} jours de médicaments consécutifs !",
    sleep_done:"Sommeil enregistré.",
    readiness_good:"Excellente forme aujourd'hui !",
    readiness_low:"Reposez-vous aujourd'hui.",
    telehealth_booked:"Rendez-vous réservé.",
    hrv_good:"Votre variabilité de fréquence cardiaque semble saine.",
    activity_goal:"Excellent travail pour atteindre votre objectif d'activité !",
  },
  "de-DE":{
    welcome:"Hallo! Ich bin heute hier, um Ihnen zu helfen, gesund zu bleiben.",
    med_remind:"Zeit für Ihre Medikamente.",
    med_done:"Wunderbar! Medikament genommen.",
    vitals_log:"Gesundheitsdaten gespeichert.",
    fall_tip:"Stehen Sie langsam auf.",
    emergency:"Hilferuf wird jetzt abgesetzt.",
    mood_prompt:"Wie fühlen Sie sich gerade?",
    med_streak:"{days} Tage Medikamenten-Streak!",
    sleep_done:"Schlaf protokolliert.",
    readiness_good:"Hervorragende Bereitschaft heute!",
    readiness_low:"Ruhen Sie sich heute aus.",
    telehealth_booked:"Termin gebucht.",
    hrv_good:"Ihre Herzratenvariabilität sieht heute gesund aus.",
    activity_goal:"Gut gemacht, Ihr Aktivitätsziel erreicht!",
  },
  "zh-CN":{
    welcome:"您好！我在这里帮助您今天保持健康和安全。",
    med_remind:"该服药了。请现在服用。",
    med_done:"太好了！已服药。",
    vitals_log:"健康数据已保存。",
    fall_tip:"慢慢站起来。",
    emergency:"正在呼叫救援。请保持冷静。",
    mood_prompt:"您现在感觉怎么样？",
    med_streak:"已连续{days}天服药！",
    sleep_done:"睡眠已记录。",
    readiness_good:"今天准备状态极佳！",
    readiness_low:"今天请休息。",
    telehealth_booked:"预约已成功。",
    hrv_good:"您今天的心率变异性看起来很健康。",
    activity_goal:"今天完成了活动目标！",
  },
  "ja-JP":{
    welcome:"こんにちは！今日、お元気でいられるようお手伝いします。",
    med_remind:"お薬の時間です。今すぐ飲んでください。",
    med_done:"素晴らしい！お薬を飲みました。",
    vitals_log:"健康データが保存されました。",
    fall_tip:"ゆっくり立ち上がってください。",
    emergency:"今すぐ助けを呼んでいます。",
    mood_prompt:"今どんな気分ですか？",
    med_streak:"{days}日連続でお薬を飲んでいます！",
    sleep_done:"睡眠が記録されました。",
    readiness_good:"今日のレディネスは優秀です！",
    readiness_low:"今日は休んでください。",
    telehealth_booked:"予約が完了しました。",
    hrv_good:"今日の心拍数変動は健康的です。",
    activity_goal:"今日の活動目標を達成しました！",
  },
  "ko-KR":{
    welcome:"안녕하세요! 오늘 건강하게 지내실 수 있도록 도와드릴게요.",
    med_remind:"약 드실 시간입니다.",
    med_done:"훌륭합니다! 약을 드셨습니다.",
    vitals_log:"건강 수치가 저장되었습니다.",
    fall_tip:"천천히 일어나세요.",
    emergency:"지금 도움을 요청하고 있습니다.",
    mood_prompt:"지금 어떤 기분이신가요?",
    med_streak:"{days}일 연속으로 약을 드셨습니다!",
    sleep_done:"수면이 기록되었습니다.",
    readiness_good:"오늘 준비 상태가 훌륭합니다!",
    readiness_low:"오늘은 쉬세요.",
    telehealth_booked:"예약이 완료되었습니다.",
    hrv_good:"오늘 심박 변이도가 건강합니다.",
    activity_goal:"오늘 활동 목표를 달성했습니다!",
  },
  "ar-SA":{
    welcome:"مرحباً! أنا هنا لمساعدتك على البقاء بصحة جيدة اليوم.",
    med_remind:"حان وقت تناول دوائك.",
    med_done:"رائع! تم تناول الدواء.",
    vitals_log:"تم حفظ بيانات الصحة.",
    fall_tip:"انهض ببطء.",
    emergency:"نتصل طلباً للمساعدة الآن.",
    mood_prompt:"كيف تشعر الآن؟",
    med_streak:"{days} أيام متتالية من الدواء!",
    sleep_done:"تم تسجيل النوم.",
    readiness_good:"استعداد ممتاز اليوم!",
    readiness_low:"استرح اليوم.",
    telehealth_booked:"تم حجز الموعد.",
    hrv_good:"تقلب معدل ضربات قلبك يبدو صحياً اليوم.",
    activity_goal:"عمل رائع في تحقيق هدف النشاط اليوم!",
  },
  "pt-BR":{
    welcome:"Olá! Estou aqui para ajudá-lo a se manter saudável hoje.",
    med_remind:"Hora do seu remédio.",
    med_done:"Maravilhoso! Remédio tomado.",
    vitals_log:"Dados de saúde salvos.",
    fall_tip:"Levante-se devagar.",
    emergency:"Ligando por ajuda agora.",
    mood_prompt:"Como você está se sentindo agora?",
    med_streak:"{days} dias seguidos de remédio!",
    sleep_done:"Sono registrado.",
    readiness_good:"Excelente prontidão hoje!",
    readiness_low:"Descanse hoje.",
    telehealth_booked:"Consulta reservada.",
    hrv_good:"Sua variabilidade de frequência cardíaca parece saudável hoje.",
    activity_goal:"Ótimo trabalho atingindo sua meta de atividade!",
  },
  "mr-IN":{
    welcome:"नमस्कार! आज तुम्हाला निरोगी ठेवण्यासाठी मी इथे आहे.",
    med_remind:"औषध घेण्याची वेळ झाली.",
    med_done:"अप्रतिम! औषध घेतले.",
    vitals_log:"आरोग्य आकडे सेव्ह केले.",
    fall_tip:"हळूहळू उठा.",
    emergency:"मदतीसाठी कॉल होत आहे.",
    mood_prompt:"तुम्हाला आत्ता कसे वाटत आहे?",
    med_streak:"{days} दिवसांपासून औषध!",
    sleep_done:"झोप नोंदवली.",
    readiness_good:"आज उत्कृष्ट तयारी!",
    readiness_low:"आज विश्रांती घ्या.",
    telehealth_booked:"अपॉइंटमेंट बुक झाली.",
    hrv_good:"तुमची हृदय गती परिवर्तनशीलता आज चांगली दिसते.",
    activity_goal:"आज क्रियाकलाप ध्येय पूर्ण केले!",
  },
  "bn-IN":{
    welcome:"নমস্কার! আজ আপনাকে সুস্থ রাখতে আমি এখানে আছি।",
    med_remind:"ওষুধ খাওয়ার সময় হয়েছে।",
    med_done:"অসাধারণ! ওষুধ খেয়েছেন।",
    vitals_log:"স্বাস্থ্য সংখ্যাগুলো সেভ হয়েছে।",
    fall_tip:"ধীরে ধীরে উঠুন।",
    emergency:"সাহায্যের জন্য ফোন করা হচ্ছে।",
    mood_prompt:"আপনি এখন কেমন অনুভব করছেন?",
    med_streak:"{days} দিন ধরে ওষুধ!",
    sleep_done:"ঘুম রেকর্ড করা হয়েছে।",
    readiness_good:"আজ চমৎকার প্রস্তুতি!",
    readiness_low:"আজ বিশ্রাম নিন।",
    telehealth_booked:"অ্যাপয়েন্টমেন্ট বুক হয়েছে।",
    hrv_good:"আপনার হার্ট রেট পরিবর্তনশীলতা আজ স্বাস্থ্যকর।",
    activity_goal:"আজ কার্যকলাপ লক্ষ্য অর্জন করেছেন!",
  },
  "kn-IN":{
    welcome:"ನಮಸ್ಕಾರ! ಇಂದು ನಿಮ್ಮನ್ನು ಆರೋಗ್ಯವಾಗಿ ಇರಿಸಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.",
    med_remind:"ಮದ್ದು ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ.",
    med_done:"ಅದ್ಭುತ! ಮದ್ದು ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ.",
    vitals_log:"ಆರೋಗ್ಯ ಸಂಖ್ಯೆಗಳು ಉಳಿಸಲಾಗಿದೆ.",
    fall_tip:"ನಿಧಾನವಾಗಿ ಎದ್ದೇಳಿ.",
    emergency:"ಈಗ ಸಹಾಯಕ್ಕಾಗಿ ಕರೆ ಮಾಡಲಾಗುತ್ತಿದೆ.",
    mood_prompt:"ನೀವು ಈಗ ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?",
    med_streak:"{days} ದಿನಗಳ ಮದ್ದು ಸ್ಟ್ರೀಕ್!",
    sleep_done:"ನಿದ್ದೆ ದಾಖಲಿಸಲಾಗಿದೆ.",
    readiness_good:"ಇಂದು ಅದ್ಭುತ ಸಿದ್ಧತೆ!",
    readiness_low:"ಇಂದು ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ.",
    telehealth_booked:"ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಆಗಿದೆ.",
    hrv_good:"ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ ವ್ಯತ್ಯಾಸ ಇಂದು ಆರೋಗ್ಯಕರ.",
    activity_goal:"ಇಂದು ಚಟುವಟಿಕೆ ಗುರಿ ಮುಟ್ಟಿದ್ದೀರಿ!",
  },
  "gu-IN":{
    welcome:"નમસ્તે! આજે તમને સ્વસ્થ રાખવા હું અહીં છું.",
    med_remind:"દવા લેવાનો સમય.",
    med_done:"અદ્ભુત! દવા લઈ લીધી.",
    vitals_log:"સ્વાસ્થ્ય આંકડા સેવ.",
    fall_tip:"ધીમે ધીમે ઊઠો.",
    emergency:"મદદ માટે કૉલ.",
    mood_prompt:"તમે અત્યારે કેવું અનુભવો છો?",
    med_streak:"{days} દિવસ દવા!",
    sleep_done:"ઊંઘ નોંધાઈ.",
    readiness_good:"આજે ઉત્તમ તૈયારી!",
    readiness_low:"આજે આરામ કરો.",
    telehealth_booked:"અપોઈન્ટમેન્ટ બુક.",
    hrv_good:"તમારી હૃદય ગતિ પ્રવૃત્તિ આજે સ્વસ્થ.",
    activity_goal:"આજે પ્રવૃત્તિ ધ્યેય પૂર્ણ!",
  },
  "ml-IN":{
    welcome:"നമസ്കാരം! ഇന്ന് നിങ്ങളെ ആരോഗ്യത്തോടെ നിലനിർത്താൻ ഞാൻ ഇവിടെ ഉണ്ട്.",
    med_remind:"മരുന്ന് കഴിക്കാൻ സമയം.",
    med_done:"അദ്ഭുതം! മരുന്ന് കഴിച്ചു.",
    vitals_log:"ആരോഗ്യ സംഖ്യകൾ സേവ് ചെയ്തു.",
    fall_tip:"പതുക്കെ എഴുന്നേൽക്കൂ.",
    emergency:"ഇപ്പോൾ സഹായത്തിനായി വിളിക്കുന്നു.",
    mood_prompt:"നിങ്ങൾ ഇപ്പോൾ എങ്ങനെ അനുഭവിക്കുന്നു?",
    med_streak:"{days} ദിവസം തുടർച്ചയായി മരുന്ന്!",
    sleep_done:"ഉറക്കം രേഖപ്പെടുത്തി.",
    readiness_good:"ഇന്ന് മികച്ച സന്നദ്ധത!",
    readiness_low:"ഇന്ന് വിശ്രമിക്കൂ.",
    telehealth_booked:"അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്തു.",
    hrv_good:"നിങ്ങളുടെ ഹൃദയ ഗതി വ്യതിയാനം ഇന്ന് ആരോഗ്യകരം.",
    activity_goal:"ഇന്ന് പ്രവർത്തന ലക്ഷ്യം കൈവരിച്ചു!",
  },
  "pa-IN":{
    welcome:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਤੁਹਾਨੂੰ ਤੰਦਰੁਸਤ ਰੱਖਣ ਲਈ ਮੈਂ ਇੱਥੇ ਹਾਂ।",
    med_remind:"ਦਵਾਈ ਲੈਣ ਦਾ ਸਮਾਂ।",
    med_done:"ਸ਼ਾਬਾਸ਼! ਦਵਾਈ ਲੈ ਲਈ।",
    vitals_log:"ਸਿਹਤ ਨੰਬਰ ਸੇਵ।",
    fall_tip:"ਹੌਲੀ-ਹੌਲੀ ਉੱਠੋ।",
    emergency:"ਮਦਦ ਲਈ ਕਾਲ।",
    mood_prompt:"ਤੁਸੀਂ ਹੁਣ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
    med_streak:"{days} ਦਿਨਾਂ ਦੀ ਦਵਾਈ ਸਟ੍ਰੀਕ!",
    sleep_done:"ਨੀਂਦ ਦਰਜ ਕੀਤੀ ਗਈ।",
    readiness_good:"ਅੱਜ ਸ਼ਾਨਦਾਰ ਤਿਆਰੀ!",
    readiness_low:"ਅੱਜ ਆਰਾਮ ਕਰੋ।",
    telehealth_booked:"ਅਪੌਇੰਟਮੈਂਟ ਬੁੱਕ ਹੋਈ।",
    hrv_good:"ਤੁਹਾਡੀ ਦਿਲ ਦੀ ਧੜਕਣ ਪਰਿਵਰਤਨਸ਼ੀਲਤਾ ਅੱਜ ਸਿਹਤਮੰਦ।",
    activity_goal:"ਅੱਜ ਗਤੀਵਿਧੀ ਟੀਚਾ ਪੂਰਾ ਕੀਤਾ!",
  },
  "or-IN":{
    welcome:"ନମସ୍କାର! ଆଜି ଆପଣଙ୍କୁ ସୁସ୍ଥ ରଖିବା ପାଇଁ ମୁଁ ଏଠାରେ।",
    med_remind:"ଔଷଧ ଖାଇବାର ସମୟ।",
    med_done:"ଅଦ୍ଭୁତ! ଔଷଧ ଖାଇଛନ୍ତି।",
    vitals_log:"ସ୍ୱାସ୍ଥ୍ୟ ସଂଖ୍ୟା ସଂରକ୍ଷଣ।",
    fall_tip:"ଧୀରେ ଧୀରେ ଉଠନ୍ତୁ।",
    emergency:"ସାହାଯ୍ୟ ପାଇଁ ଫୋନ।",
    mood_prompt:"ଆପଣ ଏବେ କେମିତି ଅନୁଭବ କରୁଛନ୍ତି?",
    med_streak:"{days} ଦିନ ଔଷଧ!",
    sleep_done:"ଶଯ୍ୟା ଦାଖଲ।",
    readiness_good:"ଆଜି ଉତ୍କୃଷ୍ଟ ପ୍ରସ୍ତୁତି!",
    readiness_low:"ଆଜି ବିଶ୍ରାମ ନିଅନ୍ତୁ।",
    telehealth_booked:"ଅ୍ୟାପଏଣ୍ଟମେଣ୍ଟ ବୁକ।",
    hrv_good:"ହୃଦ ସ୍ପନ୍ଦନ ପରିବର୍ତ୍ତନ ଆଜି ସ୍ୱସ୍ଥ।",
    activity_goal:"ଆଜି ଗତିବିଧି ଲକ୍ଷ୍ୟ ହାସଲ!",
  },
  "ur-IN":{
    welcome:"السلام علیکم! آج آپ کو صحت مند رکھنے کے لیے میں یہاں ہوں۔",
    med_remind:"دوائی لینے کا وقت۔",
    med_done:"شاندار! دوائی لے لی۔",
    vitals_log:"صحت کے اعداد محفوظ۔",
    fall_tip:"آہستہ آہستہ اٹھیں۔",
    emergency:"مدد کے لیے کال۔",
    mood_prompt:"آپ ابھی کیسا محسوس کر رہے ہیں؟",
    med_streak:"{days} دنوں کی دوائی!",
    sleep_done:"نیند ریکارڈ ہوگئی۔",
    readiness_good:"آج بہترین تیاری!",
    readiness_low:"آج آرام کریں۔",
    telehealth_booked:"اپائنٹمنٹ بک ہوگئی۔",
    hrv_good:"آپ کی دل کی دھڑکن تبدیلی آج صحت مند۔",
    activity_goal:"آج سرگرمی کا ہدف پورا ہوا!",
  },
};

function ph(lang, key, vars={}) {
  const b = PHRASES[lang] || PHRASES["en-IN"];
  let t = b[key] || PHRASES["en-IN"][key] || "";
  Object.entries(vars).forEach(([k,v]) => { t = t.replace(`{${k}}`, v); });
  return t;
}

const VITAL_TYPES=[
  {id:"bp",label:"Blood Pressure",unit:"mmHg",icon:"🩺",color:T.blue,hint:"e.g. 120/80"},
  {id:"pulse",label:"Heart Rate",unit:"bpm",icon:"💓",color:T.red,normalMin:60,normalMax:100,hint:"e.g. 72"},
  {id:"glucose",label:"Blood Sugar",unit:"mg/dL",icon:"🩸",color:T.orange,normalMin:70,normalMax:140,hint:"e.g. 95"},
  {id:"weight",label:"Weight",unit:"kg",icon:"⚖️",color:T.green,hint:"e.g. 68"},
  {id:"temp",label:"Temperature",unit:"°C",icon:"🌡️",color:T.pink,normalMin:36.1,normalMax:37.2,hint:"e.g. 36.6"},
  {id:"spo2",label:"Oxygen Sat.",unit:"%",icon:"🫁",color:T.purple,normalMin:95,normalMax:100,hint:"e.g. 98"},
  {id:"hrv",label:"HRV",unit:"ms",icon:"📈",color:T.teal,normalMin:20,normalMax:80,hint:"e.g. 45"},
];

const SLEEP_QUALITY=[
  {label:"Excellent",min:85,color:T.green,icon:"⭐"},
  {label:"Good",min:70,color:T.teal,icon:"✅"},
  {label:"Fair",min:55,color:T.accent,icon:"⚠️"},
  {label:"Poor",min:0,color:T.red,icon:"❌"},
];

const DOCTORS=[
  {id:"d1",name:"Dr. Rajesh Sharma",spec:"General Physician",avatar:"👨‍⚕️",available:true,rating:4.9,slots:["09:00","11:00","15:00"]},
  {id:"d2",name:"Dr. Priya Nair",spec:"Cardiologist",avatar:"👩‍⚕️",available:true,rating:4.8,slots:["10:00","14:00","16:30"]},
  {id:"d3",name:"Dr. Amit Verma",spec:"Geriatrician",avatar:"🧑‍⚕️",available:false,rating:4.7,slots:["09:30","13:00"]},
];

const PRESCRIPTIONS_DEMO=[
  {id:"p1",name:"Amlodipine 5mg",refillsLeft:2,totalDays:30,daysUsed:22,nextRefill:"2026-06-09",pharmacy:"Apollo Pharmacy"},
  {id:"p2",name:"Metformin 500mg",refillsLeft:1,totalDays:30,daysUsed:28,nextRefill:"2026-06-03",pharmacy:"MedPlus"},
  {id:"p3",name:"Atorvastatin 10mg",refillsLeft:3,totalDays:90,daysUsed:15,nextRefill:"2026-08-15",pharmacy:"Apollo Pharmacy"},
];

const MOODS=[
  {emoji:"😁",label:"Great",score:5,color:T.green},
  {emoji:"🙂",label:"Good",score:4,color:T.accent},
  {emoji:"😐",label:"Okay",score:3,color:T.orange},
  {emoji:"😟",label:"Low",score:2,color:T.red},
  {emoji:"😢",label:"Bad",score:1,color:"#a855f7"},
];

const SYMPTOMS=[
  "Chest pain or pressure","Difficulty breathing","Sudden severe headache",
  "Severe dizziness or confusion","Weakness on one side","Slurred speech",
  "Blurred vision","High fever (above 38.5°C)","Severe stomach pain",
  "Fall or injury","Persistent vomiting","General weakness / fatigue",
];
const SYMPTOM_SEVERITY={
  "Chest pain or pressure":"emergency","Difficulty breathing":"emergency",
  "Sudden severe headache":"emergency","Weakness on one side":"emergency",
  "Slurred speech":"emergency","Severe dizziness or confusion":"urgent",
  "Blurred vision":"urgent","High fever (above 38.5°C)":"urgent",
  "Severe stomach pain":"urgent","Fall or injury":"urgent",
  "Persistent vomiting":"urgent","General weakness / fatigue":"monitor",
};

const todayKey=()=>new Date().toISOString().split("T")[0];
function ls(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function lsSave(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
const loadLang=()=>{ const c=ls("magic16_lang","en-IN"); return LANG_MAP[c]||"en-IN"; };
const loadContacts=()=>ls("manifix_ec_v2",null);
const saveContacts=c=>lsSave("manifix_ec_v2",c);
const loadMeds=()=>ls(`manifix_meds_${todayKey()}`,[
  {id:"m1",name:"Blood Pressure",time:"08:00",dose:"1 tablet",color:T.blue,taken:false},
  {id:"m2",name:"Vitamin D",time:"08:00",dose:"1 capsule",color:T.green,taken:false},
  {id:"m3",name:"Diabetes",time:"13:00",dose:"1 tablet",color:T.orange,taken:false},
  {id:"m4",name:"Cholesterol",time:"20:00",dose:"1 tablet",color:T.purple,taken:false},
]);
const saveMeds=m=>lsSave(`manifix_meds_${todayKey()}`,m);
const loadVitals=()=>ls("manifix_vitals_v3",[]);
const saveVitalEntry=e=>{const h=loadVitals();h.unshift({...e,ts:Date.now()});lsSave("manifix_vitals_v3",h.slice(0,80));};
const loadMoods=()=>ls("manifix_moods",[]);
const saveMood=m=>{const h=loadMoods();h.unshift({...m,ts:Date.now()});lsSave("manifix_moods",h.slice(0,30));};
const loadMedStreak=()=>ls("manifix_med_streak",{days:0,lastDate:""});
function updateMedStreak(){
  const s=loadMedStreak();
  const yesterday=new Date(Date.now()-86400000).toISOString().split("T")[0];
  const today=todayKey();
  if(s.lastDate===yesterday){const ns={days:s.days+1,lastDate:today};lsSave("manifix_med_streak",ns);return ns;}
  if(s.lastDate!==today){const ns={days:1,lastDate:today};lsSave("manifix_med_streak",ns);return ns;}
  return s;
}
const loadSleepLogs=()=>ls("manifix_sleep_v1",[]);
function saveSleepLog(entry){const h=loadSleepLogs();h.unshift({...entry,ts:Date.now()});lsSave("manifix_sleep_v1",h.slice(0,14));}
const loadAppointments=()=>ls("manifix_appts_v1",[]);
const saveAppointment=a=>{const h=loadAppointments();h.unshift({...a,id:`apt_${Date.now()}`});lsSave("manifix_appts_v1",h.slice(0,20));};
const loadPrescriptions=()=>ls("manifix_rx_v1",PRESCRIPTIONS_DEMO);
function tAgo(ts){const d=Math.floor((Date.now()-ts)/60000);if(d<1)return"Just now";if(d<60)return`${d}m ago`;if(d<1440)return`${Math.floor(d/60)}h ago`;return`${Math.floor(d/1440)}d ago`;}
function getGreeting(){const h=new Date().getHours();return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening";}

function makeSpeaker(lang){
  return(text,urgent=false)=>{
    if(!("speechSynthesis" in window)||!text)return;
    const say=()=>{
      const u=new SpeechSynthesisUtterance(text);
      u.lang=lang;u.rate=urgent?0.88:T.voiceRate;u.pitch=urgent?1.0:T.voicePitch;
      const vs=speechSynthesis.getVoices();
      const base=lang.split("-")[0];
      const v=vs.find(x=>x.lang===lang)||vs.find(x=>x.lang.startsWith(base))||vs.find(x=>x.lang.startsWith("en"));
      if(v)u.voice=v;
      speechSynthesis.cancel();speechSynthesis.speak(u);
    };
    if(urgent)navigator.vibrate?.([120,60,120]);
    speechSynthesis.getVoices().length?say():(speechSynthesis.onvoiceschanged=say);
  };
}

function injectCSS(){
  if(document.getElementById("eld-v7"))return;
  const s=document.createElement("style");s.id="eld-v7";
  s.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse-red{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(1.06)}}
    @keyframes ring-fill{from{stroke-dashoffset:var(--dash)}to{stroke-dashoffset:var(--offset)}}
    @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes beat{0%,100%{transform:scale(1)}14%{transform:scale(1.18)}28%{transform:scale(1)}42%{transform:scale(1.12)}70%{transform:scale(1)}}
    .fade-in{animation:fade-in .45s cubic-bezier(.22,.68,0,1.2) both}
    .slide-up{animation:slide-up .4s ease both}
    .pulse-red{animation:pulse-red 1.8s ease-in-out infinite}
    .beat{animation:beat 1.5s ease-in-out infinite}
    .btn-xl{transition:all .2s;cursor:pointer}
    .btn-xl:hover{filter:brightness(1.08);transform:translateY(-2px)}
    .btn-xl:active{transform:scale(.97)}
    .fr:focus{outline:3px solid #FCD34D;outline-offset:3px}
    .hs::-webkit-scrollbar{display:none}
    .hs{-ms-overflow-style:none;scrollbar-width:none}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(s);
}

function computeReadiness(sleepLogs, vitals, meds, moods){
  const hrvEntries=vitals.filter(v=>v.type==="hrv").slice(0,7);
  const avgHRV=hrvEntries.length?hrvEntries.reduce((a,b)=>a+parseFloat(b.value),0)/hrvEntries.length:45;
  const hrvScore=Math.min(100,Math.max(0,((avgHRV-15)/60)*100));
  const lastSleep=sleepLogs[0];
  const sleepScore=lastSleep?lastSleep.quality:60;
  const pulseEntries=vitals.filter(v=>v.type==="pulse").slice(0,3);
  const avgPulse=pulseEntries.length?pulseEntries.reduce((a,b)=>a+parseFloat(b.value),0)/pulseEntries.length:72;
  const hrScore=avgPulse<70?95:avgPulse<80?80:avgPulse<90?65:50;
  const adherence=meds.length?Math.round(meds.filter(m=>m.taken).length/meds.length*100):100;
  const medScore=adherence;
  const moodScore=moods[0]?moods[0].score*20:60;
  const readiness=Math.round(hrvScore*0.30+sleepScore*0.30+hrScore*0.15+medScore*0.15+moodScore*0.10);
  return {
    readiness:Math.min(100,Math.max(1,readiness)),
    components:{hrv:Math.round(hrvScore),sleep:sleepScore,hr:Math.round(hrScore),meds:medScore,mood:moodScore},
    avgHRV:Math.round(avgHRV),
    avgPulse:Math.round(avgPulse),
    recommendation:readiness>=80?"Optimal day for activity":readiness>=60?"Moderate activity ok":"Rest and recovery day",
  };
}

function XLBtn({children,onClick,bg,fg,border,icon,disabled,aria,pulse}){
  return(
    <button onClick={onClick} disabled={disabled} aria-label={aria}
      className={`btn-xl fr${pulse?" pulse-red":""}`}
      style={{width:"100%",padding:"16px 18px",background:disabled?"#1a1408":bg,border:`2.5px solid ${disabled?"#333":border||bg}`,color:disabled?"#555":fg||"#0c0802",fontSize:T.fontSize,fontWeight:800,fontFamily:"'Syne',sans-serif",borderRadius:13,cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,minHeight:T.touchTarget,opacity:disabled?0.55:1}}>
      {icon&&<span style={{fontSize:24}}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

function Spark({values,color}){
  if(!values||values.length<2)return<span style={{fontSize:10,color:T.textDim}}>—</span>;
  const max=Math.max(...values),min=Math.min(...values),range=max-min||1;
  const w=72,h=22;
  const pts=values.map((v,i)=>`${(i/(values.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(values.length-1)/(values.length-1)*w} cy={h-((values[values.length-1]-min)/range)*h} r="3" fill={color}/>
    </svg>
  );
}

function ActivityRings({move,stand,exercise}){
  const rings=[
    {pct:move,color:"#ef4444",bg:"#3f0e0e",label:"Move",val:`${move}%`},
    {pct:stand,color:"#22c55e",bg:"#0a2e0a",label:"Stand",val:`${stand}%`},
    {pct:exercise,color:"#38bdf8",bg:"#0a1f2e",label:"Exercise",val:`${exercise}%`},
  ];
  return(
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <div style={{position:"relative",width:80,height:80}}>
        {rings.map((ring,i)=>{
          const offset=28-(i*9);
          const c2=2*Math.PI*offset;
          const dash=c2*(ring.pct/100);
          return(
            <svg key={i} style={{position:"absolute",top:i*4,left:i*4,width:80-i*8,height:80-i*8,transform:"rotate(-90deg)"}} viewBox={`0 0 ${(80-i*8)} ${(80-i*8)}`}>
              <circle cx={(80-i*8)/2} cy={(80-i*8)/2} r={offset-2} fill="none" stroke={ring.bg} strokeWidth="5"/>
              <circle cx={(80-i*8)/2} cy={(80-i*8)/2} r={offset-2} fill="none" stroke={ring.color} strokeWidth="5"
                strokeDasharray={`${dash} ${c2}`} strokeLinecap="round"/>
            </svg>
          );
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {rings.map((ring,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:ring.color}}/>
            <span style={{fontSize:11,color:T.textMid}}>{ring.label}</span>
            <span style={{fontSize:11,color:ring.color,fontWeight:700,marginLeft:"auto"}}>{ring.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessDash({readinessData,lang,speak}){
  const {readiness,components,recommendation,avgHRV,avgPulse}=readinessData;
  const color=readiness>=80?T.green:readiness>=60?T.teal:readiness>=40?T.orange:T.red;
  const label=readiness>=80?"Peak":readiness>=60?"Good":readiness>=40?"Fair":"Low";
  useEffect(()=>{
    if(readiness>=80)speak(ph(lang,"readiness_good"));
    else if(readiness<50)speak(ph(lang,"readiness_low"));
  },[]);
  const circ=2*Math.PI*36;
  return(
    <div className="fade-in" style={{border:`2px solid ${color}44`,background:`${color}08`,padding:"16px",borderRadius:13}}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
        <div style={{position:"relative",width:90,height:90,flexShrink:0}}>
          <svg width={90} height={90} viewBox="0 0 90 90" style={{transform:"rotate(-90deg)"}}>
            <circle cx={45} cy={45} r={36} fill="none" stroke="#1a1208" strokeWidth="7"/>
            <circle cx={45} cy={45} r={36} fill="none" stroke={color} strokeWidth="7"
              strokeDasharray={`${circ*(readiness/100)} ${circ}`} strokeLinecap="round"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color,lineHeight:1}}>{readiness}</div>
            <div style={{fontSize:9,color:T.textMid,textTransform:"uppercase",letterSpacing:".08em"}}>{label}</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:T.textPrimary,fontFamily:"'Syne',sans-serif",marginBottom:4}}>Readiness Score</div>
          <div style={{fontSize:12,color:T.textMid,lineHeight:1.5,marginBottom:8}}>{recommendation}</div>
          <div style={{display:"flex",gap:10}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:T.teal}}>{avgHRV}ms</div>
              <div style={{fontSize:9,color:T.textDim}}>Avg HRV</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:T.red}}>{avgPulse}</div>
              <div style={{fontSize:9,color:T.textDim}}>Rest HR</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[
          {label:"HRV",val:components.hrv,color:T.teal},
          {label:"Sleep",val:components.sleep,color:T.purple},
          {label:"Heart Rate",val:components.hr,color:T.red},
          {label:"Medications",val:components.meds,color:T.green},
        ].map(c=>(
          <div key={c.label} style={{background:"#100c03",padding:"8px 10px",borderRadius:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:10,color:T.textDim}}>{c.label}</span>
              <span style={{fontSize:10,color:c.color,fontWeight:700}}>{c.val}%</span>
            </div>
            <div style={{height:3,background:"#2a1f08",borderRadius:2,overflow:"hidden"}}>
              <div style={{width:`${c.val}%`,height:"100%",background:c.color,borderRadius:2,transition:"width .6s ease"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SleepLogger({lang,speak,onSave}){
  const [open,setOpen]=useState(false);
  const [hours,setHours]=useState(7);
  const [bedtime,setBedtime]=useState("22:00");
  const [wake,setWake]=useState("05:30");
  const [disturbances,setDisturbances]=useState(0);
  const [feeling,setFeeling]=useState(3);
  const quality=Math.round(Math.min(100,(hours/8)*40+(feeling/5)*30+Math.max(0,(3-disturbances)/3)*30));
  const sqInfo=SLEEP_QUALITY.find(s=>quality>=s.min)||SLEEP_QUALITY[3];
  if(!open)return(
    <button onClick={()=>setOpen(true)} className="btn-xl fr" style={{width:"100%",padding:"13px 16px",background:`${T.purple}12`,border:`2px solid ${T.purple}44`,color:T.purple,borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:22}}>🌙</span> Log Last Night's Sleep
    </button>
  );
  return(
    <div className="slide-up" style={{border:`2px solid ${T.purple}44`,background:`${T.purple}09`,padding:"16px",borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:14,fontWeight:700,color:T.purple,fontFamily:"'Syne',sans-serif"}}>🌙 Sleep Log</span>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:T.textMid,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Bedtime</div>
          <input type="time" value={bedtime} onChange={e=>setBedtime(e.target.value)} style={{width:"100%",padding:"8px 10px",fontSize:14,background:"#1a1208",border:"2px solid #3a2a10",color:T.textPrimary,borderRadius:8,fontFamily:"inherit"}}/>
        </div>
        <div>
          <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Wake Time</div>
          <input type="time" value={wake} onChange={e=>setWake(e.target.value)} style={{width:"100%",padding:"8px 10px",fontSize:14,background:"#1a1208",border:"2px solid #3a2a10",color:T.textPrimary,borderRadius:8,fontFamily:"inherit"}}/>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:11,color:T.textDim}}>Hours slept</span>
          <span style={{fontSize:13,color:T.purple,fontWeight:700}}>{hours}h</span>
        </div>
        <input type="range" min={2} max={12} value={hours} onChange={e=>setHours(+e.target.value)} style={{width:"100%",accentColor:T.purple}}/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Times woken up</div>
        <div style={{display:"flex",gap:6}}>
          {[0,1,2,3,4].map(n=>(
            <button key={n} onClick={()=>setDisturbances(n)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1.5px solid ${disturbances===n?T.purple:"#2a1f08"}`,background:disturbances===n?`${T.purple}22`:"#100c03",color:disturbances===n?T.purple:T.textDim,fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>How refreshed do you feel?</div>
        <div style={{display:"flex",gap:6}}>
          {["😴","😪","😐","😊","😁"].map((e,i)=>(
            <button key={i} onClick={()=>setFeeling(i+1)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1.5px solid ${feeling===i+1?T.purple:"#2a1f08"}`,background:feeling===i+1?`${T.purple}22`:"#100c03",fontSize:20,cursor:"pointer"}}>{e}</button>
          ))}
        </div>
      </div>
      <div style={{background:`${sqInfo.color}18`,border:`1.5px solid ${sqInfo.color}44`,borderRadius:8,padding:"10px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{sqInfo.icon}</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:sqInfo.color}}>Sleep Quality: {quality}/100 — {sqInfo.label}</div>
          <div style={{fontSize:11,color:T.textMid}}>{hours}h · {disturbances} wakeups · Feeling {feeling}/5</div>
        </div>
      </div>
      <XLBtn onClick={()=>{saveSleepLog({bedtime,wake,hours,disturbances,feeling,quality});onSave();speak(ph(lang,"sleep_done"));setOpen(false);}} bg={T.purple} fg="#fff" aria="Save sleep log">💾 Save Sleep Log</XLBtn>
    </div>
  );
}

function SleepHistory({logs}){
  if(!logs.length)return<div style={{fontSize:12,color:T.textDim,textAlign:"center",padding:"12px 0"}}>No sleep logs yet. Start logging tonight!</div>;
  return(
    <div>
      <div style={{fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Last 7 nights</div>
      {logs.slice(0,7).map((log,i)=>{
        const sqInfo=SLEEP_QUALITY.find(s=>log.quality>=s.min)||SLEEP_QUALITY[3];
        return(
          <div key={i} style={{border:`1.5px solid ${sqInfo.color}33`,background:`${sqInfo.color}07`,padding:"10px 12px",borderRadius:9,marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:18}}>{sqInfo.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{log.hours}h sleep · {log.bedtime}→{log.wake}</div>
              <div style={{fontSize:11,color:T.textMid}}>{log.disturbances} wakeups · Quality {log.quality}/100</div>
            </div>
            <span style={{fontSize:12,color:sqInfo.color,fontWeight:700}}>{sqInfo.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TelehealthBooker({lang,speak,contacts}){
  const [step,setStep]=useState("list");
  const [selDoctor,setSelDoctor]=useState(null);
  const [selSlot,setSelSlot]=useState(null);
  const [apptType,setApptType]=useState("video");
  const [reason,setReason]=useState("");
  const [appointments,setAppointments]=useState(()=>loadAppointments());
  const [open,setOpen]=useState(false);
  const book=()=>{
    const appt={doctor:selDoctor.name,spec:selDoctor.spec,slot:selSlot,type:apptType,reason:reason||"General checkup",date:todayKey(),avatar:selDoctor.avatar};
    saveAppointment(appt);setAppointments(loadAppointments());setStep("booked");speak(ph(lang,"telehealth_booked"),true);
  };
  if(!open)return(
    <div>
      <button onClick={()=>setOpen(true)} className="btn-xl fr" style={{width:"100%",padding:"13px 16px",background:`${T.cyan}12`,border:`2px solid ${T.cyan}44`,color:T.cyan,borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>📹</span><span>Telehealth — Book a Doctor</span></div>
        <span style={{fontSize:11,opacity:.7}}>{appointments.length} upcoming ▸</span>
      </button>
      {appointments.slice(0,2).map((a,i)=>(
        <div key={i} style={{border:`1px solid ${T.cyan}33`,background:`${T.cyan}07`,padding:"10px 12px",borderRadius:8,marginTop:6,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{a.avatar}</span>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.textPrimary}}>{a.doctor}</div><div style={{fontSize:11,color:T.textMid}}>{a.spec} · {a.slot} · {a.date}</div></div>
          <span style={{fontSize:10,color:T.green,background:`${T.green}22`,padding:"3px 8px",borderRadius:5,fontWeight:700}}>Booked</span>
        </div>
      ))}
    </div>
  );
  return(
    <div className="slide-up" style={{border:`2px solid ${T.cyan}44`,background:`${T.cyan}08`,padding:"16px",borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <span style={{fontSize:14,fontWeight:700,color:T.cyan,fontFamily:"'Syne',sans-serif"}}>📹 Telehealth</span>
        <button onClick={()=>{setOpen(false);setStep("list");}} style={{background:"none",border:"none",color:T.textMid,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {step==="list"&&(
        <>
          <div style={{fontSize:12,color:T.textMid,marginBottom:12}}>Choose your doctor:</div>
          {DOCTORS.map(doc=>(
            <button key={doc.id} onClick={()=>{if(doc.available){setSelDoctor(doc);setStep("doctor");}}} className="btn-xl fr"
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:doc.available?"#0a1318":"#100c03",border:`1.5px solid ${doc.available?T.cyan:"#2a1f08"}`,borderRadius:10,cursor:doc.available?"pointer":"not-allowed",textAlign:"left",marginBottom:8,fontFamily:"inherit",opacity:doc.available?1:0.5}}>
              <span style={{fontSize:28}}>{doc.avatar}</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{doc.name}</div><div style={{fontSize:11,color:T.textMid}}>{doc.spec} · ⭐ {doc.rating}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:10,color:doc.available?T.green:T.red,fontWeight:700}}>{doc.available?"Available":"Busy"}</div><div style={{fontSize:9,color:T.textDim}}>{doc.slots.length} slots</div></div>
            </button>
          ))}
          {appointments.length>0&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,color:T.textDim,marginBottom:6,textTransform:"uppercase",letterSpacing:".08em"}}>Your appointments</div>
              {appointments.slice(0,3).map((a,i)=>(
                <div key={i} style={{border:`1px solid #2a1f08`,padding:"8px 10px",borderRadius:8,marginBottom:5,display:"flex",gap:10,alignItems:"center"}}>
                  <span>{a.avatar}</span>
                  <div style={{flex:1,fontSize:11,color:T.textMid}}>{a.doctor} · {a.slot} · {a.date}</div>
                  <span style={{fontSize:10,color:T.green}}>✓</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {step==="doctor"&&selDoctor&&(
        <>
          <button onClick={()=>setStep("list")} style={{background:"none",border:"none",color:T.cyan,cursor:"pointer",fontFamily:"inherit",fontSize:12,marginBottom:12}}>← Back</button>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 12px",background:"#0a1318",border:`1.5px solid ${T.cyan}44`,borderRadius:10}}>
            <span style={{fontSize:32}}>{selDoctor.avatar}</span>
            <div><div style={{fontSize:14,fontWeight:700,color:T.textPrimary}}>{selDoctor.name}</div><div style={{fontSize:12,color:T.textMid}}>{selDoctor.spec} · ⭐ {selDoctor.rating}</div></div>
          </div>
          <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Appointment type</div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[{id:"video",icon:"📹",label:"Video"},{id:"audio",icon:"📞",label:"Audio"},{id:"chat",icon:"💬",label:"Chat"}].map(t=>(
              <button key={t.id} onClick={()=>setApptType(t.id)} style={{flex:1,padding:"10px 6px",borderRadius:8,border:`1.5px solid ${apptType===t.id?T.cyan:"#2a1f08"}`,background:apptType===t.id?`${T.cyan}18`:"#100c03",color:apptType===t.id?T.cyan:T.textMid,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
                <div style={{fontSize:18,marginBottom:3}}>{t.icon}</div>{t.label}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Select time slot</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {selDoctor.slots.map(slot=>(
              <button key={slot} onClick={()=>setSelSlot(slot)} style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${selSlot===slot?T.cyan:"#2a1f08"}`,background:selSlot===slot?`${T.cyan}22`:"#100c03",color:selSlot===slot?T.cyan:T.textMid,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:selSlot===slot?700:400}}>{slot}</button>
            ))}
          </div>
          <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Reason for visit (optional)</div>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Blood pressure check, follow-up" style={{width:"100%",padding:"10px",fontSize:13,background:"#1a1208",border:"2px solid #3a2a10",color:T.textPrimary,borderRadius:8,fontFamily:"inherit",marginBottom:12}}/>
          <XLBtn onClick={()=>selSlot&&setStep("confirm")} bg={T.cyan} fg="#0c0802" disabled={!selSlot} aria="Continue">Confirm Details →</XLBtn>
        </>
      )}
      {step==="confirm"&&selDoctor&&(
        <>
          <button onClick={()=>setStep("doctor")} style={{background:"none",border:"none",color:T.cyan,cursor:"pointer",fontFamily:"inherit",fontSize:12,marginBottom:12}}>← Back</button>
          <div style={{border:`2px solid ${T.cyan}44`,background:"#0a1318",padding:"14px",borderRadius:10,marginBottom:14}}>
            <div style={{fontSize:11,color:T.textDim,marginBottom:8,textTransform:"uppercase",letterSpacing:".08em"}}>Appointment Summary</div>
            {[["Doctor",`${selDoctor.avatar} ${selDoctor.name}`],["Speciality",selDoctor.spec],["Date",todayKey()],["Time",selSlot],["Type",apptType==="video"?"📹 Video Call":apptType==="audio"?"📞 Audio Call":"💬 Chat"],["Reason",reason||"General checkup"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid #1a1208`}}>
                <span style={{fontSize:12,color:T.textDim}}>{k}</span>
                <span style={{fontSize:12,color:T.textPrimary,fontWeight:700}}>{v}</span>
              </div>
            ))}
          </div>
          <XLBtn onClick={book} bg={T.cyan} fg="#0c0802" aria="Book appointment">📅 Book Appointment</XLBtn>
        </>
      )}
      {step==="booked"&&(
        <div className="fade-in" style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:52,marginBottom:12}}>✅</div>
          <div style={{fontSize:20,fontWeight:800,color:T.green,fontFamily:"'Syne',sans-serif",marginBottom:8}}>Appointment Booked!</div>
          <div style={{fontSize:13,color:T.textMid,marginBottom:8}}>{selDoctor?.avatar} {selDoctor?.name}</div>
          <div style={{fontSize:14,color:T.cyan,marginBottom:4}}>{selSlot} · {apptType==="video"?"📹 Video":apptType==="audio"?"📞 Audio":"💬 Chat"}</div>
          <div style={{fontSize:12,color:T.textDim,marginBottom:20}}>You will receive a reminder 15 minutes before</div>
          <XLBtn onClick={()=>{setStep("list");setSelSlot(null);setSelDoctor(null);}} bg={T.green} fg="#0c0802" aria="Done">Done ✓</XLBtn>
        </div>
      )}
    </div>
  );
}

function PrescriptionTracker(){
  const [open,setOpen]=useState(false);
  const rx=loadPrescriptions();
  if(!open)return(
    <button onClick={()=>setOpen(true)} className="btn-xl fr" style={{width:"100%",padding:"13px 16px",background:`${T.orange}12`,border:`2px solid ${T.orange}44`,color:T.orange,borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>💊</span><span>Prescription Refills</span></div>
      <span style={{fontSize:11,color:T.red}}>{rx.filter(r=>r.daysUsed/r.totalDays>0.85).length} expiring ▸</span>
    </button>
  );
  return(
    <div className="slide-up" style={{border:`2px solid ${T.orange}44`,background:`${T.orange}08`,padding:"16px",borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:14,fontWeight:700,color:T.orange,fontFamily:"'Syne',sans-serif"}}>💊 Refill Tracker</span>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:T.textMid,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {rx.map(r=>{
        const pct=r.daysUsed/r.totalDays;
        const urgent=pct>0.85;
        const color=pct>0.9?T.red:pct>0.75?T.orange:T.green;
        return(
          <div key={r.id} style={{border:`1.5px solid ${color}33`,background:`${color}06`,padding:"12px 14px",borderRadius:10,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{r.name}</div>
              {urgent&&<span style={{fontSize:10,color:T.red,background:`${T.red}22`,padding:"2px 8px",borderRadius:5,fontWeight:700}}>⚠ Refill Soon</span>}
            </div>
            <div style={{height:4,background:"#1a1208",borderRadius:2,marginBottom:6,overflow:"hidden"}}>
              <div style={{width:`${pct*100}%`,height:"100%",background:color,borderRadius:2,transition:"width .5s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textMid}}>
              <span>{r.refillsLeft} refills left · {r.pharmacy}</span>
              <span style={{color}}>{r.totalDays-r.daysUsed} days left · Next: {r.nextRefill}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HRVPanel({vitals,lang,speak}){
  const [open,setOpen]=useState(false);
  const hrvLogs=vitals.filter(v=>v.type==="hrv").slice(0,7);
  const pulseLogs=vitals.filter(v=>v.type==="pulse").slice(0,7);
  const avgHRV=hrvLogs.length?Math.round(hrvLogs.reduce((a,b)=>a+parseFloat(b.value),0)/hrvLogs.length):45;
  const trend=hrvLogs.length>1?hrvLogs[0].value>hrvLogs[1].value?"↑ Improving":"↓ Declining":"—";
  const color=avgHRV>50?T.green:avgHRV>35?T.teal:avgHRV>20?T.orange:T.red;
  if(!open)return(
    <button onClick={()=>setOpen(true)} className="btn-xl fr" style={{width:"100%",padding:"13px 16px",background:`${T.teal}12`,border:`2px solid ${T.teal}44`,color:T.teal,borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span className="beat" style={{fontSize:22,display:"inline-block"}}>💚</span><span>HRV & Recovery</span></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:14,color,fontWeight:800}}>{avgHRV}ms</div><div style={{fontSize:9,color:T.textDim}}>Avg HRV {trend}</div></div>
    </button>
  );
  const hrvVals=hrvLogs.map(v=>parseFloat(v.value)).filter(Boolean).reverse();
  const pulseVals=pulseLogs.map(v=>parseFloat(v.value)).filter(Boolean).reverse();
  return(
    <div className="slide-up" style={{border:`2px solid ${T.teal}44`,background:`${T.teal}08`,padding:"16px",borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <span style={{fontSize:14,fontWeight:700,color:T.teal,fontFamily:"'Syne',sans-serif"}}>💚 HRV & Recovery</span>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:T.textMid,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{background:"#0a1a14",border:`1.5px solid ${T.teal}33`,padding:"12px",borderRadius:10}}>
          <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Heart Rate Variability</div>
          <div style={{fontSize:26,fontWeight:800,color,fontFamily:"'Syne',sans-serif"}}>{avgHRV}<span style={{fontSize:12,fontWeight:400,color:T.textDim}}> ms</span></div>
          <div style={{fontSize:10,color:T.textMid,marginTop:4}}>{avgHRV>50?"Excellent recovery":avgHRV>35?"Good recovery":avgHRV>20?"Moderate":"Low — rest today"}</div>
          <div style={{marginTop:8}}><Spark values={hrvVals} color={T.teal}/></div>
        </div>
        <div style={{background:"#1a0a0a",border:`1.5px solid ${T.red}33`,padding:"12px",borderRadius:10}}>
          <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Resting Heart Rate</div>
          <div style={{fontSize:26,fontWeight:800,color:T.red,fontFamily:"'Syne',sans-serif"}}>{pulseLogs[0]?.value||"—"}<span style={{fontSize:12,fontWeight:400,color:T.textDim}}> bpm</span></div>
          <div style={{fontSize:10,color:T.textMid,marginTop:4}}>{(pulseLogs[0]?.value||72)<70?"Very good":pulseLogs[0]?.value<80?"Normal":"Slightly elevated"}</div>
          <div style={{marginTop:8}}><Spark values={pulseVals} color={T.red}/></div>
        </div>
      </div>
      <div style={{fontSize:11,color:T.textDim,marginBottom:8}}>Recovery zones</div>
      {[
        {label:"Peak Recovery",range:"HRV > 50ms",color:T.green,active:avgHRV>50},
        {label:"Good Recovery",range:"HRV 35-50ms",color:T.teal,active:avgHRV>=35&&avgHRV<=50},
        {label:"Moderate",range:"HRV 20-35ms",color:T.orange,active:avgHRV>=20&&avgHRV<35},
        {label:"Low — Rest",range:"HRV < 20ms",color:T.red,active:avgHRV<20},
      ].map(z=>(
        <div key={z.label} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,background:z.active?`${z.color}18`:"transparent",border:`1px solid ${z.active?z.color:"transparent"}`,marginBottom:4}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:z.active?z.color:"#2a1f08"}}/>
          <div style={{flex:1}}><span style={{fontSize:12,color:z.active?T.textPrimary:T.textDim,fontWeight:z.active?700:400}}>{z.label}</span><span style={{fontSize:10,color:T.textDim,marginLeft:8}}>{z.range}</span></div>
          {z.active&&<span style={{fontSize:10,color:z.color,fontWeight:700}}>← You</span>}
        </div>
      ))}
    </div>
  );
}

function MedCard({med,onToggle,streak}){
  const now=new Date();
  const [h,m]=med.time.split(":").map(Number);
  const mt=new Date();mt.setHours(h,m,0);
  const windowEnd=new Date(mt.getTime()+2*3600000);
  const isDue=now>=mt&&now<windowEnd;
  const isPast=now>windowEnd;
  return(
    <div className="fade-in" style={{border:`2.5px solid ${med.taken?T.green:isDue?T.accent:"#2a1f08"}`,background:med.taken?"#071208":isDue?`${T.accent}0f`:"#100c03",padding:"13px 15px",borderRadius:12,marginBottom:8,transition:"all .25s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:med.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💊</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{med.name}</div>
            <div style={{fontSize:11,color:T.textMid}}>{med.dose} · {med.time}</div>
          </div>
        </div>
        <button onClick={()=>!med.taken&&onToggle(med.id)} disabled={med.taken} className="fr"
          style={{width:50,height:50,borderRadius:"50%",background:med.taken?T.green:isDue?T.accent:"#2a1f08",border:`2px solid ${med.taken?"#14532d":isDue?"#000":"#4a3820"}`,color:med.taken?"#071208":isDue?"#0c0802":"#8a6030",fontSize:20,fontWeight:800,cursor:med.taken?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
          {med.taken?"✓":"○"}
        </button>
      </div>
      {isDue&&!med.taken&&<div style={{fontSize:12,color:T.accent,fontWeight:700,marginTop:5}}>⏰ Due now</div>}
      {isPast&&!med.taken&&<div style={{fontSize:12,color:T.orange,marginTop:5}}>⚠ Missed</div>}
      {med.taken&&streak>1&&<div style={{fontSize:11,color:T.green,marginTop:4}}>🔥 {streak}-day streak!</div>}
    </div>
  );
}

function VitalRow({vital,history,onLog}){
  const myHistory=history.filter(e=>e.type===vital.id).slice(0,7);
  const numVals=myHistory.map(e=>parseFloat(e.value.split("/")[0])).filter(Boolean).reverse();
  const latest=myHistory[0];
  return(
    <button onClick={()=>onLog(vital)} className="btn-xl fr" style={{border:`2px solid ${vital.color}44`,background:`${vital.color}0a`,padding:"12px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:12,cursor:"pointer",width:"100%",textAlign:"left",minHeight:T.touchTarget}}>
      <div style={{width:40,height:40,borderRadius:"50%",background:vital.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{vital.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{vital.label}</div>
        <div style={{fontSize:11,color:T.textMid}}>{latest?`${latest.value} ${vital.unit} · ${tAgo(latest.ts)}`:"No reading yet"}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
        <Spark values={numVals} color={vital.color}/>
        <span style={{fontSize:10,color:vital.color,fontWeight:700}}>+ Log</span>
      </div>
    </button>
  );
}

function VitalModal({vital,onClose,onSave}){
  const [val,setVal]=useState("");
  const isValid=val.trim().length>0;
  const numVal=parseFloat(val.split("/")[0]);
  let statusColor=T.textMid,statusLabel="";
  if(isValid&&vital.normalMin&&vital.normalMax){
    if(numVal<vital.normalMin){statusColor=T.blue;statusLabel="Below normal range";}
    else if(numVal>vital.normalMax){statusColor=T.red;statusLabel="Above normal range";}
    else{statusColor=T.green;statusLabel="Within normal range ✓";}
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:T.bg,border:`3px solid ${vital.color}`,padding:22,width:"min(400px,100%)",borderRadius:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>{vital.icon}</span><span style={{fontSize:17,fontWeight:800,color:T.textPrimary,fontFamily:"'Syne',sans-serif"}}>{vital.label}</span></div>
          <button onClick={onClose} style={{fontSize:20,background:"none",border:"none",color:T.textMid,cursor:"pointer"}}>✕</button>
        </div>
        <input value={val} onChange={e=>setVal(e.target.value)} placeholder={vital.hint} autoFocus style={{width:"100%",padding:"14px 16px",fontSize:20,background:"#1a1208",border:`2.5px solid ${vital.color}44`,color:T.textPrimary,borderRadius:10,fontFamily:"inherit",marginBottom:8}}/>
        {statusLabel&&<div style={{fontSize:12,color:statusColor,marginBottom:10,fontWeight:600}}>{statusLabel}</div>}
        <div style={{fontSize:11,color:T.textDim,marginBottom:16}}>Unit: {vital.unit} · {vital.hint}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:14,fontSize:14,background:"#1a1208",border:"2px solid #3a2a10",color:T.textMid,borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={()=>{if(isValid){onSave({type:vital.id,value:val.trim(),unit:vital.unit});onClose();}}} disabled={!isValid}
            style={{flex:1,padding:14,fontSize:14,fontWeight:700,background:isValid?vital.color:"#222",border:"2px solid transparent",color:isValid?"#0c0802":T.textDim,borderRadius:10,cursor:isValid?"pointer":"not-allowed",fontFamily:"inherit",opacity:isValid?1:0.5}}>Save</button>
        </div>
      </div>
    </div>
  );
}

function MoodBar({onLog}){
  const [chosen,setChosen]=useState(null);
  return(
    <div>
      <div style={{fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>How are you feeling?</div>
      <div style={{display:"flex",gap:7,justifyContent:"center"}}>
        {MOODS.map(m=>(
          <button key={m.label} onClick={()=>{setChosen(m.label);onLog(m);}} className="btn-xl fr"
            style={{flex:1,padding:"9px 4px",borderRadius:10,textAlign:"center",background:chosen===m.label?`${m.color}25`:"#100c03",border:`2px solid ${chosen===m.label?m.color:"#2a1f08"}`,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>
            <div style={{fontSize:22}}>{m.emoji}</div>
            <div style={{fontSize:9,color:chosen===m.label?m.color:T.textDim,marginTop:3}}>{m.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SymptomChecker({lang,onEmergency,onTelehealth}){
  const [open,setOpen]=useState(false);
  const [sel,setSel]=useState([]);
  const [result,setResult]=useState(null);
  const check=()=>{
    const sevs=sel.map(s=>SYMPTOM_SEVERITY[s]);
    if(sevs.includes("emergency"))setResult("emergency");
    else if(sevs.includes("urgent"))setResult("urgent");
    else setResult("monitor");
  };
  if(!open)return(
    <button onClick={()=>setOpen(true)} className="btn-xl fr" style={{width:"100%",padding:"13px 16px",background:`${T.blue}12`,border:`2px solid ${T.blue}44`,color:T.blue,borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:22}}>🩹</span> AI Symptom Triage
    </button>
  );
  return(
    <div style={{border:`2px solid ${T.blue}44`,background:`${T.blue}08`,padding:"16px",borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:14,fontWeight:700,color:T.blue,fontFamily:"'Syne',sans-serif"}}>🩹 What are you feeling?</span>
        <button onClick={()=>{setOpen(false);setSel([]);setResult(null);}} style={{background:"none",border:"none",color:T.textMid,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {!result?(
        <>
          <div style={{display:"grid",gap:5,marginBottom:12}}>
            {SYMPTOMS.map(s=>(
              <label key={s} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,background:sel.includes(s)?`${T.blue}18`:"#100c03",border:`1.5px solid ${sel.includes(s)?T.blue:"#2a1f08"}`,cursor:"pointer",transition:"all .18s"}}>
                <input type="checkbox" checked={sel.includes(s)} onChange={()=>setSel(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} style={{accentColor:T.blue,width:17,height:17}}/>
                <span style={{fontSize:13,color:sel.includes(s)?T.textPrimary:T.textMid}}>{s}</span>
              </label>
            ))}
          </div>
          <XLBtn onClick={check} bg={T.blue} fg="#0c0802" disabled={sel.length===0} aria="Check symptoms">Check Symptoms</XLBtn>
        </>
      ):(
        <div className="fade-in">
          {result==="emergency"&&(
            <div style={{textAlign:"center",padding:"10px 0"}}>
              <div style={{fontSize:44,marginBottom:8}} className="pulse-red">🚨</div>
              <div style={{fontSize:17,fontWeight:800,color:T.red,fontFamily:"'Syne',sans-serif",marginBottom:8}}>Seek Emergency Care Now</div>
              <div style={{fontSize:13,color:T.textMid,marginBottom:16}}>These symptoms require immediate attention.</div>
              <XLBtn onClick={onEmergency} bg={T.red} fg="#fff" aria="Call emergency">📞 Call Emergency Now</XLBtn>
            </div>
          )}
          {result==="urgent"&&(
            <div style={{textAlign:"center",padding:"10px 0"}}>
              <div style={{fontSize:44,marginBottom:8}}>⚠️</div>
              <div style={{fontSize:15,fontWeight:800,color:T.orange,fontFamily:"'Syne',sans-serif",marginBottom:8}}>Contact Your Doctor Today</div>
              <div style={{fontSize:13,color:T.textMid,marginBottom:14}}>Book a telehealth appointment or visit your clinic.</div>
              <XLBtn onClick={onTelehealth} bg={T.cyan} fg="#0c0802" aria="Book telehealth">📹 Book Telehealth Now</XLBtn>
            </div>
          )}
          {result==="monitor"&&(
            <div style={{textAlign:"center",padding:"10px 0"}}>
              <div style={{fontSize:44,marginBottom:8}}>🔍</div>
              <div style={{fontSize:15,fontWeight:800,color:T.accent,fontFamily:"'Syne',sans-serif",marginBottom:8}}>Monitor & Rest</div>
              <div style={{fontSize:13,color:T.textMid,marginBottom:16}}>Stay hydrated. Contact your doctor if symptoms worsen.</div>
            </div>
          )}
          <button onClick={()=>{setSel([]);setResult(null);}} style={{width:"100%",padding:10,background:"none",border:`1px solid ${T.border}`,color:T.textMid,borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Start Over</button>
        </div>
      )}
    </div>
  );
}

function EmergencySetup({onSave}){
  const [c1n,setC1n]=useState(""),c2n=useRef(""),c2p=useRef(""),dn=useRef(""),dp=useRef("");
  const [c1ph,setC1ph]=useState("");
  const canSave=c1n.trim()&&c1ph.trim();
  return(
    <div style={{minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Mono',monospace",color:T.textPrimary}}>
      <div style={{width:"min(440px,100%)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:52,marginBottom:10}}>🆘</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:T.accent}}>Set Up Emergency Contacts</div>
          <div style={{fontSize:13,color:T.textMid,marginTop:6,lineHeight:1.6}}>Enter real phone numbers before using this app.</div>
        </div>
        {[
          {label:"Primary Contact (Son/Daughter) *",req:true},
          {label:"Backup Contact"},
          {label:"Doctor / Clinic"},
        ].map((f,i)=>{
          const [nn,setNn]=i===0?[c1n,setC1n]:[null,null];
          const [np,setNp]=i===0?[c1ph,setC1ph]:[null,null];
          const nRef=i===1?c2n:i===2?dn:null;
          const pRef=i===1?c2p:i===2?dp:null;
          return(
            <div key={i} style={{background:T.card,border:`2px solid ${T.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:11,color:T.textMid,marginBottom:8,letterSpacing:".08em"}}>{f.label}</div>
              <div style={{display:"flex",gap:8}}>
                <input defaultValue="" ref={i>0?nRef:undefined} value={i===0?nn:undefined} onChange={i===0?e=>setNn(e.target.value):undefined} placeholder="Name" style={{flex:1,padding:"10px",fontSize:14,background:"#1a1208",border:"2px solid #3a2a10",color:T.textPrimary,borderRadius:8,fontFamily:"inherit"}}/>
                <input defaultValue="" ref={i>0?pRef:undefined} value={i===0?np:undefined} onChange={i===0?e=>setNp(e.target.value):undefined} placeholder="+91-9XXXXXXXXX" type="tel" style={{flex:1,padding:"10px",fontSize:14,background:"#1a1208",border:"2px solid #3a2a10",color:T.textPrimary,borderRadius:8,fontFamily:"inherit"}}/>
              </div>
            </div>
          );
        })}
        <XLBtn onClick={()=>{
          if(!canSave)return;
          const contacts=[
            {id:"c1",name:c1n,relation:"Primary",phone:c1ph,avatar:"👨‍👩‍👧"},
            ...(c2n.current?.value&&c2p.current?.value?[{id:"c2",name:c2n.current.value,relation:"Backup",phone:c2p.current.value,avatar:"👤"}]:[]),
            ...(dn.current?.value&&dp.current?.value?[{id:"doc",name:dn.current.value,relation:"Doctor",phone:dp.current.value,avatar:"👨‍⚕️"}]:[]),
            {id:"amb",name:"Ambulance",relation:"108 / 112",phone:"108",avatar:"🚑"},
          ];
          onSave(contacts);
        }} bg={T.accent} fg="#0c0802" disabled={!canSave} aria="Save and continue">✅ Save & Continue</XLBtn>
      </div>
    </div>
  );
}

export default function ElderlyHealthV7(){
  const lang=useMemo(loadLang,[]);
  const speak=useMemo(()=>makeSpeaker(lang),[lang]);
  const [contacts,setContacts]=useState(()=>loadContacts());
  const [meds,setMeds]=useState(()=>loadMeds());
  const [vitals,setVitals]=useState(()=>loadVitals());
  const [moods,setMoods]=useState(()=>loadMoods());
  const [sleepLogs,setSleepLogs]=useState(()=>loadSleepLogs());
  const [streak,setStreak]=useState(()=>loadMedStreak().days);
  const [loading,setLoading]=useState(true);
  const [offline,setOffline]=useState(!navigator.onLine);
  const [emergency,setEmergency]=useState(false);
  const [vitalModal,setVitalModal]=useState(null);
  const [activeTab,setActiveTab]=useState("today");

  const adherence=useMemo(()=>meds.length?Math.round(meds.filter(m=>m.taken).length/meds.length*100):100,[meds]);
  const readinessData=useMemo(()=>computeReadiness(sleepLogs,vitals,meds,moods),[sleepLogs,vitals,meds,moods]);
  const activityRings=useMemo(()=>{
    const today=vitals.filter(v=>Date.now()-v.ts<86400000);
    const move=Math.min(100,today.length*18+adherence*0.2);
    const stand=Math.min(100,60+adherence*0.3);
    const exercise=Math.min(100,today.length*12+streak*3);
    return{move:Math.round(move),stand:Math.round(stand),exercise:Math.round(exercise)};
  },[vitals,adherence,streak]);

  useEffect(()=>{
    injectCSS();
    const t=setTimeout(()=>{setLoading(false);speak(ph(lang,"welcome"));},900);
    return()=>clearTimeout(t);
  },[]);

  useEffect(()=>{
    const on=()=>setOffline(false),off=()=>setOffline(true);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);

  useEffect(()=>{saveMeds(meds);},[meds]);

  useEffect(()=>{
    const check=()=>{
      const now=new Date();
      const due=meds.find(m=>{
        if(m.taken)return false;
        const[h,min]=m.time.split(":").map(Number);
        const mt=new Date();mt.setHours(h,min,0);
        const end=new Date(mt.getTime()+2*3600000);
        return now>=mt&&now<=end;
      });
      if(due)speak(ph(lang,"med_remind"),true);
    };
    const i=setInterval(check,60000);
    return()=>clearInterval(i);
  },[meds,lang,speak]);

  const handleMedToggle=useCallback((id)=>{
    setMeds(p=>p.map(m=>m.id===id?{...m,taken:true}:m));
    speak(ph(lang,"med_done"));
    const s=updateMedStreak();setStreak(s.days);
    if(s.days>1)setTimeout(()=>speak(ph(lang,"med_streak",{days:s.days})),2500);
  },[lang,speak]);

  const handleVitalSave=useCallback((entry)=>{saveVitalEntry(entry);setVitals(loadVitals());speak(ph(lang,"vitals_log"));},[lang,speak]);
  const handleMoodLog=useCallback((mood)=>{saveMood(mood);setMoods(loadMoods());},[]);
  const handleSleepSave=useCallback(()=>{setSleepLogs(loadSleepLogs());},[]);
  const callContact=useCallback((contact)=>{if(contact.phone)window.location.href=`tel:${contact.phone}`;},[]);
  const triggerEmergency=useCallback(()=>{speak(ph(lang,"emergency"),true);setEmergency(true);},[lang,speak]);

  if(loading)return(
    <div style={{minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",color:T.textPrimary}}>
      <div style={{fontSize:56,marginBottom:16}}>👴</div>
      <div style={{fontSize:13,letterSpacing:".14em",color:T.accent,textTransform:"uppercase",marginBottom:14}}>ManifiX Elderly v7.0</div>
      <div style={{width:28,height:28,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    </div>
  );

  if(!contacts)return<EmergencySetup onSave={(c)=>{saveContacts(c);setContacts(c);}}/>;

  if(emergency)return(
    <div style={{minHeight:"100dvh",background:"#0d0000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",padding:20,gap:16}}>
      <div className="pulse-red" style={{fontSize:80}}>🚨</div>
      <div style={{fontSize:28,fontWeight:800,color:T.red,textAlign:"center"}}>EMERGENCY</div>
      <div style={{fontSize:14,color:"#ccc",textAlign:"center",marginBottom:8}}>Tap a name to call. Stay where you are.</div>
      <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",gap:10}}>
        {contacts.map(c=>(
          <button key={c.id} onClick={()=>callContact(c)} className="btn-xl fr"
            style={{width:"100%",padding:"18px 20px",background:c.id==="amb"?"#3d0000":"#1a0a00",border:`2.5px solid ${c.id==="amb"?T.red:T.accent}`,color:c.id==="amb"?T.red:T.accent,fontSize:16,fontWeight:800,borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:14,fontFamily:"inherit"}}>
            <span style={{fontSize:28}}>{c.avatar}</span>
            <div style={{textAlign:"left"}}><div>{c.name}</div><div style={{fontSize:12,opacity:.7}}>{c.relation} · {c.phone}</div></div>
            <span style={{marginLeft:"auto",fontSize:22}}>📞</span>
          </button>
        ))}
      </div>
      <button onClick={()=>setEmergency(false)} style={{marginTop:16,padding:"14px 32px",fontSize:15,background:"#1a1208",border:"2px solid #3a2a10",color:T.textMid,borderRadius:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel Emergency</button>
    </div>
  );

  const TABS=[
    {id:"today",label:"🏠 Today"},
    {id:"recovery",label:"💚 Recovery"},
    {id:"telehealth",label:"📹 Care"},
    {id:"vitals",label:"🩺 Vitals"},
  ];

  const readinessColor=readinessData.readiness>=80?T.green:readinessData.readiness>=60?T.teal:T.orange;

  return(
    <div style={{minHeight:"100dvh",background:T.bg,color:T.textPrimary,fontFamily:"'DM Mono','Courier New',monospace",display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",position:"relative"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(rgba(252,211,77,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(252,211,77,0.016) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>
      <div style={{position:"fixed",top:"15%",left:"50%",transform:"translateX(-50%)",width:500,height:220,background:`radial-gradient(ellipse,rgba(252,211,77,0.10) 0%,transparent 70%)`,pointerEvents:"none"}}/>

      {offline&&<div style={{position:"fixed",top:8,left:"50%",transform:"translateX(-50%)",zIndex:99,fontSize:10,background:T.card,border:`2px solid ${T.accent}`,color:T.accent,padding:"4px 12px",textTransform:"uppercase",borderRadius:7,letterSpacing:".1em"}}>⚡ Offline</div>}

      <div style={{position:"relative",zIndex:2,width:"min(480px,98vw)",display:"flex",flexDirection:"column",gap:11,paddingTop:16,paddingBottom:48}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:12,borderBottom:`2px solid ${T.border}`}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,lineHeight:1,color:T.textPrimary}}>
              ManifiX <span style={{color:T.accent}}>Elderly</span> <span style={{fontSize:13,color:T.textDim}}>v7</span>
            </div>
            <div style={{fontSize:11,color:T.accent,textTransform:"uppercase",letterSpacing:".12em",marginTop:3,opacity:.8}}>Oura · Teladoc · WHO · 20 Languages</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:T.textDim}}>{lang}</div>
            <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{getGreeting()}</div>
            {streak>0&&<div style={{fontSize:11,color:T.accent,marginTop:2}}>🔥 {streak}d streak</div>}
          </div>
        </div>

        {/* EMERGENCY */}
        <XLBtn onClick={triggerEmergency} bg={T.red} fg="#fff" border={T.red} icon="🚨" pulse aria="Emergency">
          EMERGENCY — Call for Help
        </XLBtn>

        {/* READINESS + RINGS ROW */}
        <div className="fade-in" style={{border:`2px solid ${readinessColor}44`,background:`${readinessColor}08`,padding:"14px 16px",borderRadius:12,display:"flex",alignItems:"center",gap:14}}>
          <div style={{textAlign:"center",minWidth:64}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:38,fontWeight:800,color:readinessColor,lineHeight:1}}>{readinessData.readiness}</div>
            <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:".08em",marginTop:2}}>Readiness</div>
            <div style={{fontSize:10,color:readinessColor,marginTop:2,fontWeight:700}}>
              {readinessData.readiness>=80?"Peak":readinessData.readiness>=60?"Good":readinessData.readiness>=40?"Fair":"Low"}
            </div>
          </div>
          <div style={{width:1,height:60,background:T.border}}/>
          <ActivityRings move={activityRings.move} stand={activityRings.stand} exercise={activityRings.exercise}/>
          <div style={{width:1,height:60,background:T.border}}/>
          <div style={{textAlign:"center",minWidth:48}}>
            <div style={{fontSize:24}}>{moods[0]?.emoji||"😐"}</div>
            <div style={{fontSize:9,color:T.textDim,marginTop:2}}>Mood</div>
            <div style={{fontSize:11,color:T.teal,fontWeight:700,marginTop:4}}>{readinessData.avgHRV}ms</div>
            <div style={{fontSize:9,color:T.textDim}}>HRV</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:6}}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className="btn-xl fr"
              style={{flex:1,padding:"9px 4px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",fontFamily:"inherit",borderRadius:9,background:activeTab===tab.id?`${T.accent}18`:"#100c03",border:`1.5px solid ${activeTab===tab.id?T.accent:T.border}`,color:activeTab===tab.id?T.accent:T.textDim,cursor:"pointer"}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: TODAY */}
        {activeTab==="today"&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em"}}>Today's Medicines</span>
              <span style={{fontSize:12,color:adherence>=80?T.green:T.accent,fontWeight:700}}>{adherence}% taken</span>
            </div>
            {meds.map(m=><MedCard key={m.id} med={m} onToggle={handleMedToggle} streak={streak}/>)}
            <div style={{height:10}}/>
            <MoodBar onLog={handleMoodLog}/>
            <div style={{height:10}}/>
            <PrescriptionTracker/>
          </div>
        )}

        {/* TAB: RECOVERY */}
        {activeTab==="recovery"&&(
          <div className="fade-in">
            <ReadinessDash readinessData={readinessData} lang={lang} speak={speak}/>
            <div style={{height:10}}/>
            <HRVPanel vitals={vitals} lang={lang} speak={speak}/>
            <div style={{height:10}}/>
            <SleepLogger lang={lang} speak={speak} onSave={handleSleepSave}/>
            <div style={{height:10}}/>
            <SleepHistory logs={sleepLogs}/>
          </div>
        )}

        {/* TAB: TELEHEALTH + CARE */}
        {activeTab==="telehealth"&&(
          <div className="fade-in">
            <TelehealthBooker lang={lang} speak={speak} contacts={contacts}/>
            <div style={{height:10}}/>
            <SymptomChecker lang={lang} onEmergency={triggerEmergency} onTelehealth={()=>setActiveTab("telehealth")}/>
            <div style={{height:10}}/>
            <div style={{fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Family Connections</div>
            {contacts.filter(c=>c.id!=="amb").map(c=>(
              <button key={c.id} onClick={()=>callContact(c)} className="btn-xl fr"
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.card,border:`2px solid ${T.border}`,borderRadius:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",minHeight:T.touchTarget,marginBottom:8}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`${T.accent}22`,border:`2px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{c.avatar}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{c.name}</div><div style={{fontSize:11,color:T.textMid}}>{c.relation} · {c.phone}</div></div>
                <span style={{fontSize:18,color:T.accent}}>📞</span>
              </button>
            ))}
          </div>
        )}

        {/* TAB: VITALS */}
        {activeTab==="vitals"&&(
          <div className="fade-in">
            <div style={{fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Log & Track (7-day sparklines)</div>
            <div style={{display:"grid",gap:8}}>
              {VITAL_TYPES.map(v=><VitalRow key={v.id} vital={v} history={vitals} onLog={setVitalModal}/>)}
            </div>
          </div>
        )}

        {/* EDIT CONTACTS */}
        <button onClick={()=>{if(window.confirm("Reset emergency contacts?")){{saveContacts(null);setContacts(null);}}}} style={{padding:"7px 14px",fontSize:10,color:T.textDim,background:"none",border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",letterSpacing:".08em"}}>
          ✎ Edit Emergency Contacts
        </button>

        <div style={{textAlign:"center",fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:".12em",paddingTop:4}}>
          v7.0 · 20 Languages · Oura+Teladoc Features · {offline?"Offline":"Live"} · WHO SDG 3.4
        </div>
      </div>

      {vitalModal&&<VitalModal vital={vitalModal} onClose={()=>setVitalModal(null)} onSave={handleVitalSave}/>}
    </div>
  );
}
