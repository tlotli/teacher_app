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
        <h1>Teacher Profile</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">
        <div class="card">
          <div class="card-body" style="text-align:center;padding:26px 22px;">
            <div style="width:88px;height:88px;background:#f2f5f8;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:30px;color:var(--accent);font-weight:800;box-shadow:0 14px 24px rgba(23,24,31,0.06);">
              ${htmlEscape((teacher?.name || "T")[0].toUpperCase())}
            </div>
            <h2 style="font-size:24px;font-weight:800;margin-bottom:4px;">${htmlEscape(teacher?.name || "")}</h2>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:8px;">${htmlEscape(teacher?.email || "")}</p>
            <span class="badge-pill badge-success" style="margin-top:8px;">${htmlEscape(teacher?.role || "Teacher")}</span>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;text-align:left;">
              <div class="app-panel" style="padding:12px 14px;">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Role</div>
                <div style="font-size:14px;font-weight:700;">${htmlEscape(teacher?.role || "Teacher")}</div>
              </div>
              <div class="app-panel" style="padding:12px 14px;">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">School</div>
                <div style="font-size:14px;font-weight:700;">${htmlEscape(school?.name || "Not loaded")}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="section-title" style="padding:0 0 8px;">School Information</div>
            <div style="font-size:14px;">
              <div class="info-row">
                <span style="color:var(--text-muted);">School</span>
                <span style="font-weight:600;">${htmlEscape(school?.name || "—")}</span>
              </div>
              <div class="info-row">
                <span style="color:var(--text-muted);">Province</span>
                <span style="font-weight:600;">${htmlEscape(school?.province || "—")}</span>
              </div>
              <div class="info-row">
                <span style="color:var(--text-muted);">EMIS Number</span>
                <span style="font-weight:600;">${htmlEscape(school?.emis_number || "—")}</span>
              </div>
            </div>
          </div>
        </div>

        <button id="logoutBtn" class="btn-primary">
          <i class="bi bi-box-arrow-right"></i> Sign Out
        </button>
        </div>
      </div>
    `;

    document.getElementById("goBackBtn")?.addEventListener("click", () => router.navigate("/dashboard"));
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
