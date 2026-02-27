// src/hooks/useDashboardStats.ts
import { useMemo } from "react";
import { useSettings } from "@/context/settings/SettingsContext";
import { useMagic16 } from "@/hooks/useMagic16";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

export interface DashboardStats {
  streak: number;
  lastCompletedAt: string | null;
  hasCompletedToday: boolean;
  sessionsToday: number;
  focusModeEnabled: boolean;
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  greetingMessage: string;
  motivationScore: number; // 0–100
}

export function useDashboardStats(): DashboardStats {
  // ✅ Get global settings
  const { settings } = useSettings();

  // ✅ Get Magic16 stats
  const { streak = 0, lastCompletedAt = null } = useMagic16();

  // ✅ Get Voice AI stats
  const { sessionsToday = 0 } = useVoiceCommands();

  return useMemo<DashboardStats>(() => {
    const today = new Date().toDateString();

    const hasCompletedToday =
      lastCompletedAt && new Date(lastCompletedAt).toDateString() === today;

    // AI motivation engine
    let motivationScore = 0;
    if (hasCompletedToday) motivationScore += 30;
    if (streak >= 3) motivationScore += 20;
    if (sessionsToday > 0) motivationScore += 20;
    if (settings?.health.focusModeEnabled) motivationScore += 15;
    if (settings?.voice.enabled) motivationScore += 10;
    if (settings?.notifications.streakAlerts) motivationScore += 5;
    if (motivationScore > 100) motivationScore = 100;

    // Greeting logic
    const hour = new Date().getHours();
    let greetingMessage = "Welcome back 🌱";
    if (hour < 12) greetingMessage = "Good Morning ☀️";
    else if (hour < 18) greetingMessage = "Good Afternoon 🌤️";
    else greetingMessage = "Good Evening 🌙";

    return {
      streak,
      lastCompletedAt,
      hasCompletedToday,
      sessionsToday,
      focusModeEnabled: Boolean(settings?.health.focusModeEnabled),
      voiceEnabled: Boolean(settings?.voice.enabled),
      notificationsEnabled: Boolean(settings?.notifications.streakAlerts),
      greetingMessage,
      motivationScore,
    };
  }, [
    streak,
    lastCompletedAt,
    sessionsToday,
    settings?.health.focusModeEnabled,
    settings?.voice.enabled,
    settings?.notifications.streakAlerts,
  ]);
}
