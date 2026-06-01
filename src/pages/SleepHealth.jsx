import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   MANIFIX SLEEPGOLD v3 — BLACK × GOLD × CRIMSON
   Global Health Tech · WHO MH-SLP · SDG 3.4
   v3.0 — + HRV · RHR · SpO2 · Sleep Debt · Recovery Score
           + Goal vs Actual · 30-Day Analytics · AI Insights
           + Nap Tracking · Consistency Streaks
═══════════════════════════════════════════════════════════ */

const GOLD    = "#D4AF37";
const GOLD2   = "#F0D060";
const CRIMSON = "#C0392B";
const CRIM2   = "#E74C3C";
const BG      = "#040302";
const BG2     = "#080604";
const BG3     = "#0c0906";
const BORDER  = "#1c1508";
const GRID    = "rgba(212,175,55,0.015)";
const TEXTM   = "#F5E6C8";
const TEXTD   = "#5a4020";
const TEXTMU  = "#2e2010";
const PROG    = `linear-gradient(90deg,#1a0c04,#8B6914,#D4AF37)`;
const GREEN   = "#34D399";
const AMBER   = "#F59E0B";

/* ─── WHO DATA ─── */
const WHO = {
  code:"MH-SLP", promise:"4h → 8h deep sleep · 21 days",
  stat1:"970M people live with mental disorders — WHO 2022",
  stat2:"45% of global adults report chronically insufficient sleep",
  stat3:"$411B/year lost from sleep deprivation — RAND Corporation",
  stat4:"75% in LMICs receive zero mental health treatment",
  solve:"Quality sleep: Depression ↓40% · Anxiety ↓30% · Immunity ↑25%",
  sdg:"SDG 3.4 — Promote mental health and wellbeing for all",
};

/* ─── MULTILINGUAL ─── */
const PHRASES = {
  "en-IN":{ ready:"Let your body receive the rest it has earned.", tip:"Consistent bedtimes improve sleep quality 40%.", breathe:"Activate calm. Four in. Seven hold. Eight out.", saved:"Sleep entry logged. Consistency score updating.", story:"Settle in. Let your body grow heavy and still." },
  "hi-IN":{ ready:"अपने शरीर को वो आराम दें जो उसने अर्जित किया है।", tip:"नियमित सोने का समय नींद में 40% सुधार करता है।", breathe:"4 सांस लें। 7 रोकें। 8 छोड़ें।", saved:"नींद लॉग सहेजा गया।", story:"शांत हो जाएं। अपने शरीर को भारी होने दें।" },
  "te-IN":{ ready:"మీ శరీరానికి విశ్రాంతిని అందించండి.", tip:"స్థిరమైన నిద్రవేళలు నిద్ర నాణ్యతను 40% మెరుగుపరుస్తాయి.", breathe:"4 లోపలికి. 7 ఆపు. 8 బయటికి.", saved:"నిద్ర లాగ్ సేవ్ చేయబడింది.", story:"స్థిరపడండి. మీ శరీరాన్ని విశ్రాంతి తీసుకోనివ్వండి." },
  "ta-IN":{ ready:"உங்கள் உடல் சம்பாதித்த ஓய்வை அதற்கு அளியுங்கள்.", tip:"சீரான தூக்க நேரங்கள் தரத்தை 40% மேம்படுத்துகின்றன.", breathe:"4 உள்ளே. 7 நிறுத்து. 8 வெளியே.", saved:"தூக்க பதிவு சேமிக்கப்பட்டது.", story:"அமைதியாகிடுங்கள். உங்கள் உடல் கனமாகட்டும்." },
  "es-ES":{ ready:"Deja que tu cuerpo reciba el descanso que se ha ganado.", tip:"Los horarios de sueño constantes mejoran la calidad un 40%.", breathe:"Inhala 4. Retén 7. Exhala 8.", saved:"Registro de sueño guardado.", story:"Acomódate. Deja que tu cuerpo se vuelva pesado." },
  "fr-FR":{ ready:"Laissez votre corps recevoir le repos qu'il a mérité.", tip:"Des horaires réguliers améliorent le sommeil de 40%.", breathe:"Inspirez 4. Retenez 7. Expirez 8.", saved:"Journal de sommeil enregistré.", story:"Installez-vous. Laissez votre corps s'alourdir." },
  "de-DE":{ ready:"Lass deinen Körper die Ruhe empfangen, die er verdient hat.", tip:"Regelmäßige Schlafzeiten verbessern die Qualität um 40%.", breathe:"4 einatmen. 7 halten. 8 ausatmen.", saved:"Schlafeintrag gespeichert.", story:"Mach es dir bequem. Lass deinen Körper schwer werden." },
  "ja-JP":{ ready:"体に、獲得した休息を与えましょう。", tip:"規則正しい就寝時間は睡眠の質を40%向上させます。", breathe:"4で吸い、7で保ち、8で吐く。", saved:"睡眠記録を保存しました。", story:"落ち着いて。体が重くなるのを感じてください。" },
};
const ph = (l,k) => PHRASES[l]?.[k] || PHRASES["en-IN"][k] || "";

/* ─── HABITS ─── */
const HABITS_DEFAULT = [
  { id:1, label:"No screens 60 min before bed",      science:"Blue light suppresses melatonin by 50%"   },
  { id:2, label:"Read a physical book 15 min",        science:"Reduces stress 68% faster than other methods" },
  { id:3, label:"4-7-8 breathing completed",          science:"Activates vagus nerve, lowers cortisol"   },
  { id:4, label:"Room temperature 18–20°C",           science:"Core body temp drop triggers deep sleep"  },
  { id:5, label:"No caffeine after 2 PM",             science:"Caffeine half-life: 5-6h, disrupts REM"  },
  { id:6, label:"Light stretch or yoga (10 min)",     science:"Releases muscle tension, eases sleep onset" },
  { id:7, label:"Journaled 3 gratitudes",             science:"Reduces rumination, boosts slow-wave sleep" },
  { id:8, label:"No alcohol tonight",                 science:"Alcohol kills REM — worst sleep disruptor" },
  { id:9, label:"Dark room achieved",                 science:"Even dim light during sleep damages cognition" },
  { id:10,label:"Last meal 3h before bed",            science:"Digestion prevents deep sleep stages"    },
];

/* ─── SLEEP STORIES ─── */
const SLEEP_STORIES = [
  {
    id:"forest_dawn", title:"The Forest at Dawn", subtitle:"Ancient Woodland · 12 min", emoji:"🌲",
    duration:720, color: GOLD, category:"Nature",
    science:"Biophilic narrative reduces amygdala activation 28%. Nature imagery triggers parasympathetic state.",
    soundRec:"Crystal Bowl or 432 Hz",
    paragraphs:[
      "You are walking along a moss-covered path deep in an ancient forest. The air is cool and carries the faint scent of cedar and damp earth. Each footstep is soft, almost silent, cushioned by layers of fallen leaves accumulated over decades.",
      "Sunlight filters through the canopy far above, arriving in long golden columns that illuminate drifting motes of pollen. The forest breathes around you — a slow, deep breath measured in centuries rather than seconds.",
      "You find a clearing where a wide, flat stone rests beside a still pool. The water is dark and perfectly calm, mirroring the pale sky overhead. You sit on the stone, and the cold smoothness against your palms grounds you completely in this moment.",
      "Somewhere distant, a woodpecker marks a steady rhythm against heartwood. Closer, a stream you cannot see murmurs just below awareness. Your eyes grow heavy. The trees hold you here, rooted and unhurried, as time slows to the pace of growing things.",
      "You lie back against the moss. The stone is warm where the light has touched it. Your breath matches the forest's own slow rhythm now. In. A long pause. Out. Each exhale carries away a little more of the day's weight. The canopy sways almost imperceptibly overhead. You are perfectly safe. The forest has kept its watch for ten thousand years, and it will keep it tonight.",
    ]
  },
  {
    id:"ocean_village", title:"The Sleeping Village", subtitle:"Mediterranean Coast · 14 min", emoji:"🌊",
    duration:840, color: GOLD2, category:"Journey",
    science:"Scene-based imagery activates default mode network, bypassing anxiety circuits. Proven faster sleep onset.",
    soundRec:"Ocean Resonance",
    paragraphs:[
      "A small whitewashed village clings to the cliffs above a midnight-blue sea. Every window is dark except yours, where a single candle burns low. The smell of salt and jasmine moves through the open shutter like a gentle tide.",
      "Below, the harbor holds three fishing boats that rock in slow unison. The water against the hull makes the softest sound — a repeated, wordless syllable that means nothing and everything. The boats know this rhythm by heart. They have rested here every night for generations.",
      "You pull a linen blanket around your shoulders. The chair beneath you is old wood worn smooth, familiar as your own hands. On the table, the candle sputters once and steadies. Outside, a cat moves across the cobblestones and disappears into a doorway.",
      "The sea is enormous and very still tonight. From up here it looks like poured pewter, cool and permanent. The stars are out in their full number, reflected in the water, so that the sky and sea form one continuous dark field of light.",
      "You close your eyes and let the salt air fill your chest. The village breathes around you — quietly, without effort, the way things breathe when they have been at rest for a very long time. The candle goes out on its own. The dark is warm and complete. The harbor below rocks its boats. The sea turns its slow wheel. You are here, and you are resting, and there is nothing else required of you tonight.",
    ]
  },
  {
    id:"mountain_rain", title:"Rain on the Mountain Hut", subtitle:"High Alpine · 10 min", emoji:"🏔",
    duration:600, color: GOLD, category:"Weather",
    science:"Rain audio is proven sleep-onset accelerant. Narrative framing adds safety cue — shelter against elements.",
    soundRec:"Brown Rain",
    paragraphs:[
      "You have reached the stone hut just before the storm arrives. The door is heavy and latches cleanly. Inside: a narrow cot, a wool blanket, a small iron stove already warming. The smell of pine smoke and old wood fills every corner.",
      "The rain begins softly on the slate roof, then finds its rhythm — a million small negotiations between water and stone. The window shows nothing but darkness and moving water. You are behind glass and warmth and three feet of mountain wall.",
      "You unlace your boots and let your feet breathe. The cot creaks as you settle in. The blanket is rough and heavy in the best way, pressing you gently into the mattress. Your body begins cataloguing its tiredness, the pleasant ache of elevation and effort.",
      "The stove ticks as the metal expands with heat. The rain outside intensifies for a moment, drumming harder, then finds a steadier tone. The hut absorbs all of it — the cold, the sound, the dark — and gives back only warmth and stillness.",
      "Your eyes are closed now. The rain on the roof is a continuous presence, something to lean against. You hear it without listening. It means: you are inside. It means: there is no further to go tonight. It means: sleep.",
    ]
  },
  {
    id:"library_night", title:"The Midnight Library", subtitle:"Old Reading Room · 11 min", emoji:"📚",
    duration:660, color: GOLD2, category:"Interior",
    science:"Interior safety imagery with low stimulation reduces cortisol. Reading narrative shifts attention from ruminative loops.",
    soundRec:"Delta Binaural",
    paragraphs:[
      "The library closes at ten, but you have a key. The reading room at this hour belongs entirely to you — the long oak tables, the green-shaded lamps that pool light in warm circles, the tall shelves receding into shadow.",
      "You find your usual chair by the window. Outside, the street is empty and slicked with recent rain. A single lamp post stands in a small cone of amber light. A leaf crosses through it and disappears. The world has grown very small and very quiet.",
      "You open a book and read the same page three times without retaining a word, which is fine. The point was never the words. The point was the weight of the book in your hands, the slight give of the chair beneath you, the smell of paper and dust and decades.",
      "The lamps hum almost inaudibly. Somewhere in the building, a clock measures out its slow inventory. You set the book face-down and rest your head against the chair's high back. The ceiling above is lost in shadow. The shelves stand at their patient attention, holding their thousand accumulated silences.",
      "In old libraries the air itself seems thickened with quiet. You breathe it in. Your thoughts, which have been so insistent all day, are losing their edges now, becoming indistinct, moving away like figures in fog. The lamp flickers once. Your hands rest open in your lap. There is nothing to finish tonight. The books will keep. The library will keep. Let go.",
    ]
  },
  {
    id:"desert_stars", title:"Stars Over the Desert", subtitle:"Open Wilderness · 13 min", emoji:"✨",
    duration:780, color: GOLD, category:"Sky",
    science:"Vastness imagery triggers awe response, silencing the default mode network's self-referential chatter. Accelerates sleep.",
    soundRec:"Schumann + 40Hz",
    paragraphs:[
      "You are lying on warm sandstone in a desert that has not seen rain in forty days. The rock beneath you holds the day's heat, radiating it slowly back through your spine and shoulders. Above you, the Milky Way is so dense it looks structural, like something load-bearing.",
      "The desert at night is not silent — it clicks and hisses with cooling stone, with the distant passage of an unseen animal, with the strange acoustics of open space carrying sounds from impossible distances. But all of it is far away. None of it requires anything from you.",
      "A meteor crosses the sky in a single slow stroke and is gone. You watched the whole arc. Your eyes are adjusting still, and new stars are continuously arriving into your awareness, filling in the dark spaces between the stars you already knew.",
      "Your body has settled completely into the rock. You cannot tell anymore where the stone ends and you begin. The warmth moves through you in long, slow waves, from your heels to the back of your skull. Your arms are heavy at your sides. Your jaw has unclenched.",
      "The stars turn above you with imperceptible slowness, the same turning they have performed every night since before there was anyone to watch. You are the smallest imaginable thing beneath this sky, and that smallness is a profound relief. Nothing is required of something this small. Nothing at all. The stars turn. The rock breathes its stored warmth into you. You are held here, under the oldest light, in perfect and total rest.",
    ]
  },
  {
    id:"train_night", title:"Night Train Through the Valley", subtitle:"Sleeper Carriage · 15 min", emoji:"🚂",
    duration:900, color: GOLD2, category:"Journey",
    science:"Rhythmic motion cues synchronize with natural sleep oscillations. Train rhythm mirrors rocking associated with infant sleep onset.",
    soundRec:"Theta Binaural",
    paragraphs:[
      "The sleeper carriage sways on its rails with the unhurried rhythm of a night journey. Your berth is narrow and exactly right — the thin pillow, the folded blanket, the small curtained window showing darkness broken occasionally by a distant farmhouse light that appears and disappears before you can hold it.",
      "The train's motion is a kind of conversation with the tracks — a recurring phrase, a beat in three-four time that the wheels have been saying for hours. You are not going anywhere urgent. You have surrendered your passage to the schedule, and this surrender is a form of rest in itself.",
      "The corridor outside your curtain is empty. You heard footsteps earlier, the attendant with her trolley, but that was an hour ago. Now the train is entirely yours in the way that shared spaces become yours at night when everyone is sleeping. The carriage rocks. A coat hangs on a hook and sways in a slight counterpoint.",
      "Outside, a river appears — you can see its pale surface in the moonlight, running alongside the track for a long straight mile before curving away into the dark. Fields. Hedgerows. The silhouette of a hill. The landscape moves through the window like a slow reel of images from somewhere you have always meant to visit.",
      "You pull the blanket to your chin. The rhythm of the wheels is a lullaby you did not know you already knew. It says: you are moving but you are still. It says: you are carried. The darkness beyond the window deepens. The next station is many hours away, and you do not need to be awake for it. Close your eyes. The train knows the way. The tracks know the way. You are already there.",
    ]
  },
];

