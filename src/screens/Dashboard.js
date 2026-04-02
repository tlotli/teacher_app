import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { storage } from "../services/storage.js";
import { attendanceApi } from "../api/attendance.js";
import { atpApi } from "../api/atp.js";
import { messagesApi } from "../api/messages.js";
import { schoolworkApi } from "../api/schoolwork.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";
import { formatDateTime, truncate } from "../utils/helpers.js";

export default class Dashboard extends BaseScreen {
  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const teacher = storage.getTeacherInfo();
    const el = document.getElementById("screen-content");

    el.innerHTML = `
      <div class="dashboard-hero">
        <div class="dashboard-hero-card">
          <div class="dashboard-hero-topline">
            <button id="profileBtn" class="top-action-btn" aria-label="Open profile">
              <i class="bi bi-person"></i>
            </button>
            <button id="notifBtn" class="top-action-btn" aria-label="Notifications" style="position:relative;">
              <i class="bi bi-bell"></i>
              <span class="notif-dot"></span>
            </button>
          </div>

          <div class="dashboard-hero-copy">
            <h1 class="dashboard-hero-title">
              Hi ${htmlEscape(teacher?.name?.split(" ")[0] || "Teacher")},<br>
              How can I help<br>you today?
            </h1>
          </div>

          <div class="hero-actions-grid">
            <button class="hero-action-card tone-blue" data-nav="/attendance">
              <span class="hero-action-icon"><i class="bi bi-clipboard-check"></i></span>
              <span class="hero-action-label">Attendance</span>
            </button>
            <button class="hero-action-card tone-lilac" data-nav="/messages">
              <span class="hero-action-icon"><i class="bi bi-chat-dots"></i></span>
              <span class="hero-action-label">Messages</span>
            </button>
            <button class="hero-action-card tone-mint" data-nav="/schoolwork">
              <span class="hero-action-icon"><i class="bi bi-journal-text"></i></span>
              <span class="hero-action-label">School Work</span>
            </button>
            <button class="hero-action-card tone-amber" data-nav="/demerits">
              <span class="hero-action-icon"><i class="bi bi-exclamation-triangle"></i></span>
              <span class="hero-action-label">Demerits</span>
            </button>
          </div>

          <div class="dashboard-search-prompt">
            <i class="bi bi-search"></i>
            <span>Ask or search for anything</span>
            <span class="search-mic-btn"><i class="bi bi-mic"></i></span>
          </div>
        </div>
      </div>

      <div class="screen-body dashboard-body">
        <div class="screen-stack">
          <div id="checkInCard"></div>

          <div class="section-header-row">
            <div>
              <div class="section-title">Teaching Summary</div>
              <div class="section-caption">Your key classroom numbers at a glance</div>
            </div>
          </div>
          <div id="quickStats" class="quick-grid">
            <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
            <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
            <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
            <div class="card"><div class="card-body skeleton" style="height:80px;"></div></div>
          </div>

          <div class="section-header-row">
            <div>
              <div class="section-title">Today's Schedule</div>
              <div class="section-caption">Open a class to take attendance or review the timetable</div>
            </div>
          </div>
          <div id="timetableList" class="card">
            <div style="padding:16px;">
              <div class="skeleton" style="height:60px;margin-bottom:8px;"></div>
              <div class="skeleton" style="height:60px;margin-bottom:8px;"></div>
              <div class="skeleton" style="height:60px;"></div>
            </div>
          </div>

          <div class="section-header-row">
            <div>
              <div class="section-title">Recent Messages</div>
              <div class="section-caption">Stay on top of parent conversations</div>
            </div>
          </div>
          <div id="recentMessagesList" class="card activity-card">
            <div class="activity-card-body">
              <div class="skeleton" style="height:62px;margin-bottom:10px;"></div>
              <div class="skeleton" style="height:62px;margin-bottom:10px;"></div>
              <div class="skeleton" style="height:62px;"></div>
            </div>
          </div>

          <div class="section-header-row">
            <div>
              <div class="section-title">Latest Submissions</div>
              <div class="section-caption">Recently uploaded learner work ready for review</div>
            </div>
          </div>
          <div id="recentSubmissionsList" class="card activity-card">
            <div class="activity-card-body">
              <div class="skeleton" style="height:68px;margin-bottom:10px;"></div>
              <div class="skeleton" style="height:68px;margin-bottom:10px;"></div>
              <div class="skeleton" style="height:68px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("profileBtn")?.addEventListener("click", () => router.navigate("/profile"));
    el.querySelectorAll("[data-nav]").forEach((item) => {
      item.addEventListener("click", () => router.navigate(item.dataset.nav));
    });

    this._loadData();
  }

  async _loadData() {
    try {
      const [timetableRes, atpRes, msgRes, threadsRes, worksRes] = await Promise.allSettled([
        attendanceApi.getTimetableToday(),
        atpApi.getSummary(),
        messagesApi.getUnreadCount(),
        messagesApi.getThreads(),
        schoolworkApi.getAll(),
      ]);

      if (!this.isActive) return;

      const timetablePayload = timetableRes.status === "fulfilled" ? (timetableRes.value?.data?.data ?? {}) : {};
      const timetable = Array.isArray(timetablePayload.entries) ? timetablePayload.entries : [];
      const atpSummary = atpRes.status === "fulfilled" ? (atpRes.value?.data ?? {}) : {};
      const unread = msgRes.status === "fulfilled" ? (msgRes.value?.data?.unread_count ?? 0) : 0;
      const threads = threadsRes.status === "fulfilled" ? (threadsRes.value?.data?.data ?? []) : [];
      const works = worksRes.status === "fulfilled" ? (worksRes.value?.data?.data ?? []) : [];

      const submissionResults = works.length
        ? await Promise.allSettled(works.slice(0, 3).map((work) => schoolworkApi.getSubmissions(work.id)))
        : [];

      if (!this.isActive) return;

      const recentMessages = threads
        .map((thread) => this._normaliseThread(thread))
        .filter(Boolean)
        .slice(0, 3);

      const recentSubmissions = submissionResults
        .flatMap((result, index) => {
          if (result.status !== "fulfilled") return [];
          const work = this._normaliseWork(works[index]);
          const submissions = result.value?.data?.data ?? [];

          return submissions.map((submission) => this._normaliseSubmission(submission, work));
        })
        .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
        .slice(0, 3);

      storage.setUnreadCount(unread);
      renderBottomNav();

      this._renderCheckIn();
      this._renderStats(timetable, atpSummary, unread);
      this._renderTimetable(timetable);
      this._renderRecentMessages(recentMessages);
      this._renderRecentSubmissions(recentSubmissions);
    } catch (err) {
      if (!this.isActive) return;
      console.error("Dashboard load error:", err);
    }
  }

  _normaliseThread(thread) {
    if (!thread) return null;

    const latestMessage = Array.isArray(thread.latest_message) ? thread.latest_message[0] : thread.latest_message;
    const studentName = [thread.student?.first_name, thread.student?.last_name].filter(Boolean).join(" ");
    const participant = thread.parent?.name || studentName || thread.subject || "Conversation";
    const preview = latestMessage?.content || thread.last_message || thread.subject || "Open the conversation";

    return {
      id: thread.id,
      participant,
      preview,
      unread: Number(thread.unread_count || 0) > 0,
      updatedAt: thread.last_message_at || latestMessage?.created_at || thread.updated_at,
    };
  }

  _normaliseWork(work) {
    if (!work) return {};

    const classes = Array.isArray(work.school_classes)
      ? work.school_classes.map((schoolClass) => schoolClass?.name).filter(Boolean)
      : [];

    return {
      id: work.id,
      title: work.title || "School work",
      subjectName: work.subject?.name || work.subject_name || "",
      classNames: classes,
    };
  }

  _normaliseSubmission(submission, work = {}) {
    const studentName = [submission.student?.first_name, submission.student?.last_name].filter(Boolean).join(" ");

    return {
      id: submission.id,
      workId: work.id,
      workTitle: work.title || "School work",
      subjectName: work.subjectName || "",
      studentName: studentName || submission.student_name || "Student",
      admissionNo: submission.student?.admission_no || "",
      status: submission.status || "submitted",
      gradeScore: submission.grade_score,
      submittedAt: submission.submitted_at || submission.created_at || null,
    };
  }

  _renderCheckIn() {
    const el = document.getElementById("checkInCard");
    if (!el) return;

    el.innerHTML = `
      <div class="checkin-card">
        <div class="checkin-card-top">
          <div class="checkin-icon-shell">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <div class="checkin-copy">
            <div class="checkin-eyebrow">Arrival tracking</div>
            <div class="checkin-title">Clock in for today</div>
            <div class="checkin-text">Record your arrival in one tap. If geofencing is enabled for your school, the app will capture location automatically.</div>
          </div>
        </div>
        <button id="clockInBtn" class="checkin-btn">
          <i class="bi bi-check-circle"></i>
          Check In
        </button>
      </div>
    `;

    document.getElementById("clockInBtn")?.addEventListener("click", () => this._doCheckIn());
  }

  async _doCheckIn() {
    const btn = document.getElementById("clockInBtn");
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Checking in...';

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
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Checked In';
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

    const classCount = Array.isArray(timetable) ? timetable.length : 0;
    const avgProgress = Number.isFinite(Number(atp?.average_progress)) ? Number(atp.average_progress) : 0;
    const totalPlans = Number.isFinite(Number(atp?.total_plans)) ? Number(atp.total_plans) : 0;
    const unreadCount = Number.isFinite(Number(unread)) ? Number(unread) : 0;

    el.innerHTML = `
      <div class="card stat-card" onclick="window.__nav('/attendance')">
        <div class="card-body">
          <div class="soft-icon">
            <i class="bi bi-clipboard-check"></i>
          </div>
          <div class="stat-value">${classCount}</div>
          <div class="stat-label">Classes Today</div>
        </div>
      </div>
      <div class="card stat-card" onclick="window.__nav('/messages')">
        <div class="card-body">
          <div class="soft-icon">
            <i class="bi bi-chat-dots-fill"></i>
          </div>
          <div class="stat-value">${unreadCount}</div>
          <div class="stat-label">Unread Messages</div>
        </div>
      </div>
      <div class="card stat-card" onclick="window.__nav('/atp')">
        <div class="card-body">
          <div class="soft-icon" style="background:#f7f7f8;color:var(--accent);">
            <i class="bi bi-bar-chart-line-fill"></i>
          </div>
          <div class="stat-value">${Math.round(avgProgress)}%</div>
          <div class="stat-label">ATP Progress</div>
        </div>
      </div>
      <div class="card stat-card" onclick="window.__nav('/schoolwork')">
        <div class="card-body">
          <div class="soft-icon" style="background:#f7f7f8;color:var(--accent);">
            <i class="bi bi-journal-text"></i>
          </div>
          <div class="stat-value">${totalPlans}</div>
          <div class="stat-label">Active Plans</div>
        </div>
      </div>
    `;
  }

  _renderTimetable(timetable) {
    const el = document.getElementById("timetableList");
    if (!el) return;

    if (!Array.isArray(timetable) || !timetable.length) {
      el.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-calendar-check"></i>
          <p>No classes scheduled today</p>
        </div>
      `;
      return;
    }

    el.innerHTML = timetable.map((entry) => {
      const subjectName = entry.subject?.name || entry.subject_name || "";
      const className = entry.school_class?.name || entry.class_name || "";
      const gradeName = entry.school_class?.grade?.name || "";
      const periodName = entry.period?.name || entry.period_name || "";
      const startTime = entry.period?.start_time || entry.start_time || "";
      const endTime = entry.period?.end_time || entry.end_time || "";
      const classId = entry.school_class_id || entry.class_id || "";

      return `
        <div class="list-item" data-class-id="${classId}">
          <div class="icon" style="background:#eef7ff;color:#1794f7;">
            <i class="bi bi-book"></i>
          </div>
          <div class="content">
            <div class="title">${htmlEscape(subjectName)}</div>
            <div class="subtitle">${htmlEscape(gradeName ? `${className} · ${gradeName}` : className)} · ${htmlEscape(periodName)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;font-weight:700;color:var(--accent);">${htmlEscape(startTime)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${htmlEscape(endTime)}</div>
          </div>
        </div>
      `;
    }).join("");

    el.querySelectorAll(".list-item").forEach((item) => {
      item.addEventListener("click", () => {
        const classId = item.dataset.classId;
        if (classId) router.navigate(`/attendance/${classId}`);
      });
    });
  }

  _renderRecentMessages(messages) {
    const el = document.getElementById("recentMessagesList");
    if (!el) return;

    if (!messages.length) {
      el.innerHTML = `
        <div class="activity-empty">
          <i class="bi bi-chat-square-text"></i>
          <p>No recent parent messages yet.</p>
          <button class="btn-outline" id="openMessagesBtn">Open messages</button>
        </div>
      `;
      document.getElementById("openMessagesBtn")?.addEventListener("click", () => router.navigate("/messages"));
      return;
    }

    el.innerHTML = `
      <div class="activity-card-body">
        ${messages.map((message) => `
          <button class="activity-item" data-thread-id="${message.id}">
            <div class="activity-item-icon">
              <i class="bi bi-chat-left-text"></i>
            </div>
            <div class="activity-item-copy">
              <div class="activity-item-topline">
                <span class="activity-item-title">${htmlEscape(message.participant)}</span>
                ${message.unread ? '<span class="activity-badge">New</span>' : ""}
              </div>
              <div class="activity-item-subtitle">${htmlEscape(truncate(message.preview, 74))}</div>
            </div>
            <div class="activity-item-trailing">${htmlEscape(formatDateTime(message.updatedAt))}</div>
          </button>
        `).join("")}
      </div>
    `;

    el.querySelectorAll("[data-thread-id]").forEach((item) => {
      item.addEventListener("click", () => router.navigate(`/messages/${item.dataset.threadId}`));
    });
  }

  _renderRecentSubmissions(submissions) {
    const el = document.getElementById("recentSubmissionsList");
    if (!el) return;

    if (!submissions.length) {
      el.innerHTML = `
        <div class="activity-empty">
          <i class="bi bi-journal-check"></i>
          <p>New learner uploads will appear here after parents submit work in the parent app.</p>
          <button class="btn-outline" id="openSchoolworkBtn">Open school work</button>
        </div>
      `;
      document.getElementById("openSchoolworkBtn")?.addEventListener("click", () => router.navigate("/schoolwork"));
      return;
    }

    el.innerHTML = `
      <div class="activity-card-body">
        ${submissions.map((submission) => `
          <button class="activity-item" data-work-id="${submission.workId}">
            <div class="activity-item-icon">
              <i class="bi bi-check2-square"></i>
            </div>
            <div class="activity-item-copy">
              <div class="activity-kicker">${htmlEscape(submission.workTitle)}</div>
              <div class="activity-item-title">${htmlEscape(submission.studentName)}</div>
              <div class="activity-item-subtitle">
                ${htmlEscape(submission.admissionNo ? `Admission ${submission.admissionNo}` : submission.subjectName || "Ready for review")}
              </div>
            </div>
            <div class="activity-item-trailing">
              <div>${htmlEscape(formatDateTime(submission.submittedAt))}</div>
              <div class="activity-pill ${submission.gradeScore != null ? "is-success" : ""}">
                ${submission.gradeScore != null ? `${submission.gradeScore}%` : "Review"}
              </div>
            </div>
          </button>
        `).join("")}
      </div>
    `;

    el.querySelectorAll("[data-work-id]").forEach((item) => {
      item.addEventListener("click", () => router.navigate(`/schoolwork/${item.dataset.workId}`));
    });
  }
}

window.__nav = (path) => router.navigate(path);
