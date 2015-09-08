var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var packager = require('electron-packager');
var createInstaller = require('electron-installer-squirrel-windows');
var debug = require('debug')('scout:tasks:win32');

var APP_PATH = path.resolve(__dirname, '../dist/MongoDBCompass-win32-x64');
module.exports.ELECTRON = path.join(APP_PATH, 'MongoDBCompass.exe');
module.exports.RESOURCES = path.join(APP_PATH, 'resources');

var PACKAGER_CONFIG = {
  name: 'MongoDBCompass',
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'win32',
  arch: 'x64',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/win32/scout.icon'),
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
  overwrite: true
};

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
  createInstaller(INSTALLER_CONFIG, function(err) {
    if (err) {
      return done(err);
    }
    console.log('Installer created!');
    done();
  });
};
