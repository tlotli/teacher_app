import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { storage } from "./storage.js";

window.Pusher = Pusher;
Pusher.logToConsole = true;

class TeacherWebSocketService {
  constructor() {
    this.echo = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this._reconnectTimer = null;
    this._currentToken = null;
    this._pusherConnectedHandler = null;
    this._pusherDisconnectedHandler = null;
    this._pusherErrorHandler = null;
    this._pusherUnavailableHandler = null;
    this._pusherFailedHandler = null;
    // Active thread subscriptions — replayed on every (re)connect
    this._threadSubs = new Map(); // threadId → onMessage callback
  }

  initialize(authToken) {
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = null;

    if (this._currentToken === authToken && this.echo !== null) {
      return this.echo;
    }

    if (this.echo) this._teardown();

    this._currentToken = authToken;

    const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
    const isSecure = apiBase.startsWith("https");
    const key = import.meta.env.VITE_REVERB_APP_KEY;
    const host = import.meta.env.VITE_REVERB_HOST || "edulinkdigital.co.za";

    const authHeaders = { Authorization: `Bearer ${authToken}` };
    const broadcastAuthEndpoint = `${apiBase}/api/broadcasting/auth`;
    console.log("🔑 Teacher broadcasting auth endpoint:", broadcastAuthEndpoint);

    this.echo = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: isSecure ? 443 : 80,
      wssPort: 443,
      forceTLS: isSecure,
      enabledTransports: ["ws", "wss"],
      disableStats: true,
      channelAuthorization: {
        endpoint: broadcastAuthEndpoint,
        transport: "ajax",
        headers: authHeaders,
      },
      auth: {
        headers: authHeaders,
      },
      authEndpoint: broadcastAuthEndpoint,
    });

    this._pusherConnectedHandler = () => {
      console.log("✅ Teacher WebSocket connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      // Replay all queued/active thread subscriptions
      this._threadSubs.forEach((onMessage, threadId) => {
        this._doSubscribeToThread(threadId, onMessage);
      });
    };
    this._pusherDisconnectedHandler = () => {
      console.log("❌ Teacher WebSocket disconnected");
      this.isConnected = false;
      this._scheduleReconnect();
    };
    this._pusherErrorHandler = () => { this.isConnected = false; };
    this._pusherUnavailableHandler = () => { this.isConnected = false; };
    this._pusherFailedHandler = () => { this.isConnected = false; };

    const conn = this.echo.connector.pusher.connection;
    conn.bind("connected", this._pusherConnectedHandler);
    conn.bind("disconnected", this._pusherDisconnectedHandler);
    conn.bind("error", this._pusherErrorHandler);
    conn.bind("unavailable", this._pusherUnavailableHandler);
    conn.bind("failed", this._pusherFailedHandler);

    console.log("✅ Teacher WebSocket initialized");
    return this.echo;
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Teacher WS: max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    console.log(`🔄 Teacher WS reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    this._reconnectTimer = setTimeout(() => {
      const token = this._currentToken || storage.getAuthToken();
      if (token) this.initialize(token);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  _teardown() {
    const pusherConn = this.echo?.connector?.pusher?.connection;
    if (pusherConn) {
      if (this._pusherConnectedHandler) pusherConn.unbind("connected", this._pusherConnectedHandler);
      if (this._pusherDisconnectedHandler) pusherConn.unbind("disconnected", this._pusherDisconnectedHandler);
      if (this._pusherErrorHandler) pusherConn.unbind("error", this._pusherErrorHandler);
      if (this._pusherUnavailableHandler) pusherConn.unbind("unavailable", this._pusherUnavailableHandler);
      if (this._pusherFailedHandler) pusherConn.unbind("failed", this._pusherFailedHandler);
    }
    this._pusherConnectedHandler = null;
    this._pusherDisconnectedHandler = null;
    this._pusherErrorHandler = null;
    this._pusherUnavailableHandler = null;
    this._pusherFailedHandler = null;
    try { this.echo.disconnect(); } catch { /* ignore */ }
    this.echo = null;
    this.isConnected = false;
  }

  /**
   * Subscribe to a message thread for real-time parent replies.
   * Queued and replayed automatically if WebSocket isn't connected yet.
   */
  subscribeToThread(threadId, onMessage) {
    if (!this.echo) {
      const token = storage.getAuthToken();
      if (token) this.initialize(token);
    }

    // Always register so it survives reconnects and deferred connects
    this._threadSubs.set(threadId, onMessage);

    if (!this.isConnected) {
      console.log(`⏳ Teacher thread ${threadId} subscription queued until WebSocket connects`);
      return;
    }
    this._doSubscribeToThread(threadId, onMessage);
  }

  _doSubscribeToThread(threadId, onMessage) {
    this.echo.private(`message-thread.${threadId}`).listen(".message.sent", (e) => {
      console.log("📬 Real-time message in teacher thread", threadId, e);
      onMessage(e);
    });
  }

  unsubscribeFromThread(threadId) {
    this._threadSubs.delete(threadId);
    if (this.echo) {
      this.echo.leave(`message-thread.${threadId}`);
    }
  }

  disconnect() {
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = null;
    this._currentToken = null;
    if (this.echo) this._teardown();
  }
}

export const teacherWebSocket = new TeacherWebSocketService();
