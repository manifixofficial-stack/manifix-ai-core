/* ==========================================================
 * ManifiX — Auth Service (SUPABASE v2 PRODUCTION READY)
 * ----------------------------------------------------------
 * ✔ Supabase v2 compatible
 * ✔ SPA-safe (refresh-proof)
 * ✔ Web + Mobile stable
 * ✔ Prevents white screen on reload
 * ✔ Correct auth listener cleanup
 * ✔ Normalized error handling
 * ========================================================== */

import supabase from "./supabase";

// ===============================================
// 🔒 AUTH SERVICE CLASS
// ===============================================
class AuthService {
  // ===========================================
  // 🔐 SIGN UP
  // ===========================================
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) throw error;

      return data?.user || null;
    } catch (err) {
      throw new Error(err.message || "Sign up failed");
    }
  }

  // ===========================================
  // 🔑 SIGN IN (EMAIL + PASSWORD)
  // ===========================================
  async login(email, password) {
    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      return data?.user || null;
    } catch (err) {
      throw new Error(err.message || "Login failed");
    }
  }

  // ===========================================
  // 🔑 SIGN IN WITH GOOGLE (OAUTH)
  // ===========================================
  async loginWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      throw new Error(err.message || "Google login failed");
    }
  }

  // ===========================================
  // 🚪 SIGN OUT
  // ===========================================
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Logout failed");
    }
  }

  // ===========================================
  // 👤 GET CURRENT USER (SAFE v2)
  // ===========================================
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data?.user || null;
    } catch {
      return null;
    }
  }

  // ===========================================
  // 🧾 GET CURRENT SESSION
  // ===========================================
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data?.session || null;
    } catch {
      return null;
    }
  }

  // ===========================================
  // 🔁 AUTH STATE LISTENER (v2 SAFE)
  // ===========================================
  onAuthChange(callback) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    // Proper cleanup
    return () => subscription.unsubscribe();
  }

  // ===========================================
  // 🔄 RESET PASSWORD (EMAIL LINK)
  // ===========================================
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Password reset failed");
    }
  }

  // ===========================================
  // 🔐 UPDATE PASSWORD
  // ===========================================
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Password update failed");
    }
  }

  // ===========================================
  // 🧹 FORCE LOGOUT (Failsafe)
  // ===========================================
  async forceLogout() {
    try {
      await supabase.auth.signOut();
    } catch {
      console.warn("ManifiX: force logout fallback executed");
    }
  }
}

// ===============================================
// 🔒 SINGLETON EXPORT
// ===============================================
const authService = new AuthService();
export default authService;
