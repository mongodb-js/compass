const path = require('path');
const child_process = require('child_process');
const electronPath = require('electron');

function startElectronProxy() {
  child_process.execFile(
    electronPath,
    [path.resolve(__dirname, 'electron-proxy.js')],
    { env: process.env }
  );
}

module.exports = { startElectronProxy };
