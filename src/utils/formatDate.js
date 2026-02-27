/**
 * Format a date into a human-readable string
 * @param {number|string|Date} dateInput
 * @param {Object} options
 * @returns {string}
 */
export function formatDate(
  dateInput,
  options = { dateStyle: "medium", timeStyle: "short" }
) {
  if (!dateInput) return "";

  let date;

  // Handle different input types
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    return "";
  }

  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

/**
 * Format time only (HH:MM)
 */
export function formatTimeOnly(dateInput) {
  return formatDate(dateInput, { timeStyle: "short" });
}

/**
 * Format date only (DD MMM YYYY)
 */
export function formatDateOnly(dateInput) {
  return formatDate(dateInput, { dateStyle: "medium" });
}
