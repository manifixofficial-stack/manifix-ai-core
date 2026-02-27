import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/config/supabase";

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  guidedProgress: Record<string, boolean>;
  completedAchievements?: string[];
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // =========================
  // Fetch profile from Supabase
  // =========================
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          guidedProgress: data.guidedProgress || {},
          completedAchievements: data.completedAchievements || [],
        });
      }
    } catch (err) {
      console.error("[UserProfile] Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================
  // Update profile helper
  // =========================
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      if (data) setProfile(data);
    } catch (err) {
      console.error("[UserProfile] Update failed", err);
    }
  };

  // =========================
  // Complete guided step
  // =========================
  const completeGuidedStep = async (stepId: string) => {
    if (!profile) return;

    const updatedProgress = {
      ...profile.guidedProgress,
      [stepId]: true,
    };

    await updateProfile({ guidedProgress: updatedProgress });
  };

  // =========================
  // Complete achievement
  // =========================
  const completeAchievement = async (achievementId: string) => {
    if (!profile) return;

    const updatedAchievements = [
      ...(profile.completedAchievements || []),
      achievementId,
    ];

    await updateProfile({ completedAchievements: updatedAchievements });
  };

  // =========================
  // Auto-fetch on mount
  // =========================
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // =========================
  // Return API
  // =========================
  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    completeGuidedStep,
    completeAchievement,
  };
};
