/* eslint no-console:0 */
var fs = require('fs');
var path = require('path');
var del = require('del');
var async = require('async');
var chalk = require('chalk');
var figures = require('figures');
var sign = require('electron-osx-sign');
const { execFile } = require('child_process');
const debug = require('debug')('hadron-build:codesign');

function checkAppExists(opts, fn) {
  debug('checking appPath `%s` exists...', opts.appPath);
  fs.exists(opts.appPath, function(exists) {
    if (!exists) {
      debug('appPath `%s` does not exist!', opts.appPath);
      return fn(new Error(opts.appPath + ' does not exist.'));
    }
    debug('appPath exists');
    fn();
  });
}

// Clean up ".cstemp" files from previous attempts
function cleanup(opts, fn) {
  debug('running cleanup');
  del([opts.appPath + '/*.cstemp']).then(function() {
    fn();
  });
}

function runCodesign(src, opts, fn) {
  var entitlementsFile = opts.entitlements ||
    path.resolve(__dirname, 'entitlements.xml');
  sign({
    app: src,
    hardenedRuntime: true,
    identity: opts.identity,
    'gatekeeper-assess': false,
    entitlements: entitlementsFile,
    'entitlements-inherit': entitlementsFile,
    'entitlements-loginheler': entitlementsFile
  }, function(err) {
    if (err) {
      fn(new Error('codesign failed ' + path.basename(src)
        + ': ' + err.message));
      return;
    }
    fn(null, src);
  });
}

/**
 * @param {String} commonName
 * @param {Function} fn - Callback.
 */
function isIdentityAvailable(commonName, fn) {
  execFile('certtool', ['y'], function(err, output) {
    if (err) {
      debug('Failed to list certificates.');
      fn(null, false);
      return;
    }
    if (output.indexOf(commonName) === -1) {
      debug('Signing identity `%s` not detected.',
        commonName);
      fn(null, false);
      return;
    }

    debug('The signing identity `%s` is available!', commonName);

    fn(null, true);
  });
}

module.exports = function(opts, done) {
  async.series([
    checkAppExists.bind(null, opts),
    cleanup.bind(null, opts),
    runCodesign.bind(null, opts.appPath, opts)
  ], done);
};

module.exports.isIdentityAvailable = isIdentityAvailable;
module.exports.codesign = runCodesign;

module.exports.printWarning = function() {
  console.error(chalk.yellow.bold(figures.warning),
    ' User confusion ahead!');

  console.error(chalk.gray(
    '  The default preferences for OSX Gatekeeper will not',
    'allow users to run unsigned applications.'));

  console.error(chalk.gray(
    '  However, we\'re going to continue building',
    'the app and an installer because you\'re most likely'));

  console.error(chalk.gray(
    '  a developer trying to test',
    'the app\'s installation process.'));

  console.error(chalk.gray(
    '  For more information on OSX Gatekeeper and how to change your',
    'system preferences to run unsigned applications,'));
  console.error(chalk.gray('  please see',
    'https://support.apple.com/en-us/HT202491'));
};
