import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { messagesApi } from "../api/messages.js";
import { attendanceApi } from "../api/attendance.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class NewMessage extends BaseScreen {
  constructor() {
    super();
    this.classes = [];
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>New Message</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">
        <div class="page-intro-card">
          <div class="toolbar-row" style="justify-content:space-between;align-items:flex-start;">
            <div>
              <div class="page-intro-title">Compose clearly</div>
              <div class="page-intro-text">Send a message to a parent or an entire class with a clean, structured flow.</div>
            </div>
            <div class="soft-icon">
              <i class="bi bi-send"></i>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
        <form id="newMsgForm">
          <div class="form-group">
            <label>Recipient Type</label>
            <select id="recipientType" class="form-control">
              <option value="parent">Parent</option>
              <option value="class">Entire Class</option>
            </select>
          </div>
          <div class="form-group">
            <label>Class</label>
            <select id="classSelect" class="form-control">
              <option value="">Loading…</option>
            </select>
          </div>
          <div class="form-group" id="studentGroup">
            <label>Student (Parent)</label>
            <select id="studentSelect" class="form-control">
              <option value="">Select a class first</option>
            </select>
          </div>
          <div class="form-group">
            <label>Subject</label>
            <input type="text" id="msgSubject" class="form-control" placeholder="Message subject" required />
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea id="msgBody" class="form-control" rows="4" placeholder="Type your message…" required style="resize:vertical;"></textarea>
          </div>
          <button type="submit" class="btn-primary" id="sendBtn">
            <i class="bi bi-send-fill"></i> Send Message
          </button>
        </form>
          </div>
        </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this._loadClasses();
  }

  _bindEvents() {
    document.getElementById("recipientType")?.addEventListener("change", (e) => {
      document.getElementById("studentGroup").style.display = e.target.value === "parent" ? "block" : "none";
    });

    document.getElementById("classSelect")?.addEventListener("change", (e) => {
      if (e.target.value) this._loadStudents(e.target.value);
    });

    document.getElementById("newMsgForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this._send();
    });
  }

  async _loadClasses() {
    try {
      const { data } = await attendanceApi.getClasses();
      if (!this.isActive) return;
      this.classes = data.data || [];
      const select = document.getElementById("classSelect");
      select.innerHTML = '<option value="">Select a class</option>' +
        this.classes.map((c) => `<option value="${c.id}">${htmlEscape(c.name)}</option>`).join("");
    } catch (err) {
      if (!this.isActive) return;
    }
  }

  async _loadStudents(classId) {
    try {
      const { data } = await attendanceApi.getStudents(classId);
      if (!this.isActive) return;
      const students = data.data || [];
      const select = document.getElementById("studentSelect");
      select.innerHTML = '<option value="">Select a student</option>' +
        students.map((s) => `<option value="${s.id}">${htmlEscape(s.first_name + " " + s.last_name)}</option>`).join("");
    } catch (err) {
      if (!this.isActive) return;
    }
  }

  async _send() {
    const btn = document.getElementById("sendBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending…';

    const payload = {
      subject: document.getElementById("msgSubject").value,
      body: document.getElementById("msgBody").value,
      recipient_type: document.getElementById("recipientType").value,
      class_id: document.getElementById("classSelect").value,
    };

    if (payload.recipient_type === "parent") {
      payload.student_id = document.getElementById("studentSelect").value;
    }

    try {
      await messagesApi.sendMessage(payload);
      if (!this.isActive) return;
      errorHandler.showSuccess("Message sent!");
      router.back();
    } catch (err) {
      if (!this.isActive) return;
      errorHandler.showError(err.response?.data?.message || "Failed to send");
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send-fill"></i> Send Message';
    }
  }
}
