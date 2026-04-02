import { router } from "../../router.js";
import { storage } from "../../services/storage.js";

const MENU_ITEMS = [
  { icon: "bi-house-fill",                label: "Dashboard",   path: "/dashboard",  color: "#281C9D", bg: "#F2F1F9" },
  { icon: "bi-clipboard-check-fill",      label: "Attendance",  path: "/attendance", color: "#52D5BA", bg: "#eafaf5" },
  { icon: "bi-chat-dots-fill",            label: "Messages",    path: "/messages",   color: "#5655B9", bg: "#eeecf9" },
  { icon: "bi-bar-chart-line-fill",       label: "ATP",         path: "/atp",        color: "#FFAF2A", bg: "#fff8e6" },
  { icon: "bi-journal-text",              label: "School Work", path: "/schoolwork", color: "#0B90FE", bg: "#e6f4ff" },
  { icon: "bi-exclamation-triangle-fill", label: "Demerits",    path: "/demerits",   color: "#FF4267", bg: "#fff0f3" },
  { icon: "bi-person-circle",             label: "Profile",     path: "/profile",    color: "#343434", bg: "#f2f2f4" },
];

// ─── inline style helpers ───────────────────────────────────────────────────
function el(tag, styles = {}, attrs = {}) {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  });
  return e;
}

