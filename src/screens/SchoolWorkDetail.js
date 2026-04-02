import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { schoolworkApi } from "../api/schoolwork.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDate } from "../utils/helpers.js";

export default class SchoolWorkDetail extends BaseScreen {
  constructor() {
    super();
    this.itemId = null;
  }

  async render(params) {
    setScreenSignal(this.signal);
    renderBottomNav();
    this.itemId = params?.id;

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>Submissions</h1>
      </div>
      <div class="screen-body">
        <div id="submissionsList">
          <div class="skeleton" style="height:64px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:64px;margin-bottom:8px;"></div>
        </div>
      </div>
    `;

    this._load();
  }

  async _load() {
    try {
      const { data } = await schoolworkApi.getSubmissions(this.itemId);
      if (!this.isActive) return;

      const subs = data.data || [];
      const el = document.getElementById("submissionsList");

      if (!subs.length) {
        el.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><p>No submissions yet</p></div>`;
        return;
      }

      el.innerHTML = subs.map((s) => `
        <div class="card" style="margin-bottom:8px;">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;background:#e9ecef;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#6c757d;">
                ${htmlEscape((s.student_name || "??")[0])}
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${htmlEscape(s.student_name || "Student")}</div>
                <div style="font-size:12px;color:#6c757d;">Submitted ${formatDate(s.submitted_at || s.created_at)}</div>
              </div>
              <div style="text-align:right;">
                ${s.grade_score != null
                  ? `<span style="font-weight:700;font-size:15px;color:#198754;">${s.grade_score}</span>`
                  : `<button class="grade-btn btn-outline" data-id="${s.id}" style="padding:6px 12px;font-size:12px;">Grade</button>`
                }
              </div>
            </div>
            <div id="gradeForm-${s.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;">
              <div style="display:flex;gap:8px;align-items:end;">
                <div class="form-group" style="flex:1;margin:0;">
                  <label style="font-size:12px;">Score</label>
                  <input type="number" class="form-control grade-score" data-id="${s.id}" placeholder="0" min="0" style="padding:8px;" />
                </div>
                <div class="form-group" style="flex:2;margin:0;">
                  <label style="font-size:12px;">Feedback</label>
                  <input type="text" class="form-control grade-feedback" data-id="${s.id}" placeholder="Optional feedback" style="padding:8px;" />
                </div>
                <button class="save-grade-btn btn-primary" data-id="${s.id}" style="width:auto;padding:8px 16px;font-size:13px;">Save</button>
              </div>
            </div>
          </div>
        </div>
      `).join("");

      el.querySelectorAll(".grade-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const form = document.getElementById(`gradeForm-${btn.dataset.id}`);
          form.style.display = form.style.display === "none" ? "block" : "none";
        });
      });

      el.querySelectorAll(".save-grade-btn").forEach((btn) => {
        btn.addEventListener("click", () => this._grade(btn.dataset.id));
      });
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("submissionsList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load</p></div>`;
    }
  }

  async _grade(submissionId) {
    const score = document.querySelector(`.grade-score[data-id="${submissionId}"]`)?.value;
    const feedback = document.querySelector(`.grade-feedback[data-id="${submissionId}"]`)?.value;

    try {
      await schoolworkApi.gradeSubmission(submissionId, {
        grade_score: score ? parseInt(score) : null,
        teacher_feedback: feedback || null,
      });
      if (!this.isActive) return;
      errorHandler.showSuccess("Grade saved!");
      this._load();
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError("Failed to save grade");
    }
  }
}
