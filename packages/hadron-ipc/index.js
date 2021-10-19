'use strict';

const isRenderer = require('is-electron-renderer');

let isElectron = false;
try {
  isElectron = typeof require('electron') !== 'string';
} catch (err) { /* not electron */ }

function requireExportModule() {
  if (!isElectron) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn('Unsupported environment for hadron-ipc');
    }

    return {};
  }

  const ipc = isRenderer ? require('./lib/renderer') : require('./lib/main');

  module.exports = ipc;

  if (isRenderer) {
    module.exports.ipcRenderer = ipc;
  } else {
    module.exports.ipcMain = ipc;
  }
}

requireExportModule();
