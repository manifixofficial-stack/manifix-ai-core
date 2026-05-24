import supabase from "./supabase";

const PROD_URL      = "https://www.manifixai.com";
const DASHBOARD_URL = `${PROD_URL}/app/dashboard`;
const RESET_URL     = `${PROD_URL}/reset-password`;

class AuthService {

  // 🔐 SIGN UP (email/password)
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

  // 🔑 LOGIN (email/password)
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data?.user || null;
    } catch (err) {
      throw new Error(err.message || "Login failed");
    }
  }

  // 🔑 GOOGLE OAUTH (used by BOTH login + signup pages)
  async loginWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: DASHBOARD_URL, // dashboard will redirect to /onboarding if needed
        },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(err.message || "Google login failed");
    }
  }

  // ✅ CHECK ONBOARDING STATUS
  async isOnboarded(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", userId)
        .single();
      if (error) return false;
      return data?.onboarded === true;
    } catch {
      return false;
    }
  }

  // ✅ MARK ONBOARDING COMPLETE
  async completeOnboarding(userId) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarded: true })
        .eq("id", userId);
      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Failed to save onboarding");
    }
  }

  // 🚪 SIGN OUT
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Logout failed");
    }
  }

  // 👤 GET CURRENT USER
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data?.user || null;
    } catch {
      return null;
    }
  }

  // 🧾 GET SESSION
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data?.session || null;
    } catch {
      return null;
    }
  }

  // 🔁 AUTH STATE LISTENER
  onAuthChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }

  // 🔄 RESET PASSWORD
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_URL,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Password reset failed");
    }
  }

  // 🔐 UPDATE PASSWORD
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    } catch (err) {
      throw new Error(err.message || "Password update failed");
    }
  }

  // 🧹 FORCE LOGOUT
  async forceLogout() {
    try {
      await supabase.auth.signOut();
    } catch {
      console.warn("ManifiX: force logout fallback executed");
    }
  }
}

const authService = new AuthService();
export default authService;
