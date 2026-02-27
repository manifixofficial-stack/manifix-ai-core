/* ==========================================================
 * ManifiX — Validators
 * ----------------------------------------------------------
 * Responsibilities:
 * - Input validation utilities
 * - Email, password, text, number, and custom rules
 * - Production-ready, secure, mobile/web compatible
 * ========================================================== */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validate password
 * Requirements: 
 * - Min 8 characters
 * - At least 1 uppercase
 * - At least 1 lowercase
 * - At least 1 number
 * - At least 1 special character
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return re.test(password);
}

/**
 * Validate username / display name
 * Requirements:
 * - Only letters, numbers, underscores
 * - Length 3-20
 * @param {string} username
 * @returns {boolean}
 */
export function isValidUsername(username) {
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return re.test(username.trim());
}

/**
 * Validate text input length
 * @param {string} text
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isValidTextLength(text, min = 1, max = 500) {
  const len = text.trim().length;
  return len >= min && len <= max;
}

/**
 * Validate number range
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isValidNumber(num, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  return typeof num === "number" && num >= min && num <= max;
}

/**
 * Validate URL format
 * @param {string} url
 * @returns {boolean}
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if input is non-empty
 * @param {string} text
 * @returns {boolean}
 */
export function isNotEmpty(text) {
  return text && text.trim().length > 0;
}

/**
 * Example Usage:
 * 
 * import { isValidEmail, isValidPassword, isValidTextLength } from "../utils/validators.js";
 * 
 * console.log(isValidEmail("user@example.com")); // true
 * console.log(isValidPassword("StrongP@ss1")); // true
 * console.log(isValidTextLength("Hello ManifiX", 5, 50)); // true
 */
