// src/services/vibe.service.js
import supabase from "./supabase.js";

/**
 * VibeService
 * Professional production-ready vibe manager
 * Handles create, fetch, search, delete
 */
const VibeService = {
  /**
   * Create a new vibe
   */
  async createVibe({
    text,
    privacy = "private",
    font = "",
    music_title = "",
    music_artist = "",
    music_url = "",
  }) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error("Vibe text cannot be empty");
      }

      if (!["public", "private"].includes(privacy)) {
        throw new Error("Invalid privacy value");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("vibes")
        .insert([
          {
            user_id: user.id,
            text: text.trim(),
            privacy,
            font,
            music_title,
            music_artist,
            music_url,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return data || null;
    } catch (err) {
      console.error("VibeService.createVibe error:", err.message);
      return null;
    }
  },

  /**
   * Get all vibes of current user
   */
  async getUserVibes() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return [];

      const { data, error } = await supabase
        .from("vibes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error("VibeService.getUserVibes error:", err.message);
      return [];
    }
  },

  /**
   * Search public vibes (username, email, text)
   */
  async searchPublicVibes(searchTerm = "") {
    try {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from("vibes")
        .select(`
          id,
          text,
          font,
          music_title,
          music_artist,
          music_url,
          created_at,
          profiles:profiles (
            username,
            email
          )
        `)
        .eq("privacy", "public")
        .or(`
          text.ilike.%${searchTerm}%,
          profiles.username.ilike.%${searchTerm}%,
          profiles.email.ilike.%${searchTerm}%
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((v) => ({
        id: v.id,
        text: v.text,
        font: v.font,
        music_title: v.music_title,
        music_artist: v.music_artist,
        music_url: v.music_url,
        user_name:
          v.profiles?.username ||
          v.profiles?.email ||
          "Anonymous",
      }));
    } catch (err) {
      console.error("VibeService.searchPublicVibes error:", err.message);
      return [];
    }
  },

  /**
   * Delete vibe securely (only owner can delete)
   */
  async deleteVibe(vibeId) {
    try {
      if (!vibeId) throw new Error("Vibe ID required");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("vibes")
        .delete()
        .eq("id", vibeId)
        .eq("user_id", user.id); // 🔐 secure delete

      if (error) throw error;

      return true;
    } catch (err) {
      console.error("VibeService.deleteVibe error:", err.message);
      return false;
    }
  },
};

export default VibeService;
