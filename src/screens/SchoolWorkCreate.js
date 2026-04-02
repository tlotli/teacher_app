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
    this.selectedFile = null;
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>Create Schoolwork</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">
        <div class="card">
          <div class="card-body">
        <form id="createForm">
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="title" class="form-control" placeholder="e.g. Chapter 5 Worksheet" required />
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
            <label>Subject</label>
            <select id="subjectSelect" class="form-control">
              <option value="">Loading subjects…</option>
            </select>
          </div>
          <div class="form-group">
            <label>Class</label>
            <select id="classSelect" class="form-control">
              <option value="">Loading classes…</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description / Instructions</label>
            <textarea id="description" class="form-control" rows="4" placeholder="Describe the task for learners…" style="resize:vertical;"></textarea>
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

          <div class="form-group">
            <label>Attachment <span style="color:var(--text-muted);font-weight:400;font-size:12px;">(optional)</span></label>
            <div class="file-upload-zone" id="fileUploadZone">
              <input type="file" id="attachmentInput" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip" style="display:none;" />
              <div id="fileUploadPrompt">
                <i class="bi bi-cloud-upload" style="font-size:28px;color:var(--text-muted);"></i>
                <div style="font-size:14px;font-weight:500;margin-top:8px;">Tap to attach a file</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">PDF, Word, Image, ZIP — max 5 MB</div>
              </div>
              <div id="fileSelected" style="display:none;" class="file-selected-info">
                <i class="bi bi-paperclip" style="font-size:20px;color:var(--primary);"></i>
                <div class="file-selected-details">
                  <span id="fileName" style="font-size:13px;font-weight:600;"></span>
                  <span id="fileSize" style="font-size:11px;color:var(--text-muted);"></span>
                </div>
                <button type="button" id="removeFile" class="remove-file-btn"><i class="bi bi-x"></i></button>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-primary" id="submitBtn">
            <i class="bi bi-plus-circle"></i> Create Schoolwork
          </button>
        </form>
          </div>
        </div>
        </div>
      </div>
    `;

    this._loadFormData();
    this._bindFileUpload();

    document.getElementById("goBackBtn")?.addEventListener("click", () => router.back());
    document.getElementById("createForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this._submit();
    });
  }

  async _loadFormData() {
    try {
      const [subjectsRes, classesRes, timetableRes] = await Promise.allSettled([
        attendanceApi.getSubjects(),
        attendanceApi.getClasses(),
        attendanceApi.getTimetableToday(),
      ]);
      if (!this.isActive) return;

      const directSubjects = subjectsRes.status === "fulfilled" ? (subjectsRes.value.data.data || []) : [];
      const timetableEntries = timetableRes.status === "fulfilled"
        ? (timetableRes.value.data?.data?.entries || [])
        : [];
      const fallbackSubjects = Array.from(
        new Map(
          timetableEntries
            .map((entry) => entry?.subject)
            .filter((subject) => subject?.id && subject?.name)
            .map((subject) => [subject.id, subject])
        ).values()
      );
      const subjects = directSubjects.length ? directSubjects : fallbackSubjects;
      const classes = classesRes.status === "fulfilled" ? (classesRes.value.data.data || []) : [];

      const subjectSelect = document.getElementById("subjectSelect");
      subjectSelect.innerHTML = subjects.length
        ? '<option value="">Select a subject</option>' +
          subjects.map((s) => `<option value="${s.id}">${htmlEscape(s.name)}</option>`).join("")
        : '<option value="">No subjects available</option>';

      const classSelect = document.getElementById("classSelect");
      classSelect.innerHTML = classes.length
        ? '<option value="">Select a class</option>' +
          classes.map((c) => `<option value="${c.id}">${htmlEscape(c.name)}</option>`).join("")
        : '<option value="">No classes available</option>';
    } catch (err) {
      if (!this.isActive) return;
    }
  }

  _bindFileUpload() {
    const zone = document.getElementById("fileUploadZone");
    const input = document.getElementById("attachmentInput");

    zone?.addEventListener("click", (e) => {
      if (e.target.closest("#removeFile")) return;
      input.click();
    });

    input?.addEventListener("change", () => {
      const file = input.files[0];
      if (file) this._setFile(file);
    });

    document.getElementById("removeFile")?.addEventListener("click", () => this._clearFile());

    zone?.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
    zone?.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone?.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      const file = e.dataTransfer?.files[0];
      if (file) this._setFile(file);
    });
  }

  _setFile(file) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errorHandler.showError("File is too large. Maximum size is 5 MB.");
      return;
    }
    this.selectedFile = file;
    document.getElementById("fileUploadPrompt").style.display = "none";
    document.getElementById("fileSelected").style.display = "flex";
    document.getElementById("fileName").textContent = file.name;
    document.getElementById("fileSize").textContent = `${(file.size / 1024).toFixed(0)} KB`;
  }

  _clearFile() {
    this.selectedFile = null;
    document.getElementById("attachmentInput").value = "";
    document.getElementById("fileUploadPrompt").style.display = "";
    document.getElementById("fileSelected").style.display = "none";
  }

  async _submit() {
    const subjectId = document.getElementById("subjectSelect").value;
    const classId = document.getElementById("classSelect").value;
    const title = document.getElementById("title").value.trim();

    if (!title) { errorHandler.showError("Please enter a title."); return; }
    if (!subjectId) { errorHandler.showError("Please select a subject."); return; }
    if (!classId) { errorHandler.showError("Please select a class."); return; }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating…';

    const formData = new FormData();
    formData.append("title", title);
    formData.append("type", document.getElementById("type").value);
    formData.append("subject_id", subjectId);
    formData.append("class_ids[]", classId);
    formData.append("description", document.getElementById("description").value);
    const dueDate = document.getElementById("dueDate").value;
    if (dueDate) formData.append("due_date", dueDate);
    const totalMarks = document.getElementById("totalMarks").value;
    if (totalMarks) formData.append("total_marks", totalMarks);
    if (this.selectedFile) formData.append("attachment", this.selectedFile);

    try {
      await schoolworkApi.create(formData);
      if (!this.isActive) return;
      errorHandler.showSuccess("Schoolwork created!");
      router.back();
    } catch (err) {
      if (!this.isActive) return;
      const validationMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : null;
      const msg = validationMsg || err.response?.data?.message || "Failed to create schoolwork";
      errorHandler.showError(msg);
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-plus-circle"></i> Create Schoolwork';
    }
  }
}
