// src/config/env.js

import dotenv from "dotenv";

// Load .env variables
dotenv.config();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // AI / LLM
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",

  // Weather
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,

  // News
  NEWS_API_KEY: process.env.NEWS_API_KEY,

  // Voice / Speech
  COQUI_TTS_URL: process.env.COQUI_TTS_URL, // e.g. http://localhost:5002
  VOSK_MODEL_PATH: process.env.VOSK_MODEL_PATH,

  // Security
  JWT_SECRET: process.env.JWT_SECRET,
};
