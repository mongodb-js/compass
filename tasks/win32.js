var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var spawn = require('child_process').spawn;
var del = require('del');

var debug = require('debug')('scout:tasks:win32');

var NAME = pkg.electron.name;
var APP_PATH = path.join('dist', NAME + '-win32-ia32');

var packager = require('electron-packager');
var CONFIG = module.exports = {
  name: pkg.electron.name,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  appPath: APP_PATH,
  BUILD: path.join(APP_PATH, 'resources', 'app'),
  ELECTRON: path.join(APP_PATH, NAME + '.exe'),
  platform: 'win32',
  arch: 'ia32',
  version: pkg.electron.version,
  icon: path.resolve(__dirname, '../images/win32/scout.icon'),
  overwrite: true,
  prune: true,
  asar: true,
  'version-string': {
    CompanyName: 'MongoDB Inc.',
    LegalCopyright: '2015 MongoDB Inc.',
    FileDescription: 'The MongoDB GUI.',
    FileVersion: pkg.version,
    ProductVersion: pkg.version,
    ProductName: NAME,
    InternalName: NAME
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
    del([path.join(APP_PATH, 'resources', 'app')], function() {
      done();
    });
  });
};

module.exports.start = function() {
  var child = spawn(path.resolve(CONFIG.ELECTRON), [path.resolve(CONFIG.dir)]);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
};
