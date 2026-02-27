// src/hooks/useVibe.js
import { useCallback } from "react";

export function useVibe() {
  const createVibe = useCallback(async ({ text, mood, musicURL }) => {
    // Later: send to Supabase / backend
    console.log("Vibe created:", {
      text,
      mood,
      musicURL,
      createdAt: new Date().toISOString(),
    });

    // simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    return true;
  }, []);

  return { createVibe };
}
