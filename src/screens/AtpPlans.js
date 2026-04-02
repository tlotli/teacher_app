import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { atpApi } from "../api/atp.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class AtpPlans extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <h1>ATP Plans</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">
        <div class="page-intro-card">
          <div class="toolbar-row" style="justify-content:space-between;align-items:flex-start;">
            <div>
              <div class="page-intro-title">Track curriculum progress</div>
              <div class="page-intro-text">See targets, monitor plan completion, and stay aligned with what needs to be taught.</div>
            </div>
            <div class="soft-icon">
              <i class="bi bi-bar-chart-line"></i>
            </div>
          </div>
        </div>
        <div id="atpSummary" style="margin-bottom:16px;">
          <div class="card"><div class="card-body skeleton" style="height:60px;"></div></div>
        </div>
        <div class="section-title">Your Plans</div>
        <div id="planList" class="stack-list">
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
        </div>
        </div>
      </div>
    `;

    this._load();
  }

  async _load() {
    try {
      const [plansRes, summaryRes] = await Promise.allSettled([
        atpApi.getPlans(),
        atpApi.getSummary(),
      ]);
      if (!this.isActive) return;

      const plans = plansRes.status === "fulfilled" ? (plansRes.value.data.data || []) : [];
      const summary = summaryRes.status === "fulfilled" ? summaryRes.value.data : {};

      this._renderSummary(summary);
      this._renderPlans(plans);
    } catch (err) {
      if (!this.isActive) return;
    }
  }

  _renderSummary(summary) {
    const el = document.getElementById("atpSummary");
    if (!el) return;

    const avg = Math.round(summary.average_progress || 0);

    el.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#6b7df7,#5165e9);color:#fff;border:none;box-shadow:0 18px 34px rgba(93,114,243,0.28);">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-weight:600;">Overall Progress</span>
            <span style="font-size:22px;font-weight:700;">${avg}%</span>
          </div>
          <div class="progress-bar-container" style="background:rgba(255,255,255,0.2);">
            <div class="progress-bar-fill" style="width:${avg}%;background:#fff;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;opacity:0.8;">
            <span>${summary.total_plans || 0} plans</span>
            <span>${summary.completed_plans || 0} completed</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderPlans(plans) {
    const el = document.getElementById("planList");
    if (!el) return;

    if (!plans.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-bar-chart-line"></i><p>No ATP plans assigned</p></div>`;
      return;
    }

    el.innerHTML = plans.map((p) => {
      const pct = p.progress_percentage ?? p.completion_percentage ?? 0;
      const statusColor = pct >= 80 ? "#198754" : pct >= 50 ? "#ffc107" : "#dc3545";

      return `
        <div class="card" style="cursor:pointer;" data-id="${p.id}">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div>
                <div style="font-weight:700;font-size:15px;">${htmlEscape(p.subject_name || p.title || "")}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">${htmlEscape(p.grade_name || "")} · ${htmlEscape(p.class_name || "")}</div>
              </div>
              <span class="badge-pill" style="background:${statusColor}20;color:${statusColor};">${Math.round(pct)}%</span>
            </div>
            <div class="progress-bar-container" style="margin-top:10px;">
              <div class="progress-bar-fill" style="width:${pct}%;background:${statusColor};"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    el.querySelectorAll("[data-id]").forEach((card) => {
      card.addEventListener("click", () => router.navigate(`/atp/${card.dataset.id}`));
    });
  }
}
