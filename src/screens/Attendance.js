import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { attendanceApi } from "../api/attendance.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class Attendance extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <h1>Attendance</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">
        <div class="page-intro-card">
          <div class="toolbar-row" style="justify-content:space-between;align-items:flex-start;">
            <div>
              <div class="page-intro-title">Take attendance fast</div>
              <div class="page-intro-text">Open a class, mark learners, and keep the register clean and quick.</div>
            </div>
            <div class="soft-icon">
              <i class="bi bi-clipboard-check"></i>
            </div>
          </div>
        </div>

        <div class="section-title">Your Classes</div>
        <div id="classList" class="card">
          <div style="padding:16px;">
            <div class="skeleton" style="height:64px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:64px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:64px;"></div>
          </div>
        </div>
        </div>
      </div>
    `;

    this._loadClasses();
  }

  async _loadClasses() {
    try {
      const { data } = await attendanceApi.getClasses();
      if (!this.isActive) return;

      const classes = data.data || [];
      const el = document.getElementById("classList");

      if (!classes.length) {
        el.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><p>No classes assigned</p></div>`;
        return;
      }

      el.innerHTML = classes.map((cls) => `
        <div class="list-item" data-id="${cls.id}">
          <div class="icon" style="background:#edf2ff;color:#5d72f3;">
            <i class="bi bi-people-fill"></i>
          </div>
          <div class="content">
            <div class="title">${htmlEscape(cls.name)}</div>
            <div class="subtitle">${cls.student_count || 0} students · Grade ${htmlEscape(cls.grade || "")}</div>
          </div>
          <i class="bi bi-chevron-right" style="color:var(--text-muted);"></i>
        </div>
      `).join("");

      el.querySelectorAll(".list-item").forEach((item) => {
        item.addEventListener("click", () => router.navigate(`/attendance/${item.dataset.id}`));
      });
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("classList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load classes</p></div>`;
    }
  }
}
