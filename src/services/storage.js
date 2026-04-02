const STORAGE_KEYS = {
  AUTH_TOKEN: "teacher_auth_token",
  TEACHER_INFO: "teacher_info",
  SCHOOL_INFO: "teacher_school_info",
  APP_SETTINGS: "teacher_app_settings",
  CACHE_TIMESTAMP: "teacher_cache_ts",
  FCM_TOKEN: "teacher_fcm_token",
  OFFLINE_ACTION_QUEUE: "teacher_offline_queue",
  UNREAD_MESSAGES: "teacher_unread_messages",
};

export const CACHE_DURATIONS = {
  CLASSES: 15 * 60 * 1000,
  STUDENTS: 15 * 60 * 1000,
  TIMETABLE: 30 * 60 * 1000,
  ATTENDANCE: 5 * 60 * 1000,
  MESSAGES: 2 * 60 * 1000,
  ATP_PLANS: 10 * 60 * 1000,
  SCHOOLWORK: 5 * 60 * 1000,
};

class StorageService {
  constructor() {
    this.memoryStorage = {};
    this.storageAvailable = this._checkAvailable();
  }

  _checkAvailable() {
    try {
      const t = "__test__";
      localStorage.setItem(t, t);
      localStorage.removeItem(t);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key) {
    try {
      if (this.storageAvailable) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
      return this.memoryStorage[key] || null;
    } catch {
      return this.memoryStorage[key] || null;
    }
  }

  setItem(key, value) {
    try {
      if (this.storageAvailable) localStorage.setItem(key, JSON.stringify(value));
      this.memoryStorage[key] = value;
    } catch {
      this.memoryStorage[key] = value;
    }
  }

  removeItem(key) {
    try {
      if (this.storageAvailable) localStorage.removeItem(key);
      delete this.memoryStorage[key];
    } catch {
      delete this.memoryStorage[key];
    }
  }

  // Auth
  getAuthToken() {
    return this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  setAuthToken(token) {
    this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  // Teacher info
  getTeacherInfo() {
    return this.getItem(STORAGE_KEYS.TEACHER_INFO);
  }
  setTeacherInfo(info) {
    this.setItem(STORAGE_KEYS.TEACHER_INFO, info);
  }

  // School info
  getSchoolInfo() {
    return this.getItem(STORAGE_KEYS.SCHOOL_INFO);
  }
  setSchoolInfo(info) {
    this.setItem(STORAGE_KEYS.SCHOOL_INFO, info);
  }

  // Cache management
  isCacheValid(cacheKey, duration) {
    const timestamps = this.getItem(STORAGE_KEYS.CACHE_TIMESTAMP) || {};
    const ts = timestamps[cacheKey];
    return ts ? Date.now() - ts < duration : false;
  }

  setCacheTimestamp(cacheKey) {
    const timestamps = this.getItem(STORAGE_KEYS.CACHE_TIMESTAMP) || {};
    timestamps[cacheKey] = Date.now();
    this.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, timestamps);
  }

  clearCache(cacheKey) {
    this.removeItem(cacheKey);
    const timestamps = this.getItem(STORAGE_KEYS.CACHE_TIMESTAMP) || {};
    delete timestamps[cacheKey];
    this.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, timestamps);
  }

  // Unread messages
  getUnreadCount() {
    return this.getItem(STORAGE_KEYS.UNREAD_MESSAGES) || 0;
  }
  setUnreadCount(n) {
    this.setItem(STORAGE_KEYS.UNREAD_MESSAGES, n);
  }

  // Clear auth
  clearAuth() {
    this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    this.removeItem(STORAGE_KEYS.TEACHER_INFO);
    this.removeItem(STORAGE_KEYS.SCHOOL_INFO);
    this.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    this.removeItem(STORAGE_KEYS.UNREAD_MESSAGES);
  }
}

export const storage = new StorageService();
