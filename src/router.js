import { setScreenSignal } from "./api/config.js";

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.currentScreenInstance = null;
    this.navigationId = 0;
    this.navigationCooldownMs = 250;
    this.lastNavigationStartedAt = 0;

    window.addEventListener("popstate", () => {
      this.markNavigationStarted();
      this.handleRoute();
    });

    document.addEventListener("DOMContentLoaded", () => this.handleRoute());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path, data = {}) {
    if (!path || path === window.location.pathname) return;
    if (!this.canStartNavigation()) return;
    this.markNavigationStarted();
    window.history.pushState(data, "", path);
    this.handleRoute();
  }

  replace(path, data = {}) {
    if (!path) return;
    if (!this.canStartNavigation()) return;
    this.markNavigationStarted();
    window.history.replaceState(data, "", path);
    this.handleRoute();
  }

  back() {
    if (!this.canStartNavigation()) return;
    this.markNavigationStarted();
    window.history.back();
  }

  reload() {
    if (!this.canStartNavigation()) return;
    this.markNavigationStarted();
    this.handleRoute();
  }

  canStartNavigation() {
    return Date.now() - this.lastNavigationStartedAt >= this.navigationCooldownMs;
  }

  markNavigationStarted() {
    this.lastNavigationStartedAt = Date.now();
  }

  cleanupModals() {
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());

    document.querySelectorAll(".modal.show").forEach((el) => {
      el.classList.remove("show");
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
      if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
        const inst = bootstrap.Modal.getInstance(el);
        if (inst) inst.dispose();
      }
    });

    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  resetScrollPosition() {
    const screen = document.getElementById("screen-content");
    if (screen) screen.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  async handleRoute() {
    const path = window.location.pathname;
    this.navigationId += 1;
    const activeNavId = this.navigationId;

    this.cleanupModals();
    setScreenSignal(null);

    if (this.currentScreenInstance && typeof this.currentScreenInstance.cleanup === "function") {
      try {
        this.currentScreenInstance.cleanup();
      } catch (e) {
        console.error("Screen cleanup error:", e);
      }
    }
    this.currentScreenInstance = null;
    this.currentRoute = path;

    // Exact match
    if (this.routes[path]) {
      try {
        await this.routes[path]();
      } catch (e) {
        console.error("Route handler failed:", path, e);
      }
      if (activeNavId !== this.navigationId) return;
      this.resetScrollPosition();
      return;
    }

    // Parameterized match
    for (const routePath in this.routes) {
      const params = this.matchRoute(routePath, path);
      if (params) {
        try {
          await this.routes[routePath](params);
        } catch (e) {
          console.error("Route handler failed:", routePath, e);
        }
        if (activeNavId !== this.navigationId) return;
        this.resetScrollPosition();
        return;
      }
    }

    console.error("Route not found:", path);
    this.navigate("/");
  }

  matchRoute(routePath, actualPath) {
    const routeParts = routePath.split("/");
    const actualParts = actualPath.split("/");
    if (routeParts.length !== actualParts.length) return null;

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = actualParts[i];
      } else if (routeParts[i] !== actualParts[i]) {
        return null;
      }
    }
    return params;
  }

  getCurrentPath() {
    return window.location.pathname;
  }

  getNavigationId() {
    return this.navigationId;
  }

  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) result[key] = value;
    return result;
  }
}

export const router = new Router();
