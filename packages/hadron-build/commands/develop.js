'use strict';

const _ = require('lodash');
const spawn = require('child_process').spawn;
const async = require('async');
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

exports.handler = function(argv) {
  process.env.NODE_ENV = 'development';

  if (argv.devtools) {
    process.env.DEVTOOLS = '1';
  }

  async.series(exports.tasks(argv), function(err) {
    abortIfError(err);
    process.exit(0);
  });
};

exports.startElectronPrebuilt = function(opts, done) {
  var args = [process.cwd()];

  var proc = spawn(ELECTRON_PREBUILT_EXECUTABLE, args, {
    env: process.env,
    stdio: 'inherit'
  });
  proc.on('error', abortIfError);
  proc.on('exit', done.bind(null, null));
};

exports.tasks = function(argv) {
  return _.flatten([
    verify.tasks(argv),
    ui.tasks(argv),
    exports.startElectronPrebuilt.bind(null, argv)
  ]);
};
