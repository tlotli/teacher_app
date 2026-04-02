import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { schoolworkApi } from "../api/schoolwork.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDateTime } from "../utils/helpers.js";

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
        <div class="screen-stack">
          <div class="page-intro-card">
            <div class="toolbar-row" style="justify-content:space-between;align-items:flex-start;">
              <div>
                <div class="page-intro-title">Review learner work</div>
                <div class="page-intro-text">Learners submit from the parent app. Every upload appears here so you can review it, assign a score, and leave feedback.</div>
              </div>
              <div class="soft-icon">
                <i class="bi bi-check2-square"></i>
              </div>
            </div>
          </div>

          <div id="submissionsList" class="stack-list">
            <div class="skeleton" style="height:108px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:108px;margin-bottom:8px;"></div>
          </div>
        </div>
      </div>
    `;

    this._load();
  }

  _studentName(submission) {
    return [submission.student?.first_name, submission.student?.last_name]
      .filter(Boolean)
      .join(" ") || submission.student_name || "Student";
  }

  async _load() {
    try {
      const { data } = await schoolworkApi.getSubmissions(this.itemId);
      if (!this.isActive) return;

      const subs = data.data || [];
      const el = document.getElementById("submissionsList");

      if (!subs.length) {
        el.innerHTML = `
          <div class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>No submissions yet</p>
            <p class="empty-state-caption">There is no teacher upload button on this screen. Parents and learners submit from the parent app, and their work will appear here automatically.</p>
          </div>
        `;
        return;
      }

      el.innerHTML = subs.map((submission) => {
        const studentName = this._studentName(submission);
        const admissionNo = submission.student?.admission_no;
        const isReviewed = submission.grade_score != null;
        const nameParts = studentName.split(" ").filter(Boolean);
        const initials = `${nameParts[0]?.charAt(0) || "S"}${nameParts[nameParts.length - 1]?.charAt(0) || ""}`;

        return `
          <div class="card">
            <div class="card-body">
              <div class="submission-card-top">
                <div class="student-avatar-sm">
                  ${htmlEscape(initials)}
                </div>
                <div style="flex:1;min-width:0;">
                  <div class="submission-card-title">${htmlEscape(studentName)}</div>
                  <div class="submission-card-meta">
                    ${htmlEscape(admissionNo ? `Admission ${admissionNo}` : "Learner submission")}
                    <span class="submission-dot"></span>
                    Submitted ${htmlEscape(formatDateTime(submission.submitted_at || submission.created_at))}
                  </div>
                </div>
                <div class="submission-card-score ${isReviewed ? "is-reviewed" : ""}">
                  ${isReviewed ? `${submission.grade_score}%` : "Pending"}
                </div>
              </div>

              <div class="submission-card-actions">
                <button class="grade-btn btn-outline" data-id="${submission.id}">
                  <i class="bi bi-pencil-square"></i>
                  ${isReviewed ? "Update grade" : "Review & grade"}
                </button>
              </div>

              <div id="gradeForm-${submission.id}" class="submission-grade-form" style="display:${isReviewed ? "block" : "none"};">
                <div class="submission-grade-grid">
                  <div class="form-group" style="margin:0;">
                    <label style="font-size:12px;">Score</label>
                    <input
                      type="number"
                      class="form-control grade-score"
                      data-id="${submission.id}"
                      placeholder="0"
                      min="0"
                      value="${submission.grade_score ?? ""}"
                      style="padding:10px 12px;"
                    />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size:12px;">Feedback</label>
                    <input
                      type="text"
                      class="form-control grade-feedback"
                      data-id="${submission.id}"
                      placeholder="Optional feedback"
                      value="${htmlEscape(submission.teacher_feedback || "")}"
                      style="padding:10px 12px;"
                    />
                  </div>
                </div>
                <button class="save-grade-btn btn-primary btn-inline" data-id="${submission.id}">
                  <i class="bi bi-check-circle"></i>
                  Save Feedback
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      el.querySelectorAll(".grade-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const form = document.getElementById(`gradeForm-${btn.dataset.id}`);
          if (!form) return;
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
        grade_score: score ? parseInt(score, 10) : null,
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
