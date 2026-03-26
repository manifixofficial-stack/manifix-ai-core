// src/components/index.js

// ================= Layout =================
export { default as MainLayout } from "./Layout/MainLayout";
export { default as MobileLayout } from "./Layout/MobileLayout";
export { default as TopBar } from "./Layout/TopBar";
export { default as BottomNav } from "./Layout/BottomNav";

// ================= Chat =================
export { default as ChatBox } from "./Chat/ChatBox";
export { default as ChatInput } from "./Chat/ChatInput";
export { default as ChatMessage } from "./Chat/ChatMessage";

// ================= Magic16 =================
export { default as Magic16Controls } from "./Magic16/Magic16Controls";
export { default as Magic16Timer } from "./Magic16/Magic16Timer";
export { default as Magic16Step } from "./Magic16/Magic16Step";
export { default as Magic16Progress } from "./Magic16/Magic16Progress";
export { default as Magic16Score } from "./Magic16/Magic16Score";
export { default as Magic16Complete } from "./Magic16/Magic16Complete";
export { default as Magic16Share } from "./Magic16/Magic16Share";
export { default as PostureOverlay } from "./Magic16/PostureOverlay";
export { default as BreathingCircle } from "./Magic16/BreathingCircle";
export { default as CookieBanner } from "./CookieBanner"; // ✅ ADD THIS
// ================= Profile =================
export { default as ProfileCard } from "./Profile/ProfileCard";

// ================= Vision / Camera =================
export { default as CameraView } from "./Camera/CameraView";
export { default as CameraStats } from "./Camera/CameraStats";
export { default as EmotionOverlay } from "./Camera/EmotionOverlay";
export { default as VisionStats } from "./Camera/VisionStats";

// ================= UI =================
export { default as Modal } from "./Modal";
// ================= Auth / Security =================
export { default as ProtectedRoute } from "./ProtectedRoute";
