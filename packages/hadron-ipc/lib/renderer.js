'use strict';

const getResponseChannel = require('./common').getResponseChannel;
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const _debug = require('debug')('hadron-ipc:renderer');

exports = ipcRenderer;

function call(debug, methodName, ...args) {
  debug(`calling ${methodName} with args`, args);
  const responseChannel = getResponseChannel(methodName);
  const errorResponseChannel = `${responseChannel}-error`;

  return new Promise(function(resolve, reject) {
    ipcRenderer.on(responseChannel, function(event, result) {
      debug(`got response for ${methodName} from main`, result);
      ipcRenderer.removeAllListeners(responseChannel);
      ipcRenderer.removeAllListeners(errorResponseChannel);
      resolve(result);
    });

    ipcRenderer.on(errorResponseChannel, function(event, err) {
      debug(`error for ${methodName} from main`, err);
      ipcRenderer.removeAllListeners(responseChannel);
      ipcRenderer.removeAllListeners(errorResponseChannel);
      reject(err);
    });

    ipcRenderer.send(methodName, ...args);
  });
}

exports.callQuiet = function(methodName, ...args) {
  return call(() => {}, methodName, ...args);
};

exports.call = function(methodName, ...args) {
  return call(_debug, methodName, ...args);
};

module.exports = exports;
