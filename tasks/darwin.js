var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var run = require('./run');
var format = require('util').format;
var chalk = require('chalk');
var figures = require('figures');
var series = require('run-series');
var _ = require('lodash');
var packager = require('electron-packager');
var createDMG = require('electron-installer-dmg');

var debug = require('debug')('scout:tasks:darwin');

var NAME = pkg.product_name;
var PACKAGE = path.join('dist', NAME + '-darwin-x64');
var APP_PATH = path.join(PACKAGE, NAME + '.app');

module.exports.ELECTRON = path.join(APP_PATH, 'Contents', 'MacOS', 'Electron');
module.exports.RESOURCES = path.join(APP_PATH, 'Contents', 'Resources');

var PACKAGER_CONFIG = {
  name: pkg.product_name,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'darwin',
  arch: 'x64',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/darwin/scout.icns'),
  overwrite: true,
  prune: true,
  'app-bundle-id': 'com.mongodb.compass',
  'app-version': pkg.version,
  protocols: [
    {
      name: 'MongoDB Prototcol',
      schemes: ['mongodb']
    }
  ]
};

// @todo (imlucas): Standardize `electron-installer-dmg`
// options w/ `electron-installer-squirrel-windows`.
var INSTALLER_CONFIG = {
  name: pkg.product_name,
  out: path.resolve(__dirname, '../dist'),
  icon: path.resolve(__dirname, '../images/darwin/scout.icns'),
  appPath: APP_PATH,
  overwrite: true,
  background: path.resolve(__dirname, '../images/darwin/background.png'),
  // The following only modifies "x","y" values from defaults
  contents: [
    {
      x: 450,
      y: 344,
      type: 'link',
      path: '/Applications'
    },
    {
      x: 192,
      y: 344,
      type: 'file',
      path: path.resolve(process.cwd(), APP_PATH)
    }
  ]
};

var CODESIGN_IDENTITY_COMMON_NAME = 'Developer ID Application: Matt Kangas (ZD3CL9MT3L)';
var CODESIGN_IDENTITY_SHA1 = '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A';

/**
 * Checks if the current environment can actually sign builds.
 * If signing can be done, `electron-packager`'s config will
 * be updated to sign artifacts.  If not, gracefully degrade
 *
 * @param {Function} fn - Callback.
 */
function addCodesignIdentityIfAvailable(fn) {
  run('certtool', ['y'], function(err, output) {
    if (err) {
      debug('Failed to list certificates.  Build will not be signed.');
      fn();
      return;
    }
    if (output.indexOf(CODESIGN_IDENTITY_COMMON_NAME) === -1) {
      debug('Signing identity `%s` not detected.  Build will not be signed.',
        CODESIGN_IDENTITY_COMMON_NAME);
      fn();
      return;
    }

    PACKAGER_CONFIG.sign = CODESIGN_IDENTITY_SHA1;
    debug('The signing identity `%s` is available!  '
      + 'This build will be signed!', CODESIGN_IDENTITY_COMMON_NAME);

    console.log(chalk.green.bold(figures.tick),
      format(' This build will be signed using the `%s` signing identity',
        CODESIGN_IDENTITY_COMMON_NAME));
    fn();
  });
}

module.exports.build = function(done) {
  addCodesignIdentityIfAvailable(function(err) {
    if (err) return done(err);

    fs.exists(APP_PATH, function(exists) {
      if (exists && process.env.NODE_ENV !== 'production') {
        debug('.app already exists.  skipping packager run.');
        return done();
      }
      debug('running electron-packager...');
      packager(PACKAGER_CONFIG, done);
    });
  });
};

/**
 * If the app is supposed to be signed, verify that
 * the signing was actually completed correctly.
 * If signing is not available, print helpful details
 * on working with unsigned builds.
 *
 * @param {Function} done - Callback which receives `(err)`.
 */
function verify(done) {
  if (!PACKAGER_CONFIG.sign) {
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
    debug('Build is not signed.  Skipping codesign verification.');
    process.nextTick(done);
    return;
  }

  debug('Verifying `%s` has been signed correctly...', APP_PATH);
  run('codesign', ['--verify', APP_PATH], function(err) {
    if (err) {
      err = new Error('App is not correctly signed');
      done(err);
      return;
    }
    debug('Verified that the app has been signed correctly!');
    done();
  });
}

/**
 * Package the application as a single `.DMG` file which
 * is the OSX equivalent of a `Setup.exe` installer.
 *
 * @param {Function} done - Callback which receives `(err)`.
 */
module.exports.installer = function(done) {
  debug('creating installer...');

  var tasks = [
    verify,
    _.partial(createDMG, INSTALLER_CONFIG)
  ];

  series(tasks, function(err) {
    if (err) {
      console.error(chalk.red.bold(figures.cross),
        'Failed to create DMG installer:', err.message);
      console.error(chalk.gray(err.stack));
      return done(err);
    }
    console.log(chalk.green.bold(figures.tick),
      ' DMG installer written to',
      path.join(INSTALLER_CONFIG.out, INSTALLER_CONFIG.name + '.dmg'));
    done();
  });
};
