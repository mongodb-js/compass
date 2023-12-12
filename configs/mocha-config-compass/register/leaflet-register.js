// Proxy window.L between window and globalThis for leaflet/leaflet-draw compatibility
Object.defineProperty(window, 'L', {
  get() {
    return globalThis.L;
  },
  set(value) {
    globalThis.L = value;
  },
});
