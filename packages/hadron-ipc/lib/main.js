'use strict';

const getResponseChannel = require('./common').getResponseChannel;
const forIn = require('lodash.forin');
const isPlainObject = require('lodash.isplainobject');
const isPromise = require('is-promise');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const debug = require('debug')('hadron-ipc:main');

exports = ipcMain;

exports.respondTo = (methodName, handler) => {
  if (isPlainObject(methodName)) {
    forIn(methodName, (methodHandler, name) => {
      exports.respondTo(name, methodHandler);
    });
    return exports;
  }

  const responseChannel = getResponseChannel(methodName);
  const errorResponseChannel = `${responseChannel}-error`;

  ipcMain.on(methodName, (event, ...args) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    // In rare cases when browserWindow is closed/destroyed before we even had a
    // chance to get the reference to it from web contents, browserWindow might
    // be null here
    if (!browserWindow) {
      return;
    }
    const resolve = (result) => {
      debug(`responding with result for ${methodName}`, result);
      if (browserWindow.isDestroyed()) {
        return debug('browserWindow went away.  nothing to send response to.');
      }
      event.sender.send(responseChannel, result);
    };
    const reject = (err) => {
      debug(`responding with error for ${methodName}`, err);
      if (browserWindow.isDestroyed()) {
        return debug('browserWindow went away.  nothing to send response to.');
      }
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
  return exports;
};

exports.broadcast = (methodName, ...args) => {
  BrowserWindow.getAllWindows().forEach((_win) => {
    if (_win.webContents) {
      _win.webContents.send(methodName, ...args);
    }
  });
};

exports.broadcastFocused = (methodName, ...args) => {
  BrowserWindow.getAllWindows().forEach((_win) => {
    if (_win.webContents && _win.isFocused()) {
      _win.webContents.send(methodName, ...args);
    }
  });
};

exports.remove = (channel, listener) => {
  ipcMain.removeListener(channel, listener);
};

module.exports = exports;