/* ─── WIND DOWN STEPS ─── */
const WINDDOWN_STEPS = [
  { id:1, time:60, label:"Dim All Lights", icon:"💡", color:GOLD, desc:"Switch to warm, indirect lighting. No overhead whites. Candlelight or 2700K lamps only.", science:"Bright light before bed delays melatonin onset by 90 min. Dimming 60 min out accelerates it.", soundRec:"Crystal Bowl or 432 Hz" },
  { id:2, time:50, label:"Screen-Free Zone", icon:"📵", color:GOLD2, desc:"All screens off or filtered to night mode. Put phone in another room if possible.", science:"Blue light from screens suppresses melatonin 50% and delays sleep onset by 40 minutes.", soundRec:"432 Hz Natural" },
  { id:3, time:40, label:"Warm Shower", icon:"🚿", color:GOLD, desc:"10-min warm (not hot) shower. Body temperature drop after shower triggers sleep onset.", science:"Post-shower cooling mimics the temperature drop the body performs naturally before deep sleep.", soundRec:"Ocean Resonance" },
  { id:4, time:30, label:"Light Stretch & PMR", icon:"🧘", color:GOLD2, desc:"5 min gentle yoga or progressive muscle relaxation. Start from feet, work upward.", science:"PMR reduces sleep-onset time by 37% in clinical trials. Releases daytime muscle tension stores.", soundRec:"Forest Night" },
  { id:5, time:20, label:"4-7-8 Breathing", icon:"🌬", color:GOLD, desc:"Complete 4 rounds of 4-7-8 breathing. Activates parasympathetic nervous system.", science:"Vagus nerve activation via extended exhale reduces cortisol, lowers heart rate by 8-12 BPM.", soundRec:"Delta Binaural" },
  { id:6, time:15, label:"Gratitude Journal", icon:"📝", color:GOLD2, desc:"Write 3 specific gratitudes. Not generic — one sensory detail each.", science:"Gratitude journaling reduces pre-sleep cognitive arousal and increases slow-wave sleep depth.", soundRec:"Brown Rain" },
  { id:7, time:10, label:"Sleep Story", icon:"🌙", color:GOLD, desc:"Begin a sleep story in SleepGold. Let narrative carry your mind away from the day.", science:"Scene-based imagery bypasses anxiety circuits. 83% of users report faster sleep onset vs silence.", soundRec:"Theta Binaural" },
  { id:8, time:0,  label:"Sleep Tones On", icon:"🎵", color:GOLD2, desc:"Activate Delta Binaural or Brown Rain. Headphones recommended for binaural.", science:"Delta binaural beats entrain brain to 0.5-4 Hz sleep frequencies within 20-30 minutes.", soundRec:"Delta Binaural" },
];

/* ─── SLEEP STAGE DATA ─── */
const SLEEP_STAGES = [
  { id:"awake",  label:"Awake",    shortLabel:"W",  color:"#E74C3C", pct:5,  desc:"Brief waking moments. Normal: 5% of night. More than 10% signals fragmented sleep.", hz:"Beta 13–30 Hz", waves:"High frequency, low amplitude", benefits:[], duration:"5–15 min" },
  { id:"n1",     label:"Light N1", shortLabel:"N1", color:"#F59E0B", pct:8,  desc:"Sleep onset. Hypnic jerks common. Easily woken. Gateway stage.", hz:"Alpha/Theta 8–12 Hz", waves:"Slow eye movement", benefits:["Memory processing begins","Body temperature drops"], duration:"5–10 min" },
  { id:"n2",     label:"Core N2",  shortLabel:"N2", color:GOLD,      pct:47, desc:"Majority of night. Sleep spindles protect sleep from noise. Motor learning consolidated.", hz:"Theta 4–8 Hz + Spindles", waves:"Sleep spindles 12–15 Hz", benefits:["Motor skill learning","Immune repair begins","Blood pressure drops 10–20%"], duration:"10–25 min/cycle" },
  { id:"n3",     label:"Deep N3",  shortLabel:"N3", color:"#34D399", pct:25, desc:"Slow-wave sleep. Hardest to wake. Growth hormone released. Critical immune restoration.", hz:"Delta 0.5–4 Hz", waves:"High amplitude, slow", benefits:["Growth hormone release","Immune system repair","Memory consolidation","Cell regeneration","Glucose metabolism"], duration:"20–40 min (early cycles)" },
  { id:"rem",    label:"REM",      shortLabel:"REM",color:GOLD2,     pct:20, desc:"Dreaming stage. Emotional processing, creativity, learning. Increases in later cycles.", hz:"Theta/Beta mixed", waves:"Rapid eye movement, muscle atonia", benefits:["Emotional regulation","Creative insight","Procedural memory","Stress processing","Empathy circuits"], duration:"10–60 min (grows each cycle)" },
];

const STAGE_CYCLE = [
  {stage:"n1",start:0,end:8,cycle:1},{stage:"n2",start:8,end:22,cycle:1},{stage:"n3",start:22,end:50,cycle:1},{stage:"rem",start:50,end:60,cycle:1},
  {stage:"n2",start:62,end:75,cycle:2},{stage:"n3",start:75,end:95,cycle:2},{stage:"rem",start:95,end:112,cycle:2},
  {stage:"n2",start:114,end:125,cycle:3},{stage:"n3",start:125,end:135,cycle:3},{stage:"rem",start:135,end:160,cycle:3},
  {stage:"n2",start:162,end:175,cycle:4},{stage:"rem",start:175,end:210,cycle:4},
  {stage:"n2",start:212,end:225,cycle:5},{stage:"rem",start:225,end:270,cycle:5},
];

const CYCLES_FN = (wakeStr) => {
  const [h,m] = wakeStr.split(":").map(Number);
  const wake  = new Date(); wake.setHours(h,m,0,0);
  if (wake < new Date()) wake.setDate(wake.getDate()+1);
  return [6,5,4,3].map(c => {
    const t = new Date(wake.getTime()-(c*90+14)*60000);
    return { cycles:c, time:t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), best:c===5 };
  });
};

/* ─── NEW v3: ENHANCED SCORE ALGORITHM with Recovery ─── */
const SCORE_FN = (logs, habits) => {
  if (!logs.length) return 50;
  const r=logs.slice(0,7);
  const avg=r.reduce((a,b)=>a+b.duration,0)/r.length;
  const aq =r.reduce((a,b)=>a+b.quality,0)/r.length;
  const dur =avg>=7&&avg<=9?38:avg>5?26:12;
  const qual=(aq/10)*30;
  const vars=r.map(l=>l.duration);
  const vari=vars.reduce((a,b)=>a+Math.pow(b-avg,2),0)/vars.length;
  const cons=Math.max(0,20-vari*9);
  const hab =(habits.filter(h=>h.done).length/habits.length)*12;
  return Math.min(100,Math.round(dur+qual+cons+hab));
};

/* ─── NEW v3: RECOVERY SCORE ─── */
const RECOVERY_FN = (log, prevLog) => {
  if (!log) return null;
  let score = 50;
  // Duration component
  if (log.duration >= 8) score += 20;
  else if (log.duration >= 7) score += 12;
  else if (log.duration >= 6) score += 4;
  else score -= 10;
  // Quality component
  score += (log.quality - 5) * 3;
  // HRV component
  if (log.hrv) {
    const hrvBaseline = 45;
    score += Math.min(15, Math.max(-15, (log.hrv - hrvBaseline) / 2));
  }
  // RHR component - lower is better
  if (log.rhr) {
    const rhrBaseline = 60;
    score += Math.min(10, Math.max(-10, (rhrBaseline - log.rhr)));
  }
  return Math.min(100, Math.max(0, Math.round(score)));
};

/* ─── NEW v3: SLEEP DEBT ─── */
const SLEEP_DEBT_FN = (logs, goalHours) => {
  const goal = goalHours || 8;
  let debt = 0;
  const recent = logs.slice(0, 14);
  recent.forEach(l => { debt += Math.max(0, goal - l.duration); });
  return Math.round(debt * 10) / 10;
};

/* ─── NEW v3: STREAK CALCULATION ─── */
const STREAK_FN = (logs, goalHours) => {
  const goal = goalHours || 7;
  let streak = 0;
  const sorted = [...logs].sort((a,b) => new Date(b.date) - new Date(a.date));
  for (const log of sorted) {
    if (log.duration >= goal) streak++;
    else break;
  }
  return streak;
};

/* ─── NEW v3: 30-DAY STATS ─── */
const MONTHLY_STATS_FN = (logs) => {
  const last30 = logs.slice(0, 30);
  if (!last30.length) return null;
  const avgDur = last30.reduce((a,b) => a+b.duration, 0) / last30.length;
  const avgQual = last30.reduce((a,b) => a+b.quality, 0) / last30.length;
  const best = last30.reduce((a,b) => b.duration > a.duration ? b : a, last30[0]);
  const worst = last30.reduce((a,b) => b.duration < a.duration ? b : a, last30[0]);
  const nights7plus = last30.filter(l => l.duration >= 7).length;
  const pctGoal = Math.round((nights7plus / last30.length) * 100);
  return { avgDur: avgDur.toFixed(1), avgQual: avgQual.toFixed(1), best, worst, pctGoal, nights7plus, count: last30.length };
};

/* ─── NEW v3: AI INSIGHT GENERATION ─── */
const AI_INSIGHTS_FN = (logs, habits, sleepGoal, debt) => {
  const insights = [];
  if (!logs.length) return [{ icon:"◎", color:GOLD, title:"Start Tracking", body:"Log your first night's sleep to unlock personalized AI insights.", priority:1 }];

  const avgDur = logs.slice(0,7).reduce((a,b)=>a+b.duration,0) / Math.min(7,logs.length);
  const avgQual = logs.slice(0,7).reduce((a,b)=>a+b.quality,0) / Math.min(7,logs.length);
  const streak = STREAK_FN(logs, sleepGoal);
  const habDone = habits.filter(h=>h.done).length;
  const consistency = (() => {
    const durs = logs.slice(0,7).map(l=>l.duration);
    const avg = durs.reduce((a,b)=>a+b,0)/durs.length;
    const variance = durs.reduce((a,b)=>a+Math.pow(b-avg,2),0)/durs.length;
    return Math.sqrt(variance);
  })();

  // Debt insight
  if (debt >= 5) {
    insights.push({ icon:"⚠", color:CRIMSON, title:"Critical Sleep Debt", body:`You've accumulated ${debt}h of sleep debt in the past 14 nights. At this level, cognitive performance equals legal intoxication. Prioritize 8h+ for 5 consecutive nights to restore baseline.`, priority:1 });
  } else if (debt >= 2) {
    insights.push({ icon:"◑", color:AMBER, title:"Sleep Debt Building", body:`${debt}h deficit detected. Plan 30-min extra sleep on 3 nights this week. Avoid "catching up" on weekends — it disrupts circadian rhythm more than it helps.`, priority:2 });
  }

  // Consistency insight
  if (consistency > 1.5) {
    insights.push({ icon:"⟳", color:GOLD, title:"Irregular Schedule Detected", body:`Your sleep duration varies by ${consistency.toFixed(1)}h on average. High variability is as harmful as short sleep. Aim for ±30 min variance. Set a fixed wake time — even weekends.`, priority:2 });
  } else if (consistency < 0.5) {
    insights.push({ icon:"◈", color:GREEN, title:"Elite Consistency", body:`Your sleep schedule shows remarkable regularity (${consistency.toFixed(1)}h variance). This is one of the strongest predictors of deep sleep architecture quality. Keep the fixed bedtime.`, priority:3 });
  }

  // Duration insight
  if (avgDur < 6) {
    insights.push({ icon:"🔴", color:CRIMSON, title:"Severe Sleep Restriction", body:`7-night average: ${avgDur.toFixed(1)}h. Below 6h chronically: Alzheimer's risk ↑33%, immune function ↓40%, testosterone ↓10-15%. Recovery protocol: add 1h per night for 2 weeks.`, priority:1 });
  } else if (avgDur >= 7 && avgDur <= 8.5) {
    insights.push({ icon:"◉", color:GREEN, title:"Optimal Duration Zone", body:`Your ${avgDur.toFixed(1)}h average sits in the 7-9h sweet spot. Mortality risk in this range is 25% lower than under-sleepers. Maintaining this consistently is more important than occasional perfect nights.`, priority:3 });
  }

  // Quality vs duration mismatch
  if (avgDur >= 7 && avgQual < 5) {
    insights.push({ icon:"◐", color:AMBER, title:"Duration-Quality Mismatch", body:`You're getting enough hours but rating quality low. Likely causes: fragmented sleep, poor sleep architecture, stress, or alcohol. Check wind-down routine. Track wake-ups in your notes.`, priority:2 });
  }

  // Streak encouragement
  if (streak >= 7) {
    insights.push({ icon:"✦", color:GOLD, title:`${streak}-Night Streak`, body:`${streak} consecutive nights at goal. At this point, sleep architecture is actively rebuilding. Deep sleep spindle density increases after 10+ nights of consistency. Keep going.`, priority:3 });
  }

  // Habit correlation
  if (habDone >= 8) {
    insights.push({ icon:"◎", color:GREEN, title:"Habit Compliance: Elite", body:`${habDone}/10 sleep hygiene habits completed. Users with 8+ habits consistently score 22% higher on sleep quality metrics. The compound effect of multiple small habits outperforms any single intervention.`, priority:3 });
  } else if (habDone <= 3) {
    insights.push({ icon:"▸", color:GOLD, title:"Activate Sleep Hygiene", body:`Only ${habDone} habits active tonight. The single highest-impact habit to add first: no screens 60 min before bed. Blue light alone can delay sleep onset by 40 minutes.`, priority:2 });
  }

  // RHR trend insight
  const logsWithRHR = logs.filter(l => l.rhr).slice(0, 7);
  if (logsWithRHR.length >= 3) {
    const avgRHR = logsWithRHR.reduce((a,b)=>a+b.rhr,0)/logsWithRHR.length;
    if (avgRHR > 65) {
      insights.push({ icon:"❤", color:CRIMSON, title:"Elevated Resting Heart Rate", body:`Average RHR ${avgRHR.toFixed(0)} BPM over 7 nights. RHR above 65 during sleep often signals poor parasympathetic tone or incomplete recovery. Prioritize 4-7-8 breathing and consistent bedtimes.`, priority:2 });
    }
  }

  // HRV insight
  const logsWithHRV = logs.filter(l => l.hrv).slice(0, 7);
  if (logsWithHRV.length >= 3) {
    const avgHRV = logsWithHRV.reduce((a,b)=>a+b.hrv,0)/logsWithHRV.length;
    if (avgHRV < 35) {
      insights.push({ icon:"◈", color:AMBER, title:"Low HRV — Recovery Needed", body:`Average HRV ${avgHRV.toFixed(0)}ms. Below 40ms indicates sympathetic dominance — your system hasn't fully recovered. Reduce training load, avoid alcohol, and protect 8h sleep for 3 nights.`, priority:2 });
    } else if (avgHRV > 60) {
      insights.push({ icon:"◈", color:GREEN, title:"Strong HRV — Well Recovered", body:`Average HRV ${avgHRV.toFixed(0)}ms indicates strong parasympathetic activity. Your sleep is delivering genuine physiological recovery. This directly predicts immune, cognitive, and cardiovascular performance.`, priority:3 });
    }
  }

  return insights.sort((a,b) => a.priority - b.priority).slice(0, 4);
};

