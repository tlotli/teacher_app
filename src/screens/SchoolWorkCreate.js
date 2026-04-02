import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { schoolworkApi } from "../api/schoolwork.js";
import { attendanceApi } from "../api/attendance.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class SchoolWorkCreate extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>New Assignment</h1>
      </div>
      <div class="screen-body">
        <form id="createForm">
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="title" class="form-control" placeholder="Assignment title" required />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select id="type" class="form-control">
              <option value="homework">Homework</option>
              <option value="assignment">Assignment</option>
              <option value="test">Test</option>
              <option value="project">Project</option>
            </select>
          </div>
          <div class="form-group">
            <label>Class</label>
            <select id="classSelect" class="form-control">
              <option value="">Loading…</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="description" class="form-control" rows="3" placeholder="Instructions for students…" style="resize:vertical;"></textarea>
          </div>
          <div style="display:flex;gap:12px;">
            <div class="form-group" style="flex:1;">
              <label>Due Date</label>
              <input type="date" id="dueDate" class="form-control" />
            </div>
            <div class="form-group" style="flex:1;">
              <label>Total Marks</label>
              <input type="number" id="totalMarks" class="form-control" placeholder="100" min="0" />
            </div>
          </div>
          <button type="submit" class="btn-primary" id="submitBtn">
            <i class="bi bi-plus-circle"></i> Create Assignment
          </button>
        </form>
      </div>
    `;

    this._loadClasses();
    document.getElementById("createForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this._submit();
    });
  }

  async _loadClasses() {
    try {
      const { data } = await attendanceApi.getClasses();
      if (!this.isActive) return;
      const classes = data.data || [];
      const select = document.getElementById("classSelect");
      select.innerHTML = '<option value="">Select a class</option>' +
        classes.map((c) => `<option value="${c.id}">${htmlEscape(c.name)}</option>`).join("");
    } catch (err) {
      if (!this.isActive) return;
    }
  }

  async _submit() {
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating…';

    const payload = {
      title: document.getElementById("title").value,
      type: document.getElementById("type").value,
      class_id: document.getElementById("classSelect").value,
      description: document.getElementById("description").value,
      due_date: document.getElementById("dueDate").value || null,
      total_marks: document.getElementById("totalMarks").value || null,
    };

    try {
      await schoolworkApi.create(payload);
      if (!this.isActive) return;
      errorHandler.showSuccess("Assignment created!");
      router.back();
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError(err.response?.data?.message || "Failed to create");
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-plus-circle"></i> Create Assignment';
    }
  }
}
