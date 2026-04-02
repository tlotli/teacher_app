/**
 * Global error handler for toast/snackbar display
 */
class ErrorHandler {
  show(message, title = "", type = "info") {
    const existing = document.querySelector(".app-toast");
    if (existing) existing.remove();

    const colors = {
      success: "#198754",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#0d6efd",
    };

    const toast = document.createElement("div");
    toast.className = "app-toast";
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      z-index: 99999; background: ${colors[type] || colors.info}; color: #fff;
      padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2); max-width: calc(100vw - 32px);
      text-align: center; animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = title ? `${title}: ${message}` : message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  showSuccess(message, title = "") {
    this.show(message, title, "success");
  }
  showError(message, title = "") {
    this.show(message, title, "error");
  }
  showWarning(message, title = "") {
    this.show(message, title, "warning");
  }
  showInfo(message, title = "") {
    this.show(message, title, "info");
  }
}

export const errorHandler = new ErrorHandler();
