import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { storage } from "../services/storage.js";
import { authApi } from "../api/auth.js";
import { errorHandler } from "../utils/error-handler.js";
import { hideBottomNav } from "../components/navigation/BottomNav.js";
import { initCsrfProtection } from "../api/config.js";

export default class Login extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    setScreenSignal(this.signal);
    hideBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="login-shell">
        <div class="login-hero">
          <div class="login-hero-badge">
            <i class="bi bi-mortarboard-fill" style="font-size:34px;"></i>
          </div>
          <div class="mini-meta" style="margin:0 auto 12px;">
            <i class="bi bi-stars"></i>
            Teacher workspace
          </div>
          <h1 style="font-size:30px;font-weight:800;margin-bottom:6px;">EduLink Teacher</h1>
          <p style="color:var(--text-muted);font-size:14px;line-height:1.5;">
            Attendance, ATP tracking, messaging, and schoolwork in one polished teaching hub.
          </p>
        </div>

        <div class="login-card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">
            <div>
              <h2 style="font-size:22px;font-weight:800;margin-bottom:4px;">Welcome back</h2>
              <p style="font-size:13px;color:var(--text-muted);">Sign in with your school credentials.</p>
            </div>
            <div class="soft-icon" style="width:44px;height:44px;border-radius:16px;">
              <i class="bi bi-person-badge"></i>
            </div>
          </div>

          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" class="form-control" placeholder="teacher@school.co.za" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-input-wrap">
                <input type="password" id="password" class="form-control password-input" placeholder="Enter your password" autocomplete="current-password" required />
                <button type="button" id="togglePassword" class="password-toggle-btn" title="Show / hide password" tabindex="-1">
                  <i class="bi bi-eye-slash"></i>
                </button>
              </div>
            </div>
            <div id="loginError" style="display:none;color:#dc3545;font-size:13px;margin-bottom:14px;padding:10px 12px;background:#fff1f3;border-radius:16px;border:1px solid #ffd5dc;"></div>
            <button type="submit" class="btn-primary" id="loginBtn">
              <span id="loginBtnText">Sign In</span>
              <span id="loginSpinner" style="display:none;" class="spinner-border spinner-border-sm" role="status"></span>
            </button>
          </form>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
            <div class="app-panel" style="padding:12px 14px;">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Built for</div>
              <div style="font-size:14px;font-weight:700;">Daily teaching flow</div>
            </div>
            <div class="app-panel" style="padding:12px 14px;">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Includes</div>
              <div style="font-size:14px;font-weight:700;">ATP + messaging</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const form = document.getElementById("loginForm");
    const toggleBtn = document.getElementById("togglePassword");

    toggleBtn?.addEventListener("click", () => {
      const pwd = document.getElementById("password");
      const icon = toggleBtn.querySelector("i");
      if (pwd.type === "password") {
        pwd.type = "text";
        icon.className = "bi bi-eye";          // eye open = currently visible, click to hide
        toggleBtn.title = "Hide password";
      } else {
        pwd.type = "password";
        icon.className = "bi bi-eye-slash";    // eye slashed = currently hidden, click to show
        toggleBtn.title = "Show password";
      }
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this.isActive) return;

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("loginError");
      const btn = document.getElementById("loginBtn");
      const btnText = document.getElementById("loginBtnText");
      const spinner = document.getElementById("loginSpinner");

      if (!email || !password) {
        errorEl.textContent = "Please enter your email and password.";
        errorEl.style.display = "block";
        return;
      }

      btn.disabled = true;
      btnText.textContent = "Signing in…";
      spinner.style.display = "inline-block";
      errorEl.style.display = "none";

      try {
        await initCsrfProtection();
        const response = await authApi.login(email, password);
        // Backend returns { message, data: { token, user } }
        const { token, user } = response.data.data;

        storage.setAuthToken(token);
        storage.setTeacherInfo(user);
        if (user?.school) storage.setSchoolInfo(user.school);

        window.dispatchEvent(new Event("user-authenticated"));
        router.replace("/dashboard");
      } catch (err) {
        if (!this.isActive) return;
        const msg = err.response?.data?.message || "Login failed. Please check your credentials.";
        errorEl.textContent = msg;
        errorEl.style.display = "block";
        btn.disabled = false;
        btnText.textContent = "Sign In";
        spinner.style.display = "none";
      }
    });
  }
}
