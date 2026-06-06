import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ════════════════════════════════════════════════════════════
   THEME
════════════════════════════════════════════════════════════ */
const T = {
  accent:      "#00ff87",
  accentDim:   "#00cc6a",
  accentGlow:  "rgba(0,255,135,0.08)",
  accentDark:  "#003d20",
  blue:        "#60a5fa",
  yellow:      "#fcd34d",
  red:         "#f87171",
  purple:      "#c084fc",
  orange:      "#fb923c",
  teal:        "#34d399",
  pink:        "#f472b6",
  bg:          "#050a07",
  bgMid:       "#080f0a",
  card:        "#0a120c",
  cardMid:     "#0d1a0f",
  border:      "#0f2214",
  borderMid:   "#152b1a",
  textPrimary: "#f0fdf4",
  textMid:     "#86efac",
  textDim:     "#166534",
  voiceRate:   0.9,
  voicePitch:  0.97,
};

const LIGHT_CONFIG = {
  green:  { label:"Go",      color:"#22c55e", bg:"rgba(34,197,94,0.1)",   desc:"Eat freely — nutrient-dense, low calorie density" },
  yellow: { label:"Slow",    color:"#fcd34d", bg:"rgba(252,211,77,0.1)",  desc:"Eat mindfully — moderate calorie density" },
  red:    { label:"Careful", color:"#f87171", bg:"rgba(248,113,113,0.1)", desc:"Limit — high calorie density, low nutrients" },
};

/* ════════════════════════════════════════════════════════════
   FOOD DATABASE (Indian + Global)
════════════════════════════════════════════════════════════ */
const FOOD_DB = {
  rice:       { name:"Rice (cooked)",            calories:130, protein:2.7,  carbs:28,  fat:0.3,  fiber:0.4, icon:"🍚", iron:0.2, calcium:10,  vitC:0,   vitD:0,   light:"yellow", satiety:55 },
  roti:       { name:"Roti / Chapati",           calories:104, protein:3.3,  carbs:18,  fat:2.1,  fiber:2.5, icon:"🫓", iron:1.5, calcium:20,  vitC:0,   vitD:0,   light:"yellow", satiety:68 },
  oats:       { name:"Oats (cooked)",            calories:71,  protein:2.5,  carbs:12,  fat:1.4,  fiber:2,   icon:"🥣", iron:1.7, calcium:54,  vitC:0,   vitD:0,   light:"green",  satiety:83 },
  chicken:    { name:"Chicken Breast (grilled)", calories:165, protein:31,   carbs:0,   fat:3.6,  fiber:0,   icon:"🍗", iron:1.0, calcium:15,  vitC:0,   vitD:0.3, light:"green",  satiety:90 },
  dal:        { name:"Dal / Lentils",            calories:116, protein:9,    carbs:20,  fat:0.4,  fiber:8,   icon:"🥘", iron:3.3, calcium:40,  vitC:1.5, vitD:0,   light:"green",  satiety:85 },
  egg:        { name:"Egg (boiled)",             calories:78,  protein:6.3,  carbs:0.6, fat:5.3,  fiber:0,   icon:"🥚", iron:1.2, calcium:28,  vitC:0,   vitD:1.1, light:"green",  satiety:88 },
  fish:       { name:"Fish (grilled)",           calories:206, protein:22,   carbs:0,   fat:12,   fiber:0,   icon:"🐟", iron:0.8, calcium:30,  vitC:0,   vitD:5.6, light:"green",  satiety:87 },
  tofu:       { name:"Tofu",                     calories:76,  protein:8,    carbs:1.9, fat:4.8,  fiber:0.3, icon:"🫘", iron:1.6, calcium:200, vitC:0,   vitD:0,   light:"green",  satiety:75 },
  spinach:    { name:"Spinach (cooked)",         calories:23,  protein:3,    carbs:3.6, fat:0.3,  fiber:2.4, icon:"🥬", iron:3.6, calcium:245, vitC:18,  vitD:0,   light:"green",  satiety:72 },
  tomato:     { name:"Tomato",                   calories:18,  protein:0.9,  carbs:3.9, fat:0.2,  fiber:1.2, icon:"🍅", iron:0.3, calcium:10,  vitC:14,  vitD:0,   light:"green",  satiety:65 },
  carrot:     { name:"Carrot",                   calories:41,  protein:0.9,  carbs:10,  fat:0.2,  fiber:2.8, icon:"🥕", iron:0.3, calcium:33,  vitC:6,   vitD:0,   light:"green",  satiety:70 },
  potato:     { name:"Potato (boiled)",          calories:87,  protein:2.5,  carbs:20,  fat:0.1,  fiber:2.2, icon:"🥔", iron:0.6, calcium:8,   vitC:13,  vitD:0,   light:"yellow", satiety:78 },
  banana:     { name:"Banana",                   calories:89,  protein:1.1,  carbs:23,  fat:0.3,  fiber:2.6, icon:"🍌", iron:0.3, calcium:5,   vitC:9,   vitD:0,   light:"green",  satiety:74 },
  apple:      { name:"Apple",                    calories:52,  protein:0.3,  carbs:14,  fat:0.2,  fiber:2.4, icon:"🍎", iron:0.1, calcium:6,   vitC:5,   vitD:0,   light:"green",  satiety:76 },
  mango:      { name:"Mango",                    calories:60,  protein:0.8,  carbs:15,  fat:0.4,  fiber:1.6, icon:"🥭", iron:0.2, calcium:11,  vitC:36,  vitD:0,   light:"green",  satiety:68 },
  orange:     { name:"Orange",                   calories:47,  protein:0.9,  carbs:12,  fat:0.1,  fiber:2.4, icon:"🍊", iron:0.1, calcium:40,  vitC:53,  vitD:0,   light:"green",  satiety:72 },
  milk:       { name:"Milk (whole)",             calories:61,  protein:3.2,  carbs:4.8, fat:3.3,  fiber:0,   icon:"🥛", iron:0.1, calcium:120, vitC:0,   vitD:1.2, light:"yellow", satiety:69 },
  curd:       { name:"Curd / Yogurt",            calories:59,  protein:3.5,  carbs:4.7, fat:3.3,  fiber:0,   icon:"🍶", iron:0.1, calcium:110, vitC:0,   vitD:0.1, light:"green",  satiety:73 },
  nuts:       { name:"Mixed Nuts (30g)",         calories:185, protein:5,    carbs:6,   fat:16,   fiber:3,   icon:"🥜", iron:1.2, calcium:35,  vitC:0,   vitD:0,   light:"yellow", satiety:80 },
  bread:      { name:"Whole Wheat Bread",        calories:81,  protein:4,    carbs:14,  fat:1.1,  fiber:2,   icon:"🍞", iron:1.2, calcium:30,  vitC:0,   vitD:0,   light:"yellow", satiety:62 },
  cheese:     { name:"Cheese (cheddar)",         calories:113, protein:7,    carbs:0.4, fat:9.3,  fiber:0,   icon:"🧀", iron:0.2, calcium:200, vitC:0,   vitD:0.2, light:"red",    satiety:70 },
  idli:       { name:"Idli (2 pcs)",             calories:138, protein:3.4,  carbs:28,  fat:0.4,  fiber:1.2, icon:"🫔", iron:0.5, calcium:15,  vitC:0,   vitD:0,   light:"green",  satiety:72 },
  dosa:       { name:"Plain Dosa",               calories:168, protein:3.8,  carbs:30,  fat:3.7,  fiber:1.5, icon:"🥞", iron:0.6, calcium:20,  vitC:0,   vitD:0,   light:"yellow", satiety:68 },
  sambar:     { name:"Sambar (1 cup)",           calories:95,  protein:4.2,  carbs:14,  fat:2.1,  fiber:4.5, icon:"🥣", iron:2.1, calcium:45,  vitC:8,   vitD:0,   light:"green",  satiety:80 },
  paneer:     { name:"Paneer (100g)",            calories:265, protein:18,   carbs:3.4, fat:20,   fiber:0,   icon:"🧈", iron:0.5, calcium:480, vitC:0,   vitD:0,   light:"red",    satiety:82 },
  rajma:      { name:"Rajma (kidney beans)",     calories:127, protein:8.7,  carbs:22,  fat:0.5,  fiber:6.4, icon:"🫘", iron:2.9, calcium:43,  vitC:2,   vitD:0,   light:"green",  satiety:86 },
  poha:       { name:"Poha (cooked)",            calories:180, protein:2.6,  carbs:35,  fat:3.8,  fiber:1.2, icon:"🍚", iron:7.2, calcium:13,  vitC:0,   vitD:0,   light:"yellow", satiety:65 },
  upma:       { name:"Upma (1 cup)",             calories:220, protein:4.1,  carbs:32,  fat:8.2,  fiber:2.1, icon:"🥣", iron:1.8, calcium:22,  vitC:0,   vitD:0,   light:"yellow", satiety:70 },
  pizza:      { name:"Pizza (1 slice)",          calories:285, protein:12,   carbs:36,  fat:10,   fiber:2.5, icon:"🍕", iron:2.0, calcium:189, vitC:2,   vitD:0,   light:"red",    satiety:60 },
  burger:     { name:"Veg Burger",               calories:354, protein:12,   carbs:42,  fat:17,   fiber:3.2, icon:"🍔", iron:3.1, calcium:80,  vitC:4,   vitD:0,   light:"red",    satiety:62 },
  salad:      { name:"Green Salad",              calories:35,  protein:2.1,  carbs:6.5, fat:0.4,  fiber:2.8, icon:"🥗", iron:1.2, calcium:55,  vitC:25,  vitD:0,   light:"green",  satiety:58 },
  avocado:    { name:"Avocado (half)",           calories:160, protein:2,    carbs:9,   fat:15,   fiber:7,   icon:"🥑", iron:0.6, calcium:12,  vitC:10,  vitD:0,   light:"green",  satiety:88 },
  broccoli:   { name:"Broccoli (cooked)",        calories:55,  protein:3.7,  carbs:11,  fat:0.6,  fiber:5.1, icon:"🥦", iron:1.0, calcium:62,  vitC:84,  vitD:0,   light:"green",  satiety:76 },
  sweet_pot:  { name:"Sweet Potato",             calories:103, protein:2.3,  carbs:24,  fat:0.1,  fiber:3.8, icon:"🍠", iron:0.7, calcium:39,  vitC:20,  vitD:0,   light:"green",  satiety:80 },
  greek_yog:  { name:"Greek Yogurt (150g)",      calories:100, protein:17,   carbs:6,   fat:0.7,  fiber:0,   icon:"🥛", iron:0.1, calcium:200, vitC:0,   vitD:0,   light:"green",  satiety:88 },
  almonds:    { name:"Almonds (28g)",            calories:164, protein:6,    carbs:6,   fat:14,   fiber:3.5, icon:"🌰", iron:1.0, calcium:76,  vitC:0,   vitD:0,   light:"yellow", satiety:82 },
  watermelon: { name:"Watermelon (200g)",        calories:61,  protein:1.2,  carbs:15,  fat:0.3,  fiber:0.8, icon:"🍉", iron:0.3, calcium:11,  vitC:12,  vitD:0,   light:"green",  satiety:62 },
};

const FOOD_KEYS = Object.keys(FOOD_DB);
const QUICK_ADD = ["oats","egg","dal","chicken","spinach","banana","apple","curd","fish","nuts","idli","paneer"];

