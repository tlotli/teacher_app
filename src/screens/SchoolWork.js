import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { schoolworkApi } from "../api/schoolwork.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDate } from "../utils/helpers.js";

export default class SchoolWork extends BaseScreen {
  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <h1>School Work</h1>
        <button id="createBtn" class="header-action-btn" aria-label="Create school work">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
      <div class="screen-body">
        <div class="screen-stack">
          <div class="page-intro-card">
            <div class="toolbar-row" style="justify-content:space-between;align-items:flex-start;">
              <div>
                <div class="page-intro-title">Create and review work</div>
                <div class="page-intro-text">Publish assignments for your classes, then open each card to review learner submissions and grading.</div>
              </div>
              <div class="soft-icon">
                <i class="bi bi-journal-check"></i>
              </div>
            </div>
          </div>

          <div id="workList" class="stack-list">
            <div class="skeleton" style="height:104px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:104px;margin-bottom:8px;"></div>
          </div>
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
        el.innerHTML = `
          <div class="empty-state">
            <i class="bi bi-journal-text"></i>
            <p>No assignments yet</p>
            <p class="empty-state-caption">Create a task for your class and learner submissions will show up here for review.</p>
            <div class="empty-state-actions">
              <button id="emptyCreateBtn" class="btn-primary btn-inline">
                <i class="bi bi-plus-circle-fill"></i>
                Create Schoolwork
              </button>
            </div>
          </div>
        `;
        document.getElementById("emptyCreateBtn")?.addEventListener("click", () => router.navigate("/schoolwork/create"));
        return;
      }

      el.innerHTML = items.map((item) => {
        const typeIcon = { homework: "bi-pencil-square", test: "bi-clipboard-data", assignment: "bi-file-earmark-text", project: "bi-diagram-3" };
        const subjectName = item.subject?.name || item.subject_name || "Subject";
        const classNames = Array.isArray(item.school_classes)
          ? item.school_classes.map((schoolClass) => schoolClass?.name).filter(Boolean).join(", ")
          : (item.class_name || "");

        return `
          <button class="card assignment-card" data-id="${item.id}">
            <div class="card-body">
              <div class="assignment-card-top">
                <div class="icon assignment-card-icon">
                  <i class="bi ${typeIcon[item.type] || "bi-file-earmark"}"></i>
                </div>
                <div style="flex:1;min-width:0;text-align:left;">
                  <div style="font-weight:700;font-size:15px;">${htmlEscape(item.title || "School work")}</div>
                  <div style="font-size:13px;color:var(--text-muted);margin-top:3px;">
                    ${htmlEscape(subjectName)}${classNames ? ` · ${htmlEscape(classNames)}` : ""}
                  </div>
                </div>
                <div class="assignment-card-count">
                  <strong>${item.submissions_count ?? 0}</strong>
                  <span>Submissions</span>
                </div>
              </div>

              <div class="assignment-card-footer">
                <div class="assignment-card-meta">
                  <span class="badge-pill badge-info">${htmlEscape(item.type || "task")}</span>
                  ${item.due_date ? `<span class="assignment-card-date"><i class="bi bi-calendar3"></i> ${formatDate(item.due_date)}</span>` : ""}
                </div>
                <span class="assignment-card-link">Review submissions <i class="bi bi-arrow-right-short"></i></span>
              </div>
            </div>
          </button>
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
