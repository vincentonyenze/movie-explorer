// Runs before every test file (see "setupFiles" in vite.config.js)

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom (the fake browser) has no <dialog> methods yet. These stand-ins
// do just enough for the tests: open, close, and the "close" event. The
// real behaviour (the page behind going inert, Escape, focus going back to
// the card) can only happen in a real browser; it was checked in Chrome.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  cleanup(); // remove what the test rendered
  localStorage.clear(); // favourites from one test must not leak into the next
  vi.unstubAllGlobals(); // put the real fetch back
  vi.useRealTimers();
});