const ACTIVITIES = [
  { id:"walk",    name:"Walking",       icon:"🚶", calPerMin:4  },
  { id:"run",     name:"Running",       icon:"🏃", calPerMin:10 },
  { id:"yoga",    name:"Yoga",          icon:"🧘", calPerMin:3  },
  { id:"cycle",   name:"Cycling",       icon:"🚴", calPerMin:7  },
  { id:"swim",    name:"Swimming",      icon:"🏊", calPerMin:8  },
  { id:"dance",   name:"Dancing",       icon:"💃", calPerMin:5  },
  { id:"climb",   name:"Stair Climb",   icon:"🧗", calPerMin:9  },
  { id:"stretch", name:"Stretching",    icon:"🤸", calPerMin:2  },
  { id:"hiit",    name:"HIIT",          icon:"⚡", calPerMin:12 },
  { id:"cricket", name:"Cricket",       icon:"🏏", calPerMin:5  },
  { id:"football",name:"Football",      icon:"⚽", calPerMin:8  },
  { id:"badminton",name:"Badminton",    icon:"🏸", calPerMin:6  },
];

const CBT_LESSONS = [
  { id:1, day:1, title:"The Why Behind Your Plate",            content:"Before eating, pause 3 seconds and ask: Am I physically hungry, emotionally hungry, or just bored? This tiny habit rewires your relationship with food.", exercise:"For your next meal, rate your hunger 1-10 before and after eating.", category:"mindfulness", icon:"🧠", duration:"3 min" },
  { id:2, day:2, title:"Cognitive Restructuring for Cravings", content:"Cravings last 15-20 minutes. Acknowledge the craving, name it, then delay action by 10 minutes.", exercise:"Next craving: write it down + time. Wait 10 mins. Did it pass?", category:"cbt", icon:"💭", duration:"4 min" },
  { id:3, day:3, title:"Slim by Design Principle",             content:"You eat 92% of what you serve yourself. Use smaller plates, pre-portion snacks, put fruit in visible spots.", exercise:"Rearrange one area of your kitchen to make healthy food more visible.", category:"environment", icon:"🏠", duration:"5 min" },
  { id:4, day:4, title:"Emotional Eating Triggers",            content:"Stress, boredom, sadness, and celebration are the 4 main emotional eating triggers. None require food — they require acknowledgment.", exercise:"List your top 3 emotional eating triggers and one non-food alternative.", category:"cbt", icon:"❤️", duration:"6 min" },
  { id:5, day:5, title:"Mindful Eating Protocol",              content:"Your brain needs 20 minutes to register fullness. Put your fork down between bites. Chew 20 times.", exercise:"Set a timer for 20 minutes for your next main meal.", category:"mindfulness", icon:"🍽️", duration:"3 min" },
  { id:6, day:6, title:"All-or-Nothing Thinking",              content:"\"I had one cookie, I ruined my day\" is cognitive distortion. Progress beats perfection. The 80/20 rule works.", exercise:"Practice self-compassionate self-talk after your next imperfect choice.", category:"cbt", icon:"⚖️", duration:"4 min" },
  { id:7, day:7, title:"Food as Fuel vs. Reward",              content:"Using food as the primary reward creates a problematic loop. Build a reward menu with non-food items.", exercise:"Create your personal 10-item non-food reward list.", category:"habit", icon:"🎯", duration:"5 min" },
];

/* ════════════════════════════════════════════════════════════
   DATA LAYER
════════════════════════════════════════════════════════════ */
function loadData() {
  try {
    const s = localStorage.getItem("manifix_nutrition_v92");
    if (s) return JSON.parse(s);
  } catch {}
  return {
    dailyGoal:      { calories:2000, protein:50, carbs:250, fat:65, water:8 },
    logged:         [],
    water:          [],
    activities:     [],
    groceryChecked: [],
    streakDays:     0,
    lastActiveDate: null,
    weeklyScores:   [],
    cbtProgress:    [],
    userProfile:    { weight:70, height:170, age:25, gender:"other", name:"" },
    aiScans:        [],
    lastUpdated:    Date.now(),
  };
}

function saveData(d) {
  try { localStorage.setItem("manifix_nutrition_v92", JSON.stringify({ ...d, lastUpdated: Date.now() })); } catch {}
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

function calcTotals(logged, water) {
  const today     = todayStr();
  const todayLogs = logged.filter(l => l.time.startsWith(today));
  const totals    = { calories:0, protein:0, carbs:0, fat:0, fiber:0, iron:0, calcium:0, vitC:0, vitD:0, greenCount:0, yellowCount:0, redCount:0 };
  todayLogs.forEach(log => {
    if (log._barcode) {
      totals.calories += log._barcode.calories || 0;
      totals.protein  += log._barcode.protein  || 0;
      totals.carbs    += log._barcode.carbs    || 0;
      totals.fat      += log._barcode.fat      || 0;
      totals.fiber    += log._barcode.fiber    || 0;
      const light = log._barcode.light || "yellow";
      totals[`${light}Count`]++;
      return;
    }
    if (log._ai) {
      totals.calories += log._ai.calories || 0;
      totals.protein  += log._ai.protein  || 0;
      totals.carbs    += log._ai.carbs    || 0;
      totals.fat      += log._ai.fat      || 0;
      totals.fiber    += log._ai.fiber    || 0;
      const light = log._ai.light || "yellow";
      totals[`${light}Count`]++;
      return;
    }
    const f = FOOD_DB[log.foodId];
    if (!f) return;
    const p = log.portion || 1;
    totals.calories += f.calories * p;
    totals.protein  += f.protein  * p;
    totals.carbs    += f.carbs    * p;
    totals.fat      += f.fat      * p;
    totals.fiber    += f.fiber    * p;
    totals.iron     += (f.iron    || 0) * p;
    totals.calcium  += (f.calcium || 0) * p;
    totals.vitC     += (f.vitC    || 0) * p;
    totals.vitD     += (f.vitD    || 0) * p;
    totals[`${f.light}Count`]++;
  });
  const waterCount = water.filter(t => t.startsWith(today)).length;
  return { ...totals, water: waterCount };
}

function calcActivityBurn(activities) {
  const today = todayStr();
  return (activities || []).filter(a => a.time.startsWith(today)).reduce((sum, a) => sum + (a.calories || 0), 0);
}

function calcScore(totals, goal, burn) {
  if (!goal) return 50;
  const net      = totals.calories - burn;
  const calRatio = net / Math.max(goal.calories, 1);
  const s = [
    calRatio >= 0.8 && calRatio <= 1.2 ? 20 : Math.max(0, 20 - Math.abs(calRatio - 1) * 40),
    totals.protein >= goal.protein * 0.8 ? 20 : (totals.protein / Math.max(goal.protein, 1)) * 20,
    totals.fiber   >= 20                 ? 20 : (totals.fiber   / 20) * 20,
    Math.min(20, totals.water * 2.5),
    Math.min(20, totals.greenCount * 4),
  ];
  return Math.round(s.reduce((a, b) => a + b, 0));
}

function updateStreak(data) {
  const today     = todayStr();
  if (data.lastActiveDate === today) return data;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = data.lastActiveDate === yesterday ? (data.streakDays || 0) + 1 : 1;
  return { ...data, streakDays: newStreak, lastActiveDate: today };
}

function calcBMR(profile) {
  const { weight = 70, height = 170, age = 25, gender = "other" } = profile;
  if (gender === "male")   return Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age);
  if (gender === "female") return Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.330 * age);
  return Math.round((88.362 + 447.593) / 2 + 11.322 * weight + 3.949 * height - 5.004 * age);
}

/* ════════════════════════════════════════════════════════════
   OPEN FOOD FACTS API
════════════════════════════════════════════════════════════ */
async function fetchBarcodeNutrition(barcode) {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  if (!response.ok) throw new Error("Network error — check your connection");
  const data = await response.json();
  if (data.status !== 1) throw new Error("Product not found — try another barcode");
  const p = data.product;
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"] || 0;
  return {
    name:       p.product_name || p.product_name_en || "Unknown Product",
    brand:      p.brands || "",
    image:      p.image_url || null,
    quantity:   p.quantity || "",
    calories:   Math.round(kcal),
    protein:    Math.round((n.proteins_100g      || 0) * 10) / 10,
    carbs:      Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    fat:        Math.round((n.fat_100g           || 0) * 10) / 10,
    fiber:      Math.round((n.fiber_100g         || 0) * 10) / 10,
    sodium:     Math.round((n.sodium_100g        || 0) * 1000),
    sugar:      Math.round((n["sugars_100g"]     || 0) * 10) / 10,
    light:      kcal < 100 ? "green" : kcal < 250 ? "yellow" : "red",
    nutriscore: p.nutriscore_grade || "",
    serving:    p.serving_size || "100g",
    countries:  p.countries_tags?.[0]?.replace("en:", "") || "",
  };
}

