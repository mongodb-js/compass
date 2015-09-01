var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var del = require('del');
var packager = require('electron-packager');
var createInstaller = require('electron-installer-squirrel-windows');
var series = require('run-series');
var _ = require('lodash');
var debug = require('debug')('scout:tasks:win32');

var APP_PATH = path.resolve(__dirname, '../dist/MongoDBScout-win32-ia32');
module.exports.BUILD = path.join(APP_PATH, 'resources', 'app');
module.exports.ELECTRON = path.join(APP_PATH, 'MongoDBScout.exe');

var PACKAGER_CONFIG = {
  name: 'MongoDBScout',
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'win32',
  arch: 'ia32',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/win32/scout.icon'),
  overwrite: true,
  asar: true,
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
  name: 'MongoDBScout',
  path: APP_PATH,
  out: path.resolve(__dirname, '../dist'),
  overwrite: true
};

debug('packager config: ', JSON.stringify(PACKAGER_CONFIG, null, 2));
debug('installer config: ', JSON.stringify(INSTALLER_CONFIG, null, 2));

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      debug('.app already exists.  skipping packager run.');
      return done();
    }
    debug('running packager to create electron binaries...');
    packager(PACKAGER_CONFIG, done);
  });
};

module.exports.installer = function(done) {
  debug('Packaging into `%s`', path.join(APP_PATH, 'resources', 'app.asar'));

  var tasks = [
    _.partial(packager, PACKAGER_CONFIG),
    _.partial(createInstaller, INSTALLER_CONFIG),
    _.partial(del, module.exports.BUILD)
  ];

  series(tasks, function(err) {
    if (err) return done(err);
    console.log('Installer created!');
    done();
  });
};
