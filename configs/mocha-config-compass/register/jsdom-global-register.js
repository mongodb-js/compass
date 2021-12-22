if (typeof window === 'undefined') {
  require('global-jsdom')(undefined, { pretendToBeVisual: true });
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
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
