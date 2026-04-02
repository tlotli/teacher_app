/**
 * BaseScreen — base class for all screen components.
 *
 * Provides:
 *  - AbortController so all fetch requests are cancelled on navigation
 *  - `isActive` guard for async callbacks
 *  - `addListener()` for auto-removed event listeners
 */
export class BaseScreen {
  constructor() {
    this._destroyed = false;
    this._controller = new AbortController();
    this._listeners = [];
  }

  get isActive() {
    return !this._destroyed;
  }

  get signal() {
    return this._controller.signal;
  }

  addListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this._listeners.push({ target, event, handler, options });
    return handler;
  }

  cleanup() {
    if (this._destroyed) return;
    this._destroyed = true;

    try {
      this._controller.abort();
    } catch (_) {}

    for (const { target, event, handler, options } of this._listeners) {
      try {
        target.removeEventListener(event, handler, options);
      } catch (_) {}
    }
    this._listeners = [];
  }
}
