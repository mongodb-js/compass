var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var del = require('del');
var packager = require('electron-packager');
var createInstaller = require('electron-installer-squirrel-windows');
var debug = require('debug')('scout:tasks:win32');

var NAME = pkg.name;
var APP_PATH = path.join('dist', NAME + '-win32-ia32');

var CONFIG = module.exports = {
  name: NAME,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  appPath: APP_PATH,
  path: APP_PATH,
  BUILD: path.join(APP_PATH, 'resources', 'app'),
  ELECTRON: path.join(APP_PATH, NAME + '.exe'),
  platform: 'win32',
  arch: 'ia32',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/win32/scout.icon'),
  overwrite: true,
  asar: true,
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

debug('packager config: ', JSON.stringify(CONFIG, null, 2));

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      debug('.app already exists.  skipping packager run.');
      return done();
    }
    debug('running packager to create electron binaries...');
    packager(CONFIG, done);
  });
};

// @todo (imlucas): electron-installer-windows/squirrel
module.exports.installer = function(done) {
  debug('Packaging into `%s`', path.join(APP_PATH, 'resources', 'app.asar'));
  packager(CONFIG, function(err) {
    if (err) return done(err);

    var unpacked = path.resolve(__dirname, '..' + path.join(APP_PATH, 'resources', 'app'));
    debug('Deleting `%s` so app is loaded from .asar', unpacked);
    del(unpacked, function() {
      createInstaller(CONFIG, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });
};
