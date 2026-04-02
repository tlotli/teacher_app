import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { schoolworkApi } from "../api/schoolwork.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDate } from "../utils/helpers.js";

export default class SchoolWork extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <h1>School Work</h1>
        <button id="createBtn" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:18px;cursor:pointer;">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
      <div class="screen-body">
        <div id="workList">
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
        </div>
      </div>
    `;

    document.getElementById("createBtn")?.addEventListener("click", () => router.navigate("/schoolwork/create"));
    this._load();
  }

  async _load() {
    try {
      const { data } = await schoolworkApi.getAll();
      if (!this.isActive) return;

      const items = data.data || [];
      const el = document.getElementById("workList");

      if (!items.length) {
        el.innerHTML = `<div class="empty-state"><i class="bi bi-journal-text"></i><p>No assignments yet</p></div>`;
        return;
      }

      el.innerHTML = items.map((item) => {
        const typeIcon = { homework: "bi-pencil-square", test: "bi-clipboard-data", assignment: "bi-file-earmark-text", project: "bi-diagram-3" };
        return `
          <div class="card" style="margin-bottom:10px;cursor:pointer;" data-id="${item.id}">
            <div class="card-body">
              <div style="display:flex;align-items:start;gap:12px;">
                <div class="icon" style="background:#e8e0f5;color:#6f42c1;">
                  <i class="bi ${typeIcon[item.type] || "bi-file-earmark"}"></i>
                </div>
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:15px;">${htmlEscape(item.title)}</div>
                  <div style="font-size:13px;color:#6c757d;margin-top:2px;">
                    ${htmlEscape(item.subject_name || "")} · ${htmlEscape(item.class_name || "")}
                  </div>
                  <div style="display:flex;gap:8px;margin-top:6px;">
                    <span class="badge-pill badge-info">${htmlEscape(item.type || "task")}</span>
                    ${item.due_date ? `<span style="font-size:12px;color:#6c757d;"><i class="bi bi-calendar3"></i> ${formatDate(item.due_date)}</span>` : ""}
                  </div>
                </div>
                <span style="font-size:13px;color:#6c757d;">${item.submissions_count ?? 0} <i class="bi bi-people-fill"></i></span>
              </div>
            </div>
          </div>
        `;
      }).join("");

      el.querySelectorAll("[data-id]").forEach((card) => {
        card.addEventListener("click", () => router.navigate(`/schoolwork/${card.dataset.id}`));
      });
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("workList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load</p></div>`;
    }
  }
}
