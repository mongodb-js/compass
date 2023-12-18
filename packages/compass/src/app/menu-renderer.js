const electron = require('electron');
const { ipcRenderer: ipc } = require('hadron-ipc');

const ZOOM_DEFAULT = 0;
const ZOOM_INCREMENT = 0.5;
const ZOOM_MAX = 5;
const ZOOM_MIN = -3;

const zoomReset = () => {
  return electron.webFrame.setZoomLevel(ZOOM_DEFAULT);
};
const zoomIn = () => {
  const currentZoomLevel = electron.webFrame.getZoomLevel();
  const newZoomLevel = Math.min(currentZoomLevel + ZOOM_INCREMENT, ZOOM_MAX);
  return electron.webFrame.setZoomLevel(newZoomLevel);
};
const zoomOut = () => {
  const currentZoomLevel = electron.webFrame.getZoomLevel();
  const newZoomLevel = Math.max(currentZoomLevel - ZOOM_INCREMENT, ZOOM_MIN);
  return electron.webFrame.setZoomLevel(newZoomLevel);
};

ipc.on('window:zoom-reset', zoomReset);
ipc.on('window:zoom-in', zoomIn);
ipc.on('window:zoom-out', zoomOut);

module.exports = {
  zoomReset,
  zoomIn,
  zoomOut,
};
