'use strict';

const electron = require('electron');
const isRenderer = require('is-electron-renderer');
const isPromise = require('is-promise');

let debug = null;
let ipcRenderer = null;
let ipcMain = null;
let BrowserWindow = null;

if (isRenderer) {
  ipcRenderer = electron.ipcRenderer;
  debug = require('debug')('hadron-ipc:renderer');
} else {
  ipcMain = electron.ipcMain;
  BrowserWindow = electron.BrowserWindow;
  debug = require('debug')('hadron-ipc:main');
}

function getResponseChannel(methodName) {
  return 'hadron-ipc-' + methodName + '-response';
}


exports.call = function(methodName, ...args) {
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
};

exports.respondTo = (methodName, handler) => {
  const responseChannel = getResponseChannel(methodName);
  const errorResponseChannel = `${responseChannel}-error`;

  ipcMain.on(methodName, (event, ...args) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    const resolve = (result) => {
      debug(`responding with result for ${methodName}`, result);
      event.sender.send(responseChannel, result);
    };
    const reject = (err) => {
      debug(`responding with error for ${methodName}`, err);
      event.sender.send(errorResponseChannel, err);
    };

    debug(`calling ${methodName} handler with args`, args);
    const res = handler(browserWindow, ...args);
    if (isPromise(res)) {
      res.then(resolve).catch(reject);
    } else if (res instanceof Error) {
      reject(res);
    } else {
      resolve(res);
    }
  });
};
