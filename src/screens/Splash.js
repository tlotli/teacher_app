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
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#198754,#146c43);color:#fff;text-align:center;padding:24px;">
        <div style="width:80px;height:80px;background:rgba(255,255,255,0.15);border-radius:24px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <i class="bi bi-mortarboard-fill" style="font-size:40px;"></i>
        </div>
        <h1 style="font-size:28px;font-weight:700;margin-bottom:8px;">EduLink Teacher</h1>
        <p style="opacity:0.8;font-size:15px;">Attendance · Messaging · ATP · Schoolwork</p>
        <div style="margin-top:32px;">
          <div class="spinner-border text-light" role="status" style="width:24px;height:24px;border-width:2px;">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    `;

    // Auto-navigate after brief splash
    setTimeout(() => {
      if (!this.isActive) return;
      const token = storage.getAuthToken();
      if (token) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }, 1200);
  }
}
