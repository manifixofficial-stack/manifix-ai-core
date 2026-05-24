/* ==========================================================
 * ManifiX — Auth Service (SUPABASE v2 PRODUCTION READY)
 * ----------------------------------------------------------
 * ✔ Supabase v2 compatible
 * ✔ SPA-safe (refresh-proof)
 * ✔ Web + Mobile stable
 * ✔ Prevents white screen on reload
 * ✔ Correct auth listener cleanup
 * ✔ Normalized error handling
 * ✔ Hardcoded production URLs (manifixai.com)
 * ========================================================== */

import supabase from "./supabase";

// ─── Production URLs ────────────────────────────────────────
const PROD_URL      = "https://www.manifixai.com";
const DASHBOARD_URL = `${PROD_URL}/app/dashboard`;
const RESET_URL     = `${PROD_URL}/reset-password`;

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
 async loginWithGoogleSignup() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://www.manifixai.com/onboarding", // ✅ goes to onboarding
      },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    throw new Error(err.message || "Google sign-up failed");
  }
}

  // ===========================================
  // 🔑 SIGN IN WITH GOOGLE (OAUTH)
  // ✅ Fixed: hardcoded production redirect URL
  // ===========================================
  async loginWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: DASHBOARD_URL, // ✅ always → manifixai.com/app/dashboard
        },
      });

      if (error) throw error;
      // User comes back via onAuthStateChange — not here
      return data;
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

    return () => subscription.unsubscribe();
  }

  // ===========================================
  // 🔄 RESET PASSWORD (EMAIL LINK)
  // ✅ Fixed: hardcoded production reset URL
  // ===========================================
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_URL, // ✅ always → manifixai.com/reset-password
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
