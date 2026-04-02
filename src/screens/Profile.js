import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { storage } from "../services/storage.js";
import { authApi } from "../api/auth.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class Profile extends BaseScreen {
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
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>Profile</h1>
      </div>
      <div class="screen-body">
        <div class="card" style="margin-bottom:16px;">
          <div class="card-body" style="text-align:center;padding:24px;">
            <div style="width:72px;height:72px;background:#d1e7dd;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:28px;color:#198754;font-weight:700;">
              ${htmlEscape((teacher?.name || "T")[0].toUpperCase())}
            </div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">${htmlEscape(teacher?.name || "")}</h2>
            <p style="font-size:14px;color:#6c757d;">${htmlEscape(teacher?.email || "")}</p>
            <span class="badge-pill badge-success" style="margin-top:8px;">${htmlEscape(teacher?.role || "Teacher")}</span>
          </div>
        </div>

        <div class="card" style="margin-bottom:16px;">
          <div class="card-body">
            <div class="section-title" style="padding:0 0 8px;">School Information</div>
            <div style="font-size:14px;">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <span style="color:#6c757d;">School</span>
                <span style="font-weight:600;">${htmlEscape(school?.name || "—")}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <span style="color:#6c757d;">Province</span>
                <span style="font-weight:600;">${htmlEscape(school?.province || "—")}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;">
                <span style="color:#6c757d;">EMIS Number</span>
                <span style="font-weight:600;">${htmlEscape(school?.emis_number || "—")}</span>
              </div>
            </div>
          </div>
        </div>

        <button id="logoutBtn" class="btn-primary" style="background:#dc3545;">
          <i class="bi bi-box-arrow-right"></i> Sign Out
        </button>
      </div>
    `;

    document.getElementById("logoutBtn")?.addEventListener("click", () => this._logout());
  }

  async _logout() {
    const btn = document.getElementById("logoutBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Signing out…';

    try {
      await authApi.logout();
    } catch {
      // Ignore errors
    }

    storage.clearAuth();
    router.replace("/login");
  }
}
