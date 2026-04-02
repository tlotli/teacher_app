import { storage } from "../services/storage.js";
import { router } from "../router.js";

const DEBUG = import.meta.env.VITE_DEBUG_API_REQUESTS === "true";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
const TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

let _screenSignal = null;

export function setScreenSignal(signal) {
  _screenSignal = signal || null;
}

function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(method, data, extraHeaders = {}) {
  const isFormData = data instanceof FormData;
  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    Accept: "application/json",
    ...extraHeaders,
  };

  const token = storage.getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const csrf = getCsrfToken();
  if (csrf && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    headers["X-XSRF-TOKEN"] = csrf;
  }

  return headers;
}

function buildSignal(customSignal) {
  const controllers = [];
  const signals = [];

  // Timeout
  const timeoutCtrl = new AbortController();
  controllers.push(timeoutCtrl);
  signals.push(timeoutCtrl.signal);
  const timeoutId = setTimeout(() => timeoutCtrl.abort(new DOMException("Request timed out", "TimeoutError")), TIMEOUT_MS);

  // Screen signal
  if (_screenSignal && !_screenSignal.aborted) signals.push(_screenSignal);

  // Custom signal
  if (customSignal && !customSignal.aborted) signals.push(customSignal);

  const combined = AbortSignal.any ? AbortSignal.any(signals) : signals[0];

  return { signal: combined, clearTimeout: () => clearTimeout(timeoutId) };
}

/**
 * Normalise a fetch Response into an axios-compatible shape:
 * { data, status, statusText, headers, config }
 * Throws an axios-compatible error on non-2xx responses.
 */
async function handleResponse(fetchResponse, config) {
  const contentType = fetchResponse.headers.get("content-type") || "";
  let data;
  try {
    data = contentType.includes("application/json")
      ? await fetchResponse.json()
      : await fetchResponse.text();
  } catch {
    data = null;
  }

  const response = {
    data,
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: Object.fromEntries(fetchResponse.headers.entries()),
    config,
  };

  if (!fetchResponse.ok) {
    const err = new Error(`Request failed with status ${fetchResponse.status}`);
    err.response = response;
    err.config = config;

    switch (fetchResponse.status) {
      case 401:
        storage.clearAuth();
        router.navigate("/login");
        break;
      case 419:
        console.error("CSRF mismatch — refreshing token");
        initCsrfProtection();
        break;
    }

    throw err;
  }

  return response;
}

async function request(method, url, { params, data, headers: extraHeaders, signal: customSignal, suppressErrorLog } = {}) {
  const fullUrl = new URL(url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fullUrl.searchParams.set(k, v);
    });
  }

  const headers = buildHeaders(method, data, extraHeaders);
  const { signal, clearTimeout } = buildSignal(customSignal);

  const config = { method, url: fullUrl.toString(), data, headers };

  if (DEBUG) console.log("API →", method.toUpperCase(), fullUrl.pathname);

  const fetchOptions = {
    method: method.toUpperCase(),
    headers,
    credentials: "include",
    signal,
  };

  if (data !== undefined && data !== null) {
    fetchOptions.body = (data instanceof FormData) ? data : (typeof data === "string" ? data : JSON.stringify(data));
  }

  try {
    const response = await fetch(fullUrl.toString(), fetchOptions);
    clearTimeout();
    return await handleResponse(response, config);
  } catch (err) {
    clearTimeout();

    // Re-classify abort errors
    if (err.name === "AbortError" || err.name === "CanceledError") {
      const cancelErr = new Error("Request canceled");
      cancelErr.code = "ERR_CANCELED";
      cancelErr.name = "CanceledError";
      throw cancelErr;
    }

    if (err.response) throw err; // Already handled above

    // Network error
    const netErr = new Error(err.message || "Network Error");
    netErr.code = "ERR_NETWORK";
    netErr.request = true;
    throw netErr;
  }
}

// Drop-in axios-compatible client
const apiClient = {
  get:    (url, config = {})       => request("GET",    url, config),
  post:   (url, data, config = {}) => request("POST",   url, { ...config, data }),
  put:    (url, data, config = {}) => request("PUT",    url, { ...config, data }),
  patch:  (url, data, config = {}) => request("PATCH",  url, { ...config, data }),
  delete: (url, config = {})       => request("DELETE", url, config),
};

export async function initCsrfProtection() {
  try {
    const sanctumUrl =
      import.meta.env.VITE_SANCTUM_URL ||
      BASE_URL.replace("/api", "/sanctum/csrf-cookie");
    await fetch(sanctumUrl, { method: "GET", credentials: "include" });
    if (DEBUG) console.log("✓ CSRF initialized");
  } catch (e) {
    console.warn("CSRF init failed:", e.message);
  }
}

export default apiClient;
