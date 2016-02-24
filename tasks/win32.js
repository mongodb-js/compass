/* eslint no-console: 0 */
var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var format = require('util').format;
var chalk = require('chalk');
var figures = require('figures');
var packager = require('electron-packager');
var createInstaller = require('electron-installer-squirrel-windows');
var debug = require('debug')('mongodb-compass:tasks:win32');


var APP_PATH = path.resolve(__dirname, '../dist/MongoDBCompass-win32-x64');
module.exports.ELECTRON = path.join(APP_PATH, 'MongoDBCompass.exe');
module.exports.RESOURCES = path.join(APP_PATH, 'resources');
module.exports.HOME = APP_PATH;

var PACKAGER_CONFIG = {
  name: 'MongoDBCompass',
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'win32',
  arch: 'x64',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/win32/mongodb-compass.ico'),
  overwrite: true,
  prune: true,
  'version-string': {
    CompanyName: 'MongoDB Inc.',
    LegalCopyright: '2015 MongoDB Inc.',
    FileDescription: 'The MongoDB GUI.',
    FileVersion: pkg.version,
    ProductVersion: pkg.version,
    ProductName: pkg.product_name,
    InternalName: pkg.name
  }
};

var INSTALLER_CONFIG = {
  name: 'MongoDBCompass',
  path: APP_PATH,
  out: path.resolve(__dirname, '../dist'),
  loading_gif: path.resolve(__dirname, '../images/win32/mdb-compass-installer.gif'),
  overwrite: true
};

/**
 * Checks if the current environment can actually sign builds.
 * If signing can be done, `electron-installer-squirrel-windows`'s config
 * will be updated to sign artifacts.  If not, gracefully degrade
 *
 * @param {Function} fn - Callback.
 */
function addCodesignIdentityIfAvailable(fn) {
  if (process.env.SIGNTOOL_PARAMS) {
    INSTALLER_CONFIG.sign_with_params = process.env.SIGNTOOL_PARAMS;
    console.log(chalk.green.bold(figures.tick),
      format(' This build will be signed using signtool.exe `%s`',
        INSTALLER_CONFIG.sign_with_params));
  }
  fn();
  return;
}

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      debug('.app already exists.  skipping packager run.');
      return done(null, false);
    }
    debug('running packager to create electron binaries...');
    packager(PACKAGER_CONFIG, function(err, res) {
      if (err) {
        return done(err);
      }
      debug('Packager result', res);
      done(null, true);
    });
  });
};

module.exports.installer = function(done) {
  addCodesignIdentityIfAvailable(function(err) {
    if (err) {
      return done(err);
    }
    createInstaller(INSTALLER_CONFIG, function(err2) {
      if (err2) {
        return done(err2);
      }
      console.log('Installer created!');
      done();
    });
  });
};
