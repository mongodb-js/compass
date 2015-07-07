var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var opn = require('opn');

var debug = require('debug')('scout:tasks:darwin');

var NAME = pkg.electron.name;
var APP_PATH = path.join('dist', NAME + '-darwin-x64', NAME + '.app');

var packager = require('electron-packager');
var createDMG = require('electron-installer-dmg');

var CONFIG = {
  name: pkg.electron.name,
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  appPath: APP_PATH,
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

module.exports.start = function(done) {
  opn(APP_PATH, done);
};

module.exports.tasks = function(gulp) {
  gulp.task('build electron app', ['install build'], module.exports.build);

  gulp.task('build installer', ['build electron app'], module.exports.installer);
  gulp.task('start electron', ['build electron app'], module.exports.start);

  gulp.task('copy build files to electron', function() {
    return gulp.src('../build/*.js')
      .pipe(gulp.dest(path.join(CONFIG.appPath, 'Contents', 'Resources', 'app')));
  });
};
