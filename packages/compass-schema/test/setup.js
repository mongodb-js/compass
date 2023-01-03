import L from 'leaflet';

// Apply leaflet to global for tests.
window.L = L;
global.L = L;

// Fill for leaflet.
window.URL.createObjectURL = () => '';
