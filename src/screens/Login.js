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
      <div style="min-height:100vh;display:flex;flex-direction:column;">
        <div style="background:linear-gradient(135deg,#198754,#146c43);color:#fff;padding:48px 24px 32px;text-align:center;">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <i class="bi bi-mortarboard-fill" style="font-size:32px;"></i>
          </div>
          <h1 style="font-size:24px;font-weight:700;margin-bottom:4px;">EduLink Teacher</h1>
          <p style="opacity:0.8;font-size:14px;">Sign in with your school credentials</p>
        </div>
        <div style="flex:1;padding:24px;background:#fff;border-radius:24px 24px 0 0;margin-top:-16px;position:relative;z-index:1;">
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" class="form-control" placeholder="teacher@school.co.za" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <div style="position:relative;">
                <input type="password" id="password" class="form-control" placeholder="Enter your password" autocomplete="current-password" required />
                <button type="button" id="togglePassword" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#6c757d;font-size:18px;cursor:pointer;">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
            </div>
            <div id="loginError" style="display:none;color:#dc3545;font-size:13px;margin-bottom:12px;padding:8px 12px;background:#f8d7da;border-radius:8px;"></div>
            <button type="submit" class="btn-primary" id="loginBtn">
              <span id="loginBtnText">Sign In</span>
              <span id="loginSpinner" style="display:none;" class="spinner-border spinner-border-sm" role="status"></span>
            </button>
          </form>
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
        icon.className = "bi bi-eye-slash";
      } else {
        pwd.type = "password";
        icon.className = "bi bi-eye";
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
        const { data } = await authApi.login(email, password);

        storage.setAuthToken(data.token);
        storage.setTeacherInfo(data.teacher);
        if (data.school) storage.setSchoolInfo(data.school);

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
