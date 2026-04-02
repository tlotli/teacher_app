import { router } from "../../router.js";
import { storage } from "../../services/storage.js";

const TABS = [
  { id: "home", icon: "bi-house-fill", label: "Home", path: "/dashboard" },
  { id: "attendance", icon: "bi-clipboard-check", label: "Attendance", path: "/attendance" },
  { id: "messages", icon: "bi-chat-dots-fill", label: "Messages", path: "/messages" },
  { id: "atp", icon: "bi-bar-chart-line-fill", label: "ATP", path: "/atp" },
  { id: "work", icon: "bi-journal-text", label: "Work", path: "/schoolwork" },
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

  nav.innerHTML = TABS.map((tab) => {
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

  nav.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.path;
      if (currentPath === path) {
        router.reload();
      } else {
        router.navigate(path);
      }
    });
  });
}

export function hideBottomNav() {
  const nav = document.querySelector(".bottom-nav");
  if (nav) nav.style.display = "none";
}

export function showBottomNav() {
  const nav = document.querySelector(".bottom-nav");
  if (nav) nav.style.display = "flex";
}
