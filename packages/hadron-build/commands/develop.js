'use strict';

const _ = require('lodash');
const spawn = require('child_process').spawn;
const ui = require('./ui');
const verify = require('./verify');
const abortIfError = require('../lib/abort-if-error');
const ELECTRON_PREBUILT_EXECUTABLE = require('electron-prebuilt');

exports.command = 'develop [options]';

exports.describe = 'Run the app in development mode.';

exports.builder = {
  devtools: {
    describe: 'Automatically open devtools?',
    type: 'boolean',
    default: false
  }
};

_.assign(exports.builder, verify.builder, ui.builder);

exports.tasks = function(argv) {
  process.env.NODE_ENV = 'development';

  if (argv.devtools) {
    process.env.DEVTOOLS = '1';
  }

  return Promise.all([
    verify.tasks(argv), ui.tasks(argv)
  ])
  .then(exports.startElectronPrebuilt);
};

exports.handler = (argv) => exports.tasks(argv).catch(abortIfError);

exports.startElectronPrebuilt = () => {
  const cwd = process.cwd();
  const options = {
    env: process.env,
    cwd: cwd,
    stdio: 'inherit'
  };

  const p = new Promise();
  spawn(ELECTRON_PREBUILT_EXECUTABLE, [cwd], options)
    .on('error', p.reject)
    .on('exit', p.resolve);
  return p;
};
