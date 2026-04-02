/**
 * Utility helpers
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(dateStr) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`.trim();
}

export function truncate(str, len = 50) {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "…" : str;
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function today() {
  return new Date().toISOString().split("T")[0];
}
