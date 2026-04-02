import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { messagesApi } from "../api/messages.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDateTime } from "../utils/helpers.js";

export default class MessageThread extends BaseScreen {
  constructor() {
    super();
    this.threadId = null;
  }

  async render(params) {
    setScreenSignal(this.signal);
    renderBottomNav();
    this.threadId = params?.threadId;

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1 id="threadTitle">Message</h1>
      </div>
      <div id="messageList" style="padding:16px;min-height:calc(100vh - 180px);">
        <div class="skeleton" style="height:60px;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:60px;margin-bottom:8px;"></div>
      </div>
      <div style="position:fixed;bottom:64px;left:0;right:0;background:#fff;border-top:1px solid #e9ecef;padding:12px 16px;display:flex;gap:8px;">
        <input type="text" id="replyInput" class="form-control" placeholder="Type a message…" style="flex:1;margin:0;" />
        <button id="sendBtn" style="background:#198754;color:#fff;border:none;width:44px;height:44px;border-radius:12px;font-size:18px;cursor:pointer;">
          <i class="bi bi-send-fill"></i>
        </button>
      </div>
    `;

    document.getElementById("sendBtn")?.addEventListener("click", () => this._sendReply());
    document.getElementById("replyInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._sendReply();
    });

    this._loadThread();
  }

  async _loadThread() {
    try {
      const { data } = await messagesApi.getThread(this.threadId);
      if (!this.isActive) return;

      const thread = data.data || data;
      document.getElementById("threadTitle").textContent = thread.subject || thread.participant_name || "Message";

      const messages = thread.messages || [];
      const el = document.getElementById("messageList");

      el.innerHTML = messages.map((m) => {
        const isMine = m.is_mine || m.is_sender;
        return `
          <div style="display:flex;${isMine ? "justify-content:flex-end;" : ""}margin-bottom:12px;">
            <div style="max-width:80%;padding:12px 16px;border-radius:16px;${isMine
              ? "background:#198754;color:#fff;border-bottom-right-radius:4px;"
              : "background:#f0f0f0;color:#1a1a2e;border-bottom-left-radius:4px;"
            }">
              ${!isMine ? `<div style="font-size:12px;font-weight:600;margin-bottom:4px;opacity:0.8;">${htmlEscape(m.sender_name || "")}</div>` : ""}
              <div style="font-size:14px;">${htmlEscape(m.body || m.content || "")}</div>
              <div style="font-size:11px;opacity:0.6;margin-top:4px;text-align:right;">${formatDateTime(m.created_at)}</div>
            </div>
          </div>
        `;
      }).join("");

      el.scrollTop = el.scrollHeight;
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("messageList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load messages</p></div>`;
    }
  }

  async _sendReply() {
    const input = document.getElementById("replyInput");
    const body = input?.value?.trim();
    if (!body) return;

    const btn = document.getElementById("sendBtn");
    btn.disabled = true;

    try {
      await messagesApi.reply(this.threadId, body);
      if (!this.isActive) return;
      input.value = "";
      this._loadThread();
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError("Failed to send message");
    } finally {
      btn.disabled = false;
    }
  }
}
