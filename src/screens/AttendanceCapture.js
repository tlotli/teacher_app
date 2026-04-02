import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { attendanceApi } from "../api/attendance.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";
import { today } from "../utils/helpers.js";

export default class AttendanceCapture extends BaseScreen {
  constructor() {
    super();
    this.classId = null;
    this.students = [];
    this.records = {};
    this.date = today();
    this.periods = [];
    this.selectedPeriodId = null;
  }

  async render(params) {
    setScreenSignal(this.signal);
    renderBottomNav();
    this.classId = params?.classId;

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>Mark Attendance</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">

        <div class="attendance-controls-card card">
          <div class="card-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label>Date</label>
              <input type="date" id="dateInput" class="form-control" value="${this.date}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>Period <span style="color:var(--text-muted);font-weight:400;font-size:12px;">(optional)</span></label>
              <div id="periodPills" class="period-pills">
                <span class="period-pill-skeleton"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="toolbar-row">
          <button id="markAllPresent" class="btn-outline" style="flex:1;font-size:13px;">
            <i class="bi bi-check2-circle"></i> All Present
          </button>
          <button id="markAllAbsent" class="btn-outline" style="flex:1;font-size:13px;color:#ff4f67;border-color:#ffd6de;">
            <i class="bi bi-x-circle"></i> All Absent
          </button>
        </div>

        <div id="studentList" class="stack-list">
          <div class="skeleton" style="height:92px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:92px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:92px;"></div>
        </div>

        <div class="attendance-save-wrap">
          <button id="saveBtn" class="btn-primary" disabled>
            <i class="bi bi-check-circle"></i> Save Attendance
          </button>
        </div>

        </div>
      </div>
    `;

    document.getElementById("goBackBtn")?.addEventListener("click", () => router.back());
    document.getElementById("dateInput")?.addEventListener("change", (e) => {
      this.date = e.target.value;
      this._loadStudents();
    });

    document.getElementById("markAllPresent")?.addEventListener("click", () => this._markAll("present"));
    document.getElementById("markAllAbsent")?.addEventListener("click", () => this._markAll("absent"));
    document.getElementById("saveBtn")?.addEventListener("click", () => this._save());

    this._loadPeriods();
    this._loadStudents();
  }

  async _loadPeriods() {
    try {
      const res = await attendanceApi.getTimetableToday();
      if (!this.isActive) return;
      this.periods = res.data?.data?.periods || [];
      this._renderPeriodPills();
    } catch {
      if (!this.isActive) return;
      document.getElementById("periodPills").innerHTML = '<span style="font-size:12px;color:var(--text-muted);">No periods available</span>';
    }
  }

  _renderPeriodPills() {
    const container = document.getElementById("periodPills");
    if (!container) return;

    if (!this.periods.length) {
      container.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">No periods configured</span>';
      return;
    }

    container.innerHTML = `
      <button class="period-pill ${this.selectedPeriodId === null ? "active" : ""}" data-period="null">All Day</button>
      ${this.periods.map((p) => `
        <button class="period-pill ${this.selectedPeriodId === p.id ? "active" : ""}" data-period="${p.id}">
          ${htmlEscape(p.name)}
        </button>
      `).join("")}
    `;

    container.querySelectorAll(".period-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.period;
        this.selectedPeriodId = val === "null" ? null : parseInt(val);
        this._renderPeriodPills();
        this._loadStudents();
      });
    });
  }

  async _loadStudents() {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        attendanceApi.getStudents(this.classId),
        attendanceApi.getAttendance(this.classId, this.date),
      ]);
      if (!this.isActive) return;

      this.students = studentsRes.data.data || [];
      const existing = attendanceRes.data.data || [];

      this.records = {};
      existing
        .filter((r) => this.selectedPeriodId === null || r.period_id === this.selectedPeriodId)
        .forEach((r) => { this.records[r.student_id] = r.status; });

      this._renderStudents();
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("studentList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load students</p></div>`;
    }
  }

  _renderStudents() {
    const el = document.getElementById("studentList");
    const btn = document.getElementById("saveBtn");

    if (!this.students.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><p>No students in this class</p></div>`;
      return;
    }

    btn.disabled = false;

    el.innerHTML = this.students.map((s) => {
      const status = this.records[s.id] || "present";
      const learnerName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
      const initials = `${(s.first_name || "").charAt(0)}${(s.last_name || "").charAt(0)}`;

      return `
        <div class="card attendance-student-card">
          <div class="card-body">
            <div class="attendance-student-row">
              <div class="student-avatar-sm">
                ${htmlEscape(initials)}
              </div>
              <div class="attendance-student-copy">
                <div class="attendance-student-name">${htmlEscape(learnerName || "Learner")}</div>
                <div class="attendance-student-note">
                  ${htmlEscape(s.admission_no ? `Admission ${s.admission_no}` : "Tap a status to mark attendance")}
                </div>
              </div>
            </div>

            <div class="attendance-status-grid status-picker" data-student="${s.id}">
              ${["present", "late", "absent", "excused"].map((st) => `
                <button class="status-btn attendance-status-btn ${status === st ? "active" : ""}" data-status="${st}" style="
                  background:${status === st ? this._statusColor(st) : "#f7f7f8"};
                  color:${status === st ? "#fff" : "var(--text-muted)"};
                  border-color:${status === st ? this._statusColor(st) : "#ececef"};
                ">
                  <span>${this._statusLabel(st)}</span>
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }).join("");

    el.querySelectorAll("[data-student]").forEach((group) => {
      group.querySelectorAll(".status-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const studentId = parseInt(group.dataset.student);
          const status = btn.dataset.status;
          this.records[studentId] = status;
          this._renderStudents();
        });
      });
    });
  }

  _statusColor(status) {
    const colors = { present: "#198754", late: "#ffc107", absent: "#dc3545", excused: "#0d6efd" };
    return colors[status] || "#6c757d";
  }

  _statusLabel(status) {
    return { present: "Present", late: "Late", absent: "Absent", excused: "Excused" }[status] || status;
  }

  _markAll(status) {
    this.students.forEach((s) => { this.records[s.id] = status; });
    this._renderStudents();
  }

  async _save() {
    const btn = document.getElementById("saveBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving…';

    const payload = {
      school_class_id: parseInt(this.classId),
      date: this.date,
      ...(this.selectedPeriodId ? { period_id: this.selectedPeriodId } : {}),
      records: this.students.map((s) => ({
        student_id: s.id,
        status: this.records[s.id] || "present",
      })),
    };

    try {
      await attendanceApi.bulkMark(payload);
      if (!this.isActive) return;
      errorHandler.showSuccess("Attendance saved!");
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Saved';
      setTimeout(() => {
        if (this.isActive && btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-check-circle"></i> Save Attendance';
        }
      }, 2000);
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError(err.response?.data?.message || "Failed to save");
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Save Attendance';
    }
  }
}
