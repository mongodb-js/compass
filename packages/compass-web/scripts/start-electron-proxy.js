'use strict';
const path = require('path');
const child_process = require('child_process');
const electronPath = require('electron');

function startElectronProxy() {
  const child = child_process.execFile(
    electronPath,
    [path.resolve(__dirname, 'electron-proxy.js')],
    { env: process.env }
  );
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}

module.exports = { startElectronProxy };
