'use strict';
if (typeof window === 'undefined') {
  require('global-jsdom')(undefined, { pretendToBeVisual: true });
}

if (!globalThis.DOMRectReadOnly) {
  globalThis.DOMRectReadOnly = class DOMRectReadOnly {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    top = 0;
    right = 0;
    bottom = 0;
    left = 0;
  };
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// We always mock clipboard because it doesn't exist in jsdom and it doesn't
// work when running tests programmatically in "hidden" electron renderer
// window (it needs an actual, user-initiated focus)
class Clipboard {
  #text = '';
  async writeText(str) {
    this.#text = str;
  }
  async readText() {
    return this.#text;
  }
}
const clipboard = new Clipboard();
Object.defineProperty(globalThis.navigator, 'clipboard', {
  get() {
    return clipboard;
  },
});

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver =
    window.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
}

// jsdom doesn't override classes that already exist in global scope
// https://github.com/jsdom/jsdom/issues/3331
globalThis.EventTarget = window.EventTarget;

Range.prototype.getClientRects = function () {
  return [];
};

Element.prototype.scrollIntoView = () => {};
