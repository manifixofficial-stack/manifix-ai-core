import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";
import supabase from "../services/supabase";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // 🔐 AUTH STATE
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 RITUAL STATE
  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [energy, setEnergy] = useState(50);
  const [vibeScore, setVibeScore] = useState(5);

  // 🔄 AUTH HYDRATION
  useEffect(() => {
    let unsubscribe;

    const initAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);

      unsubscribe = authService.onAuthChange((updatedUser) => {
        setUser(updatedUser);
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 📥 LOAD PROFILE
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("streak, last_streak_date, energy, vibe_score")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setStreak(data.streak || 0);
        setLastCompletedDate(data.last_streak_date);
        setEnergy(data.energy || 50);
        setVibeScore(data.vibe_score || 5);
      }
    };

    loadProfile();
  }, [user]);

  // 🔥 COMPLETE RITUAL
  const completeRitual = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    if (lastCompletedDate === today) return;

    let newStreak = 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastCompletedDate === yesterdayStr) {
      newStreak = streak + 1;
    }

    const newEnergy = Math.min(energy + 10, 100);

    const { error } = await supabase
      .from("profiles")
      .update({
        streak: newStreak,
        last_streak_date: today,
        energy: newEnergy,
      })
      .eq("id", user.id);

    if (!error) {
      setStreak(newStreak);
      setLastCompletedDate(today);
      setEnergy(newEnergy);
    }
  };

  // 🧹 RESET
  const resetRitual = async () => {
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        streak: 0,
        last_streak_date: null,
        energy: 50,
        vibe_score: 5,
      })
      .eq("id", user.id);

    setStreak(0);
    setLastCompletedDate(null);
    setEnergy(50);
    setVibeScore(5);
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        logout,
        streak,
        energy,
        vibeScore,
        setVibeScore,
        completeRitual,
        resetRitual,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
};
