// src/context/AppProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";
import supabase from "../services/supabase";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [energy, setEnergy] = useState(50);
  const [vibeScore, setVibeScore] = useState(5);

  useEffect(() => {
    let unsubscribe;

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();

        if (currentUser) {
          await ensureProfile(currentUser);
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
      } finally {
        setLoading(false);
      }

      unsubscribe = authService.onAuthChange(async (updatedUser) => {
        if (updatedUser) {
          await ensureProfile(updatedUser);
          setUser(updatedUser);
        } else {
          setUser(null);
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const ensureProfile = async (user) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) {
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          streak: 0,
          last_streak_date: null,
          energy: 50,
          vibe_score: 5,
          created_at: new Date(),
        });
      }
    } catch (err) {
      console.error("Profile check/create failed:", err);
    }
  };

  // Load profile data
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("streak, last_streak_date, energy, vibe_score")
          .eq("id", user.id)
          .single();

        if (data) {
          setStreak(data.streak || 0);
          setLastCompletedDate(data.last_streak_date);
          setEnergy(data.energy || 50);
          setVibeScore(data.vibe_score || 5);
        }
      } catch (err) {
        console.error("Load profile failed:", err);
      }
    };

    loadProfile();
  }, [user]);

  // Ritual actions
  const completeRitual = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    if (lastCompletedDate === today) return;

    let newStreak = 1;
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (lastCompletedDate === yesterdayStr) newStreak = streak + 1;
    const newEnergy = Math.min(energy + 10, 100);

    try {
      await supabase.from("profiles").update({
        streak: newStreak,
        last_streak_date: today,
        energy: newEnergy,
      }).eq("id", user.id);

      setStreak(newStreak);
      setLastCompletedDate(today);
      setEnergy(newEnergy);
    } catch (err) {
      console.error("Complete ritual failed:", err);
    }
  };

  const resetRitual = async () => {
    if (!user) return;
    try {
      await supabase.from("profiles").update({
        streak: 0,
        last_streak_date: null,
        energy: 50,
        vibe_score: 5,
      }).eq("id", user.id);

      setStreak(0);
      setLastCompletedDate(null);
      setEnergy(50);
      setVibeScore(5);
    } catch (err) {
      console.error("Reset ritual failed:", err);
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      setUser,
      logout,
      streak,
      energy,
      vibeScore,
      setVibeScore,
      completeRitual,
      resetRitual,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};
