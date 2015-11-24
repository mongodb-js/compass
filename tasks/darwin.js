/* eslint no-console: 0 */
var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var chalk = require('chalk');
var figures = require('figures');
var series = require('run-series');
var _ = require('lodash');
var packager = require('electron-packager');
var createDMG = require('electron-installer-dmg');
var codesign = require('electron-installer-codesign');

var debug = require('debug')('mongodb-compass:tasks:darwin');

var NAME = pkg.product_name;
var PACKAGE = path.join('dist', NAME + '-darwin-x64');
var APP_PATH = path.join(PACKAGE, NAME + '.app');

module.exports.ELECTRON = path.join(APP_PATH, 'Contents', 'MacOS', 'Electron');
module.exports.RESOURCES = path.join(APP_PATH, 'Contents', 'Resources');
module.exports.HOME = PACKAGE;

var PACKAGER_CONFIG = {
  name: pkg.product_name,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'darwin',
  arch: 'x64',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/darwin/mongodb-compass.icns'),
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
  icon: path.resolve(__dirname, '../images/darwin/mongodb-compass.icns'),
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

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists && process.env.NODE_ENV !== 'production') {
      debug('.app already exists.  skipping packager run.');
      return done();
    }
    debug('running electron-packager...');
    packager(PACKAGER_CONFIG, done);
  });
};


/**
 * Package the application as a single `.DMG` file which
 * is the OSX equivalent of a `Setup.exe` installer.
 *
 * @param {Function} done - Callback which receives `(err)`.
 */
module.exports.installer = function(done) {
  debug('creating installer...');

  var tasks = [];
  codesign.isIdentityAvailable(CODESIGN_IDENTITY_COMMON_NAME, function(err, available) {
    if (err) {
      return done(err);
    }
    if (available) {
      tasks.push(_.partial(codesign, {
        identity: CODESIGN_IDENTITY_SHA1,
        appPath: APP_PATH
      }));
    } else {
      codesign.printWarning();
    }

    tasks.push(_.partial(createDMG, INSTALLER_CONFIG));
    series(tasks, function(_err) {
      if (_err) {
        console.error(chalk.red.bold(figures.cross),
          'Failed to create DMG installer:', _err.message);
        console.error(chalk.gray(_err.stack));
        return done(_err);
      }
      console.log(chalk.green.bold(figures.tick),
        ' DMG installer written to',
        path.join(INSTALLER_CONFIG.out, INSTALLER_CONFIG.name + '.dmg'));
      done();
    });
  });
};