/* ═══════════════════════════════════════════════════════════
   REAL THERAPEUTIC FREQUENCY ENGINE
═══════════════════════════════════════════════════════════ */
function buildSleepEngine(ctx, type, volRef) {
  const nodes = [];
  const master = ctx.createGain();
  master.gain.value = 0.001;
  master.connect(ctx.destination);
  const ramp = (val, t=1.2) => master.gain.linearRampToValueAtTime(val, ctx.currentTime + t);

  function brownNoise(dur=4) {
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * dur, sr);
    const d   = buf.getChannelData(0);
    let last  = 0;
    for (let i=0;i<d.length;i++) {
      const white = Math.random()*2-1;
      last = (last + 0.02*white) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }
  function pinkNoise(dur=4) {
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr*dur, sr);
    const d   = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<d.length;i++) {
      const w=Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
      b6=w*0.115926;
    }
    return buf;
  }
  function loopNoise(buf) { const s=ctx.createBufferSource(); s.buffer=buf; s.loop=true; s.start(); return s; }
  function osc(freq,type="sine",startTime=0) { const o=ctx.createOscillator(); o.type=type; o.frequency.value=freq; o.start(ctx.currentTime+startTime); return o; }
  function gain(val) { const g=ctx.createGain(); g.gain.value=val; return g; }
  function biquad(type,freq,Q=1) { const f=ctx.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=Q; return f; }
  function lfo(rate,depth) { const l=osc(rate,"sine"); const g=gain(depth); l.connect(g); return {lfo:l,gain:g}; }

  if (type === "delta_binaural") {
    const merger=ctx.createChannelMerger(2);
    const L=osc(100); const R=osc(102);
    const gL=gain(0.08); const gR=gain(0.08);
    L.connect(gL); R.connect(gR);
    gL.connect(merger,0,0); gR.connect(merger,0,1);
    merger.connect(master);
    const bn=loopNoise(brownNoise(5)); const lpf=biquad("lowpass",280,0.7);
    const ng=gain(0.06); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(L,R,bn); ramp(volRef.current/600);
  } else if (type === "theta_binaural") {
    const merger=ctx.createChannelMerger(2);
    const L=osc(200); const R=osc(205);
    const gL=gain(0.07); const gR=gain(0.07);
    L.connect(gL); R.connect(gR);
    gL.connect(merger,0,0); gR.connect(merger,0,1);
    merger.connect(master);
    const pn=loopNoise(pinkNoise(4)); const bp=biquad("bandpass",600,0.4);
    const ng=gain(0.04); pn.connect(bp); bp.connect(ng); ng.connect(master);
    nodes.push(L,R,pn); ramp(volRef.current/550);
  } else if (type === "solfeggio_528") {
    const o1=osc(528); const o2=osc(264); const o3=osc(1056);
    const g1=gain(0.05); const g2=gain(0.03); const g3=gain(0.015);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1,g2,g3].forEach(g=>g.connect(master));
    const sh=lfo(0.08,8); sh.lfo.connect(sh.gain); sh.gain.connect(o1.frequency);
    const bn=loopNoise(brownNoise(5)); const lpf=biquad("lowpass",320,0.5);
    const ng=gain(0.04); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(o1,o2,o3,sh.lfo,bn); ramp(volRef.current/500);
  } else if (type === "solfeggio_432") {
    const o1=osc(432); const o2=osc(216); const o3=osc(864);
    const g1=gain(0.05); const g2=gain(0.025); const g3=gain(0.012);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1,g2,g3].forEach(g=>g.connect(master));
    const sh=lfo(0.06,6); sh.lfo.connect(sh.gain); sh.gain.connect(o1.frequency);
    const bn=loopNoise(brownNoise(4)); const lpf=biquad("lowpass",300,0.6);
    const ng=gain(0.035); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(o1,o2,o3,sh.lfo,bn); ramp(volRef.current/500);
  } else if (type === "brown_rain") {
    const bn=loopNoise(brownNoise(6));
    const lpf=biquad("lowpass",350,0.5); const shelf=biquad("highshelf",4000,0.5);
    shelf.gain.value=-18;
    const ng=gain(0.22); bn.connect(lpf); lpf.connect(shelf); shelf.connect(ng); ng.connect(master);
    const pn=loopNoise(pinkNoise(3)); const hp=biquad("highpass",2200,1.2);
    const pg=gain(0.04); pn.connect(hp); hp.connect(pg); pg.connect(master);
    nodes.push(bn,pn); ramp(volRef.current/220);
  } else if (type === "ocean_resonance") {
    const bn=loopNoise(brownNoise(8));
    const lpf=biquad("lowpass",220,0.4);
    const wave=lfo(0.09,180); wave.lfo.connect(wave.gain); wave.gain.connect(lpf.frequency);
    const ng=gain(0.18); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    const pn=loopNoise(pinkNoise(4)); const hp=biquad("highpass",3800,0.8);
    const sg=gain(0.025); pn.connect(hp); hp.connect(sg); sg.connect(master);
    nodes.push(bn,pn,wave.lfo); ramp(volRef.current/200);
  } else if (type === "forest_deep") {
    const pn=loopNoise(pinkNoise(5)); const bp=biquad("bandpass",700,0.35);
    const ng=gain(0.12); pn.connect(bp); bp.connect(ng); ng.connect(master);
    const bn=loopNoise(brownNoise(4)); const lpw=biquad("lowpass",180,0.5);
    const wl=lfo(0.04,120); wl.lfo.connect(wl.gain); wl.gain.connect(lpw.frequency);
    const wg=gain(0.1); bn.connect(lpw); lpw.connect(wg); wg.connect(master);
    const cr=osc(3900); const crg=gain(0); cr.connect(crg); crg.connect(master);
    const cl=lfo(14,0.006); cl.lfo.connect(cl.gain); cl.gain.connect(crg.gain);
    nodes.push(pn,bn,cr,wl.lfo,cl.lfo); ramp(volRef.current/240);
  } else if (type === "womb_heartbeat") {
    const bn=loopNoise(brownNoise(3)); const lpf=biquad("lowpass",160,1.2);
    const ng=gain(0.25); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    const hb=osc(60,"sine"); const hbg=gain(0); hb.connect(hbg); hbg.connect(master);
    const hl=lfo(1,0.09); hl.lfo.connect(hl.gain); hl.gain.connect(hbg.gain);
    const sd=osc(40,"sine"); const sdg=gain(0.04); sd.connect(sdg); sdg.connect(master);
    nodes.push(bn,hb,hl.lfo,sd); ramp(volRef.current/160);
  } else if (type === "crystal_bowl") {
    const o1=osc(396); const o2=osc(792); const o3=osc(198);
    const g1=gain(0.055); const g2=gain(0.022); const g3=gain(0.028);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1,g2,g3].forEach(g=>g.connect(master));
    const rm=osc(0.5,"sine"); const rmg=gain(0.03); rm.connect(rmg); rmg.connect(o1.frequency);
    const del=ctx.createDelay(3); del.delayTime.value=0.8;
    const fb=gain(0.45); del.connect(fb); fb.connect(del);
    const dg=gain(0.3); g1.connect(del); del.connect(dg); dg.connect(master);
    const bn=loopNoise(brownNoise(4)); const lpf=biquad("lowpass",250,0.5);
    const nbg=gain(0.035); bn.connect(lpf); lpf.connect(nbg); nbg.connect(master);
    nodes.push(o1,o2,o3,rm,bn); ramp(volRef.current/480);
  } else if (type === "spine_release") {
    const o40=osc(40,"sine"); const g40=gain(0.04); o40.connect(g40); g40.connect(master);
    const oS=osc(7.83,"sine"); const gS=gain(0.03); oS.connect(gS); gS.connect(master);
    const bl=lfo(0.5,0.02); bl.lfo.connect(bl.gain); bl.gain.connect(g40.gain);
    const bn=loopNoise(brownNoise(4)); const lpf=biquad("lowpass",300,0.5);
    const ng=gain(0.07); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(o40,oS,bl.lfo,bn); ramp(volRef.current/500);
  }

  const stopAll = (fade=1.5) => {
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
    setTimeout(() => {
      nodes.forEach(n=>{ try{n.stop();}catch{} });
      try{ master.disconnect(); }catch{}
    }, (fade+0.2)*1000);
  };
  return { master, stopAll };
}

/* ─── SOUND CATALOG ─── */
const SOUNDS = [
  { id:"delta_binaural",  label:"Delta Binaural",  sub:"0–4 Hz · Deep Sleep",      emoji:"🌑", color:GOLD,    science:"Entrains brain to delta — deepest sleep stage. Proven by EEG studies." },
  { id:"theta_binaural",  label:"Theta Binaural",  sub:"4–8 Hz · REM Dreams",       emoji:"🌊", color:GOLD2,   science:"Theta waves govern REM & memory consolidation. Creative dreaming." },
  { id:"solfeggio_528",   label:"528 Hz Miracle",  sub:"DNA Repair · Love Freq",    emoji:"✨", color:GOLD,    science:"528 Hz is used in DNA repair research. Deepens cell regeneration during sleep." },
  { id:"solfeggio_432",   label:"432 Hz Natural",  sub:"Universal Harmony",          emoji:"🔮", color:GOLD2,   science:"A432 tuning aligns with natural world frequencies. Calms nervous system." },
  { id:"brown_rain",      label:"Brown Rain",       sub:"Brownian Noise · Tinnitus", emoji:"🌧", color:GOLD,    science:"Brown noise clinically reduces tinnitus, anxiety, ADHD. Superior to white noise." },
  { id:"ocean_resonance", label:"Ocean Resonance",  sub:"LFO Surf · 0.1 Hz Wave",   emoji:"🌈", color:GOLD2,   science:"0.1 Hz ocean rhythm matches human resting heart rate variability." },
  { id:"forest_deep",     label:"Forest Night",     sub:"Cricket + Wind + Rustling", emoji:"🌿", color:GOLD,    science:"Natural biophonic sound reduces cortisol 12% more than silence. Ancient signal of safety." },
  { id:"womb_heartbeat",  label:"Womb Heartbeat",   sub:"60 BPM Sub-Bass Pulse",     emoji:"❤", color:CRIMSON,  science:"Heartbeat at 60 BPM is primordial sleep trigger — pre-natal memory activated." },
  { id:"crystal_bowl",    label:"Crystal Bowl",     sub:"396 Hz · Tibetan",          emoji:"🔔", color:GOLD2,   science:"Tibetan singing bowls alter brainwave patterns toward deep meditative states." },
  { id:"spine_release",   label:"Schumann + 40Hz",  sub:"7.83 Hz · Earth Resonance", emoji:"🌍", color:GOLD,   science:"Schumann 7.83 Hz = Earth's EM heartbeat. Grounds nervous system for deep sleep." },
];

/* ─── HELPERS ─── */
function useLs(key, def) {
  const [val,setVal] = useState(()=>{
    try{ const x=localStorage.getItem(key); return x?JSON.parse(x):def; } catch{ return def; }
  });
  const set = useCallback((v)=>{
    const next=typeof v==="function"?v(val):v;
    setVal(next);
    try{ localStorage.setItem(key,JSON.stringify(next)); }catch{}
  },[val,key]);
  return [val,set];
}

function makeSpeaker(lang) {
  return (text) => {
    if (!("speechSynthesis" in window)||!text) return;
    const u=new SpeechSynthesisUtterance(text);
    u.lang=lang; u.rate=0.62; u.pitch=0.74;
    const vs=speechSynthesis.getVoices();
    const v=vs.find(x=>x.lang===lang)||vs.find(x=>x.lang.startsWith("en"));
    if(v) u.voice=v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  };
}