export function openSidebar() {
  closeSidebar();

  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) bottomNav.style.visibility = "hidden";

  const user        = storage.getTeacherInfo();
  const schoolInfo  = storage.getSchoolInfo();
  const name        = user ? (user.name || user.email || "Teacher") : "Teacher";
  const school      = schoolInfo?.name || user?.school?.name || "EduLinks";
  const initials    = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "T";
  const currentPath = router.getCurrentPath();

  // ── Overlay ─────────────────────────────────────────────────────────────
  const overlay = el("div", {
    position: "fixed", inset: "0",
    background: "rgba(0,0,0,0)",
    zIndex: "100000",
    transition: "background 0.3s ease",
  }, { class: "sidebar-overlay" });
  overlay.addEventListener("click", closeSidebar);

  // ── Panel ────────────────────────────────────────────────────────────────
  const panel = el("div", {
    position: "fixed", top: "0", right: "0", bottom: "0",
    width: "min(340px, calc(100vw - 40px))",
    background: "#ffffff",
    zIndex: "100001",
    display: "flex", flexDirection: "column",
    boxShadow: "-20px 0 40px rgba(23, 24, 31, 0.12)",
    transform: "translateX(100%)",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
    overflowY: "hidden",
    borderLeft: "1px solid #ececef",
    borderRadius: "28px 0 0 28px",
  }, { class: "app-sidebar" });

  // ── Header ───────────────────────────────────────────────────────────────
  const header = el("div", {
    background: "linear-gradient(160deg, #281C9D 0%, #5655B9 100%)",
    padding: "18px 18px 20px",
    display: "flex", alignItems: "center", gap: "14px",
    position: "relative", flexShrink: "0",
    margin: "14px 14px 0",
    borderRadius: "24px",
    boxShadow: "0 18px 34px rgba(40, 28, 157, 0.22)",
  });

  const topInset = `calc(18px + env(safe-area-inset-top, 0px))`;
  header.style.paddingTop = topInset;

  // Close btn (top-right)
  const closeBtn = el("button", {
    position: "absolute", top: "14px", right: "14px",
    width: "34px", height: "34px",
    background: "rgba(255,255,255,0.18)",
    border: "none", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#ffffff", cursor: "pointer", fontSize: "14px",
    lineHeight: "1",
    boxShadow: "0 10px 18px rgba(26, 18, 120, 0.18)",
    backdropFilter: "blur(8px)",
  }, { type: "button", id: "sidebarCloseBtn" });
  const closeIcon = el("i", {}, { class: "bi bi-x-lg" });
  closeBtn.appendChild(closeIcon);

  // Avatar square
  const avatar = el("div", {
    width: "56px", height: "56px", flexShrink: "0",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: "18px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "22px", fontWeight: "800", color: "#ffffff",
    fontFamily: "inherit",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
  }, { text: initials });

  // Name + school
  const userInfo = el("div", { flex: "1", minWidth: "0" });
  const userName  = el("div", {
    fontSize: "17px", fontWeight: "700", color: "#ffffff",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    fontFamily: "inherit",
  }, { text: name });
  const userSub = el("div", {
    fontSize: "13px", color: "rgba(255,255,255,0.82)", marginTop: "3px",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    fontFamily: "inherit",
  }, { text: school });
  const rolePill = el("div", {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "12px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "600",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  }, { text: "Teacher menu" });
  userInfo.appendChild(userName);
  userInfo.appendChild(userSub);
  userInfo.appendChild(rolePill);

  header.appendChild(closeBtn);
  header.appendChild(avatar);
  header.appendChild(userInfo);

  // ── Nav ──────────────────────────────────────────────────────────────────
  const nav = el("nav", {
    flex: "1", overflowY: "auto", WebkitOverflowScrolling: "touch",
    padding: "18px 14px 10px", background: "#ffffff",
  });

  MENU_ITEMS.forEach((item) => {
    const active = currentPath.startsWith(item.path);
    const activeColor = item.color;

    const btn = el("button", {
      display: "flex", alignItems: "center", gap: "14px",
      width: "100%", padding: "13px 14px",
      border: active ? `1px solid ${activeColor}20` : "1px solid transparent",
      background: active ? "#ffffff" : "transparent",
      borderRadius: "18px", marginBottom: "8px",
      cursor: "pointer", textAlign: "left",
      transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
      boxShadow: active ? "0 12px 24px rgba(23, 24, 31, 0.06)" : "none",
    }, { type: "button", "data-path": item.path });

    // Icon box
    const iconBox = el("span", {
      width: "42px", height: "42px", flexShrink: "0",
      background: item.bg,
      borderRadius: "14px",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "18px", color: activeColor,
    });
    const icon = el("i", {}, { class: `bi ${item.icon}` });
    iconBox.appendChild(icon);

    // Label
    const label = el("span", {
      flex: "1",
      fontSize: "15px", fontWeight: active ? "700" : "600",
      color: "#343434",
      fontFamily: "inherit",
    }, { text: item.label });

    btn.appendChild(iconBox);
    btn.appendChild(label);

    if (active) {
      const dot = el("span", {
        width: "28px", height: "28px", flexShrink: "0",
        background: "#F2F1F9",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#281C9D",
        fontSize: "13px",
      });
      dot.innerHTML = '<i class="bi bi-chevron-right"></i>';
      btn.appendChild(dot);
    }

    btn.addEventListener("mouseover", () => {
      if (!active) {
        btn.style.background = "#ffffff";
        btn.style.borderColor = "#ececef";
        btn.style.transform = "translateX(-2px)";
      }
    });
    btn.addEventListener("mouseout",  () => {
      if (!active) {
        btn.style.background = "transparent";
        btn.style.borderColor = "transparent";
        btn.style.transform = "translateX(0)";
      }
    });

    btn.addEventListener("click", () => {
      closeSidebar();
      const path = btn.dataset.path;
      if (router.getCurrentPath() !== path) router.navigate(path);
    });

    nav.appendChild(btn);
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  const footer = el("div", {
    flexShrink: "0", background: "#ffffff",
    padding: "10px 14px calc(14px + env(safe-area-inset-bottom, 0px))",
  });

  const logoutBtn = el("button", {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
    width: "100%", padding: "14px 16px",
    border: "1px solid #ececef", background: "#ffffff",
    color: "#FF4267", borderRadius: "12px",
    fontSize: "15px", fontWeight: "600",
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 10px 24px rgba(23, 24, 31, 0.05)",
  }, { type: "button", id: "sidebarLogoutBtn" });

  const logoutIcon = el("i", {}, { class: "bi bi-box-arrow-left" });
  const logoutText = document.createTextNode(" Sign out");
  logoutBtn.appendChild(logoutIcon);
  logoutBtn.appendChild(logoutText);
  footer.appendChild(logoutBtn);

  // ── Assemble & mount ─────────────────────────────────────────────────────
  panel.appendChild(header);
  panel.appendChild(nav);
  panel.appendChild(footer);

  document.documentElement.appendChild(overlay);
  document.documentElement.appendChild(panel);

  requestAnimationFrame(() => {
    overlay.style.background = "rgba(0,0,0,0.45)";
    panel.style.transform = "translateX(0)";
  });

  document.getElementById("sidebarCloseBtn")?.addEventListener("click", closeSidebar);

  document.getElementById("sidebarLogoutBtn")?.addEventListener("click", async () => {
    closeSidebar();
    try {
      const { authApi } = await import("../../api/auth.js");
      await authApi.logout();
    } catch { /* silent */ }
    storage.clearAuth();
    router.navigate("/login");
  });
}

export function closeSidebar() {
  const overlay  = document.querySelector(".sidebar-overlay");
  const panel    = document.querySelector(".app-sidebar");
  const bottomNav = document.querySelector(".bottom-nav");

  if (panel) {
    panel.style.transform = "translateX(100%)";
    setTimeout(() => panel.remove(), 300);
  }
  if (overlay) {
    overlay.style.background = "rgba(0,0,0,0)";
    setTimeout(() => overlay.remove(), 300);
  }

  if (bottomNav) bottomNav.style.visibility = "";
}
