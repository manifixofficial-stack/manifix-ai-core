import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Apple,
  Flame,
  HeartPulse,
  Salad,
  Sparkles,
  TrendingUp,
  Droplets,
  Utensils,
  BarChart3,
  PlayCircle,
  Clock,
  Plus,
  Minus,
  X,
  Menu,
  User,
  Settings,
  Search,
  Bell,
  Star,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Target,
  Trophy,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChefHat,
  ShoppingCart,
  Scale,
  Zap,
  Moon,
  Coffee,
  Fish,
  Egg,
  Wheat,
  Banana,
  Carrot,
  BookOpen,
  FileText,
  Send,
  MessageCircle,
  Heart,
  Thermometer,
  RefreshCw,
  LogOut,
  ChevronLeft,
  BellRing,
  Pause,
  Play,
  AlertCircle,
  Footprints,
  Brain,
} from "lucide-react";

export default function NutritionHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [water, setWater] = useState(5);
  const [waterGoal, setWaterGoal] = useState(8);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [meals, setMeals] = useState([
    { id: 1, name: "Oatmeal with Berries", time: "8:00 AM", calories: 320, protein: 12, carbs: 45, fat: 8, type: "breakfast" },
    { id: 2, name: "Grilled Chicken Salad", time: "12:30 PM", calories: 480, protein: 38, carbs: 22, fat: 24, type: "lunch" },
    { id: 3, name: "Protein Shake", time: "3:00 PM", calories: 180, protein: 28, carbs: 12, fat: 3, type: "snack" },
  ]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", type: "breakfast", time: "" });
  const [nutritionScore, setNutritionScore] = useState(82);
  const [streak, setStreak] = useState(21);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [bmi, setBmi] = useState(24.5);
  const [shoppingList, setShoppingList] = useState([
    { id: 1, name: "Chicken Breast", checked: false, category: "Protein" },
    { id: 2, name: "Brown Rice", checked: false, category: "Carbs" },
    { id: 3, name: "Broccoli", checked: false, category: "Vegetables" },
    { id: 4, name: "Greek Yogurt", checked: true, category: "Dairy" },
    { id: 5, name: "Almonds", checked: false, category: "Nuts" },
    { id: 6, name: "Salmon", checked: false, category: "Protein" },
  ]);
  const [recipes, setRecipes] = useState([
    { id: 1, name: "Mediterranean Bowl", calories: 420, protein: 28, carbs: 45, fat: 16, time: "20 min", difficulty: "Easy", category: "lunch", image: "🥗" },
    { id: 2, name: "Protein Power Oats", calories: 350, protein: 22, carbs: 48, fat: 9, time: "10 min", difficulty: "Easy", category: "breakfast", image: "🥣" },
    { id: 3, name: "Grilled Salmon Plate", calories: 510, protein: 42, carbs: 28, fat: 22, time: "30 min", difficulty: "Medium", category: "dinner", image: "🐟" },
    { id: 4, name: "Berry Smoothie", calories: 220, protein: 8, carbs: 35, fat: 5, time: "5 min", difficulty: "Easy", category: "snack", image: "🫐" },
    { id: 5, name: "Turkey Wrap", calories: 380, protein: 26, carbs: 38, fat: 12, time: "15 min", difficulty: "Easy", category: "lunch", image: "🌯" },
    { id: 6, name: "Avocado Toast", calories: 280, protein: 10, carbs: 30, fat: 14, time: "8 min", difficulty: "Easy", category: "breakfast", image: "🥑" },
  ]);
  const [nutritionDiary, setNutritionDiary] = useState([
    { id: 1, text: "Felt energized today after high-protein breakfast!", date: "Today", mood: "😊" },
    { id: 2, text: "Drank 6 glasses of water. Still feeling a bit tired in the afternoon.", date: "Yesterday", mood: "😐" },
  ]);
  const [diaryInput, setDiaryInput] = useState("");
  const [diaryMood, setDiaryMood] = useState("😊");
  const [mealTimer, setMealTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deficiencyAlerts, setDeficiencyAlerts] = useState([
    { nutrient: "Vitamin D", level: 65, status: "Low" },
    { nutrient: "Iron", level: 78, status: "Moderate" },
    { nutrient: "Omega-3", level: 45, status: "Low" },
    { nutrient: "Calcium", level: 88, status: "Good" },
    { nutrient: "Fiber", level: 72, status: "Moderate" },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("nutritionHealthData");
    if (saved) {
      const parsed = JSON.parse(saved);
      setWater(parsed.water || 5);
      setWaterGoal(parsed.waterGoal || 8);
      setMeals(parsed.meals || meals);
      setShoppingList(parsed.shoppingList || shoppingList);
      setNutritionDiary(parsed.nutritionDiary || nutritionDiary);
      setStreak(parsed.streak || 21);
      setNutritionScore(parsed.nutritionScore || 82);
      setWeight(parsed.weight || 75);
      setHeight(parsed.height || 175);
      setDeficiencyAlerts(parsed.deficiencyAlerts || deficiencyAlerts);
      setProtein(parsed.protein || 0);
      setCarbs(parsed.carbs || 0);
      setFat(parsed.fat || 0);
      setDailyCalories(parsed.dailyCalories || 0);
    }
  }, []);

  useEffect(() => {
    const data = {
      water, waterGoal, meals, shoppingList, nutritionDiary,
      streak, nutritionScore, weight, height, deficiencyAlerts,
      protein, carbs, fat, dailyCalories,
    };
    localStorage.setItem("nutritionHealthData", JSON.stringify(data));
  }, [water, waterGoal, meals, shoppingList, nutritionDiary, streak, nutritionScore, weight, height, deficiencyAlerts, protein, carbs, fat, dailyCalories]);

  useEffect(() => {
    const totalCals = meals.reduce((a, m) => a + m.calories, 0);
    const totalProtein = meals.reduce((a, m) => a + m.protein, 0);
    const totalCarbs = meals.reduce((a, m) => a + m.carbs, 0);
    const totalFat = meals.reduce((a, m) => a + m.fat, 0);
    setDailyCalories(totalCals);
    setProtein(totalProtein);
    setCarbs(totalCarbs);
    setFat(totalFat);
  }, [meals]);

  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        setMealTimer((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning]);

  const bmiCalc = useMemo(() => {
    if (height <= 0) return 0;
    return (weight / ((height / 100) ** 2)).toFixed(1);
  }, [weight, height]);

  const hydrationProgress = useMemo(() => Math.min(100, (water / waterGoal) * 100), [water, waterGoal]);
  const calorieProgress = useMemo(() => Math.min(100, (dailyCalories / calorieGoal) * 100), [dailyCalories, calorieGoal]);

  const notifications = useMemo(() => {
    const notifs = [];
    if (water < 4) notifs.push({ id: 1, type: "warning", message: "Drink more water! You're below half your goal." });
    if (dailyCalories > calorieGoal) notifs.push({ id: 2, type: "alert", message: "You've exceeded your daily calorie goal." });
    if (protein < 50 && dailyCalories > 0) notifs.push({ id: 3, type: "info", message: "Consider adding more protein to your meals." });
    if (streak > 7) notifs.push({ id: 4, type: "success", message: `Amazing ${streak}-day healthy eating streak!` });
    return notifs;
  }, [water, dailyCalories, calorieGoal, protein, streak]);

  const addMeal = useCallback(() => {
    if (!newMeal.name || !newMeal.calories) return;
    const meal = {
      id: Date.now(),
      name: newMeal.name,
      calories: parseInt(newMeal.calories) || 0,
      protein: parseInt(newMeal.protein) || 0,
      carbs: parseInt(newMeal.carbs) || 0,
      fat: parseInt(newMeal.fat) || 0,
      type: newMeal.type,
      time: newMeal.time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setMeals((prev) => [...prev, meal]);
    setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "", type: "breakfast", time: "" });
    setShowAddMeal(false);
  }, [newMeal]);

  const deleteMeal = useCallback((id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addDiaryEntry = useCallback(() => {
    if (!diaryInput.trim()) return;
    setNutritionDiary((prev) => [
      { id: Date.now(), text: diaryInput, date: new Date().toLocaleDateString(), mood: diaryMood },
      ...prev,
    ]);
    setDiaryInput("");
  }, [diaryInput, diaryMood]);

  const deleteDiaryEntry = useCallback((id) => {
    setNutritionDiary((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const toggleShoppingItem = useCallback((id) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }, []);

  const removeShoppingItem = useCallback((id) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addShoppingItem = useCallback(() => {
    const name = prompt("Enter item name:");
    if (name) {
      setShoppingList((prev) => [
        ...prev,
        { id: Date.now(), name, checked: false, category: "Other" },
      ]);
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "meals", label: "Meal Log", icon: Utensils },
    { id: "hydration", label: "Hydration", icon: Droplets },
    { id: "recipes", label: "Recipes", icon: ChefHat },
    { id: "nutrition", label: "Nutrition Score", icon: Sparkles },
    { id: "body", label: "Body Metrics", icon: Scale },
    { id: "shopping", label: "Shopping List", icon: ShoppingCart },
    { id: "diary", label: "Food Diary", icon: BookOpen },
    { id: "timer", label: "Meal Timer", icon: Clock },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; font-family: 'Inter', sans-serif; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,215,0,0.5); }

        .app-container { display: flex; min-height: 100vh; background: #000; color: white; overflow: hidden; }

        .sidebar { width: 280px; background: linear-gradient(180deg, #0a0a0a 0%, #000 100%); border-right: 1px solid rgba(255,215,0,0.12); padding: 24px 0; position: fixed; height: 100vh; z-index: 50; display: flex; flex-direction: column; transition: transform 0.3s ease; }
        .sidebar-logo { display: flex; align-items: center; gap: 12px; padding: 0 24px; margin-bottom: 32px; }
        .sidebar-logo-icon { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #FFD700, #D4AF37); display: flex; align-items: center; justify-content: center; color: #000; }
        .sidebar-logo-text { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #FFD700, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sidebar-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; font-weight: 500; color: #888; border: none; background: none; width: 100%; text-align: left; font-size: 0.95rem; }
        .nav-item:hover { background: rgba(255,215,0,0.06); color: #FFD700; }
        .nav-item.active { background: rgba(255,215,0,0.1); color: #FFD700; font-weight: 600; }
        .nav-item svg { width: 20px; height: 20px; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,215,0,0.08); margin-top: auto; }
        .sidebar-profile { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: rgba(255,255,255,0.03); }
        .profile-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #FFD700, #D4AF37); display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700; }
        .profile-info { flex: 1; }
        .profile-name { font-size: 0.9rem; font-weight: 600; color: #fff; }
        .profile-role { font-size: 0.75rem; color: #888; }

        .main-content { flex: 1; margin-left: 280px; padding: 32px; overflow-y: auto; max-height: 100vh; background: radial-gradient(circle at top left, rgba(255,215,0,0.06), transparent 40%), radial-gradient(circle at bottom right, rgba(212,175,55,0.04), transparent 35%), #000; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .top-bar-left h1 { font-size: 2rem; font-weight: 800; color: #fff; }
        .top-bar-left p { color: #888; font-size: 0.9rem; margin-top: 4px; }
        .top-bar-right { display: flex; align-items: center; gap: 12px; }
        .top-bar-btn { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.1); color: #888; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; position: relative; }
        .top-bar-btn:hover { background: rgba(255,215,0,0.08); color: #FFD700; border-color: rgba(255,215,0,0.2); }
        .notif-badge { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%; background: #EF4444; color: white; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .notification-dropdown { position: absolute; top: 52px; right: 0; width: 320px; background: #111; border: 1px solid rgba(255,215,0,0.15); border-radius: 18px; padding: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 100; }
        .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.03); }
        .notif-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notif-text { font-size: 0.85rem; color: #ccc; line-height: 1.4; }
        .notif-time { font-size: 0.7rem; color: #666; margin-top: 4px; }
        .mobile-menu-btn { display: none; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.1); color: #888; align-items: center; justify-content: center; cursor: pointer; }

        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }

        .card { background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,215,0,0.1); border-radius: 24px; padding: 24px; backdrop-filter: blur(14px); transition: all 0.3s ease; }
        .card:hover { border-color: rgba(255,215,0,0.2); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 0.9rem; color: #888; font-weight: 500; }
        .card-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(255,215,0,0.1); color: #FFD700; }

        .stat-value { font-size: 2.4rem; font-weight: 800; color: #FFD700; line-height: 1; margin-bottom: 8px; }
        .stat-sub { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #888; }
        .trend-up { color: #10B981; }
        .trend-down { color: #EF4444; }

        .progress-bar { height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; margin-top: 16px; }
        .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #FFD700, #D4AF37); transition: width 0.5s ease; }

        .health-score-ring { width: 140px; height: 140px; margin: 0 auto; position: relative; }
        .health-score-ring svg { transform: rotate(-90deg); }
        .health-score-ring .score-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .health-score-ring .score-number { font-size: 2.2rem; font-weight: 900; color: #FFD700; line-height: 1; }
        .health-score-ring .score-label { font-size: 0.7rem; color: #888; margin-top: 2px; }

        .btn { border: none; cursor: pointer; transition: all 0.2s ease; font-weight: 600; font-family: 'Inter', sans-serif; }
        .btn-primary { background: linear-gradient(135deg, #FFD700, #D4AF37); color: #000; padding: 12px 24px; border-radius: 14px; font-size: 0.9rem; box-shadow: 0 8px 24px rgba(255,215,0,0.2); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,215,0,0.3); }
        .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; padding: 12px 24px; border-radius: 14px; border: 1px solid rgba(255,215,0,0.15); font-size: 0.9rem; }
        .btn-secondary:hover { background: rgba(255,215,0,0.08); border-color: rgba(255,215,0,0.25); }
        .btn-sm { padding: 8px 16px; font-size: 0.8rem; border-radius: 10px; }
        .btn-danger { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }

        .input-field { width: 100%; padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(255,215,0,0.12); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.95rem; font-family: 'Inter', sans-serif; outline: none; transition: all 0.2s ease; }
        .input-field:focus { border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.04); }
        .input-field::placeholder { color: #555; }
        .select-field { width: 100%; padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(255,215,0,0.12); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.95rem; font-family: 'Inter', sans-serif; outline: none; appearance: none; cursor: pointer; }
        .select-field option { background: #111; color: #fff; }

        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .badge-gold { background: rgba(255,215,0,0.12); color: #FFD700; }
        .badge-green { background: rgba(16,185,129,0.12); color: #10B981; }
        .badge-red { background: rgba(239,68,68,0.12); color: #EF4444; }

        .insight-card { padding: 16px; border-radius: 14px; background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.15); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; }
        .insight-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,215,0,0.12); display: flex; align-items: center; justify-content: center; color: #FFD700; flex-shrink: 0; }
        .insight-text { font-size: 0.85rem; color: #ccc; line-height: 1.5; }
        .insight-title { font-weight: 600; color: #FFD700; margin-bottom: 4px; }

        .water-drop { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,215,0,0.1); border: 2px solid rgba(255,215,0,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; color: #FFD700; }
        .water-drop.filled { background: rgba(255,215,0,0.25); border-color: #FFD700; }
        .water-drop:hover { transform: scale(1.1); }

        .meal-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 12px; transition: all 0.2s ease; }
        .meal-item:hover { background: rgba(255,215,0,0.04); }
        .meal-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,215,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
        .meal-info { flex: 1; }
        .meal-name { font-weight: 600; font-size: 0.95rem; }
        .meal-meta { font-size: 0.75rem; color: #666; margin-top: 2px; }
        .meal-calories { font-weight: 700; color: #FFD700; font-size: 1.1rem; }
        .meal-actions { display: flex; gap: 8px; }

        .recipe-card { padding: 20px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); cursor: pointer; transition: all 0.3s ease; }
        .recipe-card:hover { border-color: rgba(255,215,0,0.3); transform: translateY(-4px); }
        .recipe-emoji { font-size: 2.5rem; margin-bottom: 12px; }
        .recipe-name { font-weight: 700; font-size: 1.05rem; margin-bottom: 4px; }
        .recipe-details { font-size: 0.8rem; color: #888; }
        .recipe-macros { display: flex; gap: 12px; margin-top: 12px; }
        .recipe-macro { text-align: center; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.04); }
        .recipe-macro-value { font-weight: 700; color: #FFD700; font-size: 0.9rem; }
        .recipe-macro-label { font-size: 0.65rem; color: #666; margin-top: 2px; }

        .shopping-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 10px; transition: all 0.2s ease; }
        .shopping-item:hover { background: rgba(255,215,0,0.04); }
        .shopping-item.checked { opacity: 0.5; }
        .shopping-check { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,215,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .shopping-check.checked { background: #FFD700; border-color: #FFD700; color: #000; }
        .shopping-name { flex: 1; font-weight: 500; }
        .shopping-name.checked { text-decoration: line-through; color: #888; }
        .shopping-category { font-size: 0.7rem; color: #666; background: rgba(255,255,255,0.04); padding: 4px 8px; border-radius: 6px; }

        .diary-item { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 12px; }
        .diary-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .diary-date { font-size: 0.75rem; color: #666; }
        .diary-mood { font-size: 1.4rem; }
        .diary-text { color: #ccc; line-height: 1.6; font-size: 0.9rem; }
        .diary-actions { display: flex; gap: 8px; margin-top: 8px; }

        .mood-selector { display: flex; gap: 12px; justify-content: center; margin: 16px 0; }
        .mood-option { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; font-size: 1.5rem; }
        .mood-option:hover { transform: scale(1.1); }
        .mood-option.active { border-color: #FFD700; background: rgba(255,215,0,0.12); }

        .ai-chat-input { display: flex; gap: 12px; padding: 16px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.1); }
        .ai-chat-input input { flex: 1; background: none; border: none; color: #fff; font-size: 0.95rem; font-family: 'Inter', sans-serif; outline: none; }
        .ai-chat-input input::placeholder { color: #555; }

        .timer-display { font-size: 4rem; font-weight: 900; color: #FFD700; text-align: center; font-variant-numeric: tabular-nums; letter-spacing: 4px; }

        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 40; }

        @media (max-width: 1200px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 1024px) { .grid-3 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.active { display: block; }
          .main-content { margin-left: 0; padding: 20px 16px; }
          .mobile-menu-btn { display: flex; }
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
          .top-bar { flex-wrap: wrap; gap: 16px; }
        }
      `}</style>

      <div className="app-container">
        <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><Apple size={22} /></div>
            <span className="sidebar-logo-text">NutritionAI</span>
          </div>

          <nav className="sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-profile">
              <div className="profile-avatar">JD</div>
              <div className="profile-info">
                <div className="profile-name">John Doe</div>
                <div className="profile-role">Premium Member</div>
              </div>
              <Settings size={18} style={{ color: "#666", cursor: "pointer" }} />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={20} />
              </button>
              <div className="top-bar-left">
                <h1>{tabs.find((t) => t.id === activeTab)?.label || "Dashboard"}</h1>
                <p>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>

            <div className="top-bar-right">
              <div style={{ position: "relative" }}>
                <button className="top-bar-btn" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={18} />
                  {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      className="notification-dropdown"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 16, color: "#FFD700" }}>Notifications</div>
                      {notifications.map((notif) => (
                        <div key={notif.id} className="notif-item">
                          <div className="notif-icon" style={{
                            background: notif.type === "alert" ? "rgba(239,68,68,0.15)" : notif.type === "warning" ? "rgba(255,215,0,0.15)" : notif.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                            color: notif.type === "alert" ? "#EF4444" : notif.type === "warning" ? "#FFD700" : notif.type === "success" ? "#10B981" : "#3B82F6",
                          }}>
                            {notif.type === "alert" ? <AlertTriangle size={16} /> : notif.type === "warning" ? <AlertCircle size={16} /> : notif.type === "success" ? <Trophy size={16} /> : <Info size={16} />}
                          </div>
                          <div>
                            <div className="notif-text">{notif.message}</div>
                            <div className="notif-time">Just now</div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#666" }}>No notifications</div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="top-bar-btn"><Search size={18} /></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-4">
                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="card-header">
                      <span className="card-title">Nutrition Score</span>
                      <div className="card-icon"><Sparkles size={20} /></div>
                    </div>
                    <div className="health-score-ring">
                      <svg width="140" height="140">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="12" />
                        <circle cx="70" cy="70" r="60" fill="none" stroke="url(#goldGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${nutritionScore * 3.77} ${377 - nutritionScore * 3.77}`} style={{ transition: "stroke-dasharray 1s ease" }} />
                        <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#D4AF37" /></linearGradient></defs>
                      </svg>
                      <div className="score-value">
                        <div className="score-number">{nutritionScore}</div>
                        <div className="score-label">/ 100</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="card-header">
                      <span className="card-title">Calories Today</span>
                      <div className="card-icon"><Flame size={20} /></div>
                    </div>
                    <div className="stat-value">{dailyCalories}<span style={{ fontSize: "1rem", color: "#888" }}>/2000</span></div>
                    <div className="stat-sub">{dailyCalories > calorieGoal ? <span className="trend-down">Over limit</span> : <span className="trend-up">On track</span>}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${calorieProgress}%`, background: calorieProgress > 100 ? "linear-gradient(90deg, #EF4444, #DC2626)" : "linear-gradient(90deg, #FFD700, #D4AF37)" }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="card-header">
                      <span className="card-title">Water Intake</span>
                      <div className="card-icon"><Droplets size={20} /></div>
                    </div>
                    <div className="stat-value">{water}<span style={{ fontSize: "1rem", color: "#888" }}>/{waterGoal}</span></div>
                    <div className="stat-sub">glasses</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${hydrationProgress}%`, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="card-header">
                      <span className="card-title">Streak</span>
                      <div className="card-icon"><Trophy size={20} /></div>
                    </div>
                    <div className="stat-value">{streak}<span style={{ fontSize: "1rem", color: "#888" }}> days</span></div>
                    <div className="stat-sub"><span className="trend-up">🔥 Keep it going!</span></div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }} />
                    </div>
                  </motion.div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Quick Actions</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                      {[
                        { label: "Log Meal", action: () => setActiveTab("meals"), icon: Utensils },
                        { label: "Add Water", action: () => setWater((v) => Math.min(waterGoal, v + 1)), icon: Droplets },
                        { label: "Browse Recipes", action: () => setActiveTab("recipes"), icon: ChefHat },
                        { label: "Shopping List", action: () => setActiveTab("shopping"), icon: ShoppingCart },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button key={i} className="btn btn-secondary" style={{ padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }} onClick={item.action}>
                            <Icon size={24} style={{ color: "#FFD700" }} />
                            <span style={{ fontSize: "0.85rem" }}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">AI Nutrition Insight</span>
                      <div className="card-icon"><Sparkles size={20} /></div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Apple size={18} /></div>
                      <div>
                        <div className="insight-title">Protein Balance</div>
                        <div className="insight-text">
                          {protein < 100 ? `You've had ${protein}g protein today. Aim for 100g+ for optimal muscle recovery and energy.` : "Great protein intake today! Keep maintaining this balance."}
                        </div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Zap size={18} /></div>
                      <div>
                        <div className="insight-title">Energy Tip</div>
                        <div className="insight-text">
                          {dailyCalories < 1500 ? "Consider adding a nutrient-dense snack to meet your energy needs for the day." : "You're on track with your calorie goals for sustained energy."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Today's Meals</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("meals")}>View All</button>
                  </div>
                  {meals.map((meal) => {
                    const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
                    return (
                      <div key={meal.id} className="meal-item">
                        <div className="meal-icon">{mealEmojis[meal.type] || "🍽️"}</div>
                        <div className="meal-info">
                          <div className="meal-name">{meal.name}</div>
                          <div className="meal-meta">{meal.type} • {meal.time}</div>
                        </div>
                        <div className="meal-calories">{meal.calories} kcal</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* MEALS */}
            {activeTab === "meals" && (
              <motion.div key="meals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Today's Macros</span>
                  </div>
                  <div className="grid-3" style={{ marginBottom: 0 }}>
                    <div style={{ textAlign: "center", padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8 }}>Protein</div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "#FFD700" }}>{protein}g</div>
                      <div className="progress-bar" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${Math.min((protein / 150) * 100, 100)}%`, background: "linear-gradient(90deg, #10B981, #059669)" }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8 }}>Carbs</div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "#FFD700" }}>{carbs}g</div>
                      <div className="progress-bar" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${Math.min((carbs / 250) * 100, 100)}%`, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8 }}>Fat</div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "#FFD700" }}>{fat}g</div>
                      <div className="progress-bar" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${Math.min((fat / 65) * 100, 100)}%`, background: "linear-gradient(90deg, #8B5CF6, #A78BFA)" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span className="card-title">Meal Log</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddMeal(true)}>
                      <Plus size={14} style={{ marginRight: 4 }} />Add Meal
                    </button>
                  </div>

                  {meals.map((meal) => {
                    const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
                    return (
                      <div key={meal.id} className="meal-item">
                        <div className="meal-icon">{mealEmojis[meal.type] || "🍽️"}</div>
                        <div className="meal-info">
                          <div className="meal-name">{meal.name}</div>
                          <div className="meal-meta">{meal.type} • {meal.time} • P: {meal.protein}g C: {meal.carbs}g F: {meal.fat}g</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="meal-calories">{meal.calories}</div>
                          <div style={{ fontSize: "0.7rem", color: "#888" }}>kcal</div>
                        </div>
                        <div className="meal-actions">
                          <button className="btn btn-danger btn-sm" onClick={() => deleteMeal(meal.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {meals.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <Utensils size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>No meals logged today</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Start tracking your nutrition</div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddMeal && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
                      onClick={() => setShowAddMeal(false)}
                    >
                      <motion.div className="card" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFD700" }}>Add Meal</h3>
                          <button onClick={() => setShowAddMeal(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                            <X size={20} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Meal Name</label>
                            <input className="input-field" placeholder="e.g., Grilled Chicken Salad" value={newMeal.name} onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Calories</label>
                              <input className="input-field" type="number" placeholder="kcal" value={newMeal.calories} onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Time</label>
                              <input className="input-field" placeholder="e.g., 12:00 PM" value={newMeal.time} onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })} />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Protein (g)</label>
                              <input className="input-field" type="number" placeholder="g" value={newMeal.protein} onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Carbs (g)</label>
                              <input className="input-field" type="number" placeholder="g" value={newMeal.carbs} onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Fat (g)</label>
                              <input className="input-field" type="number" placeholder="g" value={newMeal.fat} onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })} />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Meal Type</label>
                            <select className="select-field" value={newMeal.type} onChange={(e) => setNewMeal({ ...newMeal, type: e.target.value })}>
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                          </div>

                          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addMeal}>Save Meal</button>
                            <button className="btn btn-secondary" onClick={() => setShowAddMeal(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* HYDRATION */}
            {activeTab === "hydration" && (
              <motion.div key="hydration" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 24 }}>
                  <div className="card-header" style={{ justifyContent: "center", marginBottom: 32 }}>
                    <span className="card-title" style={{ fontSize: "1.4rem", color: "#FFD700" }}>Daily Hydration Tracker</span>
                  </div>

                  <div style={{ fontSize: "5rem", fontWeight: 900, color: "#FFD700", marginBottom: 8 }}>{water}</div>
                  <div style={{ color: "#888", fontSize: "1.1rem", marginBottom: 32 }}>of {waterGoal} glasses</div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <div key={n} className={`water-drop ${n <= water ? "filled" : ""}`} onClick={() => setWater(n === water ? n - 1 : n)}>
                        <Droplets size={n <= water ? 18 : 16} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setWater((v) => Math.max(0, v - 1))}><Minus size={18} /></button>
                    <button className="btn btn-primary" onClick={() => setWater((v) => Math.min(waterGoal, v + 1))}>
                      <Plus size={18} style={{ marginRight: 4 }} />Add Glass
                    </button>
                    <button className="btn btn-secondary" onClick={() => setWaterGoal((g) => g + 1)}><Plus size={14} style={{ marginRight: 2 }} />Goal</button>
                  </div>

                  <div className="progress-bar" style={{ marginTop: 24, height: 12 }}>
                    <div className="progress-fill" style={{ width: `${hydrationProgress}%`, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Hydration Benefits</span>
                      <div className="card-icon"><Info size={20} /></div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Brain size={18} /></div>
                      <div>
                        <div className="insight-title">Brain Function</div>
                        <div className="insight-text">Even 1-2% dehydration can impair concentration and memory. Stay hydrated for mental clarity.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Heart size={18} /></div>
                      <div>
                        <div className="insight-title">Heart Health</div>
                        <div className="insight-text">Proper hydration helps maintain blood volume and reduces strain on your cardiovascular system.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Zap size={18} /></div>
                      <div>
                        <div className="insight-title">Energy Levels</div>
                        <div className="insight-text">Water is essential for converting food into energy. Fatigue is often a sign of dehydration.</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Weekly Water Goal</span>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFD700" }}>{waterGoal}</div>
                      <div style={{ color: "#888", marginTop: 4 }}>glasses per day</div>
                      <div style={{ marginTop: 24 }}>
                        <button className="btn btn-secondary" onClick={() => setWaterGoal((g) => Math.max(4, g - 1))}>Lower Goal</button>
                        <button className="btn btn-primary" style={{ marginLeft: 12 }} onClick={() => setWaterGoal((g) => g + 1)}>Increase Goal</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RECIPES */}
            {activeTab === "recipes" && (
              <motion.div key="recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Recipe Collection</span>
                    <span className="badge badge-gold">{recipes.length} recipes</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {["all", "breakfast", "lunch", "dinner", "snack"].map((cat) => (
                      <button key={cat} className="btn btn-secondary btn-sm" style={{ textTransform: "capitalize" }} onClick={() => setSelectedRecipe(cat)}>{cat}</button>
                    ))}
                  </div>

                  <div className="grid-3">
                    {recipes
                      .filter((r) => selectedRecipe === "all" || !selectedRecipe || r.category === selectedRecipe)
                      .map((recipe) => (
                        <div key={recipe.id} className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                          <div className="recipe-emoji">{recipe.image}</div>
                          <div className="recipe-name">{recipe.name}</div>
                          <div className="recipe-details">{recipe.time} • {recipe.difficulty}</div>
                          <div className="recipe-macros">
                            <div className="recipe-macro">
                              <div className="recipe-macro-value">{recipe.calories}</div>
                              <div className="recipe-macro-label">kcal</div>
                            </div>
                            <div className="recipe-macro">
                              <div className="recipe-macro-value">{recipe.protein}g</div>
                              <div className="recipe-macro-label">protein</div>
                            </div>
                            <div className="recipe-macro">
                              <div className="recipe-macro-value">{recipe.carbs}g</div>
                              <div className="recipe-macro-label">carbs</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedRecipe && typeof selectedRecipe === "object" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="card"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{selectedRecipe.image}</div>
                          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#FFD700" }}>{selectedRecipe.name}</h3>
                          <div style={{ color: "#888", fontSize: "0.85rem" }}>{selectedRecipe.time} • {selectedRecipe.difficulty}</div>
                        </div>
                        <button onClick={() => setSelectedRecipe("all")} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
                          <X size={24} />
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                        <div style={{ textAlign: "center", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFD700" }}>{selectedRecipe.calories}</div>
                          <div style={{ fontSize: "0.7rem", color: "#888" }}>Calories</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFD700" }}>{selectedRecipe.protein}g</div>
                          <div style={{ fontSize: "0.7rem", color: "#888" }}>Protein</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFD700" }}>{selectedRecipe.carbs}g</div>
                          <div style={{ fontSize: "0.7rem", color: "#888" }}>Carbs</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFD700" }}>{selectedRecipe.fat}g</div>
                          <div style={{ fontSize: "0.7rem", color: "#888" }}>Fat</div>
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => { setMeals((prev) => [...prev, { id: Date.now(), name: selectedRecipe.name, calories: selectedRecipe.calories, protein: selectedRecipe.protein, carbs: selectedRecipe.carbs, fat: selectedRecipe.fat, type: selectedRecipe.category, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }]); setSelectedRecipe("all"); }}>
                        <Plus size={16} style={{ marginRight: 6 }} />Add to Meal Log
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* NUTRITION SCORE */}
            {activeTab === "nutrition" && (
              <motion.div key="nutrition" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 24 }}>
                  <div className="card-header" style={{ justifyContent: "center", marginBottom: 24 }}>
                    <span className="card-title" style={{ fontSize: "1.4rem", color: "#FFD700" }}>Nutrition Quality Score</span>
                  </div>

                  <div className="health-score-ring" style={{ width: 200, height: 200 }}>
                    <svg width="200" height="200">
                      <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="14" />
                      <circle cx="100" cy="100" r="85" fill="none" stroke="url(#goldGrad2)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${nutritionScore * 5.34} ${534 - nutritionScore * 5.34}`} style={{ transition: "stroke-dasharray 1s ease" }} />
                      <defs><linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#D4AF37" /></linearGradient></defs>
                    </svg>
                    <div className="score-value">
                      <div className="score-number" style={{ fontSize: "3rem" }}>{nutritionScore}</div>
                      <div className="score-label" style={{ fontSize: "0.85rem" }}>out of 100</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button className="btn btn-primary" onClick={() => setNutritionScore((v) => Math.min(100, v + 5))}>
                      <TrendingUp size={16} style={{ marginRight: 6 }} />Improve Score
                    </button>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Nutrient Levels</span>
                      <div className="card-icon"><Target size={20} /></div>
                    </div>
                    {deficiencyAlerts.map((alert) => (
                      <div key={alert.nutrient} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "0.85rem", color: "#ccc" }}>{alert.nutrient}</span>
                          <span style={{ fontSize: "0.75rem", color: alert.status === "Good" ? "#10B981" : alert.status === "Moderate" ? "#FFD700" : "#EF4444" }}>{alert.status} ({alert.level}%)</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${alert.level}%`, background: alert.status === "Good" ? "linear-gradient(90deg, #10B981, #059669)" : alert.status === "Moderate" ? "linear-gradient(90deg, #FFD700, #D4AF37)" : "linear-gradient(90deg, #EF4444, #DC2626)" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Nutrition Tips</span>
                      <div className="card-icon"><Sparkles size={20} /></div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Apple size={18} /></div>
                      <div>
                        <div className="insight-title">Vitamin D</div>
                        <div className="insight-text">Consider adding fatty fish, eggs, or fortified foods. 15 minutes of daily sun exposure helps too.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Fish size={18} /></div>
                      <div>
                        <div className="insight-title">Omega-3</div>
                        <div className="insight-text">Add salmon, walnuts, or flaxseed to your meals. Aim for 2-3 servings of fatty fish per week.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Wheat size={18} /></div>
                      <div>
                        <div className="insight-title">Fiber</div>
                        <div className="insight-text">Include more whole grains, vegetables, and legumes. Aim for 25-30g daily for optimal digestion.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BODY METRICS */}
            {activeTab === "body" && (
              <motion.div key="body" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">BMI Calculator</span>
                      <div className="card-icon"><Scale size={20} /></div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Weight (kg)</label>
                        <input className="input-field" type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Height (cm)</label>
                        <input className="input-field" type="number" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginTop: 24, padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFD700" }}>{bmiCalc}</div>
                      <div style={{ color: "#888", marginTop: 4 }}>BMI</div>
                      <div className="badge" style={{ marginTop: 8, background: parseFloat(bmiCalc) < 18.5 ? "rgba(59,130,246,0.12)" : parseFloat(bmiCalc) < 25 ? "rgba(16,185,129,0.12)" : parseFloat(bmiCalc) < 30 ? "rgba(255,215,0,0.12)" : "rgba(239,68,68,0.12)", color: parseFloat(bmiCalc) < 18.5 ? "#3B82F6" : parseFloat(bmiCalc) < 25 ? "#10B981" : parseFloat(bmiCalc) < 30 ? "#FFD700" : "#EF4444" }}>
                        {parseFloat(bmiCalc) < 18.5 ? "Underweight" : parseFloat(bmiCalc) < 25 ? "Normal" : parseFloat(bmiCalc) < 30 ? "Overweight" : "Obese"}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Daily Calorie Needs</span>
                      <div className="card-icon"><Zap size={20} /></div>
                    </div>

                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFD700" }}>~{Math.round(weight * 22)}-{Math.round(weight * 26)}</div>
                      <div style={{ color: "#888", marginTop: 4 }}>kcal/day (BMR)</div>
                      <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "#888", fontSize: "0.85rem" }}>Sedentary</span>
                          <span style={{ color: "#FFD700", fontWeight: 700 }}>{Math.round(weight * 22 * 1.2)} kcal</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "#888", fontSize: "0.85rem" }}>Light Activity</span>
                          <span style={{ color: "#FFD700", fontWeight: 700 }}>{Math.round(weight * 22 * 1.375)} kcal</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "#888", fontSize: "0.85rem" }}>Moderate Activity</span>
                          <span style={{ color: "#FFD700", fontWeight: 700 }}>{Math.round(weight * 22 * 1.55)} kcal</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#888", fontSize: "0.85rem" }}>High Activity</span>
                          <span style={{ color: "#FFD700", fontWeight: 700 }}>{Math.round(weight * 22 * 1.725)} kcal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 0 }}>
                  <div className="card-header">
                    <span className="card-title">Health Targets</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                      { label: "BMI Range", value: "18.5 - 24.9", status: parseFloat(bmiCalc) >= 18.5 && parseFloat(bmiCalc) <= 24.9 },
                      { label: "Water", value: `${waterGoal} glasses/day`, status: water >= waterGoal },
                      { label: "Protein", value: "100g+/day", status: protein >= 100 },
                      { label: "Fiber", value: "25g+/day", status: false },
                      { label: "Calories", value: `${calorieGoal} kcal/day`, status: dailyCalories <= calorieGoal },
                      { label: "Nutrition Score", value: "80+/100", status: nutritionScore >= 80 },
                    ].map((target, i) => (
                      <div key={i} style={{ padding: "16px", borderRadius: 14, background: target.status ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${target.status ? "rgba(16,185,129,0.2)" : "rgba(255,215,0,0.1)"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: "0.85rem", color: "#888" }}>{target.label}</span>
                          <span style={{ fontSize: "1rem" }}>{target.status ? "✅" : "⚠️"}</span>
                        </div>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{target.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SHOPPING */}
            {activeTab === "shopping" && (
              <motion.div key="shopping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Shopping List</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={addShoppingItem}><Plus size={14} style={{ marginRight: 4 }} />Add Item</button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div className="badge badge-gold" style={{ marginBottom: 12 }}>{shoppingList.filter((i) => !i.checked).length} items remaining</div>
                  </div>

                  {shoppingList.map((item) => (
                    <div key={item.id} className={`shopping-item ${item.checked ? "checked" : ""}`}>
                      <div className={`shopping-check ${item.checked ? "checked" : ""}`} onClick={() => toggleShoppingItem(item.id)}>
                        {item.checked && <CheckCircle2 size={14} />}
                      </div>
                      <span className={`shopping-name ${item.checked ? "checked" : ""}`}>{item.name}</span>
                      <span className="shopping-category">{item.category}</span>
                      <button className="btn btn-danger btn-sm" onClick={() => removeShoppingItem(item.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {shoppingList.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <ShoppingCart size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>Shopping list is empty</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Add items you need for your meals</div>
                    </div>
                  )}
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Quick Add Foods</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["Chicken Breast", "Brown Rice", "Broccoli", "Greek Yogurt", "Almonds", "Salmon", "Eggs", "Sweet Potato", "Spinach", "Avocado"].map((food) => (
                      <button key={food} className="btn btn-secondary btn-sm" onClick={() => setShoppingList((prev) => [...prev, { id: Date.now() + Math.random(), name: food, checked: false, category: "Quick Add" }])}>
                        <Plus size={12} style={{ marginRight: 4 }} />{food}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* DIARY */}
            {activeTab === "diary" && (
              <motion.div key="diary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">How was your nutrition today?</span>
                    <div className="card-icon"><FileText size={20} /></div>
                  </div>

                  <div className="mood-selector">
                    {["😢", "😟", "😐", "😊", "😄"].map((m, i) => (
                      <div key={i} className={`mood-option ${diaryMood === m ? "active" : ""}`} onClick={() => setDiaryMood(m)}>{m}</div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <textarea className="input-field" placeholder="Write about your meals, how you felt, cravings, energy levels..." value={diaryInput} onChange={(e) => setDiaryInput(e.target.value)} style={{ minHeight: 80, resize: "vertical", lineHeight: 1.6 }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={addDiaryEntry}>
                      <Send size={14} style={{ marginRight: 6 }} />Save Entry
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Nutrition Diary</span>
                    <span className="badge badge-gold">{nutritionDiary.length} entries</span>
                  </div>

                  {nutritionDiary.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <BookOpen size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>No diary entries yet</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Start tracking your food experience</div>
                    </div>
                  ) : (
                    <div>
                      {nutritionDiary.map((entry) => (
                        <div key={entry.id} className="diary-item">
                          <div className="diary-header">
                            <span className="diary-date">{entry.date}</span>
                            <span className="diary-mood">{entry.mood}</span>
                          </div>
                          <div className="diary-text">{entry.text}</div>
                          <div className="diary-actions">
                            <button className="btn btn-sm btn-danger" onClick={() => deleteDiaryEntry(entry.id)}>
                              <Trash2 size={12} style={{ marginRight: 4 }} />Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TIMER */}
            {activeTab === "timer" && (
              <motion.div key="timer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div className="card-header" style={{ justifyContent: "center", marginBottom: 40 }}>
                    <span className="card-title" style={{ fontSize: "1.4rem", color: "#FFD700" }}>Meal Digestion Timer</span>
                  </div>

                  <div className="timer-display">{formatTime(mealTimer)}</div>

                  <p style={{ color: "#888", marginTop: 16, fontSize: "0.95rem" }}>
                    {isTimerRunning ? "Tracking your post-meal digestion time..." : "Start the timer after finishing a meal"}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 40 }}>
                    <button className="btn btn-primary" onClick={() => { if (isTimerRunning) { setIsTimerRunning(false); } else { setIsTimerRunning(true); } }}>
                      {isTimerRunning ? <><Pause size={16} style={{ marginRight: 6 }} />Pause</> : <><Play size={16} style={{ marginRight: 6 }} />Start</>}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setIsTimerRunning(false); setMealTimer(0); }}>
                      <RefreshCw size={16} style={{ marginRight: 6 }} />Reset
                    </button>
                  </div>

                  <div style={{ marginTop: 48 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      {[
                        { label: "15 min walk", time: 900, desc: "Light walk to aid digestion" },
                        { label: "30 min rest", time: 1800, desc: "Sit quietly after meal" },
                        { label: "2 hr window", time: 7200, desc: "Next snack timing" },
                      ].map((preset) => (
                        <button key={preset.label} className="btn btn-secondary" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }} onClick={() => { setMealTimer(preset.time); setIsTimerRunning(true); }}>
                          <div style={{ fontWeight: 700, color: "#FFD700" }}>{preset.label}</div>
                          <div style={{ fontSize: "0.75rem", color: "#888" }}>{preset.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Digestion Tips</span>
                      <div className="card-icon"><Info size={20} /></div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Footprints size={18} /></div>
                      <div>
                        <div className="insight-title">Walk After Meals</div>
                        <div className="insight-text">A 15-minute walk after eating can improve digestion and reduce blood sugar spikes by up to 30%.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Coffee size={18} /></div>
                      <div>
                        <div className="insight-title">Wait Before Drinking Coffee</div>
                        <div className="insight-text">Wait at least 1 hour after eating before consuming coffee to avoid interfering with nutrient absorption.</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Timer History</span>
                      <div className="card-icon"><Clock size={20} /></div>
                    </div>
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <Clock size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div style={{ color: "#888" }}>Timer sessions will be tracked here</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