function injectCSS() {
  if (document.getElementById("sgcss")) return;
  const el=document.createElement("style"); el.id="sgcss";
  el.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');
    @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.12;transform:scale(1.08)}}
    @keyframes pulse2{0%,100%{opacity:.02}50%{opacity:.07}}
    @keyframes beat{0%,100%{transform:scaleY(1)}50%{transform:scaleY(2.2)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes breatheIn{from{transform:scale(1);opacity:.2}to{transform:scale(1.5);opacity:.8}}
    @keyframes breatheOut{from{transform:scale(1.5);opacity:.8}to{transform:scale(1);opacity:.2}}
    @keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes stageBar{from{width:0}to{}}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes storyPulse{0%,100%{opacity:.3}50%{opacity:.7}}
    @keyframes insightSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes streakGlow{0%,100%{box-shadow:0 0 8px #D4AF3730}50%{box-shadow:0 0 22px #D4AF3760}}
    .fu{animation:fu .5s cubic-bezier(.22,.68,0,1.2) both}
    .sg-btn:hover{filter:brightness(1.18);transform:translateY(-2px)!important;transition:all .18s!important}
    .sg-btn:active{transform:translateY(0)!important}
    .snd-card:hover{border-color:rgba(212,175,55,0.3)!important;background:#0e0a06!important;transition:all .2s}
    .story-card:hover{border-color:rgba(212,175,55,0.25)!important;background:#0c0904!important;transition:all .18s}
    .wd-step:hover{background:#0d0904!important;transition:background .16s}
    .insight-card{animation:insightSlide .4s ease both}
    input[type=range]{-webkit-appearance:none;appearance:none;height:3px;border-radius:3px;outline:none;cursor:pointer}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${GOLD};cursor:pointer;border:2px solid #040200;box-shadow:0 0 8px ${GOLD}60}
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:${GOLD}25;color:${TEXTM}}
    ::-webkit-scrollbar{width:2px}
    ::-webkit-scrollbar-track{background:#040302}
    ::-webkit-scrollbar-thumb{background:${GOLD}30}
    textarea,input{font-family:'Space Mono',monospace}
    .streak-badge{animation:streakGlow 2.5s ease-in-out infinite}
  `;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   BREATH ENGINE
══════════════════════════════════════════════ */
function BreathEngine({ active }) {
  const [phase,setPhase] = useState("idle");
  const [count,setCount] = useState(0);
  const [round,setRound] = useState(0);
  const ref = useRef(null);
  useEffect(()=>{
    if(!active){ clearTimeout(ref.current); setPhase("idle"); setCount(0); setRound(0); return; }
    let cancelled=false;
    const seq=[{name:"inhale",dur:4},{name:"hold",dur:7},{name:"exhale",dur:8}];
    let si=0; let ct;
    const run=()=>{
      if(cancelled) return;
      const cur=seq[si%seq.length];
      setPhase(cur.name);
      let c=cur.dur; setCount(c);
      if(si%seq.length===0&&si>0) setRound(r=>r+1);
      ct=setInterval(()=>{ c--; setCount(c); if(c<=0){ clearInterval(ct); si++; ref.current=setTimeout(run,250); }},1000);
    };
    run();
    return()=>{ cancelled=true; clearInterval(ct); clearTimeout(ref.current); };
  },[active]);
  const anim={idle:{},inhale:{animation:"breatheIn 4s ease forwards"},hold:{transform:"scale(1.5)",opacity:.8},exhale:{animation:"breatheOut 8s ease forwards"}};
  const col={idle:`${GOLD}08`,inhale:GOLD,hold:`${GOLD}80`,exhale:`${GOLD}30`};
  const label={idle:"Ready",inhale:`Inhale · ${count}s`,hold:`Hold · ${count}s`,exhale:`Exhale · ${count}s`};
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,padding:"24px 0"}}>
      <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {[1,2,3].map(r=>(
          <div key={r} style={{position:"absolute",inset:`${r*8}px`,borderRadius:"50%",border:`1px solid ${GOLD}${r===1?"18":r===2?"0c":"06"}`}}/>
        ))}
        <div style={{width:64,height:64,borderRadius:"50%",background:col[phase],...anim[phase],willChange:"transform,opacity",transition:phase==="hold"?"none":"",boxShadow:phase!=="idle"?`0 0 32px ${GOLD}30`:""}}/>
        <div style={{position:"absolute",fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:GOLD,userSelect:"none",textShadow:`0 0 20px ${GOLD}60`}}>
          {active&&phase!=="idle"?count:""}
        </div>
        {active&&phase==="inhale"&&(
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`1px solid ${GOLD}40`,animation:"ripple 2s ease-out infinite"}}/>
        )}
      </div>
      <div style={{fontSize:10,letterSpacing:".22em",textTransform:"uppercase",color:phase==="idle"?TEXTD:GOLD,fontFamily:"'Space Mono',monospace",fontWeight:700}}>
        {label[phase]}
      </div>
    </div>
  );
}

/* ─── SCORE RING ─── */
function ScoreRing({ score, label: lbl, size=56, fontSize=11 }) {
  const c = score>=80?"#34D399":score>=60?GOLD:score>=40?"#F59E0B":CRIMSON;
  const label = lbl || (score>=80?"ELITE":score>=60?"RESTORATIVE":score>=40?"BUILDING":"CRITICAL");
  const r = (size/2) - 4;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{position:"relative",width:size,height:size}}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#141008" strokeWidth="3.5"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray={`${(score/100)*circ} ${circ}`}
            style={{transition:"stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 6px ${c}60)`}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize,fontWeight:700,color:c}}>
          {score}
        </div>
      </div>
      <div>
        <div style={{fontSize:6,letterSpacing:".2em",color:TEXTD,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:2}}>Sleep Score</div>
        <div style={{fontSize:10,color:c,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{label}</div>
      </div>
    </div>
  );
}

/* ─── NEW: RECOVERY RING ─── */
function RecoveryRing({ score }) {
  if (score === null) return null;
  const c = score>=80?GREEN:score>=60?GOLD:score>=40?AMBER:CRIMSON;
  const label = score>=80?"PEAK":score>=60?"GOOD":score>=40?"MODERATE":"LOW";
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{position:"relative",width:46,height:46}}>
        <svg viewBox="0 0 46 46" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="23" cy="23" r="19" fill="none" stroke="#141008" strokeWidth="3"/>
          <circle cx="23" cy="23" r="19" fill="none" stroke={c} strokeWidth="3"
            strokeLinecap="round" strokeDasharray={`${(score/100)*119.4} 119.4`}
            style={{transition:"stroke-dasharray 1.2s ease",filter:`drop-shadow(0 0 5px ${c}50)`}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:700,color:c}}>
          {score}
        </div>
      </div>
      <div>
        <div style={{fontSize:6,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:2}}>Recovery</div>
        <div style={{fontSize:8,color:c,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{label}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SLEEP STORY READER
══════════════════════════════════════════════ */
function StoryReader({ story, onClose, lang, speak }) {
  const [parIdx, setParIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!spokenRef.current) { speak(ph(lang,"story")); spokenRef.current=true; }
  }, []);

  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay) return;
    const readingSpeed = 38;
    const words = story.paragraphs.slice(0, parIdx+1).join(" ").split(" ").length;
    const expectedTime = Math.floor(words / readingSpeed * 60);
    if (elapsed >= expectedTime && parIdx < story.paragraphs.length - 1) {
      setParIdx(p => p+1);
    }
  }, [elapsed]);

  const progress = ((parIdx+1)/story.paragraphs.length)*100;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,1,1,.97)",zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}} onClick={onClose}>
      <div style={{maxWidth:480,width:"100%",margin:"0 auto",padding:"24px 20px",display:"flex",flexDirection:"column",gap:0}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:14,borderBottom:`1px solid ${BORDER}40`}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:GOLD,lineHeight:1.2}}>{story.title}</div>
            <div style={{fontSize:7,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginTop:4}}>{story.subtitle} · {story.category}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${BORDER}40`,color:TEXTMU,cursor:"pointer",fontSize:14,fontFamily:"inherit",padding:"6px 10px"}}>✕</button>
        </div>
        <div style={{height:2,background:"#0e0a06",marginBottom:20,borderRadius:1}}>
          <div style={{height:"100%",width:`${progress}%`,background:PROG,transition:"width .8s ease",borderRadius:1,boxShadow:`0 0 8px ${GOLD}30`}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:24,marginBottom:28}}>
          {story.paragraphs.map((p, i) => (
            <p key={i} style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize: i===parIdx ? 18 : 15,
              lineHeight: 1.85,
              color: i < parIdx ? `${TEXTM}30` : i===parIdx ? TEXTM : `${TEXTM}15`,
              letterSpacing:".01em",
              transition:"all .6s ease",
              animation: i===parIdx ? "fadeInUp .5s ease" : "",
              textIndent: "1.2em",
            }}>
              {p}
            </p>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexDirection:"column",position:"sticky",bottom:0,background:"rgba(4,3,2,.96)",paddingTop:12,paddingBottom:12}}>
          <div style={{display:"flex",gap:8}}>
            <button className="sg-btn" onClick={()=>setAutoPlay(v=>!v)}
              style={{flex:1,padding:"13px",background:autoPlay?`${GOLD}12`:`${GOLD}06`,color:GOLD,
                border:`1px solid ${GOLD}${autoPlay?"35":"15"}`,fontSize:10,fontWeight:700,
                fontFamily:"'Space Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer"}}>
              {autoPlay?"⏸  Pause":"▶  Auto-Advance"}
            </button>
            <button className="sg-btn" onClick={()=>setParIdx(p=>Math.max(0,p-1))}
              style={{padding:"13px 14px",background:"transparent",color:TEXTD,border:`1px solid ${BORDER}40`,fontSize:10,fontFamily:"'Space Mono',monospace",cursor:"pointer",letterSpacing:".06em"}}>◀</button>
            <button className="sg-btn" onClick={()=>setParIdx(p=>Math.min(story.paragraphs.length-1,p+1))}
              style={{padding:"13px 14px",background:"transparent",color:TEXTD,border:`1px solid ${BORDER}40`,fontSize:10,fontFamily:"'Space Mono',monospace",cursor:"pointer",letterSpacing:".06em"}}>▶</button>
          </div>
          <div style={{fontSize:7,letterSpacing:".12em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",textAlign:"center"}}>
            Passage {parIdx+1} of {story.paragraphs.length} · Pair with {story.soundRec || "Delta Binaural"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function SleepGold() {
  useEffect(()=>{ injectCSS(); },[]);

  /* ─── STATE ─── */
  const [sleepLog,setSleepLog] = useLs("sg_log_v3",[
    {id:1,date:"2026-05-31",duration:7.5,quality:8,notes:"Felt rested",hrv:52,rhr:58,spo2:97,isNap:false},
    {id:2,date:"2026-05-30",duration:6.2,quality:5,notes:"Woke up twice",hrv:38,rhr:64,spo2:96,isNap:false},
    {id:3,date:"2026-05-29",duration:8.0,quality:9,notes:"Deep sleep",hrv:61,rhr:55,spo2:98,isNap:false},
    {id:4,date:"2026-05-28",duration:6.8,quality:6,notes:"Vivid dreams",hrv:44,rhr:62,spo2:97,isNap:false},
    {id:5,date:"2026-05-27",duration:7.2,quality:7,notes:"Good night",hrv:49,rhr:59,spo2:97,isNap:false},
    {id:6,date:"2026-05-26",duration:5.8,quality:4,notes:"Late night, early alarm",hrv:32,rhr:68,spo2:95,isNap:false},
    {id:7,date:"2026-05-25",duration:7.8,quality:8,notes:"Weekend recovery",hrv:57,rhr:57,spo2:98,isNap:false},
    {id:8,date:"2026-05-24",duration:7.1,quality:7,notes:"Normal night",hrv:46,rhr:60,spo2:97,isNap:false},
    {id:9,date:"2026-05-23",duration:6.5,quality:6,notes:"",hrv:41,rhr:63,spo2:96,isNap:false},
    {id:10,date:"2026-05-22",duration:8.2,quality:9,notes:"Holiday rest",hrv:63,rhr:54,spo2:98,isNap:false},
    {id:11,date:"2026-05-31",duration:1.2,quality:6,notes:"Afternoon nap",hrv:null,rhr:null,spo2:null,isNap:true},
  ]);
  const [habits,setHabits] = useLs("sg_habits_v1",HABITS_DEFAULT.map(h=>({...h,done:false})));
  const [wakeGoal,setWakeGoal] = useLs("sg_wake_v1","07:00");
  const [sleepGoalHours,setSleepGoalHours] = useLs("sg_sleep_goal_v3",8);
  const [lang,setLang] = useLs("sg_lang_v1","en-IN");
  const [completedWD,setCompletedWD] = useLs("sg_wd_v1",[]);
  const [analyticsRange,setAnalyticsRange] = useLs("sg_analytics_range","7");

  const [tab,setTab] = useState("dashboard");
  const [breathActive,setBreath] = useState(false);
  const [activeSound,setActive] = useState(null);
  const [volume,setVolume] = useState(42);
  const [showLog,setShowLog] = useState(false);
  const [showNapLog,setShowNapLog] = useState(false);
  const [newEntry,setNewEntry] = useState({duration:"",quality:7,notes:"",hrv:"",rhr:"",spo2:"",isNap:false});
  const [whoOpen,setWhoOpen] = useState(false);
  const [expandedSound,setExpand] = useState(null);
  const [showHabitScience,setShowSci] = useState(null);
  const [activeStory,setActiveStory] = useState(null);
  const [selectedStage,setSelectedStage] = useState(null);
  const [stageView,setStageView] = useState("overview");
  const [expandedWD,setExpandedWD] = useState(null);
  const [insightExpanded,setInsightExpanded] = useState(null);
  const [analyticsView,setAnalyticsView] = useState("trend"); // trend | debt | hrv | consistency

  const volRef = useRef(volume);
  useEffect(()=>{ volRef.current=volume; },[volume]);
  const audioCtxRef = useRef(null);
  const soundRef    = useRef(null);

  /* ─── COMPUTED ─── */
  const mainLogs = useMemo(() => sleepLog.filter(l => !l.isNap), [sleepLog]);
  const napLogs  = useMemo(() => sleepLog.filter(l => l.isNap), [sleepLog]);

  const score   = useMemo(()=>SCORE_FN(mainLogs,habits),[mainLogs,habits]);
  const cycles  = useMemo(()=>CYCLES_FN(wakeGoal),[wakeGoal]);
  const speak   = useMemo(()=>makeSpeaker(lang),[lang]);

  const avgDur  = mainLogs.length?(mainLogs.slice(0,7).reduce((a,b)=>a+b.duration,0)/Math.min(7,mainLogs.length)).toFixed(1):"—";
  const avgQual = mainLogs.length?(mainLogs.slice(0,7).reduce((a,b)=>a+b.quality,0)/Math.min(7,mainLogs.length)).toFixed(1):"—";

  const streak = useMemo(() => STREAK_FN(mainLogs, sleepGoalHours), [mainLogs, sleepGoalHours]);
  const sleepDebt = useMemo(() => SLEEP_DEBT_FN(mainLogs, sleepGoalHours), [mainLogs, sleepGoalHours]);
  const recovery = useMemo(() => RECOVERY_FN(mainLogs[0], mainLogs[1]), [mainLogs]);
  const monthlyStats = useMemo(() => MONTHLY_STATS_FN(mainLogs), [mainLogs]);
  const insights = useMemo(() => AI_INSIGHTS_FN(mainLogs, habits, sleepGoalHours, sleepDebt), [mainLogs, habits, sleepGoalHours, sleepDebt]);

  const avgHRV  = useMemo(() => {
    const withHRV = mainLogs.filter(l=>l.hrv).slice(0,7);
    return withHRV.length ? (withHRV.reduce((a,b)=>a+b.hrv,0)/withHRV.length).toFixed(0) : null;
  }, [mainLogs]);
  const avgRHR  = useMemo(() => {
    const withRHR = mainLogs.filter(l=>l.rhr).slice(0,7);
    return withRHR.length ? (withRHR.reduce((a,b)=>a+b.rhr,0)/withRHR.length).toFixed(0) : null;
  }, [mainLogs]);
  const avgSpO2 = useMemo(() => {
    const withSpo2 = mainLogs.filter(l=>l.spo2).slice(0,14);
    return withSpo2.length ? (withSpo2.reduce((a,b)=>a+b.spo2,0)/withSpo2.length).toFixed(1) : null;
  }, [mainLogs]);

  const goalVsActual = useMemo(() => {
    return mainLogs.slice(0, parseInt(analyticsRange)).map(l => ({
      ...l,
      gap: l.duration - sleepGoalHours,
    }));
  }, [mainLogs, sleepGoalHours, analyticsRange]);

  /* ─── AUDIO ─── */
  useEffect(()=>{ const t=setTimeout(()=>speak(ph(lang,"ready")),1600); return()=>clearTimeout(t); },[]);

  const toggleSound = useCallback((snd)=>{
    if(activeSound===snd.id){ soundRef.current?.stopAll(); soundRef.current=null; setActive(null); return; }
    soundRef.current?.stopAll(0.5); soundRef.current=null;
    if(!audioCtxRef.current||audioCtxRef.current.state==="closed"){
      audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    }
    const ctx=audioCtxRef.current;
    if(ctx.state==="suspended") ctx.resume();
    soundRef.current=buildSleepEngine(ctx,snd.id,volRef);
    setActive(snd.id);
  },[activeSound]);

  useEffect(()=>{
    if(!soundRef.current?.master) return;
    const s=SOUNDS.find(s=>s.id===activeSound);
    if(!s) return;
    const map={delta_binaural:600,theta_binaural:550,solfeggio_528:500,solfeggio_432:500,brown_rain:220,ocean_resonance:200,forest_deep:240,womb_heartbeat:160,crystal_bowl:480,spine_release:500};
    soundRef.current.master.gain.linearRampToValueAtTime(volRef.current/(map[s.id]||400), audioCtxRef.current.currentTime+0.3);
  },[volume,activeSound]);

  useEffect(()=>()=>{ soundRef.current?.stopAll(0.3); try{ audioCtxRef.current?.close(); }catch{} },[]);

  /* ─── SAVE LOG ─── */
  const saveLog = useCallback((isNap=false)=>{
    if(!newEntry.duration) return;
    setSleepLog(p=>[{
      id:Date.now(),
      date:new Date().toISOString().split("T")[0],
      duration:parseFloat(newEntry.duration),
      quality:parseInt(newEntry.quality),
      notes:newEntry.notes,
      hrv: newEntry.hrv ? parseInt(newEntry.hrv) : null,
      rhr: newEntry.rhr ? parseInt(newEntry.rhr) : null,
      spo2: newEntry.spo2 ? parseFloat(newEntry.spo2) : null,
      isNap,
    },...p]);
    setNewEntry({duration:"",quality:7,notes:"",hrv:"",rhr:"",spo2:"",isNap:false});
    setShowLog(false);
    setShowNapLog(false);
    speak(ph(lang,"saved"));
  },[newEntry,setSleepLog,lang,speak]);

  const toggleHabit = useCallback((id)=>{ setHabits(p=>p.map(h=>h.id===id?{...h,done:!h.done}:h)); },[setHabits]);
  const toggleWD = useCallback((id)=>{ setCompletedWD(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]); },[setCompletedWD]);

  /* ─── TABS ─── */
  const TABS=[
    {id:"dashboard",  label:"Dashboard",   icon:"◎"},
    {id:"analytics",  label:"Analytics",   icon:"▦", badge:"NEW"},
    {id:"recovery",   label:"Recovery",    icon:"❤", badge:"NEW"},
    {id:"insights",   label:"AI Insights", icon:"◈", badge:"NEW"},
    {id:"sounds",     label:"Sleep Tones", icon:"◉"},
    {id:"stories",    label:"Stories",     icon:"📖"},
    {id:"stages",     label:"Stages",      icon:"◐"},
    {id:"winddown",   label:"Wind Down",   icon:"🌙"},
    {id:"breathe",    label:"Breathe",     icon:"○"},
    {id:"log",        label:"Sleep Log",   icon:"▣"},
    {id:"naps",       label:"Naps",        icon:"💤", badge:"NEW"},
    {id:"habits",     label:"Hygiene",     icon:"✦"},
  ];

  const LANGUAGES=[
    {code:"en-IN",label:"EN"},{code:"hi-IN",label:"हि"},{code:"te-IN",label:"తె"},{code:"ta-IN",label:"த"},
    {code:"es-ES",label:"ES"},{code:"fr-FR",label:"FR"},{code:"de-DE",label:"DE"},{code:"ja-JP",label:"日"},
  ];

  /* ══════ LOG MODAL SHARED ══════ */
  const LogModal = ({ isNap, onClose }) => (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={onClose}>
      <div className="fu" style={{background:"#0c0904",border:`1px solid ${GOLD}25`,padding:28,width:"100%",maxWidth:440,boxShadow:`0 0 60px ${GOLD}08`,maxHeight:"90vh",overflowY:"auto"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:GOLD}}>
            {isNap ? "Log Nap" : "Log Sleep Entry"}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:TEXTMU,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <div style={{fontSize:7,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:7}}>Duration (hours)</div>
            <input type="number" step=".5" min="0" max="12" value={newEntry.duration}
              onChange={e=>setNewEntry(p=>({...p,duration:e.target.value}))} placeholder={isNap?"e.g. 1.5":"e.g. 7.5"}
              style={{width:"100%",background:"#070502",border:`1px solid ${BORDER}60`,color:GOLD,fontSize:16,fontFamily:"'Space Mono',monospace",padding:"12px 14px",outline:"none",letterSpacing:".08em"}}/>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:7,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Quality</span>
              <span style={{fontSize:13,color:newEntry.quality>=7?GREEN:newEntry.quality>=5?GOLD:CRIMSON,fontWeight:700,fontFamily:"'Cormorant Garamond',serif"}}>{newEntry.quality}/10</span>
            </div>
            <input type="range" min={1} max={10} value={newEntry.quality}
              onChange={e=>setNewEntry(p=>({...p,quality:parseInt(e.target.value)}))}
              style={{width:"100%",background:`linear-gradient(90deg,${GOLD} ${newEntry.quality*10}%,#1a1408 0%)`}}/>
          </div>
          {!isNap && (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {key:"hrv",label:"HRV (ms)",placeholder:"e.g. 48",hint:"Heart Rate Variability"},
                  {key:"rhr",label:"RHR (bpm)",placeholder:"e.g. 58",hint:"Resting Heart Rate"},
                  {key:"spo2",label:"SpO₂ (%)",placeholder:"e.g. 97",hint:"Blood Oxygen"},
                ].map(f=>(
                  <div key={f.key}>
                    <div style={{fontSize:6,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:5}}>{f.label}</div>
                    <input type="number" step="1" value={newEntry[f.key]}
                      onChange={e=>setNewEntry(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                      style={{width:"100%",background:"#070502",border:`1px solid ${BORDER}50`,color:`${GOLD}80`,fontSize:11,fontFamily:"'Space Mono',monospace",padding:"9px 8px",outline:"none"}}/>
                    <div style={{fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace",marginTop:3,letterSpacing:".04em"}}>{f.hint}</div>
                  </div>
                ))}
              </div>
              <div style={{padding:"8px 10px",background:`${GOLD}06`,border:`1px solid ${GOLD}12`,fontSize:7,color:`${GOLD}55`,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7}}>
                Optional: Enter from your wearable or smart ring. These unlock HRV trend analysis, recovery scoring, and personalized AI insights.
              </div>
            </>
          )}
          <div>
            <div style={{fontSize:7,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:7}}>Notes</div>
            <textarea value={newEntry.notes} onChange={e=>setNewEntry(p=>({...p,notes:e.target.value}))}
              placeholder={isNap?"Time, location, how refreshed after...":"Dreams, wake-ups, how rested you felt..."}
              style={{width:"100%",background:"#070502",border:`1px solid ${BORDER}60`,color:`${GOLD}70`,fontSize:9,fontFamily:"'Space Mono',monospace",padding:"12px 14px",outline:"none",minHeight:60,lineHeight:1.7,resize:"none"}}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="sg-btn" onClick={()=>saveLog(isNap)}
              style={{flex:1,padding:"15px",background:`${GOLD}18`,color:GOLD,border:`1px solid ${GOLD}40`,fontSize:11,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer"}}>
              Save Entry
            </button>
            <button onClick={onClose}
              style={{flex:1,padding:"15px",background:"transparent",border:`1px solid ${BORDER}50`,color:TEXTMU,fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════ RENDER ══════ */
  return (
    <div style={{minHeight:"100dvh",background:BG,color:TEXTM,fontFamily:"'Space Mono','Courier New',monospace",display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",position:"relative"}}>

      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${GRID} 1px,transparent 1px),linear-gradient(90deg,${GRID} 1px,transparent 1px)`,backgroundSize:"52px 52px"}}/>
      <div style={{position:"fixed",top:"10%",left:"50%",transform:"translateX(-50%)",width:500,height:260,background:`radial-gradient(ellipse,${GOLD}07 0%,transparent 70%)`,animation:"pulse 6s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"20%",right:"10%",width:200,height:200,background:`radial-gradient(ellipse,${CRIMSON}04 0%,transparent 70%)`,animation:"pulse2 8s ease-in-out infinite",pointerEvents:"none"}}/>

      {/* Ticker */}
      <div style={{width:"100%",overflow:"hidden",whiteSpace:"nowrap",borderBottom:`1px solid ${BORDER}30`,padding:"6px 0",background:"#030201"}}>
        <span style={{display:"inline-block",animation:"ticker 55s linear infinite",fontSize:7,letterSpacing:".12em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>
          {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4,WHO.solve,WHO.sdg,"✦ ManifiX SleepGold v3 · "+WHO.promise,"✦ HRV · RHR · SpO₂ · Recovery · Debt · AI Insights · Naps · Streaks"].join("   ✦   ").repeat(2)}
        </span>
      </div>

      <div style={{position:"relative",zIndex:2,width:"min(480px,97vw)",display:"flex",flexDirection:"column",gap:10,paddingTop:16,paddingBottom:56}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:`1px solid ${BORDER}40`}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,letterSpacing:"-.01em",lineHeight:1,color:TEXTM}}>
              SLEEP<span style={{color:GOLD}}>GOLD</span>
            </div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,letterSpacing:".2em",color:`${GOLD}50`,textTransform:"uppercase",marginTop:3}}>
              ManifiX · WHO {WHO.code} · SDG 3.4 · v3.0
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            <ScoreRing score={score}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {LANGUAGES.map(l=>(
                <button key={l.code} onClick={()=>setLang(l.code)}
                  style={{background:lang===l.code?`${GOLD}15`:"transparent",border:`1px solid ${lang===l.code?GOLD+"40":BORDER+"50"}`,
                    color:lang===l.code?GOLD:TEXTMU,fontSize:7,fontFamily:"inherit",padding:"3px 6px",cursor:"pointer",letterSpacing:".06em"}}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.id} className="sg-btn"
              onClick={()=>setTab(t.id)}
              style={{background:tab===t.id?`${GOLD}12`:"#080604",border:`1px solid ${tab===t.id?GOLD+"35":BORDER+"60"}`,
                color:tab===t.id?GOLD:TEXTD,fontSize:7,letterSpacing:".14em",textTransform:"uppercase",
                fontFamily:"inherit",padding:"8px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .16s",position:"relative"}}>
              <span style={{color:tab===t.id?GOLD:TEXTMU,fontSize:tab===t.id?10:9}}>{t.icon}</span>
              {t.label}
              {t.badge&&<span style={{fontSize:5,letterSpacing:".1em",color:tab===t.id?GOLD:CRIMSON,background:tab===t.id?`${GOLD}15`:`${CRIMSON}18`,border:`1px solid ${tab===t.id?GOLD+"25":CRIMSON+"30"}`,padding:"1px 4px",textTransform:"uppercase"}}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ══════════ DASHBOARD ══════════ */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">

            {/* Main stats + streak */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
              {[
                {label:"Avg Sleep",   val:`${avgDur}h`,       col:parseFloat(avgDur)>=7?GREEN:GOLD},
                {label:"Avg Quality", val:`${avgQual}/10`,     col:parseFloat(avgQual)>=7?GREEN:GOLD},
                {label:"Streak",      val:`${streak}d`,        col:streak>=7?GREEN:streak>=3?GOLD:CRIMSON, badge:streak>=7?"🔥":""},
                {label:"Nights",      val:mainLogs.length,     col:GOLD},
              ].map((s,i)=>(
                <div key={i} style={{border:`1px solid ${BORDER}30`,background:BG2,padding:"12px 8px",position:"relative"}}>
                  <div style={{fontSize:6,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>{s.label}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:s.col,lineHeight:1}}>
                    {s.val}{s.badge}
                  </div>
                </div>
              ))}
            </div>

            {/* Recovery + Biometrics Row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:6,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Last Night Recovery</div>
                <RecoveryRing score={recovery}/>
                <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.6}}>
                  {recovery >= 80 ? "Body fully restored. Ready to push." : recovery >= 60 ? "Good recovery. Normal training." : recovery >= 40 ? "Moderate. Reduce intensity." : "Low. Prioritize rest today."}
                </div>
              </div>
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:6,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Sleep Debt · 14 nights</div>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,color:sleepDebt>=5?CRIMSON:sleepDebt>=2?AMBER:GREEN,lineHeight:1}}>{sleepDebt}h</div>
                  <div style={{fontSize:7,color:sleepDebt>=5?`${CRIMSON}70`:sleepDebt>=2?`${AMBER}70`:`${GREEN}70`,fontFamily:"'Space Mono',monospace",letterSpacing:".06em",marginTop:4}}>
                    {sleepDebt>=5?"CRITICAL":sleepDebt>=2?"BUILDING":"MINIMAL"}
                  </div>
                </div>
                <div style={{height:3,background:"#0e0a06",borderRadius:2}}>
                  <div style={{height:"100%",width:`${Math.min(100,(sleepDebt/14)*100)}%`,background:sleepDebt>=5?`linear-gradient(90deg,${CRIMSON},${CRIM2})`:sleepDebt>=2?`linear-gradient(90deg,${AMBER},${GOLD})`:`linear-gradient(90deg,${GREEN},#059669)`,borderRadius:2,transition:"width .6s ease"}}/>
                </div>
                <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em"}}>Goal: {sleepGoalHours}h/night</div>
              </div>
            </div>

            {/* Biometrics row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
              {[
                {label:"Avg HRV",  val:avgHRV?`${avgHRV}ms`:"—", sub:"7-night",  col:avgHRV?parseInt(avgHRV)>=50?GREEN:parseInt(avgHRV)>=35?GOLD:CRIMSON:TEXTD, icon:"◈"},
                {label:"Avg RHR",  val:avgRHR?`${avgRHR}bpm`:"—",sub:"7-night",  col:avgRHR?parseInt(avgRHR)<=58?GREEN:parseInt(avgRHR)<=65?GOLD:CRIMSON:TEXTD, icon:"❤"},
                {label:"SpO₂",    val:avgSpO2?`${avgSpO2}%`:"—", sub:"14-night", col:avgSpO2?parseFloat(avgSpO2)>=97?GREEN:parseFloat(avgSpO2)>=95?GOLD:CRIMSON:TEXTD, icon:"○"},
              ].map((m,i)=>(
                <div key={i} style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"12px 10px"}}>
                  <div style={{fontSize:8,color:m.col,marginBottom:4}}>{m.icon}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:m.col,lineHeight:1}}>{m.val}</div>
                  <div style={{fontSize:6,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginTop:3}}>{m.label} · {m.sub}</div>
                </div>
              ))}
            </div>

            {/* Goal vs actual quick view */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Goal vs Actual · Last 7 Nights</div>
                <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>Target: {sleepGoalHours}h</div>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:5,height:80,paddingBottom:20,position:"relative"}}>
                {mainLogs.slice(0,7).reverse().map((log,i)=>{
                  const actualPct = Math.min((log.duration/10)*100, 98);
                  const goalPct   = (sleepGoalHours/10)*100;
                  const exceeded  = log.duration >= sleepGoalHours;
                  const c = exceeded ? GREEN : log.duration >= sleepGoalHours*0.85 ? GOLD : CRIMSON;
                  return (
                    <div key={log.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",height:"100%",justifyContent:"flex-end"}}>
                      <div style={{fontSize:6,color:c,fontFamily:"'Space Mono',monospace"}}>{log.duration}h</div>
                      <div style={{width:"100%",height:`${actualPct}%`,background:`linear-gradient(180deg,${c},${c}25)`,borderRadius:"2px 2px 0 0",minHeight:3,position:"relative"}}>
                        {exceeded && <div style={{position:"absolute",top:-1,left:0,right:0,height:2,background:GREEN,borderRadius:1,boxShadow:`0 0 6px ${GREEN}60`}}/>}
                      </div>
                      <span style={{position:"absolute",bottom:-16,fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                        {new Date(log.date+"T00:00:00").toLocaleDateString([],{weekday:"short"})}
                      </span>
                    </div>
                  );
                })}
                {/* Goal line */}
                <div style={{position:"absolute",left:0,right:0,bottom:`${20+(sleepGoalHours/10)*60}px`,borderTop:`1px dashed ${GOLD}35`,pointerEvents:"none"}}>
                  <span style={{fontSize:6,color:`${GOLD}50`,letterSpacing:".1em",paddingLeft:4,fontFamily:"'Space Mono',monospace"}}>{sleepGoalHours}h goal</span>
                </div>
              </div>
            </div>

            {/* Streak display */}
            {streak >= 3 && (
              <div className="streak-badge fu" style={{border:`1px solid ${GOLD}30`,background:`linear-gradient(135deg,${GOLD}08,${GOLD}04)`,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:700,color:GOLD,lineHeight:1}}>{streak}</div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:GOLD,fontFamily:"'Space Mono',monospace",letterSpacing:".08em"}}>NIGHT STREAK 🔥</div>
                  <div style={{fontSize:7,color:`${GOLD}60`,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",marginTop:3,lineHeight:1.6}}>
                    {streak >= 21 ? "21-day habit formed. Sleep architecture rebuilt." : streak >= 14 ? "2 weeks of consistent sleep. Circadian rhythm locked." : streak >= 7 ? "7-day milestone. Deep sleep improving." : `${streak} nights at ${sleepGoalHours}h goal.`}
                  </div>
                </div>
              </div>
            )}

            {/* 7-Night Chart */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>7-Night Sleep Duration</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:7,height:110,paddingBottom:24,position:"relative"}}>
                {mainLogs.slice(0,7).reverse().map((log,i)=>{
                  const pct=Math.max((log.duration/10)*100,5);
                  const c=log.duration>=7?GREEN:log.duration>=6?GOLD:CRIMSON;
                  return (
                    <div key={log.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
                      <div style={{fontSize:7,color:c,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{log.duration}h</div>
                      <div style={{width:"100%",height:`${pct}%`,background:`linear-gradient(180deg,${c},${c}30)`,borderRadius:"3px 3px 0 0",minHeight:5,boxShadow:`0 -2px 8px ${c}25`}}/>
                      <span style={{position:"absolute",bottom:-20,fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                        {new Date(log.date+"T00:00:00").toLocaleDateString([],{weekday:"short"})}
                      </span>
                    </div>
                  );
                })}
                <div style={{position:"absolute",left:0,right:0,bottom:`${24+70}px`,borderTop:`1px dashed ${GOLD}20`,pointerEvents:"none"}}>
                  <span style={{fontSize:6,color:`${GOLD}35`,letterSpacing:".1em",paddingLeft:4,fontFamily:"'Space Mono',monospace"}}>7h goal</span>
                </div>
              </div>
            </div>

            {/* Wake Calculator */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:10}}>Smart Wake-Up · 90-min REM Cycles</div>
              <input type="time" value={wakeGoal} onChange={e=>setWakeGoal(e.target.value)}
                style={{background:"#050300",border:`1px solid ${BORDER}60`,color:GOLD,fontSize:16,fontFamily:"'Space Mono',monospace",padding:"10px 14px",outline:"none",width:"100%",letterSpacing:".1em",marginBottom:10}}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                {cycles.map((c,i)=>(
                  <div key={i} style={{padding:"12px 6px",textAlign:"center",background:c.best?"#140e04":BG2,border:`1px solid ${c.best?GOLD:BORDER+"30"}`}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:c.best?GOLD:TEXTD}}>{c.time}</div>
                    <div style={{fontSize:6,letterSpacing:".12em",color:c.best?`${GOLD}65`:TEXTMU,textTransform:"uppercase",marginTop:3,fontFamily:"'Space Mono',monospace"}}>{c.cycles}c{c.best?" ✦":""}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button className="sg-btn" onClick={()=>setShowLog(true)}
                style={{flex:1,padding:"14px",background:`linear-gradient(135deg,${GOLD}15,${GOLD}08)`,
                  color:GOLD,border:`1px solid ${GOLD}30`,fontSize:11,fontWeight:700,
                  fontFamily:"'Cormorant Garamond',serif",letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer"}}>
                ✦ Log Night's Sleep
              </button>
              <button className="sg-btn" onClick={()=>setShowNapLog(true)}
                style={{padding:"14px 18px",background:`${CRIMSON}10`,
                  color:CRIMSON,border:`1px solid ${CRIMSON}25`,fontSize:9,fontWeight:700,
                  fontFamily:"'Space Mono',monospace",letterSpacing:".06em",cursor:"pointer"}}>
                💤 Log Nap
              </button>
            </div>

            {/* WHO Panel */}
            <button onClick={()=>setWhoOpen(v=>!v)}
              style={{background:"transparent",border:`1px solid ${BORDER}30`,color:TEXTMU,fontSize:7,letterSpacing:".14em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",padding:"8px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
              <span>{whoOpen?"▾":"▸"} WHO Global Impact · {WHO.code}</span>
              <span style={{color:`${GOLD}45`}}>{WHO.promise}</span>
            </button>
            {whoOpen&&(
              <div className="fu" style={{border:`1px solid ${GOLD}10`,background:BG2,padding:"14px",display:"flex",flexDirection:"column",gap:8}}>
                {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4].map((s,i)=>(
                  <div key={i} style={{fontSize:8,color:i===0?`${GOLD}60`:TEXTMU,letterSpacing:".06em",lineHeight:1.8,borderLeft:`2px solid ${i===0?GOLD:BORDER+"40"}`,paddingLeft:10,fontFamily:"'Space Mono',monospace"}}>{s}</div>
                ))}
                <div style={{marginTop:4,fontSize:7,letterSpacing:".1em",color:`${GOLD}35`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{WHO.sdg}</div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ ANALYTICS (NEW) ══════════ */}
        {tab==="analytics"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">

            {/* Goal setting */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:10}}>Sleep Goal & Range</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:6,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:6}}>Nightly Goal</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <button onClick={()=>setSleepGoalHours(h=>Math.max(5,h-0.5))} style={{background:`${GOLD}10`,border:`1px solid ${GOLD}20`,color:GOLD,fontSize:14,fontFamily:"inherit",padding:"6px 10px",cursor:"pointer"}}>−</button>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:GOLD,flex:1,textAlign:"center"}}>{sleepGoalHours}h</div>
                    <button onClick={()=>setSleepGoalHours(h=>Math.min(10,h+0.5))} style={{background:`${GOLD}10`,border:`1px solid ${GOLD}20`,color:GOLD,fontSize:14,fontFamily:"inherit",padding:"6px 10px",cursor:"pointer"}}>+</button>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:6,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:6}}>Analysis Range</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {["7","14","30"].map(r=>(
                      <button key={r} onClick={()=>setAnalyticsRange(r)}
                        style={{padding:"7px",background:analyticsRange===r?`${GOLD}15`:BG3,border:`1px solid ${analyticsRange===r?GOLD+"30":BORDER+"20"}`,color:analyticsRange===r?GOLD:TEXTMU,fontSize:7,fontFamily:"'Space Mono',monospace",letterSpacing:".1em",cursor:"pointer"}}>
                        Last {r} nights
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly summary */}
            {monthlyStats && (
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>30-Night Summary</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
                  {[
                    {label:"Avg Duration",val:`${monthlyStats.avgDur}h`,col:parseFloat(monthlyStats.avgDur)>=7?GREEN:GOLD},
                    {label:"Avg Quality", val:`${monthlyStats.avgQual}/10`,col:parseFloat(monthlyStats.avgQual)>=7?GREEN:GOLD},
                    {label:"Goal Nights", val:`${monthlyStats.pctGoal}%`,col:monthlyStats.pctGoal>=70?GREEN:GOLD},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:"10px 8px",background:BG3,border:`1px solid ${BORDER}18`,textAlign:"center"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:s.col}}>{s.val}</div>
                      <div style={{fontSize:6,letterSpacing:".12em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <div style={{padding:"10px",background:BG3,border:`1px solid ${GREEN}15`}}>
                    <div style={{fontSize:6,letterSpacing:".14em",color:`${GREEN}60`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Best Night</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:GREEN}}>{monthlyStats.best.duration}h</div>
                    <div style={{fontSize:7,color:`${GREEN}55`,fontFamily:"'Space Mono',monospace"}}>{monthlyStats.best.date}</div>
                  </div>
                  <div style={{padding:"10px",background:BG3,border:`1px solid ${CRIMSON}12`}}>
                    <div style={{fontSize:6,letterSpacing:".14em",color:`${CRIMSON}60`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Worst Night</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:CRIMSON}}>{monthlyStats.worst.duration}h</div>
                    <div style={{fontSize:7,color:`${CRIMSON}55`,fontFamily:"'Space Mono',monospace"}}>{monthlyStats.worst.date}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics sub-views */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[{id:"trend",l:"Duration Trend"},{id:"debt",l:"Sleep Debt"},{id:"hrv",l:"HRV Trend"},{id:"consistency",l:"Consistency"}].map(v=>(
                <button key={v.id} onClick={()=>setAnalyticsView(v.id)} className="sg-btn"
                  style={{flex:1,minWidth:"45%",padding:"8px",background:analyticsView===v.id?`${GOLD}12`:BG2,border:`1px solid ${analyticsView===v.id?GOLD+"35":BORDER+"30"}`,
                    color:analyticsView===v.id?GOLD:TEXTD,fontSize:7,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",cursor:"pointer"}}>
                  {v.l}
                </button>
              ))}
            </div>

            {/* DURATION TREND */}
            {analyticsView==="trend"&&(
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>
                  Duration vs Goal · Last {analyticsRange} Nights
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:120,paddingBottom:22,position:"relative"}}>
                  {goalVsActual.slice().reverse().map((log,i)=>{
                    const pct=Math.max((log.duration/10)*100,4);
                    const c=log.duration>=sleepGoalHours?GREEN:log.duration>=sleepGoalHours*0.88?GOLD:CRIMSON;
                    return (
                      <div key={log.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
                        <div style={{width:"100%",height:`${pct}%`,background:`linear-gradient(180deg,${c},${c}20)`,borderRadius:"2px 2px 0 0",minHeight:4,position:"relative"}}>
                          {log.gap >= 0 && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:GREEN,boxShadow:`0 0 4px ${GREEN}50`}}/>}
                        </div>
                        <span style={{position:"absolute",bottom:-18,fontSize:5,color:TEXTMU,fontFamily:"'Space Mono',monospace",textAlign:"center"}}>
                          {new Date(log.date+"T00:00:00").toLocaleDateString([],{month:"numeric",day:"numeric"})}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{position:"absolute",left:0,right:0,bottom:`${22+(sleepGoalHours/10)*98}px`,borderTop:`1px dashed ${GOLD}35`,pointerEvents:"none"}}>
                    <span style={{fontSize:6,color:`${GOLD}50`,paddingLeft:4,fontFamily:"'Space Mono',monospace"}}>{sleepGoalHours}h</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}>
                  {[{c:GREEN,l:"At/above goal"},{c:GOLD,l:"Near goal (±12%)"},{c:CRIMSON,l:"Below goal"}].map((x,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:8,height:8,borderRadius:1,background:x.c}}/>
                      <span style={{fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEBT TREND */}
            {analyticsView==="debt"&&(
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Cumulative Sleep Debt · Running Total</div>
                <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7,marginBottom:14}}>
                  Each bar shows cumulative debt up to that night. Green = paid off. Rising = debt accumulating.
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:100,paddingBottom:22,position:"relative"}}>
                  {(()=>{
                    let cumulative = 0;
                    return mainLogs.slice(0,parseInt(analyticsRange)).slice().reverse().map((log,i)=>{
                      const shortfall = Math.max(0, sleepGoalHours - log.duration);
                      cumulative += shortfall;
                      const pct = Math.min((cumulative/14)*100, 100);
                      const c = cumulative>=5?CRIMSON:cumulative>=2?AMBER:GREEN;
                      return (
                        <div key={log.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
                          <div style={{width:"100%",height:`${Math.max(pct,4)}%`,background:`linear-gradient(180deg,${c},${c}25)`,borderRadius:"2px 2px 0 0"}}/>
                          <span style={{position:"absolute",bottom:-18,fontSize:5,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                            {new Date(log.date+"T00:00:00").toLocaleDateString([],{month:"numeric",day:"numeric"})}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div style={{marginTop:14,padding:"10px",background:`${CRIMSON}06`,border:`1px solid ${CRIMSON}15`}}>
                  <div style={{fontSize:8,color:`${CRIMSON}80`,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7}}>
                    Total debt: <span style={{color:CRIMSON,fontWeight:700}}>{sleepDebt}h</span> over 14 nights. 
                    Recovery plan: Add 1–1.5h sleep per night for {Math.ceil(sleepDebt/1.2)} nights to eliminate deficit.
                  </div>
                </div>
              </div>
            )}

            {/* HRV TREND */}
            {analyticsView==="hrv"&&(
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>HRV · Resting Heart Rate Trend</div>
                <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7,marginBottom:12}}>
                  Higher HRV = better recovery. Lower RHR = stronger cardiovascular base. Log with HRV-capable wearable.
                </div>
                {mainLogs.some(l=>l.hrv) ? (
                  <>
                    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:90,paddingBottom:20,position:"relative",marginBottom:20}}>
                      {mainLogs.filter(l=>l.hrv).slice(0,parseInt(analyticsRange)).slice().reverse().map((log,i)=>{
                        const pct = Math.max(((log.hrv||0)/120)*100, 4);
                        const c = log.hrv>=60?GREEN:log.hrv>=40?GOLD:CRIMSON;
                        return (
                          <div key={log.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
                            <div style={{fontSize:6,color:c,fontFamily:"'Space Mono',monospace"}}>{log.hrv}</div>
                            <div style={{width:"100%",height:`${pct}%`,background:`linear-gradient(180deg,${c},${c}20)`,borderRadius:"2px 2px 0 0",minHeight:4}}/>
                            <span style={{position:"absolute",bottom:-16,fontSize:5,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                              {new Date(log.date+"T00:00:00").toLocaleDateString([],{month:"numeric",day:"numeric"})}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[
                        {label:"HRV Zones",items:[{r:"60+",c:GREEN,l:"Excellent recovery"},{r:"40–59",c:GOLD,l:"Good recovery"},{r:"<40",c:CRIMSON,l:"Poor — rest needed"}]},
                        {label:"RHR Zones",items:[{r:"<55",c:GREEN,l:"Athletic"},{r:"55–65",c:GOLD,l:"Healthy"},{r:"65+",c:CRIMSON,l:"Elevated — stress"}]},
                      ].map((group,i)=>(
                        <div key={i}>
                          <div style={{fontSize:6,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:6}}>{group.label}</div>
                          {group.items.map((item,j)=>(
                            <div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:item.c,flexShrink:0}}/>
                              <span style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{item.r} — {item.l}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{padding:"20px",textAlign:"center",color:TEXTMU,fontSize:8,fontFamily:"'Space Mono',monospace",lineHeight:1.8}}>
                    No HRV data yet. When logging sleep, enter your HRV from a wearable (Oura, Whoop, Garmin, Apple Watch) to unlock this chart.
                  </div>
                )}
              </div>
            )}

            {/* CONSISTENCY */}
            {analyticsView==="consistency"&&(
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Sleep Consistency Score</div>
                <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7,marginBottom:14}}>
                  Consistency = low variance in both duration AND schedule. High variability harms circadian rhythm even if total hours are adequate.
                </div>
                {(()=>{
                  const recent = mainLogs.slice(0, parseInt(analyticsRange));
                  if (recent.length < 3) return <div style={{color:TEXTMU,fontSize:8,fontFamily:"'Space Mono',monospace",padding:"14px 0"}}>Need at least 3 entries for consistency analysis.</div>;
                  const avg = recent.reduce((a,b)=>a+b.duration,0)/recent.length;
                  const variance = recent.reduce((a,b)=>a+Math.pow(b.duration-avg,2),0)/recent.length;
                  const stdDev = Math.sqrt(variance);
                  const consistScore = Math.max(0, Math.round(100 - stdDev*25));
                  const nights7plus = recent.filter(l=>l.duration>=7).length;
                  const pct = Math.round((nights7plus/recent.length)*100);
                  return (
                    <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                        {[
                          {label:"Consistency",val:`${consistScore}`,unit:"/100",col:consistScore>=70?GREEN:consistScore>=50?GOLD:CRIMSON},
                          {label:"Std Dev",val:stdDev.toFixed(1),unit:"h",col:stdDev<0.5?GREEN:stdDev<1?GOLD:CRIMSON},
                          {label:"Goal Hit",val:`${pct}`,unit:"%",col:pct>=70?GREEN:pct>=50?GOLD:CRIMSON},
                        ].map((s,i)=>(
                          <div key={i} style={{padding:"10px 8px",background:BG3,border:`1px solid ${BORDER}18`,textAlign:"center"}}>
                            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}<span style={{fontSize:12}}>{s.unit}</span></div>
                            <div style={{fontSize:6,letterSpacing:".12em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginTop:3}}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:5,marginBottom:6}}>
                        {recent.slice().reverse().map((log,i)=>{
                          const onTrack = log.duration >= sleepGoalHours;
                          return (
                            <div key={i} style={{flex:1,height:24,borderRadius:2,background:onTrack?`${GREEN}25`:log.duration>=sleepGoalHours*0.85?`${GOLD}20`:`${CRIMSON}20`,border:`1px solid ${onTrack?GREEN:log.duration>=sleepGoalHours*0.85?GOLD:CRIMSON}25`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <div style={{width:4,height:4,borderRadius:"50%",background:onTrack?GREEN:log.duration>=sleepGoalHours*0.85?GOLD:CRIMSON}}/>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7}}>
                        {stdDev < 0.5 ? `Elite consistency (${stdDev.toFixed(1)}h std dev). Circadian rhythm is well-anchored.` 
                          : stdDev < 1 ? `Good consistency. Small improvements in schedule will push sleep quality higher.`
                          : `High variability (${stdDev.toFixed(1)}h std dev) detected. Fix wake time first — it's the master circadian anchor.`}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══════════ RECOVERY TAB (NEW) ══════════ */}
        {tab==="recovery"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Recovery Dashboard</div>
                  <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em"}}>Multi-signal recovery assessment</div>
                </div>
                <RecoveryRing score={recovery}/>
              </div>

              {/* Recovery breakdown */}
              {[
                {label:"Sleep Duration",val:`${mainLogs[0]?.duration||0}h`,goal:`Goal: ${sleepGoalHours}h`,score:mainLogs[0]?Math.round(Math.min(100,(mainLogs[0].duration/sleepGoalHours)*100)):0,col:mainLogs[0]?.duration>=sleepGoalHours?GREEN:GOLD},
                {label:"Sleep Quality",val:`${mainLogs[0]?.quality||0}/10`,goal:"Target: 7+",score:mainLogs[0]?Math.round(mainLogs[0].quality*10):0,col:mainLogs[0]?.quality>=7?GREEN:GOLD},
                {label:"HRV",val:mainLogs[0]?.hrv?`${mainLogs[0].hrv}ms`:"—",goal:"Baseline: 45ms",score:mainLogs[0]?.hrv?Math.round(Math.min(100,(mainLogs[0].hrv/80)*100)):50,col:mainLogs[0]?.hrv>=50?GREEN:mainLogs[0]?.hrv>=35?GOLD:CRIMSON},
                {label:"Resting HR",val:mainLogs[0]?.rhr?`${mainLogs[0].rhr}bpm`:"—",goal:"Target: <60",score:mainLogs[0]?.rhr?Math.round(Math.min(100,((80-mainLogs[0].rhr)/25)*100)):50,col:mainLogs[0]?.rhr<=58?GREEN:mainLogs[0]?.rhr<=65?GOLD:CRIMSON},
                {label:"Blood Oxygen",val:mainLogs[0]?.spo2?`${mainLogs[0].spo2}%`:"—",goal:"Normal: ≥95%",score:mainLogs[0]?.spo2?Math.round(Math.min(100,((mainLogs[0].spo2-90)/10)*100)):50,col:mainLogs[0]?.spo2>=97?GREEN:mainLogs[0]?.spo2>=95?GOLD:CRIMSON},
              ].map((m,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,paddingBottom:10,borderBottom:i<4?`1px solid ${BORDER}18`:""}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:8,color:TEXTM,fontFamily:"'Space Mono',monospace",letterSpacing:".04em"}}>{m.label}</span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{m.goal}</span>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:m.col}}>{m.val}</span>
                      </div>
                    </div>
                    <div style={{height:3,background:"#0e0a06",borderRadius:2}}>
                      <div style={{height:"100%",width:`${Math.max(m.score,4)}%`,background:m.col,borderRadius:2,transition:"width .8s ease",boxShadow:`0 0 6px ${m.col}30`}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 7-day recovery trend */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>7-Night Recovery Trend</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:5,height:80,paddingBottom:20,position:"relative"}}>
                {mainLogs.slice(0,7).reverse().map((log,i)=>{
                  const rec = RECOVERY_FN(log, null);
                  const pct = rec ? (rec/100)*100 : 40;
                  const c = rec>=70?GREEN:rec>=50?GOLD:CRIMSON;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
                      <div style={{fontSize:6,color:c,fontFamily:"'Space Mono',monospace"}}>{rec||"?"}</div>
                      <div style={{width:"100%",height:`${Math.max(pct,5)}%`,background:`linear-gradient(180deg,${c},${c}20)`,borderRadius:"2px 2px 0 0",minHeight:4}}/>
                      <span style={{position:"absolute",bottom:-16,fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                        {new Date(log.date+"T00:00:00").toLocaleDateString([],{weekday:"short"})}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SpO2 history */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>SpO₂ Blood Oxygen · 14-Night History</div>
              <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7,marginBottom:12}}>
                Normal: 95–100%. Below 90%: hypoxemia — see a doctor. Chronic dips may indicate sleep apnea.
              </div>
              {mainLogs.some(l=>l.spo2) ? (
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:70,paddingBottom:20,position:"relative"}}>
                  {mainLogs.filter(l=>l.spo2).slice(0,14).slice().reverse().map((log,i)=>{
                    const pct = ((log.spo2-90)/12)*100;
                    const c = log.spo2>=97?GREEN:log.spo2>=95?GOLD:CRIMSON;
                    return (
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
                        <div style={{fontSize:5,color:c,fontFamily:"'Space Mono',monospace"}}>{log.spo2}</div>
                        <div style={{width:"100%",height:`${Math.max(pct,5)}%`,background:c,borderRadius:"2px 2px 0 0",opacity:0.7,minHeight:4}}/>
                        <span style={{position:"absolute",bottom:-16,fontSize:5,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                          {new Date(log.date+"T00:00:00").toLocaleDateString([],{month:"numeric",day:"numeric"})}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{position:"absolute",left:0,right:0,bottom:`${20+((95-90)/12)*60}px`,borderTop:`1px dashed ${AMBER}40`,pointerEvents:"none"}}>
                    <span style={{fontSize:5,color:`${AMBER}60`,paddingLeft:2,fontFamily:"'Space Mono',monospace"}}>95%</span>
                  </div>
                </div>
              ) : (
                <div style={{padding:"16px",textAlign:"center",color:TEXTMU,fontSize:8,fontFamily:"'Space Mono',monospace",lineHeight:1.8}}>
                  Log SpO₂ readings from a pulse oximeter or smartwatch to track blood oxygen during sleep.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ AI INSIGHTS (NEW) ══════════ */}
        {tab==="insights"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${GOLD}15`,background:`${GOLD}04`,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}60`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>AI Sleep Analyst</div>
                <div style={{fontSize:6,letterSpacing:".1em",color:CRIMSON,fontFamily:"'Space Mono',monospace",background:`${CRIMSON}12`,border:`1px solid ${CRIMSON}25`,padding:"2px 7px",textTransform:"uppercase"}}>EXCLUSIVE</div>
              </div>
              <div style={{fontSize:8,color:TEXTMU,letterSpacing:".04em",lineHeight:1.8,fontFamily:"'Space Mono',monospace"}}>
                Personalized insights from your sleep data. Updates every time you log. Analyzes: duration, quality, HRV, RHR, consistency, habits, sleep debt.
              </div>
            </div>

            {insights.map((insight, i) => (
              <div key={i} className="insight-card" style={{animationDelay:`${i*80}ms`,border:`1px solid ${insight.color}18`,background:BG2}}>
                <div onClick={()=>setInsightExpanded(insightExpanded===i?null:i)}
                  style={{display:"flex",gap:12,padding:"16px",cursor:"pointer",alignItems:"flex-start"}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:`${insight.color}12`,border:`1.5px solid ${insight.color}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
                    {insight.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,color:insight.color,fontFamily:"'Cormorant Garamond',serif",marginBottom:5,letterSpacing:".02em"}}>{insight.title}</div>
                    <div style={{fontSize:7,color:`${insight.color}60`,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7,display:insightExpanded===i?"block":"-webkit-box",WebkitLineClamp:insightExpanded===i?undefined:2,WebkitBoxOrient:"vertical",overflow:insightExpanded===i?"visible":"hidden"}}>{insight.body}</div>
                  </div>
                  <div style={{fontSize:8,color:TEXTMU,flexShrink:0,marginTop:2}}>{insightExpanded===i?"▲":"▸"}</div>
                </div>
                {insightExpanded===i&&(
                  <div style={{borderTop:`1px solid ${insight.color}12`,padding:"10px 16px 14px 64px"}}>
                    <div style={{fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:6}}>Priority Level</div>
                    <div style={{display:"flex",gap:4}}>
                      {[1,2,3].map(p=>(
                        <div key={p} style={{width:24,height:5,borderRadius:2,background:p<=insight.priority?`${insight.priority===1?CRIMSON:insight.priority===2?AMBER:GREEN}`:BORDER+"40"}}/>
                      ))}
                      <span style={{fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace",marginLeft:6,letterSpacing:".08em"}}>
                        {insight.priority===1?"HIGH":insight.priority===2?"MEDIUM":"POSITIVE"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:10}}>Insight Quality Improves With</div>
              {[
                {icon:"◈",text:"HRV data from wearable (Oura, Whoop, Garmin)",done:mainLogs.some(l=>l.hrv)},
                {icon:"❤",text:"RHR data logged each night",done:mainLogs.some(l=>l.rhr)},
                {icon:"○",text:"SpO₂ readings for blood oxygen analysis",done:mainLogs.some(l=>l.spo2)},
                {icon:"✦",text:"7+ nights of consistent logging",done:mainLogs.length>=7},
                {icon:"◎",text:"Sleep hygiene habits tracked",done:habits.some(h=>h.done)},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:7,paddingBottom:7,borderBottom:i<4?`1px solid ${BORDER}15`:""}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:item.done?`${GREEN}15`:"transparent",border:`1.5px solid ${item.done?GREEN:BORDER+"40"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {item.done?<span style={{fontSize:9,color:GREEN}}>✓</span>:<span style={{fontSize:8,color:TEXTD}}>{item.icon}</span>}
                  </div>
                  <span style={{fontSize:7,color:item.done?`${GREEN}70`:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ SLEEP TONES ══════════ */}
        {tab==="sounds"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Therapeutic Frequency Engine</div>
              <div style={{fontSize:8,letterSpacing:".06em",color:TEXTMU,lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:14}}>
                Real Web Audio synthesis · Binaural beats · Solfeggio · Brown noise · Zero CDN · Works offline
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {SOUNDS.map(snd=>{
                  const on=activeSound===snd.id;
                  const isExp=expandedSound===snd.id;
                  return (
                    <div key={snd.id} style={{display:"flex",flexDirection:"column"}}>
                      <button className="snd-card sg-btn" onClick={()=>toggleSound(snd)}
                        style={{background:on?`${snd.color}12`:"#070503",border:`1px solid ${on?snd.color+"35":BORDER+"40"}`,
                          color:on?snd.color:TEXTD,fontFamily:"'Space Mono',monospace",padding:"14px 10px",cursor:"pointer",
                          display:"flex",flexDirection:"column",alignItems:"flex-start",gap:5,textAlign:"left",
                          boxShadow:on?`inset 0 0 24px ${snd.color}08`:"",transition:"all .18s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",width:"100%",alignItems:"center"}}>
                          <span style={{fontSize:18,animation:on?"float 3s ease-in-out infinite":""}}>{snd.emoji}</span>
                          {on&&(
                            <div style={{display:"flex",gap:2,alignItems:"flex-end",height:14}}>
                              {[1,2,3,4].map(idx=>(
                                <div key={idx} style={{width:3,background:snd.color,borderRadius:1,animation:`beat ${0.5+idx*0.12}s ease-in-out infinite alternate`,height:[8,14,6,11][idx-1]}}/>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:on?snd.color:TEXTD}}>{snd.label}</div>
                        <div style={{fontSize:7,letterSpacing:".06em",color:on?`${snd.color}70`:TEXTMU,textTransform:"uppercase"}}>{snd.sub}</div>
                      </button>
                      <button onClick={()=>setExpand(isExp?null:snd.id)}
                        style={{background:"transparent",border:`1px solid ${BORDER}25`,borderTop:"none",color:TEXTMU,fontSize:6,fontFamily:"'Space Mono',monospace",letterSpacing:".1em",padding:"5px 8px",cursor:"pointer",textTransform:"uppercase",textAlign:"left"}}>
                        {isExp?"▲ Hide":"▸ Why it works"}
                      </button>
                      {isExp&&(
                        <div className="fu" style={{background:"#080604",border:`1px solid ${GOLD}10`,borderTop:"none",padding:"10px",fontSize:8,color:`${GOLD}55`,lineHeight:1.8,fontFamily:"'Space Mono',monospace"}}>
                          {snd.science}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {activeSound&&(
                <div style={{padding:"12px 14px",background:BG3,border:`1px solid ${GOLD}15`,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:7,letterSpacing:".14em",color:GOLD,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",flex:1}}>Volume · {volume}%</div>
                  <input type="range" min={0} max={100} value={volume} onChange={e=>setVolume(parseInt(e.target.value))}
                    style={{flex:2,background:`linear-gradient(90deg,${GOLD} ${volume}%,#1a1408 0%)`}}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ SLEEP STORIES ══════════ */}
        {tab==="stories"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Sleep Stories</div>
                <div style={{fontSize:6,letterSpacing:".1em",color:CRIMSON,fontFamily:"'Space Mono',monospace",background:`${CRIMSON}12`,border:`1px solid ${CRIMSON}25`,padding:"2px 7px",textTransform:"uppercase"}}>BEATS CALM</div>
              </div>
              <div style={{fontSize:8,color:TEXTMU,letterSpacing:".06em",lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:14}}>
                6 narrative sleep stories. Scene-based imagery deactivates anxiety circuits. 83% faster sleep onset vs silence.
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {SLEEP_STORIES.map((story,i)=>(
                  <button key={story.id} className="story-card sg-btn"
                    onClick={()=>setActiveStory(story)}
                    style={{background:"#070503",border:`1px solid ${BORDER}30`,color:TEXTD,cursor:"pointer",padding:"16px 14px",textAlign:"left",display:"flex",gap:14,alignItems:"flex-start",animationDelay:`${i*40}ms`}}>
                    <span style={{fontSize:28,flexShrink:0,animation:"float 4s ease-in-out infinite",animationDelay:`${i*0.3}s`}}>{story.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,color:TEXTM}}>{story.title}</div>
                        <div style={{fontSize:6,letterSpacing:".1em",color:story.color,fontFamily:"'Space Mono',monospace",textTransform:"uppercase",flexShrink:0,marginLeft:8}}>{story.category}</div>
                      </div>
                      <div style={{fontSize:7,letterSpacing:".1em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:7}}>{story.subtitle}</div>
                      <div style={{fontSize:7,color:`${GOLD}45`,letterSpacing:".04em",lineHeight:1.6,fontFamily:"'Space Mono',monospace"}}>{story.science}</div>
                      <div style={{marginTop:10,fontSize:7,color:story.color,letterSpacing:".08em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",display:"flex",alignItems:"center",gap:6}}>
                        <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:story.color,animation:"storyPulse 2s ease-in-out infinite"}}/>
                        Read Story · {story.paragraphs.length} passages
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ SLEEP STAGES ══════════ */}
        {tab==="stages"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{display:"flex",gap:6}}>
              {[{id:"overview",label:"Overview"},{id:"chart",label:"Hypnogram"},{id:"detail",label:"Science"}].map(v=>(
                <button key={v.id} onClick={()=>setStageView(v.id)} className="sg-btn"
                  style={{flex:1,padding:"8px",background:stageView===v.id?`${GOLD}12`:BG2,border:`1px solid ${stageView===v.id?GOLD+"35":BORDER+"30"}`,
                    color:stageView===v.id?GOLD:TEXTD,fontSize:7,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",cursor:"pointer"}}>
                  {v.label}
                </button>
              ))}
            </div>

            {stageView==="overview"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                  <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:14}}>Typical Stage Distribution · 7.5h Night</div>
                  <div style={{display:"flex",height:28,borderRadius:2,overflow:"hidden",gap:1,marginBottom:8}}>
                    {SLEEP_STAGES.map(s=>(
                      <div key={s.id} style={{flex:s.pct,background:s.color,cursor:"pointer"}}
                        onClick={()=>setSelectedStage(selectedStage===s.id?null:s.id)}/>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
                    {SLEEP_STAGES.map(s=>(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}} onClick={()=>setSelectedStage(selectedStage===s.id?null:s.id)}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:s.color}}/>
                        <span style={{fontSize:7,color:selectedStage===s.id?s.color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{s.shortLabel} {s.pct}%</span>
                      </div>
                    ))}
                  </div>
                  {SLEEP_STAGES.map((stage)=>{
                    const open = selectedStage === stage.id;
                    return (
                      <div key={stage.id} style={{marginBottom:6}}>
                        <div onClick={()=>setSelectedStage(open?null:stage.id)}
                          style={{display:"flex",gap:12,padding:"12px 14px",background:open?`${stage.color}06`:BG3,border:`1px solid ${open?stage.color+"25":BORDER+"18"}`,cursor:"pointer",alignItems:"center"}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:open?`${stage.color}18`:"transparent",border:`2px solid ${open?stage.color:BORDER+"40"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <span style={{fontSize:10,fontWeight:700,color:open?stage.color:TEXTD,fontFamily:"'Space Mono',monospace"}}>{stage.shortLabel}</span>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                              <div style={{fontSize:10,fontWeight:700,color:open?stage.color:TEXTM,fontFamily:"'Cormorant Garamond',serif"}}>{stage.label}</div>
                              <div style={{fontSize:7,color:open?stage.color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{stage.pct}% · {stage.duration}</div>
                            </div>
                            <div style={{height:3,background:"#0e0a06",borderRadius:1}}>
                              <div style={{height:"100%",width:`${stage.pct}%`,background:stage.color,borderRadius:1,boxShadow:`0 0 6px ${stage.color}30`}}/>
                            </div>
                          </div>
                          <div style={{fontSize:8,color:TEXTMU}}>{open?"▲":"▸"}</div>
                        </div>
                        {open&&(
                          <div className="fu" style={{background:`${stage.color}04`,border:`1px solid ${stage.color}15`,borderTop:"none",padding:"14px"}}>
                            <div style={{fontSize:8,color:`${stage.color}80`,letterSpacing:".05em",lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:10}}>{stage.desc}</div>
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:5}}>Brainwaves</div>
                              <div style={{fontSize:8,color:stage.color,fontFamily:"'Space Mono',monospace"}}>{stage.hz}</div>
                              <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{stage.waves}</div>
                            </div>
                            {stage.benefits.length>0&&(
                              <div>
                                <div style={{fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:5}}>What Happens</div>
                                {stage.benefits.map((b,j)=>(
                                  <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                                    <div style={{width:4,height:4,borderRadius:"50%",background:stage.color,flexShrink:0}}/>
                                    <span style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{b}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stageView==="chart"&&(
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
                <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:14}}>Hypnogram · Typical 7.5h Night</div>
                <div style={{position:"relative",height:130,marginBottom:20,overflow:"hidden"}}>
                  {[{label:"REM",y:8},{label:"N2",y:36},{label:"N3",y:64},{label:"N1",y:90},{label:"W",y:112}].map((l,i)=>(
                    <div key={i} style={{position:"absolute",left:0,top:l.y,fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace",width:24,textAlign:"right"}}>{l.label}</div>
                  ))}
                  <div style={{position:"absolute",left:30,right:0,top:0,bottom:24,overflow:"hidden"}}>
                    <svg width="100%" height="100%" viewBox="0 0 270 106" preserveAspectRatio="none">
                      <defs>
                        {SLEEP_STAGES.map(s=>(
                          <linearGradient key={s.id} id={`grad_${s.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color} stopOpacity="0.6"/>
                            <stop offset="100%" stopColor={s.color} stopOpacity="0.1"/>
                          </linearGradient>
                        ))}
                      </defs>
                      {[0,28,56,84].map(y=>(
                        <line key={y} x1="0" y1={y} x2="270" y2={y} stroke={`${GOLD}08`} strokeWidth="0.5"/>
                      ))}
                      {STAGE_CYCLE.map((seg,i)=>{
                        const stageData = SLEEP_STAGES.find(s=>s.id===seg.stage);
                        if(!stageData) return null;
                        const yMap={awake:0,n1:28,n2:56,n3:84,rem:14};
                        const heightMap={awake:20,n1:24,n2:28,n3:20,rem:28};
                        const y = yMap[seg.stage] || 0;
                        const h = heightMap[seg.stage] || 20;
                        const x = (seg.start/270)*270;
                        const w = ((seg.end-seg.start)/270)*270;
                        return <rect key={i} x={x} y={y} width={Math.max(w,1)} height={h} fill={`url(#grad_${seg.stage})`} rx="1"/>;
                      })}
                      {(()=>{
                        const yCenter={awake:10,n1:40,n2:70,n3:94,rem:28};
                        const pts = STAGE_CYCLE.map(seg=>({x:((seg.start+seg.end)/2/270)*270,y:yCenter[seg.stage]||50}));
                        if(pts.length<2) return null;
                        const d = pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(" ");
                        return <path d={d} fill="none" stroke={`${GOLD}40`} strokeWidth="0.8" strokeLinejoin="round"/>;
                      })()}
                    </svg>
                    <div style={{position:"absolute",bottom:-18,left:0,right:0,display:"flex",justifyContent:"space-between"}}>
                      {["0h","1h","2h","3h","4h","5h","6h","7h"].map(t=>(
                        <span key={t} style={{fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(c=>(
                    <div key={c} style={{flex:1,padding:"8px 4px",background:BG3,border:`1px solid ${BORDER}20`,textAlign:"center"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:GOLD}}>{c}</div>
                      <div style={{fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace",marginTop:2}}>{c<=2?"N3 heavy":c<=4?"Balanced":"REM heavy"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stageView==="detail"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {title:"Why Deep Sleep (N3) Is Non-Negotiable",color:GREEN,facts:["Growth hormone: 70-80% of daily GH released during N3 only","Immune: NK cell activity increases 40% with 8h sleep vs 6h","Memory: Hippocampal replay transfers facts to neocortex","Metabolism: Glucose metabolism restores insulin sensitivity","Cellular repair: DNA repair enzymes peak during N3"]},
                  {title:"Why REM Is Your Emotional Reset",color:GOLD2,facts:["Emotional processing: amygdala consolidates fear memories, strips emotion from content","Creativity: remote associations form between unlinked memories","Empathy circuits recharge — REM deprivation reduces facial emotion recognition 20%","REM duration doubles from cycle 1 (10 min) to cycle 5 (60 min)","Dreaming correlates with norepinephrine absence — safe emotional processing"]},
                  {title:"What Destroys Your Architecture",color:CRIMSON,facts:["Alcohol: kills REM entirely in first 3 cycles. Total REM loss: 40%","Screens: delays melatonin 90 min, reduces N3 by 15-25%","Caffeine at 6pm: still 50% active at midnight, suppresses adenosine","Heat: core temp must drop 1°C. Warm room prevents N3 onset","Fragmentation: even brief awakenings destroy slow-wave continuity"]},
                ].map((sec,i)=>(
                  <div key={i} style={{border:`1px solid ${sec.color}14`,background:BG2,padding:"14px"}}>
                    <div style={{fontSize:9,fontWeight:700,color:sec.color,letterSpacing:".06em",fontFamily:"'Space Mono',monospace",marginBottom:10}}>{sec.title}</div>
                    {sec.facts.map((f,j)=>(
                      <div key={j} style={{display:"flex",gap:8,marginBottom:6,paddingBottom:6,borderBottom:j<sec.facts.length-1?`1px solid ${BORDER}18`:"",alignItems:"flex-start"}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:sec.color,flexShrink:0,marginTop:4}}/>
                        <div style={{fontSize:8,color:TEXTMU,letterSpacing:".04em",lineHeight:1.7,fontFamily:"'Space Mono',monospace"}}>{f}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ WIND DOWN ══════════ */}
        {tab==="winddown"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>60-Min Wind Down Routine</div>
              <div style={{fontSize:8,color:TEXTMU,letterSpacing:".06em",lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:14}}>
                Science-sequenced pre-sleep protocol. Complete nightly for 21 days to establish deep sleep conditioning.
              </div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".1em",textTransform:"uppercase"}}>Tonight's Progress</span>
                  <span style={{fontSize:10,color:completedWD.length===WINDDOWN_STEPS.length?GREEN:GOLD,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{completedWD.length}/{WINDDOWN_STEPS.length}</span>
                </div>
                <div style={{height:4,background:"#0e0a06",borderRadius:2}}>
                  <div style={{height:"100%",width:`${(completedWD.length/WINDDOWN_STEPS.length)*100}%`,background:completedWD.length===WINDDOWN_STEPS.length?`linear-gradient(90deg,${GREEN},#059669)`:PROG,transition:"width .6s ease",borderRadius:2}}/>
                </div>
              </div>
              {WINDDOWN_STEPS.map((step)=>{
                const done = completedWD.includes(step.id);
                const open = expandedWD === step.id;
                return (
                  <div key={step.id} style={{marginBottom:6}}>
                    <div className="wd-step" style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:done?"#0d0a05":"#080604",border:`1px solid ${done?step.color+"20":BORDER+"20"}`,cursor:"pointer",position:"relative"}}>
                      <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:7,color:done?`${step.color}60`:`${GOLD}25`,fontFamily:"'Space Mono',monospace"}}>{step.time===0?"Bed":`-${step.time}m`}</div>
                      <div onClick={()=>toggleWD(step.id)} style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${done?step.color:TEXTD}`,background:done?step.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .18s",cursor:"pointer",boxShadow:done?`0 0 10px ${step.color}35`:""}}>
                        {done&&<span style={{fontSize:11,color:"#040200",fontWeight:700}}>✓</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flex:1}} onClick={()=>setExpandedWD(open?null:step.id)}>
                        <span style={{fontSize:16,flexShrink:0}}>{step.icon}</span>
                        <div>
                          <div style={{fontSize:9,letterSpacing:".06em",color:done?`${step.color}90`:TEXTMU,fontFamily:"'Space Mono',monospace",textDecoration:done?"line-through":"none"}}>{step.label}</div>
                          <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",marginTop:1}}>{step.soundRec}</div>
                        </div>
                      </div>
                      <div onClick={()=>setExpandedWD(open?null:step.id)} style={{fontSize:8,color:TEXTMU,cursor:"pointer",marginRight:40}}>{open?"▲":"▸"}</div>
                    </div>
                    {open&&(
                      <div className="fu" style={{background:"#080604",border:`1px solid ${step.color}12`,borderTop:"none",padding:"12px 14px 12px 50px",display:"flex",flexDirection:"column",gap:8}}>
                        <div style={{fontSize:8,color:`${step.color}80`,letterSpacing:".05em",lineHeight:1.8,fontFamily:"'Space Mono',monospace"}}>{step.desc}</div>
                        <div style={{borderLeft:`2px solid ${step.color}25`,paddingLeft:10}}>
                          <div style={{fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:3}}>Science</div>
                          <div style={{fontSize:7,color:TEXTMU,letterSpacing:".04em",lineHeight:1.7,fontFamily:"'Space Mono',monospace"}}>{step.science}</div>
                        </div>
                        <div style={{fontSize:7,color:`${GOLD}45`,fontFamily:"'Space Mono',monospace"}}>🎵 Pair with: {step.soundRec}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {completedWD.length===WINDDOWN_STEPS.length&&(
                <div className="fu" style={{marginTop:10,padding:"16px",background:`${GREEN}08`,border:`1px solid ${GREEN}25`,textAlign:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:GREEN,marginBottom:4}}>✦ Routine Complete</div>
                  <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".06em",lineHeight:1.8}}>Your body is primed for elite sleep. Activate a tone and begin a story.</div>
                </div>
              )}
            </div>
            <button onClick={()=>setCompletedWD([])} style={{background:"transparent",border:`1px solid ${BORDER}30`,color:TEXTMU,fontSize:7,letterSpacing:".14em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",padding:"8px 12px",cursor:"pointer"}}>
              ↺ Reset Tonight's Checklist
            </button>
          </div>
        )}

        {/* ══════════ BREATHE ══════════ */}
        {tab==="breathe"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>4-7-8 Breathing · Parasympathetic Activation</div>
              <div style={{fontSize:8,color:TEXTMU,letterSpacing:".06em",lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:0}}>Developed by Dr. Andrew Weil · Activates vagus nerve · Reduces cortisol</div>
              <BreathEngine active={breathActive}/>
              <button className="sg-btn" onClick={()=>{ setBreath(v=>!v); if(!breathActive) speak(ph(lang,"breathe")); }}
                style={{width:"100%",padding:"15px",background:breathActive?`${GOLD}10`:`linear-gradient(135deg,${GOLD}20,${GOLD}08)`,color:GOLD,border:`1px solid ${GOLD}35`,fontSize:12,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer"}}>
                {breathActive?"⏹  Stop Breathing Guide":"▶  Start 4-7-8 Guide"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ LOG ══════════ */}
        {tab==="log"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:7,letterSpacing:".2em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Sleep Journal · {mainLogs.length} Entries</div>
              <button className="sg-btn" onClick={()=>setShowLog(true)}
                style={{background:`${GOLD}15`,color:GOLD,border:`1px solid ${GOLD}35`,fontSize:8,fontWeight:700,fontFamily:"'Space Mono',monospace",letterSpacing:".1em",textTransform:"uppercase",padding:"9px 16px",cursor:"pointer"}}>
                + Log Sleep
              </button>
            </div>
            {mainLogs.map((log,i)=>{
              const c=log.duration>=7?GREEN:log.duration>=6?GOLD:CRIMSON;
              const qc=log.quality>=7?GREEN:log.quality>=5?GOLD:CRIMSON;
              return (
                <div key={log.id} className="fu" style={{border:`1px solid ${c}12`,background:BG2,padding:"14px 16px",animationDelay:`${i*35}ms`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:log.hrv||log.rhr||log.spo2?8:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0,boxShadow:`0 0 8px ${c}50`}}/>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:TEXTM,marginBottom:3,fontFamily:"'Space Mono',monospace"}}>{log.date}</div>
                        <div style={{fontSize:7,letterSpacing:".06em",color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{log.notes||"No notes"}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:c,lineHeight:1}}>{log.duration}h</div>
                      <div style={{fontSize:7,letterSpacing:".12em",color:qc,textTransform:"uppercase",marginTop:2,fontFamily:"'Space Mono',monospace"}}>Q:{log.quality}/10</div>
                    </div>
                  </div>
                  {(log.hrv||log.rhr||log.spo2)&&(
                    <div style={{display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${BORDER}20`}}>
                      {log.hrv&&<div style={{fontSize:7,color:`${GREEN}60`,fontFamily:"'Space Mono',monospace"}}>HRV: {log.hrv}ms</div>}
                      {log.rhr&&<div style={{fontSize:7,color:`${GOLD}60`,fontFamily:"'Space Mono',monospace"}}>RHR: {log.rhr}bpm</div>}
                      {log.spo2&&<div style={{fontSize:7,color:`${GOLD2}60`,fontFamily:"'Space Mono',monospace"}}>SpO₂: {log.spo2}%</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ NAPS (NEW) ══════════ */}
        {tab==="naps"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Nap Tracker</div>
                  <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em"}}>Separate from main sleep. {napLogs.length} naps logged.</div>
                </div>
                <button className="sg-btn" onClick={()=>setShowNapLog(true)}
                  style={{background:`${GOLD}12`,color:GOLD,border:`1px solid ${GOLD}30`,fontSize:8,fontFamily:"'Space Mono',monospace",letterSpacing:".08em",padding:"9px 14px",cursor:"pointer"}}>
                  + Log Nap
                </button>
              </div>

              {/* Nap science */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:6,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:8}}>Nap Science · Optimal Timing</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {duration:"10–20 min",name:"Power Nap",col:GREEN,effect:"Alertness +34%, motor performance +16%. Avoids sleep inertia. NASA protocol."},
                    {duration:"30 min",name:"Stage 2 Nap",col:GOLD,effect:"Memory consolidation. May cause brief grogginess on waking. Take before 3pm."},
                    {duration:"60 min",name:"Slow Wave Nap",col:AMBER,effect:"Perceptual learning boost. Significant sleep inertia (15-30 min grogginess)."},
                    {duration:"90 min",name:"Full Cycle Nap",col:CRIMSON,effect:"Complete sleep cycle. Emotional + motor memory. High circadian disruption risk."},
                  ].map((n,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",background:BG3,border:`1px solid ${n.col}12`}}>
                      <div style={{width:60,flexShrink:0}}>
                        <div style={{fontSize:8,fontWeight:700,color:n.col,fontFamily:"'Space Mono',monospace"}}>{n.duration}</div>
                        <div style={{fontSize:6,color:`${n.col}60`,fontFamily:"'Space Mono',monospace",marginTop:2}}>{n.name}</div>
                      </div>
                      <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.6}}>{n.effect}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circadian nap timing */}
              <div style={{padding:"12px",background:BG3,border:`1px solid ${GOLD}10`,marginBottom:14}}>
                <div style={{fontSize:6,letterSpacing:".14em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:6}}>Optimal Nap Window</div>
                <div style={{fontSize:8,color:TEXTMU,fontFamily:"'Space Mono',monospace",letterSpacing:".04em",lineHeight:1.7}}>
                  1:00–3:00 PM: Natural circadian dip. Body temperature drops. Ideal window for a 10-20 min nap. 
                  <span style={{color:`${CRIMSON}70`}}> After 3pm: disrupts nighttime sleep by 30+ min.</span>
                </div>
              </div>

              {/* Logged naps */}
              {napLogs.length > 0 ? (
                <>
                  <div style={{fontSize:6,letterSpacing:".18em",color:`${GOLD}40`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:8}}>Logged Naps</div>
                  {napLogs.map((log,i)=>{
                    const c = log.duration<=0.4?GREEN:log.duration<=0.6?GOLD:log.duration<=1?AMBER:CRIMSON;
                    const napType = log.duration<=0.35?"Power":log.duration<=0.5?"Stage 2":log.duration<=1.1?"Slow Wave":"Full Cycle";
                    return (
                      <div key={log.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:BG3,border:`1px solid ${c}12`,marginBottom:5}}>
                        <div>
                          <div style={{fontSize:8,color:TEXTM,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{log.date}</div>
                          <div style={{fontSize:7,color:TEXTMU,fontFamily:"'Space Mono',monospace",marginTop:2}}>{log.notes||"No notes"}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:c}}>{log.duration}h</div>
                          <div style={{fontSize:6,color:`${c}60`,fontFamily:"'Space Mono',monospace",letterSpacing:".08em"}}>{napType}</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{padding:"20px",textAlign:"center",color:TEXTMU,fontSize:8,fontFamily:"'Space Mono',monospace",lineHeight:1.8}}>
                  No naps logged yet. Use the button above to track today's nap.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ HABITS ══════════ */}
        {tab==="habits"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:14}}>Sleep Hygiene Checklist · Tonight</div>
              {habits.map((h)=>{
                const sci=showHabitScience===h.id;
                return (
                  <div key={h.id} style={{marginBottom:6}}>
                    <div onClick={()=>toggleHabit(h.id)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:h.done?"#0e0b06":BG3,border:`1px solid ${h.done?GOLD+"20":BORDER+"20"}`,cursor:"pointer",transition:"all .16s"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${h.done?GOLD:TEXTD}`,background:h.done?GOLD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .16s",boxShadow:h.done?`0 0 10px ${GOLD}35`:""}}>
                        {h.done&&<span style={{fontSize:11,color:"#040200",fontWeight:700}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,letterSpacing:".04em",color:h.done?`${GOLD}80`:TEXTMU,textDecoration:h.done?"line-through":"none",fontFamily:"'Space Mono',monospace"}}>{h.label}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setShowSci(sci?null:h.id);}}
                        style={{background:"transparent",border:"none",color:TEXTMU,fontSize:8,cursor:"pointer",fontFamily:"'Space Mono',monospace",padding:"2px 6px"}}>{sci?"▲":"▸"}</button>
                    </div>
                    {sci&&(
                      <div className="fu" style={{background:"#080604",border:`1px solid ${GOLD}10`,borderTop:"none",padding:"10px 14px 10px 48px",fontSize:8,color:`${GOLD}55`,lineHeight:1.8,letterSpacing:".05em",fontFamily:"'Space Mono',monospace"}}>
                        {h.science}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{marginTop:12,display:"flex",justifyContent:"space-between",fontSize:7,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>
                <span>{habits.filter(h=>h.done).length}/{habits.length} completed</span>
                <span style={{color:GOLD}}>{Math.round((habits.filter(h=>h.done).length/habits.length)*100)}%</span>
              </div>
              <div style={{height:3,background:"#0e0a06",marginTop:8,borderRadius:2}}>
                <div style={{height:"100%",width:`${(habits.filter(h=>h.done).length/habits.length)*100}%`,background:PROG,transition:"width .6s ease",borderRadius:2,boxShadow:`0 0 8px ${GOLD}30`}}/>
              </div>
            </div>
          </div>
        )}

        <div style={{textAlign:"center",fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",paddingTop:8}}>
          ManifiX SleepGold v3 · WHO {WHO.code} · SDG 3.4 · 12 Tabs · 10 Tones · 6 Stories · HRV · Recovery · AI Insights
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {showLog && <LogModal isNap={false} onClose={()=>setShowLog(false)}/>}
      {showNapLog && <LogModal isNap={true} onClose={()=>setShowNapLog(false)}/>}

      {activeStory&&(
        <StoryReader story={activeStory} onClose={()=>setActiveStory(null)} lang={lang} speak={speak}/>
      )}
    </div>
  );
}
