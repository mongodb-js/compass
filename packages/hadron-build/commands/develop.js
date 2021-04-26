/**
 * TODO (imlucas) Use nodemon so main process has livereload.
 */
const Promise = require('bluebird');
const _ = require('lodash');
const spawn = require('child_process').spawn;
const ui = require('./ui');
const verify = require('./verify');
const cli = require('mongodb-js-cli')('hadron-build:develop');
const ELECTRON_PREBUILT_EXECUTABLE = require('electron');

exports.command = 'develop [options]';

exports.describe = 'Run the app in development mode.';

exports.builder = {
  devtools: {
    describe: 'Automatically open devtools?',
    type: 'boolean',
    default: false
  },
  interactive: {
    describe: 'Launch a main process repl after app started?',
    type: 'boolean',
    default: false
  }
};

_.assign(exports.builder, verify.builder, ui.builder);

exports.tasks = function(argv) {
  process.env.NODE_ENV = 'development';
  process.env.DEBUG = 'hadron*,mongo*,electron*';

  if (argv.devtools) {
    process.env.DEVTOOLS = '1';
  }

  if (argv.options) {
    process.env.HADRON_DISTRIBUTION = argv.options;
  }

  return Promise.all([
    verify.tasks(argv),
    ui.tasks(argv)
  ])
    .then( () => exports.startElectronPrebuilt(argv));
};

exports.handler = (argv) => {
  exports.tasks(argv)
    .catch((err) => cli.abortIfError(err));
};

exports.startElectronPrebuilt = (argv) => {
  argv = argv || {};

  const cwd = argv.cwd || process.cwd();
  const options = {
    env: process.env,
    cwd: cwd,
    stdio: 'inherit'
  };

  let args = [];
  if (argv.interactive) {
    args.push('--interactive');
  }
  args.push(cwd);

  const p = Promise.defer();
  spawn(ELECTRON_PREBUILT_EXECUTABLE, args, options)
    .on('error', (err) => p.reject(err))
    .on('exit', () => p.resolve());
  return p.promise;
};
