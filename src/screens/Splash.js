import { BaseScreen } from "../utils/screen-base.js";
import { router } from "../router.js";
import { storage } from "../services/storage.js";
import { hideBottomNav } from "../components/navigation/BottomNav.js";

export default class Splash extends BaseScreen {
  constructor() {
    super();
  }

  async render() {
    hideBottomNav();
    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#ffffff;color:#17181f;text-align:center;padding:24px;">
        <div style="width:80px;height:80px;background:#f0f8ff;border-radius:28px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 20px 40px rgba(23,148,247,0.12);">
          <i class="bi bi-mortarboard-fill" style="font-size:38px;color:#1794f7;"></i>
        </div>
        <h1 style="font-size:32px;font-weight:800;letter-spacing:-0.03em;margin-bottom:8px;">EduLink Teacher</h1>
        <p style="color:#8c8c96;font-size:14px;">Attendance · Messaging · ATP · Schoolwork</p>
        <div style="margin-top:32px;width:28px;height:28px;border:2.5px solid #ececef;border-top-color:#1794f7;border-radius:50%;animation:spin .8s linear infinite;"></div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </div>
    `;

    // Auto-navigate after brief splash (skip delay if already logged in)
    const token = storage.getAuthToken();
    const delay = token ? 600 : 1000;
    setTimeout(() => {
      if (!this.isActive) return;
      if (token) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }, delay);
  }
}
