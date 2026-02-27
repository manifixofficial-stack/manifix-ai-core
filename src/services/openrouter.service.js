/* ==========================================================
 * ManifiX — OpenRouter Service (2026 Edition)
 * ----------------------------------------------------------
 * Responsibilities:
 * - Secure communication with OpenRouter
 * - Model abstraction (easy future upgrades)
 * - High reliability & error safety
 * - NO UI should ever call OpenRouter directly
 * ========================================================== */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// 🔐 NEVER expose this key in frontend directly
// Use env variables or server-side proxy for security
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// 🧠 Default model (upgrade anytime)
const DEFAULT_MODEL = "openai/gpt-4o-mini"; 
// other options: mistralai, anthropic, meta-llama, etc.

class OpenRouterService {
  constructor() {
    if (!OPENROUTER_API_KEY) {
      console.warn("⚠️ OpenRouter API key is missing. GPT features will not work.");
    }
  }

  /**
   * Core chat method
   * @param {Object} params
   * @param {string} [params.system] - System message for context
   * @param {Array<{role: string, content: string}>} params.messages - User messages
   * @param {string} [params.model] - GPT model
   * @param {number} [params.temperature] - Creativity control
   * @param {number} [params.max_tokens] - Max tokens to generate
   * @returns {Promise<string>} - GPT response content
   */
  async chat({
    system,
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 800,
  }) {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key missing. Cannot call GPT API.");
    }

    try {
      const payload = {
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages,
        ],
        temperature,
        max_tokens,
      };

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "ManifiX AI",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API Error: ${errText}`);
      }

      const data = await response.json();

      // 🛡️ Safety fallback
      return data?.choices?.[0]?.message?.content || 
        "💖 I’m here with you. Please try again.";
    } catch (err) {
      console.error("❌ OpenRouterService.chat error:", err);
      return "✨ Something went quiet for a moment — please try again 💖";
    }
  }
}

// 🔒 Singleton instance
const openRouterService = new OpenRouterService();
export default openRouterService;
