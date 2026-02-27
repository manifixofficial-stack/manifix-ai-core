// src/hooks/useRealtime.js
import { useEffect } from "react";
import supabase from "../services/supabase";

export default function useRealtime(channel, handler) {
  useEffect(() => {
    if (!channel || !handler) return;

    const subscription = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        handler
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, handler]);
}
