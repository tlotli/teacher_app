import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { atpApi } from "../api/atp.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class AtpPlanDetail extends BaseScreen {
  constructor() {
    super();
    this.planId = null;
    this.plan = null;
    this.weeks = [];
    this.editedProgress = {};
  }

  async render(params) {
    setScreenSignal(this.signal);
    renderBottomNav();
    this.planId = params?.planId;

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>ATP Plan</h1>
      </div>
      <div class="screen-body">
        <div id="planHeader" class="card" style="margin-bottom:16px;">
          <div class="card-body skeleton" style="height:80px;"></div>
        </div>
        <div class="section-title">Weekly Targets & Progress</div>
        <div id="weeksList">
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
        </div>
        <div style="margin-top:16px;">
          <button id="saveProgressBtn" class="btn-primary" style="display:none;">
            <i class="bi bi-check-circle"></i> Save Progress
          </button>
        </div>
      </div>
    `;

    document.getElementById("saveProgressBtn")?.addEventListener("click", () => this._saveProgress());
    this._load();
  }

  async _load() {
    try {
      const { data } = await atpApi.getPlan(this.planId);
      if (!this.isActive) return;

      this.plan = data.data || data;
      this.weeks = this.plan.weekly_targets || [];

      this._renderHeader();
      this._renderWeeks();
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("weeksList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load plan</p></div>`;
    }
  }

  _renderHeader() {
    const el = document.getElementById("planHeader");
    if (!el || !this.plan) return;

    const pct = this.plan.progress_percentage ?? 0;
    const statusColor = pct >= 80 ? "#198754" : pct >= 50 ? "#ffc107" : "#dc3545";

    el.innerHTML = `
      <div class="card-body">
        <h2 style="font-size:18px;font-weight:700;margin-bottom:4px;">${htmlEscape(this.plan.subject_name || this.plan.title || "")}</h2>
        <p style="font-size:13px;color:#6c757d;margin-bottom:12px;">${htmlEscape(this.plan.grade_name || "")} · ${htmlEscape(this.plan.class_name || "")} · ${this.plan.total_weeks || 0} weeks</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:13px;font-weight:600;">Overall Progress</span>
          <span style="font-size:15px;font-weight:700;color:${statusColor};">${Math.round(pct)}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width:${pct}%;background:${statusColor};"></div>
        </div>
      </div>
    `;

    document.querySelector(".screen-header h1").textContent = this.plan.subject_name || "ATP Plan";
  }

  _renderWeeks() {
    const el = document.getElementById("weeksList");
    const saveBtn = document.getElementById("saveProgressBtn");
    if (!el) return;

    if (!this.weeks.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-week"></i><p>No weekly targets defined</p></div>`;
      return;
    }

    saveBtn.style.display = "flex";

    el.innerHTML = this.weeks.map((w) => {
      const weekNum = w.week || w.week_number;
      const target = w.target_percentage ?? 0;
      const actual = this.editedProgress[weekNum]?.completion_percentage
        ?? w.actual_percentage ?? w.completion_percentage ?? 0;
      const topics = w.topics || w.description || "";
      const statusIcon = actual >= target ? "bi-check-circle-fill" : actual > 0 ? "bi-clock-fill" : "bi-circle";
      const statusColor = actual >= target ? "#198754" : actual > 0 ? "#ffc107" : "#dee2e6";

      return `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <i class="bi ${statusIcon}" style="font-size:20px;color:${statusColor};"></i>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">Week ${weekNum}</div>
                <div style="font-size:12px;color:#6c757d;">Target: ${target}%</div>
              </div>
              <span style="font-size:15px;font-weight:700;color:${statusColor};">${Math.round(actual)}%</span>
            </div>
            ${topics ? `<div style="font-size:13px;color:#6c757d;margin-bottom:8px;padding:8px;background:#f8f9fa;border-radius:8px;">${htmlEscape(topics)}</div>` : ""}
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" min="0" max="100" step="5" value="${actual}" data-week="${weekNum}"
                style="flex:1;accent-color:#198754;" />
              <span class="range-label" style="font-size:13px;font-weight:600;min-width:36px;text-align:right;">${Math.round(actual)}%</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    el.querySelectorAll('input[type="range"]').forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const week = parseInt(e.target.dataset.week);
        const val = parseInt(e.target.value);
        const label = e.target.parentElement.querySelector(".range-label");
        if (label) label.textContent = val + "%";
        this.editedProgress[week] = { week_number: week, completion_percentage: val };
      });
    });
  }

  async _saveProgress() {
    const entries = Object.values(this.editedProgress);
    if (!entries.length) {
      errorHandler.showInfo("Adjust a slider to record progress");
      return;
    }

    const btn = document.getElementById("saveProgressBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving…';

    try {
      await atpApi.recordProgress(this.planId, entries);
      if (!this.isActive) return;
      errorHandler.showSuccess("Progress saved!");
      this.editedProgress = {};
      this._load();
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError(err.response?.data?.message || "Failed to save");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Save Progress';
    }
  }
}