/* ════════════════════════════════════════════════════════════
   AI IMAGE → CALORIES (Claude Vision)
════════════════════════════════════════════════════════════ */
async function analyzeImageWithAI(base64Image, mimeType) {
  const prompt = `You are a professional nutritionist and food recognition AI. Analyze this food image carefully.

Identify ALL food items visible in the image and estimate nutritional content.

Respond ONLY with a JSON object (no markdown, no backticks, no explanation), exactly like this:
{
  "dish_name": "Name of the overall dish or meal",
  "description": "Brief description of what you see (2 sentences max)",
  "confidence": "high/medium/low",
  "serving_estimate": "estimated serving size (e.g., 1 plate, 200g)",
  "total_calories": 450,
  "total_protein": 22,
  "total_carbs": 48,
  "total_fat": 15,
  "total_fiber": 4.5,
  "light": "yellow",
  "health_score": 72,
  "items": [
    { "name": "Dal", "calories": 120, "quantity": "1 cup" },
    { "name": "Rice", "calories": 200, "quantity": "1 cup" }
  ],
  "tips": ["Tip 1 about this meal", "Tip 2"],
  "alternatives": ["Healthier swap 1", "Healthier swap 2"]
}

Rules:
- light must be "green" (under 400 cal/serving), "yellow" (400-600), or "red" (over 600)
- health_score is 0-100 based on nutritional quality
- Be realistic and specific for Indian food if applicable
- If you cannot identify the image as food, set dish_name to "Not a food image" and all numbers to 0`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Image } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error("AI service error. Please try again.");
  const data = await response.json();
  const text = data.content?.map(c => c.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

/* ════════════════════════════════════════════════════════════
   VOICE
════════════════════════════════════════════════════════════ */
function makeSpeaker() {
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang  = "en-IN";
      u.rate  = urgent ? 1.0 : T.voiceRate;
      u.pitch = T.voicePitch;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(x => x.lang === "en-IN") || voices.find(x => x.lang.startsWith("en"));
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
   CSS
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("nut-v92-css")) return;
  const el = document.createElement("style");
  el.id = "nut-v92-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.07)}100%{transform:scale(1)}}
    @keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(140px) rotate(720deg);opacity:0}}
    @keyframes scanPulse{0%,100%{border-color:rgba(0,255,135,.3)}50%{border-color:rgba(0,255,135,.9)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .fade-up{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.2) both}
    .pop{animation:pop .3s ease both}
    .btn{transition:all .15s ease;cursor:pointer}
    .btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
    .btn:active{transform:scale(.97)}
    .ring:focus{outline:2px solid ${T.accent};outline-offset:2px}
    .shimmer{background:linear-gradient(90deg,#0d1a0f 25%,#162b19 50%,#0d1a0f 75%);background-size:200% 100%;animation:shimmer 1.8s infinite}
    .hide-scroll::-webkit-scrollbar{display:none}
    .hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
    .glow-border{animation:scanPulse 2s ease-in-out infinite}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════════════════════ */
function ScoreRing({ score }) {
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const col  = score >= 80 ? T.accent : score >= 60 ? T.yellow : T.red;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <defs>
        <filter id="gf"><feGaussianBlur stdDeviation="3" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
      </defs>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#0a2010" strokeWidth="7"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition:"stroke-dasharray .8s cubic-bezier(.4,0,.2,1)", filter:`drop-shadow(0 0 6px ${col}66)` }}/>
      <text x="50" y="53" textAnchor="middle" fill={col}
        style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{score}</text>
      <text x="50" y="66" textAnchor="middle" fill="#1e4d35"
        style={{ fontSize:8, fontFamily:"'Syne',sans-serif", letterSpacing:".15em" }}>SCORE</text>
    </svg>
  );
}

function MacroBar({ label, current, goal, color, unit="g" }) {
  const pct  = Math.min(100, Math.round((current / Math.max(goal, 1)) * 100));
  const over = pct >= 100;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
        <span style={{ color:T.textMid, fontWeight:500 }}>{label}</span>
        <span style={{ color:over ? T.accent : T.textDim, fontFamily:"'DM Mono',monospace" }}>{Math.round(current)}/{goal}{unit}</span>
      </div>
      <div style={{ height:5, background:"#0a1a0a", borderRadius:3, overflow:"hidden", position:"relative" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:over?color:`${color}99`, transition:"width .7s cubic-bezier(.4,0,.2,1)", borderRadius:3, boxShadow:over?`0 0 8px ${color}88`:undefined }}/>
      </div>
    </div>
  );
}

function TrafficLight({ light = "yellow" }) {
  const cfg = LIGHT_CONFIG[light] || LIGHT_CONFIG.yellow;
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, background:cfg.bg, color:cfg.color, letterSpacing:".08em", textTransform:"uppercase" }}>
      {light === "green" ? "●" : light === "yellow" ? "◐" : "○"} {cfg.label}
    </span>
  );
}

function Micro({ label, current, goal, unit, icon }) {
  const pct = Math.min(100, Math.round((current / Math.max(goal, 1)) * 100));
  const col = pct >= 80 ? T.accent : pct >= 50 ? T.yellow : T.red;
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:18, marginBottom:3 }}>{icon}</div>
      <div style={{ fontSize:9,  color:T.textDim, marginBottom:1 }}>{label}</div>
      <div style={{ fontSize:11, fontWeight:700, color:col, fontFamily:"'DM Mono',monospace" }}>{Math.round(current)}/{goal}</div>
      <div style={{ fontSize:8,  color:T.textDim }}>{unit}</div>
      <div style={{ height:3, background:"#0a1a0a", borderRadius:2, margin:"4px 0 0" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:2, transition:"width .5s", boxShadow:`0 0 6px ${col}66` }}/>
      </div>
    </div>
  );
}

function WaterTracker({ count, goal, onAdd }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:12, color:T.textMid, fontWeight:600 }}>💧 Hydration</span>
        <span style={{ fontSize:12, fontWeight:700, color:T.accent, fontFamily:"'DM Mono',monospace" }}>{count}/{goal} glasses</span>
      </div>
      <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} onClick={() => i === count && onAdd()}
            style={{ width:28, height:34, borderRadius:4, overflow:"hidden",
              background: i < count ? `${T.accent}15` : "#0a1a0a",
              border:`1.5px solid ${i < count ? T.accent : "#0d2010"}`,
              cursor: i === count ? "pointer" : "default", transition:"all .25s",
              display:"flex", flexDirection:"column", justifyContent:"flex-end",
              boxShadow: i < count ? `0 0 8px ${T.accent}33` : undefined }}>
            {i < count && <div style={{ width:"100%", height:"80%", background:`linear-gradient(to top,${T.accentDim},${T.accent}44)` }}/>}
          </div>
        ))}
      </div>
      <button onClick={onAdd} disabled={count >= goal} className="btn ring"
        style={{ width:"100%", padding:"10px", fontSize:12, fontWeight:700,
          background: count >= goal ? `${T.accent}15` : T.accent,
          border:`2px solid ${count >= goal ? T.accent : "#000"}`,
          color: count >= goal ? T.accent : "#050a07", borderRadius:9, fontFamily:"'Syne',sans-serif",
          opacity: count >= goal ? 0.7 : 1, cursor: count >= goal ? "not-allowed" : "pointer",
          boxShadow: count >= goal ? undefined : `0 0 16px ${T.accent}44` }}>
        {count >= goal ? "✓ Hydration Goal Met!" : "+ Add Glass of Water"}
      </button>
    </div>
  );
}

function SparkLine({ scores }) {
  if (!scores || scores.length < 2) return (
    <div style={{ fontSize:11, color:T.textDim, textAlign:"center", padding:"16px 0" }}>Track more days to see trend</div>
  );
  const max = Math.max(...scores, 1);
  const w = 240, h = 44;
  const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * w},${h - (s / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={T.accent} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={T.accent} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="url(#sparkGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {scores.map((s, i) => (
        <circle key={i} cx={(i / (scores.length - 1)) * w} cy={h - (s / max) * h} r="4" fill={T.accent} stroke="#050a07" strokeWidth="2"/>
      ))}
    </svg>
  );
}

function StreakBadge({ days }) {
  if (!days) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:12, background:`${T.orange}15`, border:`1px solid ${T.orange}44`, fontSize:11, fontWeight:700, color:T.orange }}>
      🔥 {days}d streak
    </span>
  );
}

