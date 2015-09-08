var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var cp = require('child_process');
var series = require('run-series');
var _ = require('lodash');

var debug = require('debug')('scout:tasks:darwin');

var NAME = pkg.product_name;
var PACKAGE = path.join('dist', NAME + '-darwin-x64');
var APP_PATH = path.join(PACKAGE, NAME + '.app');

var packager = require('electron-packager');
var createDMG = require('electron-installer-dmg');

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
  sign: '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A',
  protocols: [
    {
      name: 'MongoDB Prototcol',
      schemes: ['mongodb']
    }
  ]
};

// Adjust config via environment variables
if (process.env.SCOUT_INSTALLER_UNSIGNED !== undefined) {
  PACKAGER_CONFIG.sign = null;
}

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

var verify = function(done) {
  var cmd = 'codesign --verify "' + APP_PATH + '"';
  debug('Verifying `%s` has been signed...', APP_PATH);
  cp.exec(cmd, done);
};

module.exports.installer = function(done) {
  debug('creating installer...');

  var tasks = [];
  if (PACKAGER_CONFIG.sign) {
    tasks.push(verify);
  }

  tasks.push(_.partial(createDMG, INSTALLER_CONFIG));

  series(tasks, function(err) {
    if (err) {
      console.error(err.stack);
      return done(err);
    }
    console.log('Installer created!');
    done();
  });
};
