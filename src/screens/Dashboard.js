import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { storage } from "../services/storage.js";
import { authApi } from "../api/auth.js";
import { attendanceApi } from "../api/attendance.js";
import { atpApi } from "../api/atp.js";
import { messagesApi } from "../api/messages.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class Dashboard extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const teacher = storage.getTeacherInfo();
    const school = storage.getSchoolInfo();
    const el = document.getElementById("screen-content");

    el.innerHTML = `
      <div class="screen-header" style="padding:20px 20px 24px;">
        <div style="flex:1;">
          <p style="opacity:0.8;font-size:13px;margin-bottom:2px;">Good ${this._greeting()}</p>
          <h1 style="font-size:22px;">${htmlEscape(teacher?.name || "Teacher")}</h1>
          <p style="opacity:0.7;font-size:13px;margin-top:2px;">${htmlEscape(school?.name || "")}</p>
        </div>
        <button id="profileBtn" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:40px;height:40px;border-radius:12px;font-size:20px;cursor:pointer;">
          <i class="bi bi-person-fill"></i>
        </button>
      </div>
      <div class="screen-body">
        <div id="checkInCard" style="margin-bottom:16px;"></div>
        <div id="quickStats" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
          <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
          <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
          <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
        </div>
        <div class="section-title">Today's Schedule</div>
        <div id="timetableList" class="card">
          <div style="padding:16px;">
            <div class="skeleton" style="height:60px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:60px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:60px;"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("profileBtn")?.addEventListener("click", () => router.navigate("/profile"));

    this._loadData();
  }

  _greeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  async _loadData() {
    try {
      const [timetableRes, atpRes, msgRes] = await Promise.allSettled([
        attendanceApi.getTimetableToday(),
        atpApi.getSummary(),
        messagesApi.getUnreadCount(),
      ]);

      if (!this.isActive) return;

      const timetable = timetableRes.status === "fulfilled" ? timetableRes.value.data.data : [];
      const atpSummary = atpRes.status === "fulfilled" ? atpRes.value.data : {};
      const unread = msgRes.status === "fulfilled" ? msgRes.value.data.unread_count : 0;

      storage.setUnreadCount(unread);
      renderBottomNav();

      this._renderCheckIn();
      this._renderStats(timetable, atpSummary, unread);
      this._renderTimetable(timetable);
    } catch (err) {
      if (!this.isActive) return;
      console.error("Dashboard load error:", err);
    }
  }

  _renderCheckIn() {
    const el = document.getElementById("checkInCard");
    if (!el) return;

    el.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#198754,#0f5132);color:#fff;">
        <div class="card-body" style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:15px;">Clock In</div>
            <div style="font-size:12px;opacity:0.8;">Tap to record your arrival</div>
          </div>
          <button id="clockInBtn" class="btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4);padding:8px 16px;font-size:13px;">
            <i class="bi bi-check-circle"></i> Check In
          </button>
        </div>
      </div>
    `;

    document.getElementById("clockInBtn")?.addEventListener("click", () => this._doCheckIn());
  }

  async _doCheckIn() {
    const btn = document.getElementById("clockInBtn");
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
      const payload = {};
      if (navigator.geolocation && import.meta.env.VITE_GEOFENCE_ENABLED === "true") {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
        );
        payload.latitude = pos.coords.latitude;
        payload.longitude = pos.coords.longitude;
        payload.accuracy = pos.coords.accuracy;
      }

      await attendanceApi.checkIn(payload);
      if (!this.isActive) return;
      errorHandler.showSuccess("You've been checked in!");
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Done';
      btn.style.background = "rgba(255,255,255,0.2)";
    } catch (err) {
      if (!this.isActive) return;
      const msg = err.response?.data?.message || "Check-in failed";
      errorHandler.showError(msg);
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Check In';
    }
  }

  _renderStats(timetable, atp, unread) {
    const el = document.getElementById("quickStats");
    if (!el) return;

    const classCount = timetable.length;
    const avgProgress = atp.average_progress ?? 0;
    const totalPlans = atp.total_plans ?? 0;

    el.innerHTML = `
      <div class="card" onclick="window.__nav('/attendance')" style="cursor:pointer;">
        <div class="card-body" style="text-align:center;">
          <i class="bi bi-clipboard-check" style="font-size:24px;color:#198754;"></i>
          <div style="font-size:22px;font-weight:700;margin:4px 0;">${classCount}</div>
          <div style="font-size:12px;color:#6c757d;">Classes Today</div>
        </div>
      </div>
      <div class="card" onclick="window.__nav('/messages')" style="cursor:pointer;">
        <div class="card-body" style="text-align:center;">
          <i class="bi bi-chat-dots-fill" style="font-size:24px;color:#0d6efd;"></i>
          <div style="font-size:22px;font-weight:700;margin:4px 0;">${unread}</div>
          <div style="font-size:12px;color:#6c757d;">Unread Messages</div>
        </div>
      </div>
      <div class="card" onclick="window.__nav('/atp')" style="cursor:pointer;">
        <div class="card-body" style="text-align:center;">
          <i class="bi bi-bar-chart-line-fill" style="font-size:24px;color:#ffc107;"></i>
          <div style="font-size:22px;font-weight:700;margin:4px 0;">${Math.round(avgProgress)}%</div>
          <div style="font-size:12px;color:#6c757d;">ATP Progress</div>
        </div>
      </div>
      <div class="card" onclick="window.__nav('/schoolwork')" style="cursor:pointer;">
        <div class="card-body" style="text-align:center;">
          <i class="bi bi-journal-text" style="font-size:24px;color:#6f42c1;"></i>
          <div style="font-size:22px;font-weight:700;margin:4px 0;">${totalPlans}</div>
          <div style="font-size:12px;color:#6c757d;">Active Plans</div>
        </div>
      </div>
    `;
  }

  _renderTimetable(timetable) {
    const el = document.getElementById("timetableList");
    if (!el) return;

    if (!timetable.length) {
      el.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-calendar-check"></i>
          <p>No classes scheduled today</p>
        </div>
      `;
      return;
    }

    el.innerHTML = timetable.map((entry) => `
      <div class="list-item" data-class-id="${entry.class_id}">
        <div class="icon" style="background:#d1e7dd;color:#198754;">
          <i class="bi bi-book"></i>
        </div>
        <div class="content">
          <div class="title">${htmlEscape(entry.subject_name || entry.subject || "")}</div>
          <div class="subtitle">${htmlEscape(entry.class_name || "")} · ${htmlEscape(entry.period_name || "")}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px;font-weight:600;">${htmlEscape(entry.start_time || "")}</div>
          <div style="font-size:11px;color:#6c757d;">${htmlEscape(entry.end_time || "")}</div>
        </div>
      </div>
    `).join("");

    el.querySelectorAll(".list-item").forEach((item) => {
      item.addEventListener("click", () => {
        const classId = item.dataset.classId;
        if (classId) router.navigate(`/attendance/${classId}`);
      });
    });
  }
}

window.__nav = (path) => router.navigate(path);