function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id:i, left:`${Math.random()*100}%`, color:[T.accent,T.yellow,T.blue,T.orange,T.purple,T.pink][i%6],
    delay:`${Math.random()*.8}s`, dur:`${1+Math.random()*.6}s`,
  }));
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position:"absolute", left:p.left, top:"3%", width:9, height:9, borderRadius:p.id%3===0?50:2, background:p.color, animation:`confetti ${p.dur} ${p.delay} ease-in forwards` }}/>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI FOOD IMAGE SCANNER — THE STAR FEATURE 🌟
════════════════════════════════════════════════════════════ */
function AIFoodScanner({ onFoodLogged, onClose }) {
  const [phase,     setPhase]     = useState("upload");
  const [imageData, setImageData] = useState(null);
  const [imageSrc,  setImageSrc]  = useState(null);
  const [mimeType,  setMimeType]  = useState("image/jpeg");
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [meal,      setMeal]      = useState("lunch");
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Please use an image under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const full   = e.target.result;
      const b64    = full.split(",")[1];
      const mime   = file.type;
      setImageData(b64);
      setImageSrc(full);
      setMimeType(mime);
      setPhase("preview");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setError("");
    try {
      const res = await analyzeImageWithAI(imageData, mimeType);
      setResult(res);
      setPhase("result");
    } catch (e) {
      setError(e.message || "Analysis failed. Please try again.");
      setPhase("error");
    } finally {
      setLoading(false);
    }
  };

  const handleLog = () => {
    if (!result) return;
    onFoodLogged({
      name:     result.dish_name,
      calories: result.total_calories,
      protein:  result.total_protein,
      carbs:    result.total_carbs,
      fat:      result.total_fat,
      fiber:    result.total_fiber,
      light:    result.light,
      meal,
      imageData: imageSrc,
    });
    onClose();
  };

  const lcfg = result ? (LIGHT_CONFIG[result.light] || LIGHT_CONFIG.yellow) : LIGHT_CONFIG.yellow;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.98)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:T.bg, border:`3px solid ${T.pink}`, padding:20, width:"min(500px,100%)", borderRadius:18, maxHeight:"94vh", overflowY:"auto" }} className="hide-scroll">

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>
              📸 AI Food Scanner
            </div>
            <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>
              Powered by Claude Vision · Instant calorie detection
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize:22, background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
        </div>

        {/* UPLOAD PHASE */}
        {phase === "upload" && (
          <div className="fade-up">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver ? T.pink : "#2a4a3a"}`, borderRadius:14, padding:"40px 24px", textAlign:"center", cursor:"pointer", transition:"all .25s", background:dragOver ? `${T.pink}08` : "transparent" }}>
              <div style={{ fontSize:56, marginBottom:12, animation:"float 3s ease-in-out infinite" }}>📷</div>
              <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>
                Drop food photo here
              </div>
              <div style={{ fontSize:12, color:T.textDim, marginBottom:16 }}>
                or click to browse · JPG, PNG, WEBP
              </div>
              <button style={{ padding:"10px 24px", fontSize:12, fontWeight:700, background:`${T.pink}20`, border:`2px solid ${T.pink}`, color:T.pink, borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                Choose Photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => processFile(e.target.files[0])}/>

            {error && <div style={{ marginTop:10, padding:"10px 14px", background:`${T.red}10`, border:`1px solid ${T.red}44`, borderRadius:8, fontSize:12, color:T.red }}>{error}</div>}

            {/* Feature cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:16 }}>
              {[
                ["🍛","Indian & World Food","Biryani, Dal, Pizza, Sushi"],
                ["⚡","Instant Results","Under 5 seconds"],
                ["🔬","Full Nutrition","Protein, carbs, fat, fiber"],
                ["💡","Smart Tips","Health suggestions included"],
              ].map(([icon, title, sub]) => (
                <div key={title} style={{ padding:"10px 12px", background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textPrimary }}>{title}</div>
                  <div style={{ fontSize:9, color:T.textDim }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PREVIEW PHASE */}
        {phase === "preview" && imageSrc && (
          <div className="fade-up">
            <div style={{ position:"relative", marginBottom:14 }}>
              <img src={imageSrc} alt="Food" style={{ width:"100%", maxHeight:260, objectFit:"cover", borderRadius:12, border:`2px solid ${T.pink}44` }}/>
              <div style={{ position:"absolute", inset:0, borderRadius:12, border:`2px solid ${T.pink}`, animation:"scanPulse 1.5s ease-in-out infinite", pointerEvents:"none" }}/>
            </div>
            <div style={{ fontSize:12, color:T.textMid, textAlign:"center", marginBottom:14 }}>
              Ready to analyze with Claude AI Vision
            </div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ width:36, height:36, border:`3px solid ${T.border}`, borderTopColor:T.pink, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 12px" }}/>
                <div style={{ fontSize:13, color:T.textMid, fontWeight:600 }}>AI analyzing your food…</div>
                <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>Detecting calories, macros & ingredients</div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => { setPhase("upload"); setImageData(null); setImageSrc(null); }}
                  style={{ flex:1, padding:11, fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                  ← Change Photo
                </button>
                <button onClick={analyze} className="btn ring"
                  style={{ flex:2, padding:11, fontSize:13, fontWeight:700, background:T.pink, border:`2px solid ${T.pink}`, color:"#050a07", borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif", boxShadow:`0 0 20px ${T.pink}44` }}>
                  🔍 Analyze with AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && result && (
          <div className="fade-up">
            {imageSrc && (
              <img src={imageSrc} alt={result.dish_name} style={{ width:"100%", maxHeight:180, objectFit:"cover", borderRadius:12, marginBottom:14, border:`2px solid ${lcfg.color}44` }}/>
            )}

            {/* Main info */}
            <div style={{ border:`2px solid ${lcfg.color}44`, background:lcfg.bg, padding:"14px 16px", borderRadius:12, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1, marginRight:12 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>{result.dish_name}</div>
                  <div style={{ fontSize:11, color:T.textMid, marginTop:4, lineHeight:1.5 }}>{result.description}</div>
                  <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>
                    Serving: {result.serving_estimate} · Confidence: {result.confidence}
                  </div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:32, fontWeight:800, color:lcfg.color, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{result.total_calories}</div>
                  <div style={{ fontSize:9, color:T.textDim }}>calories</div>
                  <div style={{ fontSize:11, fontWeight:700, color:lcfg.color, marginTop:4 }}>
                    Health: {result.health_score}/100
                  </div>
                </div>
              </div>

              {/* Macros grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                {[["Protein",result.total_protein,"g",T.blue],["Carbs",result.total_carbs,"g",T.yellow],["Fat",result.total_fat,"g",T.red],["Fiber",result.total_fiber,"g",T.teal]].map(([l,v,u,c]) => (
                  <div key={l} style={{ textAlign:"center", padding:"8px 4px", background:"rgba(0,0,0,.35)", borderRadius:8 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:c, fontFamily:"'DM Mono',monospace" }}>{v}{u}</div>
                    <div style={{ fontSize:9, color:T.textDim }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Detected items */}
              {result.items && result.items.length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Detected items</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {result.items.map((item, i) => (
                      <span key={i} style={{ fontSize:10, padding:"3px 9px", borderRadius:12, background:`${T.pink}15`, border:`1px solid ${T.pink}33`, color:T.pink }}>
                        {item.name} · {item.calories}cal ({item.quantity})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Traffic light + meal */}
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:12 }}>
                <TrafficLight light={result.light}/>
              </div>

              <div>
                <div style={{ fontSize:10, color:T.textDim, marginBottom:5 }}>Meal type</div>
                <div style={{ display:"flex", gap:5 }}>
                  {["breakfast","lunch","dinner","snack"].map(m => (
                    <button key={m} onClick={() => setMeal(m)}
                      style={{ flex:1, padding:"6px 4px", fontSize:10, fontWeight:600, textTransform:"capitalize", borderRadius:6, background:meal===m?`${T.accent}22`:"#0a1a0a", border:`1.5px solid ${meal===m?T.accent:T.border}`, color:meal===m?T.accent:T.textDim, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Tips */}
            {result.tips && result.tips.length > 0 && (
              <div style={{ border:`1px solid ${T.teal}33`, background:`${T.teal}06`, padding:"12px 14px", borderRadius:10, marginBottom:12 }}>
                <div style={{ fontSize:10, color:T.teal, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>💡 AI Nutrition Tips</div>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ fontSize:11, color:T.textMid, marginBottom:4, paddingLeft:10, borderLeft:`2px solid ${T.teal}44` }}>• {tip}</div>
                ))}
              </div>
            )}

            {/* Healthier alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div style={{ border:`1px solid ${T.yellow}33`, background:`${T.yellow}06`, padding:"12px 14px", borderRadius:10, marginBottom:12 }}>
                <div style={{ fontSize:10, color:T.yellow, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>🔄 Healthier Alternatives</div>
                {result.alternatives.map((alt, i) => (
                  <div key={i} style={{ fontSize:11, color:T.textMid, marginBottom:4, paddingLeft:10, borderLeft:`2px solid ${T.yellow}44` }}>• {alt}</div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setPhase("upload"); setResult(null); setImageData(null); setImageSrc(null); }}
                style={{ flex:1, padding:11, fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                📷 New Photo
              </button>
              <button onClick={handleLog} className="btn ring"
                style={{ flex:2, padding:11, fontSize:13, fontWeight:700, background:T.accent, border:`2px solid ${T.accent}`, color:"#050a07", borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif", boxShadow:`0 0 20px ${T.accent}44` }}>
                + Log {result.total_calories} cal
              </button>
            </div>
          </div>
        )}

        {/* ERROR PHASE */}
        {phase === "error" && (
          <div className="fade-up" style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>⚠️</div>
            <div style={{ fontSize:14, fontWeight:700, color:T.red, marginBottom:8 }}>Analysis Failed</div>
            <div style={{ fontSize:12, color:T.textMid, marginBottom:18 }}>{error}</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => { setPhase("preview"); setError(""); }} className="btn ring"
                style={{ padding:"10px 20px", fontSize:12, background:`${T.pink}15`, border:`2px solid ${T.pink}`, color:T.pink, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                Try Again
              </button>
              <button onClick={onClose} style={{ padding:"10px 20px", fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BARCODE SCANNER
════════════════════════════════════════════════════════════ */
function BarcodeScanner({ onFoodLogged, onClose }) {
  const [phase,   setPhase]   = useState("scan");
  const [barcode, setBarcode] = useState("");
  const [result,  setResult]  = useState(null);
  const [errMsg,  setErrMsg]  = useState("");
  const [loading, setLoading] = useState(false);
  const [portion, setPortion] = useState(100);
  const [meal,    setMeal]    = useState("snack");
  const inputRef = useRef();
  useEffect(() => { if (phase === "scan") setTimeout(() => inputRef.current?.focus(), 100); }, [phase]);

  const search = async (code) => {
    const clean = code.trim();
    if (!clean) return;
    setLoading(true);
    setErrMsg("");
    try {
      const data = await fetchBarcodeNutrition(clean);
      setResult(data); setPortion(100); setPhase("result");
    } catch (e) {
      setErrMsg(e.message || "Product not found.");
      setPhase("error");
    } finally { setLoading(false); }
  };

  const cal     = result ? Math.round((result.calories * portion) / 100) : 0;
  const protein = result ? Math.round((result.protein  * portion) / 100 * 10) / 10 : 0;
  const carbs   = result ? Math.round((result.carbs    * portion) / 100 * 10) / 10 : 0;
  const fat     = result ? Math.round((result.fat      * portion) / 100 * 10) / 10 : 0;
  const fiber   = result ? Math.round((result.fiber    * portion) / 100 * 10) / 10 : 0;
  const lcfg    = result ? (LIGHT_CONFIG[result.light] || LIGHT_CONFIG.yellow) : LIGHT_CONFIG.yellow;

  const handleLog = () => {
    onFoodLogged({ name:result.name, brand:result.brand, calories:cal, protein, carbs, fat, fiber, light:result.light, portion, barcode, meal });
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.97)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:T.bg, border:`3px solid ${T.teal}`, padding:20, width:"min(460px,100%)", borderRadius:16, maxHeight:"94vh", overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>📷 Barcode Scanner</div>
            <div style={{ fontSize:11, color:T.textDim }}>Open Food Facts · 2.9M+ products · 100% Free</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
        </div>

        {phase === "scan" && (
          <div className="fade-up">
            <input ref={inputRef} value={barcode} onChange={e => setBarcode(e.target.value.replace(/\D/g,""))} onKeyDown={e => e.key === "Enter" && search(barcode)}
              placeholder="e.g. 8901058851201" inputMode="numeric"
              style={{ width:"100%", padding:"14px", fontSize:16, background:"#0a1a0a", border:`2px solid ${T.teal}`, color:T.textPrimary, borderRadius:10, fontFamily:"'DM Mono',monospace", marginBottom:10, outline:"none", textAlign:"center", letterSpacing:".12em" }}/>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={onClose} style={{ flex:1, padding:11, fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Cancel</button>
              <button onClick={() => search(barcode)} disabled={!barcode || loading} className="btn ring"
                style={{ flex:2, padding:11, fontSize:13, fontWeight:700, background:barcode&&!loading?T.teal:"#111", border:`2px solid ${barcode&&!loading?T.teal:"#333"}`, color:barcode&&!loading?"#050a07":T.textDim, borderRadius:10, cursor:barcode&&!loading?"pointer":"not-allowed", fontFamily:"'Syne',sans-serif" }}>
                {loading ? "🔍 Searching…" : "🔍 Search Product"}
              </button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="fade-up" style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
            <div style={{ fontSize:14, fontWeight:700, color:T.red, marginBottom:6 }}>Product Not Found</div>
            <div style={{ fontSize:12, color:T.textMid, marginBottom:20 }}>{errMsg}</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => { setPhase("scan"); setErrMsg(""); setBarcode(""); }} className="btn ring"
                style={{ padding:"10px 20px", fontSize:12, background:`${T.teal}15`, border:`2px solid ${T.teal}`, color:T.teal, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Try Again</button>
              <button onClick={onClose} style={{ padding:"10px 20px", fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Close</button>
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <div className="fade-up">
            {result.image && <img src={result.image} alt={result.name} style={{ width:"100%", maxHeight:160, objectFit:"contain", borderRadius:10, marginBottom:12, background:"#0a1a0a", padding:8 }} onError={e => e.target.style.display="none"}/>}
            <div style={{ border:`2px solid ${lcfg.color}44`, background:lcfg.bg, padding:"14px 16px", borderRadius:12, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1, marginRight:10 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>{result.name}</div>
                  {result.brand && <div style={{ fontSize:11, color:T.textMid, marginTop:3 }}>{result.brand}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:28, fontWeight:700, color:lcfg.color, fontFamily:"'DM Mono',monospace" }}>{cal}</div>
                  <div style={{ fontSize:10, color:T.textDim }}>calories</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                {[["Protein",protein,"g",T.blue],["Carbs",carbs,"g",T.yellow],["Fat",fat,"g",T.red],["Fiber",fiber,"g",T.teal]].map(([l,v,u,c]) => (
                  <div key={l} style={{ textAlign:"center", padding:"7px 4px", background:"rgba(0,0,0,.3)", borderRadius:6 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:c, fontFamily:"'DM Mono',monospace" }}>{v}{u}</div>
                    <div style={{ fontSize:9, color:T.textDim }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textDim, marginBottom:5 }}>
                  <span>Portion</span><span style={{ color:T.teal, fontWeight:700 }}>{portion}g → {cal} cal</span>
                </div>
                <input type="range" min={10} max={500} step={10} value={portion} onChange={e => setPortion(+e.target.value)} style={{ width:"100%", accentColor:T.teal }}/>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {["breakfast","lunch","dinner","snack"].map(m => (
                  <button key={m} onClick={() => setMeal(m)}
                    style={{ flex:1, padding:"6px 4px", fontSize:10, fontWeight:600, textTransform:"capitalize", borderRadius:6, background:meal===m?`${T.accent}22`:"#0a1a0a", border:`1.5px solid ${meal===m?T.accent:T.border}`, color:meal===m?T.accent:T.textDim, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setPhase("scan"); setResult(null); setBarcode(""); setPortion(100); }}
                style={{ flex:1, padding:11, fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Scan Again</button>
              <button onClick={handleLog} className="btn ring"
                style={{ flex:2, padding:11, fontSize:13, fontWeight:700, background:T.accent, border:`2px solid ${T.accent}`, color:"#050a07", borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                + Log {cal} cal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CBT MODULE
════════════════════════════════════════════════════════════ */
function CBTModule({ cbtProgress, onComplete, onClose }) {
  const completedIds   = cbtProgress || [];
  const nextLesson     = CBT_LESSONS.find(l => !completedIds.includes(l.id)) || CBT_LESSONS[0];
  const [activeLesson, setActiveLesson]  = useState(nextLesson);
  const [phase,        setPhase]         = useState("read");
  const [exerciseInput,setExerciseInput] = useState("");
  const catColor = { mindfulness:T.teal, cbt:T.purple, environment:T.blue, habit:T.orange };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div style={{ background:T.bg, border:`3px solid ${T.purple}`, padding:20, width:"min(440px,100%)", borderRadius:16, maxHeight:"92vh", overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>🧠 Psychology Coach</div>
            <div style={{ fontSize:11, color:T.textDim }}>CBT eating mindset · {completedIds.length}/{CBT_LESSONS.length} complete</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:5, marginBottom:16 }}>
          {CBT_LESSONS.map(l => (
            <button key={l.id} onClick={() => { setActiveLesson(l); setPhase("read"); setExerciseInput(""); }}
              style={{ flex:1, height:5, borderRadius:3, background:completedIds.includes(l.id)?T.purple:l.id===activeLesson.id?`${T.purple}55`:"#1a1a2e", border:"none", cursor:"pointer", transition:"all .2s" }}/>
          ))}
        </div>
        <div className="fade-up" style={{ border:`2px solid ${(catColor[activeLesson.category]||T.purple)}33`, background:`${(catColor[activeLesson.category]||T.purple)}08`, padding:"16px 18px", borderRadius:12, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <span style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em" }}>Day {activeLesson.day} · {activeLesson.category}</span>
              <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary, marginTop:3, fontFamily:"'Syne',sans-serif" }}>{activeLesson.icon} {activeLesson.title}</div>
            </div>
            <span style={{ fontSize:10, color:T.textDim }}>{activeLesson.duration}</span>
          </div>
          {phase === "read" && (
            <>
              <p style={{ fontSize:13, color:"#cde8d5", lineHeight:1.7, marginBottom:14 }}>{activeLesson.content}</p>
              <button onClick={() => setPhase("exercise")} className="btn ring"
                style={{ width:"100%", padding:"10px", fontSize:12, fontWeight:700, background:`${(catColor[activeLesson.category]||T.purple)}22`, border:`2px solid ${catColor[activeLesson.category]||T.purple}`, color:catColor[activeLesson.category]||T.purple, borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                ✏️ Try the Exercise
              </button>
            </>
          )}
          {phase === "exercise" && (
            <>
              <div style={{ fontSize:12, color:T.textMid, lineHeight:1.6, marginBottom:12, padding:"10px 12px", background:"rgba(0,0,0,.3)", borderRadius:8, borderLeft:`3px solid ${catColor[activeLesson.category]||T.purple}` }}>
                📝 {activeLesson.exercise}
              </div>
              <textarea value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} placeholder="Write your reflection here…" rows={3}
                style={{ width:"100%", padding:"10px 12px", fontSize:12, background:"#0a1a0a", border:`1.5px solid ${T.border}`, color:T.textPrimary, borderRadius:8, marginBottom:12, fontFamily:"'Syne',sans-serif", resize:"vertical" }}/>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setPhase("read")} style={{ flex:1, padding:10, fontSize:12, background:"#111", border:"1.5px solid #222", color:T.textDim, borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>← Back</button>
                <button onClick={() => { onComplete(activeLesson.id); setPhase("done"); }} className="btn ring"
                  style={{ flex:2, padding:10, fontSize:12, fontWeight:700, background:T.purple, border:`2px solid ${T.purple}`, color:"#050a07", borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                  ✓ Mark Complete
                </button>
              </div>
            </>
          )}
          {phase === "done" && (
            <div style={{ textAlign:"center", padding:"14px 0" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.accent, marginBottom:8 }}>Lesson Complete!</div>
              <button onClick={onClose} className="btn ring"
                style={{ padding:"10px 24px", fontSize:13, fontWeight:700, background:T.accent, border:`2px solid ${T.accent}`, color:"#050a07", borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Done</button>
            </div>
          )}
        </div>
        <div style={{ display:"grid", gap:6 }}>
          {CBT_LESSONS.map(l => {
            const done = completedIds.includes(l.id);
            const active = l.id === activeLesson.id;
            return (
              <button key={l.id} onClick={() => { setActiveLesson(l); setPhase("read"); setExerciseInput(""); }} className="btn ring"
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:active?`${T.purple}15`:done?`${T.accent}08`:"#060f08", border:`1.5px solid ${active?T.purple:done?T.accent:T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif", textAlign:"left" }}>
                <span style={{ fontSize:18 }}>{l.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:active?T.purple:done?T.accent:T.textPrimary }}>{l.title}</div>
                  <div style={{ fontSize:10, color:T.textDim }}>{l.duration} · Day {l.day}</div>
                </div>
                {done && <span style={{ fontSize:12, color:T.accent }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   FOOD LOG MODAL
════════════════════════════════════════════════════════════ */
function FoodLogModal({ onClose, onLog }) {
  const [search,  setSearch]  = useState("");
  const [sel,     setSel]     = useState(null);
  const [portion, setPortion] = useState(1);
  const [meal,    setMeal]    = useState("lunch");

  const filtered = useMemo(() => {
    if (!search) return FOOD_KEYS.map(k => ({ key:k, ...FOOD_DB[k] }));
    const q = search.toLowerCase();
    return FOOD_KEYS.filter(k => FOOD_DB[k].name.toLowerCase().includes(q)).map(k => ({ key:k, ...FOOD_DB[k] }));
  }, [search]);

  const lightGroups = { green:[], yellow:[], red:[] };
  filtered.forEach(f => { if (lightGroups[f.light]) lightGroups[f.light].push(f); });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:T.bg, border:`3px solid ${T.accent}`, padding:18, width:"min(480px,100%)", borderRadius:16, maxHeight:"92vh", overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>🍽️ Log Food</div>
            <div style={{ fontSize:11, color:T.textDim }}>Traffic-light system · {FOOD_KEYS.length} foods</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search: rice, dal, chicken, idli, paneer…"
          style={{ width:"100%", padding:"9px 12px", fontSize:12, background:"#0a1a0a", border:`1.5px solid ${T.border}`, color:T.textPrimary, borderRadius:8, fontFamily:"'Syne',sans-serif", marginBottom:10, outline:"none" }}/>

        <div style={{ maxHeight:200, overflowY:"auto", marginBottom:12 }} className="hide-scroll">
          {(search ? [["search", filtered]] : Object.entries(lightGroups)).map(([light, foods]) => {
            if (!foods.length) return null;
            const lcfg = light !== "search" ? LIGHT_CONFIG[light] : null;
            return (
              <div key={light} style={{ marginBottom:12 }}>
                {lcfg && <div style={{ fontSize:10, color:lcfg.color, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>● {lcfg.label} Foods</div>}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                  {foods.slice(0, search ? 24 : undefined).map(f => {
                    const fcfg = LIGHT_CONFIG[f.light] || LIGHT_CONFIG.yellow;
                    return (
                      <button key={f.key} onClick={() => setSel(f)} className="btn ring"
                        style={{ padding:"8px 4px", borderRadius:8, textAlign:"center", background:sel?.key===f.key?`${fcfg.color}22`:"#0a1a0a", border:`2px solid ${sel?.key===f.key?fcfg.color:"#0d2010"}`, color:sel?.key===f.key?fcfg.color:T.textMid, fontSize:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                        <div style={{ fontSize:20, marginBottom:2 }}>{f.icon}</div>
                        <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name.split(" ")[0]}</div>
                        <div style={{ fontSize:9, color:fcfg.color, marginTop:1 }}>{f.calories}cal</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {sel && (
          <div className="fade-up" style={{ border:`1.5px solid ${(LIGHT_CONFIG[sel.light]||LIGHT_CONFIG.yellow).color}44`, background:`${(LIGHT_CONFIG[sel.light]||LIGHT_CONFIG.yellow).color}08`, padding:"12px 14px", borderRadius:10, marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{sel.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{sel.name}</div>
                <div style={{ display:"flex", gap:6, marginTop:3 }}>
                  <TrafficLight light={sel.light}/>
                  <span style={{ fontSize:10, color:T.textDim }}>Satiety: {sel.satiety}/100</span>
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
              {[["Cal",Math.round(sel.calories*portion),"",T.accent],["P",+(sel.protein*portion).toFixed(1),"g",T.blue],["C",+(sel.carbs*portion).toFixed(1),"g",T.yellow],["F",+(sel.fat*portion).toFixed(1),"g",T.red]].map(([l,v,u,c]) => (
                <div key={l} style={{ textAlign:"center", padding:"6px 4px", background:"rgba(0,0,0,.3)", borderRadius:6 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:c, fontFamily:"'DM Mono',monospace" }}>{v}{u}</div>
                  <div style={{ fontSize:9, color:T.textDim }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <label style={{ fontSize:10, color:T.textDim, display:"block", marginBottom:4 }}>Portion</label>
                <select value={portion} onChange={e => setPortion(parseFloat(e.target.value))}
                  style={{ width:"100%", padding:"7px", fontSize:12, background:"#0a1a0a", border:`1.5px solid ${T.border}`, color:T.textPrimary, borderRadius:6, fontFamily:"'Syne',sans-serif" }}>
                  {[0.25,0.5,0.75,1,1.5,2,3].map(p => <option key={p} value={p} style={{ background:"#040d06" }}>{p}× ({Math.round(sel.calories*p)} cal)</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, color:T.textDim, display:"block", marginBottom:4 }}>Meal</label>
                <select value={meal} onChange={e => setMeal(e.target.value)}
                  style={{ width:"100%", padding:"7px", fontSize:12, background:"#0a1a0a", border:`1.5px solid ${T.border}`, color:T.textPrimary, borderRadius:6, fontFamily:"'Syne',sans-serif" }}>
                  {["breakfast","lunch","dinner","snack"].map(m => <option key={m} value={m} style={{ background:"#040d06" }}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:11, fontSize:13, background:"#0a1a0a", border:`1.5px solid ${T.border}`, color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Cancel</button>
          <button onClick={() => { if (sel) { onLog({ foodId:sel.key, meal, portion }); onClose(); }}} disabled={!sel} className="btn ring"
            style={{ flex:2, padding:11, fontSize:13, fontWeight:700, background:sel?T.accent:"#1a1a1a", border:`2px solid ${sel?T.accent:"#333"}`, color:sel?"#050a07":T.textDim, borderRadius:10, cursor:sel?"pointer":"not-allowed", fontFamily:"'Syne',sans-serif", boxShadow:sel?`0 0 16px ${T.accent}44`:undefined }}>
            {sel ? `+ Log ${sel.name.split(" ")[0]} (${Math.round(sel.calories*portion)} cal)` : "Select a food"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ACTIVITY MODAL
════════════════════════════════════════════════════════════ */
function ActivityModal({ onClose, onLog }) {
  const [sel,  setSel]  = useState(null);
  const [mins, setMins] = useState(30);
  const calc = sel ? Math.round(sel.calPerMin * mins) : 0;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div style={{ background:T.bg, border:`3px solid ${T.orange}`, padding:20, width:"min(420px,100%)", borderRadius:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontSize:15, fontWeight:700, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>🏃 Log Activity</span>
          <button onClick={onClose} style={{ fontSize:20, background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7, marginBottom:14 }}>
          {ACTIVITIES.map(a => (
            <button key={a.id} onClick={() => setSel(a)} className="btn ring"
              style={{ padding:"9px 4px", borderRadius:8, textAlign:"center", background:sel?.id===a.id?`${T.orange}20`:"#0a1a0a", border:`2px solid ${sel?.id===a.id?T.orange:"#0d2010"}`, color:sel?.id===a.id?T.orange:T.textMid, fontSize:9, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
              <div style={{ fontSize:20, marginBottom:3 }}>{a.icon}</div>
              <div>{a.name}</div>
            </button>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:T.textDim, display:"block", marginBottom:6 }}>Duration: <span style={{ color:T.orange, fontWeight:700 }}>{mins} min</span></label>
          <input type="range" min={5} max={120} step={5} value={mins} onChange={e => setMins(+e.target.value)} style={{ width:"100%", accentColor:T.orange }}/>
        </div>
        {sel && <div style={{ textAlign:"center", fontSize:16, fontWeight:700, color:T.orange, marginBottom:14, fontFamily:"'DM Mono',monospace" }}>~{calc} calories burned</div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:11, fontSize:13, background:"#0a1a0a", border:`1.5px solid ${T.border}`, color:T.textDim, borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Cancel</button>
          <button onClick={() => { if (sel) { onLog({ activityId:sel.id, name:sel.name, icon:sel.icon, minutes:mins, calories:calc }); onClose(); }}} disabled={!sel} className="btn ring"
            style={{ flex:1, padding:11, fontSize:13, fontWeight:700, background:sel?T.orange:"#1a1a1a", border:`2px solid ${sel?T.orange:"#333"}`, color:sel?"#050a07":T.textDim, borderRadius:10, cursor:sel?"pointer":"not-allowed", fontFamily:"'Syne',sans-serif" }}>
            Log Activity
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BMR / PROFILE MODAL
════════════════════════════════════════════════════════════ */
function ProfileModal({ profile, dailyGoal, onSave, onClose }) {
  const [p, setP] = useState({ ...profile });
  const [g, setG] = useState({ ...dailyGoal });
  const bmr = calcBMR(p);
  const tdee = Math.round(bmr * 1.55);

  const field = (label, key, min, max, step=1, isGoal=false) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textDim, marginBottom:4 }}>
        <span style={{ color:T.textMid }}>{label}</span>
        <span style={{ color:T.accent, fontFamily:"'DM Mono',monospace" }}>{isGoal ? g[key] : p[key]}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={isGoal ? g[key] : p[key]}
        onChange={e => isGoal ? setG(prev => ({...prev, [key]: +e.target.value})) : setP(prev => ({...prev, [key]: +e.target.value}))}
        style={{ width:"100%", accentColor:T.accent }}/>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div style={{ background:T.bg, border:`3px solid ${T.blue}`, padding:20, width:"min(420px,100%)", borderRadius:16, maxHeight:"92vh", overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, fontFamily:"'Syne',sans-serif" }}>⚙️ Profile & Goals</div>
            <div style={{ fontSize:11, color:T.textDim }}>Auto-calculates your BMR & TDEE</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ border:`1.5px solid ${T.blue}33`, background:`${T.blue}08`, padding:"12px 14px", borderRadius:10, marginBottom:14, textAlign:"center" }}>
          <div style={{ fontSize:11, color:T.textDim, marginBottom:4 }}>Estimated Daily Need (TDEE)</div>
          <div style={{ fontSize:28, fontWeight:700, color:T.blue, fontFamily:"'DM Mono',monospace" }}>{tdee}</div>
          <div style={{ fontSize:10, color:T.textDim }}>calories/day · BMR: {bmr} kcal</div>
        </div>

        <div style={{ marginBottom:6 }}>
          <div style={{ fontSize:11, color:T.teal, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Body Metrics</div>
          {field("Weight (kg)", "weight", 30, 200)}
          {field("Height (cm)", "height", 100, 220)}
          {field("Age", "age", 10, 80)}
        </div>

        <div style={{ marginBottom:6 }}>
          <div style={{ fontSize:11, color:T.textDim, marginBottom:6 }}>Gender</div>
          <div style={{ display:"flex", gap:6 }}>
            {["male","female","other"].map(g2 => (
              <button key={g2} onClick={() => setP(prev => ({...prev, gender:g2}))}
                style={{ flex:1, padding:"8px 4px", fontSize:11, fontWeight:600, textTransform:"capitalize", borderRadius:6, background:p.gender===g2?`${T.blue}22`:"#0a1a0a", border:`1.5px solid ${p.gender===g2?T.blue:T.border}`, color:p.gender===g2?T.blue:T.textDim, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                {g2}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop:14, marginBottom:6 }}>
          <div style={{ fontSize:11, color:T.orange, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Daily Goals</div>
          {field("Calories", "calories", 1200, 4000, 50, true)}
          {field("Protein (g)", "protein", 30, 200, 5, true)}
          {field("Carbs (g)", "carbs", 100, 400, 10, true)}
          {field("Fat (g)", "fat", 20, 150, 5, true)}
          {field("Water (glasses)", "water", 4, 15, 1, true)}
        </div>

        <button onClick={() => { onSave(p, g); }} className="btn ring"
          style={{ width:"100%", padding:12, fontSize:13, fontWeight:700, background:T.accent, border:`2px solid ${T.accent}`, color:"#050a07", borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif", boxShadow:`0 0 16px ${T.accent}44`, marginTop:10 }}>
          ✓ Save Profile
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function NutritionHealthV9() {
  const speak = useMemo(() => makeSpeaker(), []);

  const [data,         setData]        = useState(() => loadData());
  const [showFood,     setShowFood]    = useState(false);
  const [showActivity, setShowActivity]= useState(false);
  const [showBarcode,  setShowBarcode] = useState(false);
  const [showAIScan,   setShowAIScan]  = useState(false);
  const [showCBT,      setShowCBT]     = useState(false);
  const [showProfile,  setShowProfile] = useState(false);
  const [loading,      setLoading]     = useState(true);
  const [offline,      setOffline]     = useState(!navigator.onLine);
  const [confetti,     setConfetti]    = useState(false);
  const [activeTab,    setActiveTab]   = useState("today");
  const [celebMsg,     setCelebMsg]    = useState("");

  const totals     = useMemo(() => calcTotals(data.logged, data.water), [data.logged, data.water]);
  const burnCal    = useMemo(() => calcActivityBurn(data.activities), [data.activities]);
  const score      = useMemo(() => calcScore(totals, data.dailyGoal, burnCal), [totals, data.dailyGoal, burnCal]);
  const netCal     = Math.round(totals.calories - burnCal);
  const scoreColor = score >= 80 ? T.accent : score >= 60 ? T.yellow : T.red;

  const mealPlan = useMemo(() => {
    const day = new Date().getDay();
    const meals = {
      breakfast:[
        { name:"Oats + Banana + Milk",      foods:["oats","banana","milk"],               calories:290 },
        { name:"Egg + Roti + Spinach",       foods:["egg","roti","spinach"],               calories:204 },
        { name:"Idli + Sambar + Curd",       foods:["idli","sambar","curd"],               calories:292 },
      ],
      lunch:[
        { name:"Dal + Rice + Chicken + Carrot", foods:["dal","rice","chicken","carrot"], calories:452 },
        { name:"Fish + Roti + Spinach + Tomato", foods:["fish","roti","spinach","tomato"], calories:351 },
        { name:"Rajma + Rice + Salad",         foods:["rajma","rice","salad"],             calories:322 },
      ],
      dinner:[
        { name:"Dal + Roti + Curd",          foods:["dal","roti","curd"],                calories:279 },
        { name:"Grilled Fish + Veggies",     foods:["fish","spinach","tomato","carrot"], calories:288 },
        { name:"Paneer + Roti + Salad",      foods:["paneer","roti","salad"],            calories:404 },
      ],
      snack:[
        { name:"Apple + Almonds",            foods:["apple","almonds"],                  calories:216 },
        { name:"Banana + Curd",              foods:["banana","curd"],                    calories:148 },
        { name:"Avocado + Broccoli",         foods:["avocado","broccoli"],               calories:215 },
      ],
    };
    return Object.fromEntries(Object.entries(meals).map(([k, v]) => [k, v[day % v.length]]));
  }, []);

  /* Init */
  useEffect(() => {
    injectCSS();
    const d = updateStreak(data);
    if (d.streakDays !== data.streakDays) setData(d);
    const t = setTimeout(() => {
      setLoading(false);
      speak("Welcome to ManifiX Nutrition v9. AI Food Scanner ready.");
    }, 700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  /* Online/offline */
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /* Persist */
  useEffect(() => { saveData(data); }, [data]);

  /* Score milestones */
  useEffect(() => {
    if (score >= 100) {
      setConfetti(true);
      setCelebMsg("Perfect Score! 🎉");
      speak("Outstanding! Perfect nutrition score today!", true);
      setTimeout(() => { setConfetti(false); setCelebMsg(""); }, 3000);
    }
  }, [score]); // eslint-disable-line

  /* Callbacks */
  const logFood = useCallback((entry) => {
    setData(p => ({ ...p, logged: [...p.logged, { id:Date.now(), time:new Date().toISOString(), ...entry }] }));
    speak("Food logged!");
  }, [speak]);

  const logBarcodeFood = useCallback((scanResult) => {
    setData(p => ({
      ...p,
      logged: [...p.logged, {
        id:Date.now(), time:new Date().toISOString(), meal:scanResult.meal||"snack",
        _barcode: { name:scanResult.name, brand:scanResult.brand, calories:scanResult.calories, protein:scanResult.protein, carbs:scanResult.carbs, fat:scanResult.fat, fiber:scanResult.fiber, light:scanResult.light, portion:scanResult.portion, barcode:scanResult.barcode },
      }],
    }));
    speak(`Logged ${scanResult.calories} calories.`);
  }, [speak]);

  const logAIFood = useCallback((aiResult) => {
    setData(p => ({
      ...p,
      logged: [...p.logged, {
        id:Date.now(), time:new Date().toISOString(), meal:aiResult.meal||"lunch",
        _ai: { name:aiResult.name, calories:aiResult.calories, protein:aiResult.protein, carbs:aiResult.carbs, fat:aiResult.fat, fiber:aiResult.fiber, light:aiResult.light, imageData:aiResult.imageData },
      }],
    }));
    speak(`AI detected ${aiResult.calories} calories!`);
  }, [speak]);

  const addWater = useCallback(() => {
    setData(p => ({ ...p, water: [...p.water, new Date().toISOString()] }));
    if (totals.water + 1 >= data.dailyGoal.water) {
      speak("Hydration goal reached! Outstanding!", true);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2000);
    }
  }, [totals.water, data.dailyGoal.water, speak]);

  const logActivity = useCallback((act) => {
    setData(p => ({ ...p, activities: [...(p.activities || []), { id:Date.now(), time:new Date().toISOString(), ...act }] }));
    speak(`Burned ${act.calories} calories!`);
  }, [speak]);

  const completeCBT = useCallback((id) => {
    setData(p => ({ ...p, cbtProgress: [...(p.cbtProgress || []), id] }));
    speak("Psychology lesson complete!");
  }, [speak]);

  const toggleGrocery = useCallback((item) => {
    setData(p => ({ ...p, groceryChecked: p.groceryChecked.includes(item) ? p.groceryChecked.filter(i => i !== item) : [...p.groceryChecked, item] }));
  }, []);

  const saveProfile = useCallback((profile, dailyGoal) => {
    setData(p => ({ ...p, userProfile: profile, dailyGoal }));
    setShowProfile(false);
    speak("Profile updated!");
  }, [speak]);

  /* Derived */
  const grocery = useMemo(() => {
    const items = new Set();
    Object.values(mealPlan).forEach(m => m?.foods?.forEach(id => { const f = FOOD_DB[id]; if (f) items.add(f.name); }));
    ["Rice","Roti","Eggs","Milk","Dal","Curd"].forEach(s => { if (![...items].some(i => i.includes(s))) items.add(s); });
    return [...items].sort();
  }, [mealPlan]);

  const todayLog = useMemo(() => data.logged.filter(l => l.time.startsWith(todayStr())), [data.logged]);
  const cbtDone  = (data.cbtProgress || []).length;
  const bmr      = calcBMR(data.userProfile || {});

  /* Loading screen */
  if (loading) return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Mono',monospace", color:T.textPrimary }}>
      <div style={{ fontSize:60, marginBottom:20, animation:"float 2s ease-in-out infinite" }}>🥗</div>
      <div style={{ fontSize:11, letterSpacing:".2em", color:T.accent, textTransform:"uppercase", marginBottom:16 }}>ManifiX Nutrition v9.0</div>
      <div style={{ fontSize:10, color:T.textDim, letterSpacing:".12em", marginBottom:20 }}>AI · BARCODE · CBT · BMR</div>
      <div style={{ width:30, height:30, border:`3px solid ${T.border}`, borderTopColor:T.accent, borderRadius:"50%", animation:"spin 1s linear infinite", boxShadow:`0 0 12px ${T.accent}44` }}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, color:T.textPrimary, fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
      {/* Background grid */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(rgba(0,255,135,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.01) 1px,transparent 1px)`, backgroundSize:"44px 44px" }}/>
      <div style={{ position:"fixed", top:"15%", left:"50%", transform:"translateX(-50%)", width:600, height:300, background:`radial-gradient(ellipse,${T.accentGlow} 0%,transparent 70%)`, pointerEvents:"none" }}/>

      <Confetti show={confetti}/>

      {offline && (
        <div style={{ position:"fixed", top:10, left:"50%", transform:"translateX(-50%)", zIndex:99, fontSize:10, letterSpacing:".1em", background:T.card, border:`2px solid ${T.yellow}`, color:T.yellow, padding:"5px 14px", textTransform:"uppercase", borderRadius:6 }}>
          ⚠️ Offline — AI Scanner & Barcode need internet
        </div>
      )}
      {celebMsg && (
        <div style={{ position:"fixed", top:60, left:"50%", transform:"translateX(-50%)", zIndex:150, fontSize:14, fontWeight:800, background:T.accent, color:"#050a07", padding:"10px 22px", borderRadius:10, fontFamily:"'Syne',sans-serif", boxShadow:`0 0 24px ${T.accent}66` }}>
          {celebMsg}
        </div>
      )}

      <div style={{ position:"relative", zIndex:2, width:"min(500px,98vw)", display:"flex", flexDirection:"column", gap:12, padding:"18px 0 70px" }}>

        {/* ─── HEADER ─── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:14, borderBottom:`1.5px solid ${T.border}` }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, lineHeight:1.1, color:T.textPrimary }}>
              ManifiX <span style={{ color:T.accent, textShadow:`0 0 20px ${T.accent}66` }}>Nutrition</span>
            </div>
            <div style={{ fontSize:10, letterSpacing:".16em", color:T.accent, textTransform:"uppercase", marginTop:3, opacity:.55 }}>v9.0 · AI Vision · Barcode · CBT Coach</div>
            <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
              <StreakBadge days={data.streakDays}/>
              {cbtDone > 0 && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:12, background:`${T.purple}15`, border:`1px solid ${T.purple}44`, fontSize:11, fontWeight:700, color:T.purple }}>
                  🧠 {cbtDone} lessons
                </span>
              )}
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:12, background:`${T.blue}12`, border:`1px solid ${T.blue}33`, fontSize:11, color:T.blue }}>
                BMR: {bmr}
              </span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
            {burnCal > 0 && (
              <div style={{ fontSize:11, color:T.orange, background:`${T.orange}12`, border:`1px solid ${T.orange}33`, padding:"4px 10px", borderRadius:8, fontFamily:"'DM Mono',monospace" }}>
                🔥 -{burnCal} burned
              </div>
            )}
            <button onClick={() => setShowProfile(true)} className="btn ring"
              style={{ fontSize:10, background:`${T.accent}12`, border:`1px solid ${T.accent}33`, color:T.accent, padding:"4px 10px", borderRadius:8, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
              ⚙️ Profile
            </button>
          </div>
        </div>

        {/* ─── SCORE + MACROS ─── */}
        <div className="fade-up" style={{ display:"flex", gap:12 }}>
          <div style={{ border:`2px solid ${scoreColor}33`, background:`${scoreColor}07`, padding:"14px 12px", borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minWidth:118 }}>
            <ScoreRing score={score}/>
            <div style={{ fontSize:10, fontWeight:700, color:scoreColor, marginTop:5 }}>
              {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Keep going"}
            </div>
            <div style={{ fontSize:9, color:T.textDim, marginTop:2 }}>{netCal}/{data.dailyGoal.calories} net kcal</div>
          </div>
          <div style={{ flex:1, border:`1.5px solid ${T.border}`, background:T.card, padding:"14px 15px", borderRadius:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textPrimary, marginBottom:10 }}>📊 Macros Today</div>
            <MacroBar label="Protein" current={totals.protein} goal={data.dailyGoal.protein} color={T.blue}/>
            <MacroBar label="Carbs"   current={totals.carbs}   goal={data.dailyGoal.carbs}   color={T.yellow}/>
            <MacroBar label="Fat"     current={totals.fat}     goal={data.dailyGoal.fat}      color={T.red}/>
            <MacroBar label="Fiber"   current={totals.fiber}   goal={25}                      color={T.teal}/>
          </div>
        </div>

        {/* ─── AI FOOD SCANNER HERO CARD ─── */}
        <div className="fade-up" style={{ border:`2px solid ${T.pink}44`, background:`${T.pink}07`, padding:"14px 16px", borderRadius:14, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"40%", background:`radial-gradient(ellipse at right,${T.pink}10,transparent)`, pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:38, animation:"float 3s ease-in-out infinite" }}>📸</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:T.textPrimary }}>AI Food Scanner</div>
              <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>Photo → Calories in 5 sec · Claude Vision AI</div>
              <div style={{ fontSize:10, color:T.pink, marginTop:3 }}>Works with ANY food — Indian, world cuisine, homemade</div>
            </div>
            <button onClick={() => setShowAIScan(true)} className="btn ring"
              style={{ padding:"10px 16px", fontSize:12, fontWeight:800, background:T.pink, border:"none", color:"#050a07", borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif", boxShadow:`0 0 20px ${T.pink}55`, whiteSpace:"nowrap" }}>
              📸 Scan Food
            </button>
          </div>
        </div>

        {/* ─── TRAFFIC LIGHTS ─── */}
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {Object.entries(LIGHT_CONFIG).map(([key, cfg]) => {
            const count = totals[`${key}Count`] || 0;
            return (
              <div key={key} style={{ textAlign:"center", padding:"10px 8px", borderRadius:10, background:cfg.bg, border:`1.5px solid ${cfg.color}33` }}>
                <div style={{ fontSize:20, fontWeight:700, color:cfg.color, fontFamily:"'DM Mono',monospace" }}>{count}</div>
                <div style={{ fontSize:10, fontWeight:700, color:cfg.color, marginBottom:1 }}>{cfg.label}</div>
                <div style={{ fontSize:9, color:cfg.color, opacity:.7 }}>{key} foods</div>
              </div>
            );
          })}
        </div>

        {/* ─── MICRO NUTRIENTS ─── */}
        <div className="fade-up" style={{ border:`1.5px solid ${T.border}`, background:T.card, padding:"12px 15px", borderRadius:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textPrimary, marginBottom:10 }}>🔬 Micro-Nutrients</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            <Micro label="Iron"    current={totals.iron}    goal={18}   unit="mg" icon="🩸"/>
            <Micro label="Calcium" current={totals.calcium} goal={1000} unit="mg" icon="🦴"/>
            <Micro label="Vit C"   current={totals.vitC}    goal={65}   unit="mg" icon="🍊"/>
            <Micro label="Vit D"   current={totals.vitD}    goal={15}   unit="µg" icon="☀️"/>
          </div>
        </div>

        {/* ─── WATER ─── */}
        <div className="fade-up" style={{ border:`1.5px solid ${T.accent}22`, background:`${T.accent}04`, padding:"14px 15px", borderRadius:14 }}>
          <WaterTracker count={totals.water} goal={data.dailyGoal.water} onAdd={addWater}/>
        </div>

        {/* ─── QUICK ADD ─── */}
        <div>
          <div style={{ fontSize:10, color:T.textDim, textTransform:"uppercase", letterSpacing:".12em", marginBottom:6 }}>⚡ Quick Add</div>
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }} className="hide-scroll">
            {QUICK_ADD.map(key => {
              const f = FOOD_DB[key];
              const lcfg = LIGHT_CONFIG[f.light] || LIGHT_CONFIG.yellow;
              return (
                <button key={key} onClick={() => logFood({ foodId:key, meal:"snack", portion:1 })} className="btn ring"
                  style={{ flex:"0 0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 10px", borderRadius:10, background:T.card, border:`1.5px solid ${T.border}`, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                  <span style={{ fontSize:20 }}>{f.icon}</span>
                  <span style={{ fontSize:9, color:T.textDim, whiteSpace:"nowrap" }}>{f.name.split(" ")[0]}</span>
                  <span style={{ fontSize:9, color:lcfg.color }}>{f.calories}cal</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── PRIMARY ACTIONS ─── */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8 }}>
          <button onClick={() => setShowFood(true)} className="btn ring"
            style={{ padding:"13px 8px", fontSize:13, fontWeight:800, background:T.accent, border:"none", color:"#050a07", borderRadius:10, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer", boxShadow:`0 0 20px ${T.accent}44` }}>
            🍽️ Log Food
          </button>
          <button onClick={() => setShowBarcode(true)} className="btn ring"
            style={{ padding:"13px 6px", fontSize:11, fontWeight:700, background:`${T.teal}18`, border:`2px solid ${T.teal}`, color:T.teal, borderRadius:10, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer" }}>
            🏷️ Barcode
          </button>
          <button onClick={() => setShowActivity(true)} className="btn ring"
            style={{ padding:"13px 6px", fontSize:11, fontWeight:700, background:`${T.orange}15`, border:`2px solid ${T.orange}`, color:T.orange, borderRadius:10, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer" }}>
            🏃 Burns
          </button>
        </div>

        {/* ─── CBT ─── */}
        <button onClick={() => setShowCBT(true)} className="btn ring"
          style={{ width:"100%", padding:"12px", fontSize:12, fontWeight:700, background:`${T.purple}12`, border:`2px solid ${T.purple}44`, color:T.purple, borderRadius:10, fontFamily:"'Syne',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span>🧠 CBT Psychology Coach — Eating Mindset Training</span>
          <span style={{ fontSize:10, opacity:.7 }}>{cbtDone}/{CBT_LESSONS.length} ▸</span>
        </button>

        {/* ─── TABS ─── */}
        <div style={{ display:"flex", gap:5 }}>
          {["today","plan","grocery","trends"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(activeTab === tab ? "_" : tab)} className="btn ring"
              style={{ flex:1, padding:"8px 4px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", fontFamily:"'Syne',sans-serif", borderRadius:8, background:activeTab===tab?`${T.accent}16`:"#060f08", border:`1.5px solid ${activeTab===tab?T.accent:T.border}`, color:activeTab===tab?T.accent:T.textDim, cursor:"pointer" }}>
              {tab==="today"?"📋 Log":tab==="plan"?"🍱 Plan":tab==="grocery"?"🛒 Shop":"📈 Trend"}
            </button>
          ))}
        </div>

        {/* ═══ TAB: TODAY LOG ═══ */}
        {activeTab === "today" && (
          <div className="fade-up">
            <div style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>
              Today's Log · {todayLog.length} entries
            </div>
            {todayLog.length === 0 ? (
              <div style={{ textAlign:"center", padding:"28px 0", color:T.textDim, fontSize:12, border:`1.5px dashed ${T.border}`, borderRadius:12 }}>
                No food logged yet today.<br/>
                <span style={{ fontSize:11, opacity:.6 }}>Use AI Scanner, Barcode or Log Food above</span>
              </div>
            ) : (
              <div style={{ display:"grid", gap:6 }}>
                {todayLog.map(log => {
                  if (log._ai) {
                    const a = log._ai;
                    const acfg = LIGHT_CONFIG[a.light] || LIGHT_CONFIG.yellow;
                    return (
                      <div key={log.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", background:T.card, border:`1.5px solid ${T.pink}44`, borderRadius:10 }}>
                        {a.imageData ? (
                          <img src={a.imageData} alt={a.name} style={{ width:44, height:44, borderRadius:8, objectFit:"cover", flexShrink:0 }}/>
                        ) : (
                          <span style={{ fontSize:22 }}>📸</span>
                        )}
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ fontSize:12, fontWeight:700, color:T.pink }}>🤖 {a.name}</div>
                            <div style={{ fontSize:14, fontWeight:700, color:acfg.color, fontFamily:"'DM Mono',monospace" }}>{a.calories}</div>
                          </div>
                          <div style={{ fontSize:10, color:T.textDim, marginTop:2 }}>AI Scan · {log.meal}</div>
                          <div style={{ display:"flex", gap:8, fontSize:10, color:T.textDim, marginTop:3 }}>
                            <span style={{ color:T.blue }}>P:{a.protein}g</span>
                            <span style={{ color:T.yellow }}>C:{a.carbs}g</span>
                            <span style={{ color:T.red }}>F:{a.fat}g</span>
                            <TrafficLight light={a.light}/>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (log._barcode) {
                    const b = log._barcode;
                    const bcfg = LIGHT_CONFIG[b.light] || LIGHT_CONFIG.yellow;
                    return (
                      <div key={log.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", background:T.card, border:`1.5px solid ${T.teal}44`, borderRadius:10 }}>
                        <span style={{ fontSize:22 }}>📦</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ fontSize:12, fontWeight:700, color:T.teal }}>{b.name}</div>
                            <div style={{ fontSize:14, fontWeight:700, color:bcfg.color, fontFamily:"'DM Mono',monospace" }}>{b.calories}</div>
                          </div>
                          {b.brand && <div style={{ fontSize:10, color:T.textDim, marginTop:1 }}>{b.brand} · {b.portion}g · {log.meal}</div>}
                          <div style={{ display:"flex", gap:8, fontSize:10, color:T.textDim, marginTop:3 }}>
                            <span style={{ color:T.blue }}>P:{b.protein}g</span>
                            <span style={{ color:T.yellow }}>C:{b.carbs}g</span>
                            <span style={{ color:T.red }}>F:{b.fat}g</span>
                            <TrafficLight light={b.light}/>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const f = FOOD_DB[log.foodId];
                  if (!f) return null;
                  const lcfg = LIGHT_CONFIG[f.light] || LIGHT_CONFIG.yellow;
                  return (
                    <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:T.card, border:`1px solid ${lcfg.color}22`, borderRadius:10 }}>
                      <span style={{ fontSize:22 }}>{f.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{f.name}</div>
                        <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:2 }}>
                          <span style={{ fontSize:9, color:T.textDim }}>{log.meal}</span>
                          {log.portion !== 1 && <span style={{ fontSize:9, color:T.textDim }}>{log.portion}×</span>}
                          <TrafficLight light={f.light}/>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.accent, fontFamily:"'DM Mono',monospace" }}>{Math.round(f.calories * (log.portion || 1))}</div>
                        <div style={{ fontSize:9, color:T.textDim }}>cal</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: MEAL PLAN ═══ */}
        {activeTab === "plan" && (
          <div className="fade-up">
            <div style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Smart Meal Plan — Today</div>
            {Object.entries(mealPlan).map(([type, plan]) => (
              <div key={type} style={{ border:`1.5px solid ${T.border}`, background:T.card, padding:"12px 14px", borderRadius:12, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.textPrimary, textTransform:"capitalize" }}>{type}</span>
                  <span style={{ fontSize:11, color:T.accent, fontFamily:"'DM Mono',monospace" }}>{plan.calories} cal</span>
                </div>
                <div style={{ fontSize:12, color:"#cde8d5", marginBottom:8 }}>{plan.name}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
                  {plan.foods?.map((fid, i) => {
                    const f = FOOD_DB[fid];
                    if (!f) return null;
                    const lcfg = LIGHT_CONFIG[f.light] || LIGHT_CONFIG.yellow;
                    return <span key={i} style={{ fontSize:9, padding:"2px 7px", borderRadius:4, background:lcfg.bg, color:lcfg.color }}>{f.icon} {f.name.split(" ")[0]}</span>;
                  })}
                </div>
                <button onClick={() => plan.foods?.forEach(fid => logFood({ foodId:fid, meal:type, portion:1 }))} className="btn ring"
                  style={{ width:"100%", padding:"8px", fontSize:11, fontWeight:700, background:`${T.accent}10`, border:`1px solid ${T.accent}`, color:T.accent, borderRadius:6, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                  ✓ Log This Meal
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ TAB: GROCERY ═══ */}
        {activeTab === "grocery" && (
          <div className="fade-up">
            <div style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Smart Grocery · {grocery.length} items</div>
            <div style={{ display:"grid", gap:5 }}>
              {grocery.map(item => {
                const checked = data.groceryChecked.includes(item);
                return (
                  <label key={item} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, background:checked?`${T.blue}08`:T.card, border:`1px solid ${checked?T.blue:T.border}`, cursor:"pointer", transition:"all .18s" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleGrocery(item)} style={{ accentColor:T.blue, width:15, height:15 }}/>
                    <span style={{ fontSize:12, color:checked?T.textDim:T.textPrimary, textDecoration:checked?"line-through":"none" }}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB: TRENDS ═══ */}
        {activeTab === "trends" && (
          <div className="fade-up">
            <div style={{ border:`1.5px solid ${T.border}`, background:T.card, padding:"14px 16px", borderRadius:12, marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:10 }}>7-Day Score Trend</div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
                <SparkLine scores={[...(data.weeklyScores || []).slice(-6), score]}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textDim }}>
                <span>7 days ago</span>
                <span style={{ color:scoreColor, fontFamily:"'DM Mono',monospace" }}>Today: {score}</span>
              </div>
            </div>

            {/* AI Scan History */}
            {todayLog.filter(l => l._ai).length > 0 && (
              <div style={{ border:`1.5px solid ${T.pink}33`, background:`${T.pink}06`, padding:"12px 14px", borderRadius:12, marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.pink, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>📸 AI Scans Today</div>
                <div style={{ display:"grid", gap:5 }}>
                  {todayLog.filter(l => l._ai).map(log => (
                    <div key={log.id} style={{ display:"flex", gap:10, alignItems:"center" }}>
                      {log._ai.imageData && <img src={log._ai.imageData} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:"cover" }}/>}
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:T.textPrimary }}>{log._ai.name}</div>
                        <div style={{ fontSize:10, color:T.textDim }}>{log._ai.calories} cal · {log.meal}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.activities || []).filter(a => a.time.startsWith(todayStr())).length > 0 && (
              <div style={{ border:`1.5px solid ${T.border}`, background:T.card, padding:"12px 14px", borderRadius:12, marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Today's Activities · {burnCal} cal burned</div>
                <div style={{ display:"grid", gap:6 }}>
                  {(data.activities || []).filter(a => a.time.startsWith(todayStr())).map(a => (
                    <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#0a1a0a", border:`1px solid ${T.border}`, borderRadius:8 }}>
                      <span style={{ fontSize:20 }}>{a.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{a.name}</div>
                        <div style={{ fontSize:10, color:T.textDim }}>{a.minutes} min</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.orange, fontFamily:"'DM Mono',monospace" }}>-{a.calories}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ border:`1.5px solid ${T.purple}22`, background:`${T.purple}06`, padding:"12px 14px", borderRadius:12 }}>
              <div style={{ fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Psychology Progress</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
                {CBT_LESSONS.map(l => {
                  const done = (data.cbtProgress || []).includes(l.id);
                  return (
                    <div key={l.id} style={{ width:34, height:34, borderRadius:7, background:done?`${T.purple}22`:"#0a1a0a", border:`1.5px solid ${done?T.purple:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                      {done ? "✓" : l.icon}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:11, color:T.purple }}>{cbtDone}/{CBT_LESSONS.length} lessons complete</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", fontSize:9, letterSpacing:".12em", color:T.textDim, textTransform:"uppercase", paddingTop:8 }}>
          v9.0 · AI Vision · Open Food Facts · CBT Coach · {offline ? "Offline" : "Online ✓"}
        </div>
      </div>

      {/* MODALS */}
      {showFood     && <FoodLogModal   onClose={() => setShowFood(false)}     onLog={logFood}/>}
      {showActivity && <ActivityModal  onClose={() => setShowActivity(false)} onLog={logActivity}/>}
      {showBarcode  && <BarcodeScanner onFoodLogged={logBarcodeFood}          onClose={() => setShowBarcode(false)}/>}
      {showAIScan   && <AIFoodScanner  onFoodLogged={logAIFood}               onClose={() => setShowAIScan(false)}/>}
      {showCBT      && <CBTModule      cbtProgress={data.cbtProgress}         onComplete={completeCBT} onClose={() => setShowCBT(false)}/>}
      {showProfile  && <ProfileModal   profile={data.userProfile}             dailyGoal={data.dailyGoal} onSave={saveProfile} onClose={() => setShowProfile(false)}/>}
    </div>
  );
}
