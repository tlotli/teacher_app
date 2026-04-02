import { router } from "../../router.js";
import { storage } from "../../services/storage.js";
import { openSidebar } from "./Sidebar.js";

const TABS = [
  { id: "home",       icon: "bi-house-fill",       label: "Home",       path: "/dashboard" },
  { id: "attendance", icon: "bi-clipboard-check",  label: "Attendance", path: "/attendance" },
  { id: "messages",   icon: "bi-chat-dots-fill",   label: "Messages",   path: "/messages" },
];

export function renderBottomNav() {
  let nav = document.querySelector(".bottom-nav");
  if (!nav) {
    nav = document.createElement("nav");
    nav.className = "bottom-nav";
    document.body.appendChild(nav);
  }

  const currentPath = router.getCurrentPath();
  const unread = storage.getUnreadCount();

  // 3 main tabs + menu button
  const tabsHTML = TABS.map((tab) => {
    const isActive = currentPath.startsWith(tab.path);
    const badge = tab.id === "messages" && unread > 0
      ? `<span class="badge-count">${unread > 99 ? "99+" : unread}</span>`
      : "";
    return `
      <button class="nav-item ${isActive ? "active" : ""}" data-path="${tab.path}">
        <i class="bi ${tab.icon}"></i>
        ${badge}
        <span>${tab.label}</span>
      </button>
    `;
  }).join("");

  nav.style.display = "flex"; // always restore after hideBottomNav
  nav.innerHTML = tabsHTML + `
    <button class="nav-item nav-menu-btn" id="navMenuBtn">
      <i class="bi bi-grid-3x3-gap-fill"></i>
      <span>More</span>
    </button>
  `;

  nav.querySelectorAll(".nav-item[data-path]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.path;
      if (currentPath === path) router.reload();
      else router.navigate(path);
    });
  });

  document.getElementById("navMenuBtn")?.addEventListener("click", openSidebar);
}

export function hideBottomNav() {
  const nav = document.querySelector(".bottom-nav");
  if (nav) nav.style.display = "none";
}

export function showBottomNav() {
  const nav = document.querySelector(".bottom-nav");
  if (nav) nav.style.display = "flex";
}
