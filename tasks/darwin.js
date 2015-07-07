var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');

var debug = require('debug')('scout:tasks:darwin');

var NAME = pkg.electron.name;
var PACKAGE = path.join('dist', NAME + '-darwin-x64');
var APP_PATH = path.join(PACKAGE, NAME + '.app');

var packager = require('electron-packager');
var createDMG = require('electron-installer-dmg');

var spawn = require('child_process').spawn;

var CONFIG = module.exports = {
  name: pkg.electron.name,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  appPath: APP_PATH,
  PACKAGE: PACKAGE,
  BUILD: path.join(APP_PATH, 'Contents', 'Resources', 'app'),
  ELECTRON: path.join(APP_PATH, 'Contents', 'MacOS', 'Electron'),
  platform: 'darwin',
  arch: 'x64',
  version: pkg.electron.version,
  icon: path.resolve(__dirname, '../images/darwin/scout.icns'),
  overwrite: true,
  prune: true,
  'app-bundle-id': 'com.mongodb.scout',
  'app-version': pkg.version,
  sign: 'Developer ID Application: Matt Kangas',
  protocols: [
    {
      name: 'MongoDB Prototcol',
      schemes: ['mongodb']
    }
  ]
};

debug('packager config: ', JSON.stringify(CONFIG, null, 2));

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      debug('.app already exists.  skipping packager run.');
      return done();
    }
    debug('running packager...');
    packager(CONFIG, done);
  });
};

module.exports.installer = function(done) {
  createDMG(CONFIG, done);
};


module.exports.start = function() {
  var child = spawn(path.resolve(CONFIG.ELECTRON), [path.resolve(CONFIG.dir)]);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
};
