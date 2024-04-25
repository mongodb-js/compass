'use strict';
// Proxy window.L between window and globalThis for leaflet/leaflet-draw compatibility
if (typeof window !== undefined && window !== globalThis) {
  Object.defineProperty(window, 'L', {
    get() {
      return globalThis.L;
    },
    set(value) {
      globalThis.L = value;
    },
  });
}
