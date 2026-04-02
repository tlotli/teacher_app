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
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input type="date" id="dateInput" class="form-control" value="${this.date}" style="flex:1;" />
        </div>
        <div id="studentList">
          <div class="skeleton" style="height:56px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:56px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:56px;"></div>
        </div>
        <div style="margin-top:16px;">
          <button id="saveBtn" class="btn-primary" disabled>
            <i class="bi bi-check-circle"></i> Save Attendance
          </button>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button id="markAllPresent" class="btn-outline" style="flex:1;font-size:13px;">All Present</button>
          <button id="markAllAbsent" class="btn-outline" style="flex:1;font-size:13px;color:#dc3545;border-color:#dc3545;">All Absent</button>
        </div>
      </div>
    `;

    document.getElementById("dateInput")?.addEventListener("change", (e) => {
      this.date = e.target.value;
      this._loadStudents();
    });

    document.getElementById("markAllPresent")?.addEventListener("click", () => this._markAll("present"));
    document.getElementById("markAllAbsent")?.addEventListener("click", () => this._markAll("absent"));
    document.getElementById("saveBtn")?.addEventListener("click", () => this._save());

    this._loadStudents();
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
      existing.forEach((r) => {
        this.records[r.student_id] = r.status;
      });

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
      return `
        <div class="card" style="margin-bottom:8px;">
          <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;">
            <div style="width:36px;height:36px;background:#e9ecef;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#6c757d;">
              ${htmlEscape((s.first_name || "")[0] + (s.last_name || "")[0])}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:14px;">${htmlEscape(s.first_name + " " + s.last_name)}</div>
            </div>
            <div style="display:flex;gap:4px;" data-student="${s.id}">
              ${["present", "late", "absent", "excused"].map((st) => `
                <button class="status-btn ${status === st ? "active" : ""}" data-status="${st}" style="
                  padding:6px 10px;border-radius:8px;font-size:11px;font-weight:600;border:1.5px solid transparent;cursor:pointer;
                  background:${status === st ? this._statusColor(st) : "#f8f9fa"};
                  color:${status === st ? "#fff" : "#6c757d"};
                  border-color:${status === st ? this._statusColor(st) : "#dee2e6"};
                ">${st[0].toUpperCase()}</button>
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

  _markAll(status) {
    this.students.forEach((s) => {
      this.records[s.id] = status;
    });
    this._renderStudents();
  }

  async _save() {
    const btn = document.getElementById("saveBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving…';

    const records = this.students.map((s) => ({
      student_id: s.id,
      class_id: parseInt(this.classId),
      date: this.date,
      status: this.records[s.id] || "present",
    }));

    try {
      await attendanceApi.bulkMark(records);
      if (!this.isActive) return;
      errorHandler.showSuccess("Attendance saved!");
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Saved';
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError(err.response?.data?.message || "Failed to save");
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Save Attendance';
    }
  }
}
