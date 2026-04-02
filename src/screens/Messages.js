import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { messagesApi } from "../api/messages.js";
import { storage } from "../services/storage.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDateTime, truncate } from "../utils/helpers.js";

export default class Messages extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <h1>Messages</h1>
        <button id="newMsgBtn" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:18px;cursor:pointer;">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
      <div class="screen-body">
        <div id="threadList">
          <div class="skeleton" style="height:72px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:72px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:72px;"></div>
        </div>
      </div>
    `;

    document.getElementById("newMsgBtn")?.addEventListener("click", () => router.navigate("/messages/new"));
    this._loadThreads();
  }

  async _loadThreads() {
    try {
      const { data } = await messagesApi.getThreads();
      if (!this.isActive) return;

      const threads = data.data || [];
      const el = document.getElementById("threadList");

      if (!threads.length) {
        el.innerHTML = `<div class="empty-state"><i class="bi bi-chat-dots"></i><p>No messages yet</p></div>`;
        return;
      }

      el.innerHTML = threads.map((t) => `
        <div class="card" style="margin-bottom:8px;cursor:pointer;" data-id="${t.id}">
          <div style="display:flex;align-items:center;padding:14px 16px;gap:12px;">
            <div class="icon" style="background:${t.unread ? "#d1e7dd" : "#f8f9fa"};color:${t.unread ? "#198754" : "#6c757d"};">
              <i class="bi bi-person-fill"></i>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:${t.unread ? "700" : "600"};font-size:14px;">${htmlEscape(t.participant_name || t.subject || "Message")}</span>
                <span style="font-size:11px;color:#6c757d;">${formatDateTime(t.last_message_at || t.updated_at)}</span>
              </div>
              <div style="font-size:13px;color:#6c757d;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${htmlEscape(truncate(t.last_message || t.subject || "", 60))}</div>
            </div>
            ${t.unread ? '<div style="width:10px;height:10px;background:#198754;border-radius:50%;flex-shrink:0;"></div>' : ""}
          </div>
        </div>
      `).join("");

      el.querySelectorAll("[data-id]").forEach((card) => {
        card.addEventListener("click", () => router.navigate(`/messages/${card.dataset.id}`));
      });
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("threadList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load messages</p></div>`;
    }
  }
}
