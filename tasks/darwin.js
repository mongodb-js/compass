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

var CONFIG = module.exports = {
  name: pkg.product_name,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  ignore: new RegExp('(scout-server.asar|node_modules/scout-server)'),
  appPath: APP_PATH,
  PACKAGE: PACKAGE,
  BUILD: path.join(APP_PATH, 'Contents', 'Resources', 'app'),
  ELECTRON: path.join(APP_PATH, 'Contents', 'MacOS', 'Electron'),
  platform: 'darwin',
  arch: 'x64',
  version: pkg.electron_version,
  icon: path.resolve(__dirname, '../images/darwin/scout.icns'),
  background: path.resolve(__dirname, '../images/darwin/background.png'),
  overwrite: true,
  'app-bundle-id': 'com.mongodb.scout',
  'app-version': pkg.version,
  sign: '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A',
  protocols: [
    {
      name: 'MongoDB Prototcol',
      schemes: ['mongodb']
    }
  ],
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

module.exports.RESOURCES = path.join(APP_PATH, 'Contents', 'Resources');

// Adjust config via environment variables
if (process.env.SCOUT_INSTALLER_UNSIGNED !== undefined) {
  CONFIG.sign = null;
}

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

var verify = function(done) {
  var cmd = 'codesign --verify "' + CONFIG.appPath + '"';
  debug('Running', cmd);
  cp.exec(cmd, done);
};

module.exports.installer = function(done) {
  debug('running packager...');

  var tasks = [
    _.partial(packager, CONFIG)
  ];

  if (CONFIG.sign) {
    tasks.push(_.partial(verify, CONFIG));
  }

  tasks.push(_.partial(createDMG, CONFIG));

  series(tasks, function(err) {
    if (err) {
      return done(err);
    }
  });
};
