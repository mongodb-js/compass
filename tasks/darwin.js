var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var cp = require('child_process');

var debug = require('debug')('scout:tasks:darwin');

var NAME = pkg.electron.name;
var PACKAGE = path.join('dist', NAME + '-darwin-x64');
var APP_PATH = path.join(PACKAGE, NAME + '.app');

var packager = require('electron-packager');
var createDMG = require('electron-installer-dmg');

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
  sign: '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A',
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

var codesign = function(done) {
  // var cmd = 'codesign --deep --force --sign "' + CONFIG.sign + '" "' + CONFIG.appPath + '"';
  var cmd = './tasks/darwin-sign-app.sh  "' + CONFIG.sign + '" "' + CONFIG.appPath + '"';
  debug('Running', cmd);
  cp.exec(cmd, done);
};

var verify = function(done) {
  var cmd = 'codesign --verify "' + CONFIG.appPath + '"';
  debug('Running', cmd);
  cp.exec(cmd, done);
};

module.exports.installer = function(done) {
  debug('running packager...');
  packager(CONFIG, function(err) {
    if (err) return done(err);

    codesign(function(err) {
      if (err) return done(err);

      verify(function(err) {
        if (err) return done(err);

        createDMG(CONFIG, done);
      });
    });
  });
};


module.exports.start = function() {
  var child = cp.spawn(path.resolve(CONFIG.ELECTRON), [path.resolve(CONFIG.dir)]);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
};
