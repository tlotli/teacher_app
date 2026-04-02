import "bootstrap/dist/css/bootstrap.min.css";
import Framework7 from "framework7/lite-bundle";
import "framework7/css/bundle";

import "./styles/main.css";
import "./styles/components/navigation.css";

import * as bootstrap from "bootstrap";
window.bootstrap = bootstrap;

// Initialize Framework7
const app = new Framework7({
  el: "#app",
  theme: "auto",
});

app.views.create(".view-main", {
  main: true,
  router: false,
});

import { router } from "./router.js";
import { storage } from "./services/storage.js";
import { initCsrfProtection } from "./api/config.js";

// Import screens
import Splash from "./screens/Splash.js";
import Login from "./screens/Login.js";
import Dashboard from "./screens/Dashboard.js";
import Attendance from "./screens/Attendance.js";
import AttendanceCapture from "./screens/AttendanceCapture.js";
import Messages from "./screens/Messages.js";
import MessageThread from "./screens/MessageThread.js";
import NewMessage from "./screens/NewMessage.js";
import AtpPlans from "./screens/AtpPlans.js";
import AtpPlanDetail from "./screens/AtpPlanDetail.js";
import SchoolWork from "./screens/SchoolWork.js";
import SchoolWorkCreate from "./screens/SchoolWorkCreate.js";
import SchoolWorkDetail from "./screens/SchoolWorkDetail.js";
import Profile from "./screens/Profile.js";

import Demerits from "./screens/Demerits.js";

// ─── Auth Guard ──────────────────────────────────────────────

function requireAuth() {
  const token = storage.getAuthToken();
  if (!token) {
    router.replace("/login");
    return false;
  }
  return true;
}

// ─── Route Registration ──────────────────────────────────────

router.register("/", async () => {
  const s = new Splash();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/login", () => {
  // Redirect already-authenticated users straight to dashboard
  if (storage.getAuthToken()) {
    router.replace("/dashboard");
    return;
  }
  const s = new Login();
  router.currentScreenInstance = s;
  s.render();
});

router.register("/dashboard", async () => {
  if (!requireAuth()) return;
  const s = new Dashboard();
  router.currentScreenInstance = s;
  await s.render();
  window.dispatchEvent(new Event("user-authenticated"));
});

router.register("/attendance", async () => {
  if (!requireAuth()) return;
  const s = new Attendance();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/attendance/:classId", async (params) => {
  if (!requireAuth()) return;
  const s = new AttendanceCapture();
  router.currentScreenInstance = s;
  await s.render(params);
});

router.register("/messages", async () => {
  if (!requireAuth()) return;
  const s = new Messages();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/messages/new", async () => {
  if (!requireAuth()) return;
  const s = new NewMessage();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/messages/:threadId", async (params) => {
  if (!requireAuth()) return;
  const s = new MessageThread();
  router.currentScreenInstance = s;
  await s.render(params);
});

router.register("/atp", async () => {
  if (!requireAuth()) return;
  const s = new AtpPlans();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/atp/:planId", async (params) => {
  if (!requireAuth()) return;
  const s = new AtpPlanDetail();
  router.currentScreenInstance = s;
  await s.render(params);
});

router.register("/schoolwork", async () => {
  if (!requireAuth()) return;
  const s = new SchoolWork();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/schoolwork/create", async () => {
  if (!requireAuth()) return;
  const s = new SchoolWorkCreate();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/schoolwork/:id", async (params) => {
  if (!requireAuth()) return;
  const s = new SchoolWorkDetail();
  router.currentScreenInstance = s;
  await s.render(params);
});

router.register("/profile", async () => {
  if (!requireAuth()) return;
  const s = new Profile();
  router.currentScreenInstance = s;
  await s.render();
});

router.register("/demerits", async () => {
  if (!requireAuth()) return;
  const s = new Demerits();
  router.currentScreenInstance = s;
  await s.render();
});

// ─── PWA Service Worker ──────────────────────────────────────

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onOfflineReady() {
        console.log("PWA offline ready");
      },
      onNeedRefresh() {
        console.log("New version available");
      },
    });
  });
}

// ─── Online/Offline ──────────────────────────────────────────

function showOfflineIndicator() {
  let ind = document.querySelector(".offline-indicator");
  if (!ind) {
    ind = document.createElement("div");
    ind.className = "offline-indicator";
    ind.style.cssText =
      "position:fixed;top:0;left:0;right:0;background:#dc3545;color:#fff;text-align:center;padding:8px;font-size:13px;font-weight:600;z-index:99999;";
    ind.innerHTML = '<i class="bi bi-wifi-off"></i> No internet connection';
    document.body.prepend(ind);
  }
  ind.style.display = "block";
}

function hideOfflineIndicator() {
  const ind = document.querySelector(".offline-indicator");
  if (ind) ind.style.display = "none";
}

window.addEventListener("online", hideOfflineIndicator);
window.addEventListener("offline", showOfflineIndicator);
if (!navigator.onLine) showOfflineIndicator();

// ─── Back button ─────────────────────────────────────────────

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#goBackBtn");
  if (btn) {
    e.preventDefault();
    router.back();
  }
});

// ─── CSRF + Startup ─────────────────────────────────────────

initCsrfProtection().catch((err) => console.warn("CSRF init failed:", err));

console.log("EduLink Teacher PWA Initialized");
