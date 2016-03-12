#!/usr/bin/env node
process.env.NODE_ENV = 'development';
var path = require('path');

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:start');
cli.yargs.usage('$0 [options]')
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .option('devtools', {
    describe: 'Automatically open devtools for new electron browser windows?',
    type: 'boolean',
    default: false
  })
  .help('help');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

/**
 * @see ./src/main/window-manager.js
 */
if (cli.argv.devtools) {
  process.env.DEVTOOLS = '1';
}

var spawn = require('child_process').spawn;
var async = require('async');

function startElectronPrebuilt(done) {
  cli.info('Spawning electron-prebuilt');
  var ELECTRON_PREBUILT_EXECUTABLE = require('electron-prebuilt');
  var args = [path.join(__dirname, '..')];
  var opts = {
    env: process.env,
    stdio: 'inherit'
  };

  function onError(err) {
    cli.abort(err);
  }

  function onReady() {
    cli.ok('application started');
  }

  var proc = spawn(ELECTRON_PREBUILT_EXECUTABLE, args, opts);
  proc.on('error', onError);
  setTimeout(onReady, 1000);
  proc.on('exit', done.bind(null, null));
}

async.series([
  startElectronPrebuilt
], function(err) {
  cli.abortIfError(err);
});
