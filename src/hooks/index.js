// src/hooks/index.ts
// Central export for all ManifiX custom hooks
// Clean architecture for scalability

// ==================== Auth ====================
export { default as useAuth } from "./useAuth";

// ==================== AI ====================
export { default as useAIChat } from "./useAIChat";

// ==================== Magic16 System ====================
export { default as useMagic16 } from "./useMagic16";
export { default as useTimer } from "./useTimer";
export { default as useDetection } from "./useDetection";
export { default as useWarriorValidator } from "./useWarriorValidator";

// ==================== Voice System ====================
export { default as useVoice } from "./useVoice";
export { default as useVoiceCommands } from "./useVoiceCommands";

// ==================== User Progress ====================
export { default as useGuidedPrograms } from "./useGuidedPrograms";
export { default as useAchievements } from "./useAchievements";
export { default as useStreak } from "./useStreak";

// ==================== Utilities ====================
export { default as useFeatureFlags } from "./useFeatureFlags";
export { default as useErrorHandler } from "./useErrorHandler";
export { default as useNotifications } from "./useNotifications";
export { default as useOfflineCache } from "./useOfflineCache";
export { default as useQuickReplies } from "./useQuickReplies";
