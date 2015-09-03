var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var packager = require('electron-packager');
var createInstaller = require('electron-installer-squirrel-windows');
var series = require('run-series');
var _ = require('lodash');
var debug = require('debug')('scout:tasks:win32');

var APP_PATH = path.resolve(__dirname, '../dist/MongoDBScout-win32-ia32');
module.exports.ELECTRON = path.join(APP_PATH, 'MongoDBScout.exe');
module.exports.RESOURCES = path.join(APP_PATH, 'resources');


var PACKAGER_CONFIG = {
  name: 'MongoDBScout',
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'win32',
  ignore: new RegExp('(scout-server.asar|node_modules/scout-server)'),
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

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      debug('.app already exists.  skipping packager run.');
      return done(null, false);
    }
    debug('running packager to create electron binaries...');
    packager(PACKAGER_CONFIG, function(err, res) {
      if (err) return done(err);
      debug('Packager result', res);
      done(null, true);
    });
  });
};

module.exports.installer = function(done) {
  debug('Packaging into `%s`', path.join(APP_PATH, 'resources', 'app.asar'));

  var tasks = [
    _.partial(packager, PACKAGER_CONFIG),
    _.partial(createInstaller, INSTALLER_CONFIG)
  ];

  series(tasks, function(err) {
    if (err) return done(err);
    console.log('Installer created!');
    done();
  });
};
