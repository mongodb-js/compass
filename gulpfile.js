var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less');
var jade = require('gulp-jade');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var merge = require('merge-stream');
var shell = require('gulp-shell');
var path = require('path');
var del = require('del');

var notify = require('./tasks/notify');
var pkg = require('./package.json');

// Platform specific tasks
var platform = require(path.join(__dirname, 'tasks', process.platform));
gulp.task('build:electron', platform.build);
gulp.task('build:electron-installer', ['build:electron'], platform.installer);

var BUILD = 'build/';

// `npm start` calls this.
gulp.task('start', ['build:app'], function() {
  platform.start();
  return gulp.start('watch');
});

gulp.task('build:release', function() {
  BUILD = platform.BUILD;
  return gulp.start('build:app-release');
});

gulp.task('build:app', [
  'build:electron',
  'pages',
  'less',
  'copy:fonts',
  'copy:images',
  'copy:electron',
  'js:watch'
], function() {
  // deletes the `app` folder in electron build
  // so `platform:start` can just point the electron renderer at `BUILD`
  // and we don't have to do all kinds of crazy copying.
  process.env.WATCH_DIRECTORY = path.resolve(__dirname, BUILD);
  return del(platform.BUILD);
});
gulp.task('build:app-release', [
  'build:electron',
  'pages',
  'less',
  'copy:fonts',
  'copy:images',
  'copy:electron'
], function() {
  return gulp.start('build:electron-installer');
});

var bundler = browserify(pkg.browserify).transform('jadeify');

gulp.task('js', ['build:npm-install-release'], function() {
  return bundler.bundle()
    .on('error', notify('js'))
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(BUILD));
});

gulp.task('watch', function() {
  gulp.watch(['src/{*,**/*}.less', 'styles/*.less'], ['less']);
  gulp.watch(['src/*.jade'], ['pages']);
  gulp.watch('images/{*,**/*}', ['copy:images']);
  gulp.watch('fonts/*', ['copy:fonts']);
  gulp.watch(['main.js', 'src/electron/*'], ['copy:electron']);
  gulp.watch('package.json', ['copy:electron', 'build:npm-install']);
});

gulp.task('js:watch', ['build:npm-install'], function() {
  /**
   * Gulp's [fast browserify builds recipe](http://git.io/iiCk-A)
   */
  var b;
  function rebundle(files) {
    if (files) {
      gutil.log('Changed', '\'' + gutil.colors.cyan(files) + '\'');
      gutil.log('Starting', '\'' + gutil.colors.cyan('rebundle') + '\'...');
    }
    return b.bundle()
      .on('error', notify('js'))
      .pipe(source('index.js'))
      .pipe(gulp.dest(BUILD))
      .on('end', function() {
        gutil.log('Finished', '\'' + gutil.colors.cyan('rebundle') + '\'...');
      });
  }
  b = watchify(bundler).on('update', rebundle);
  return rebundle();
});

// Compile LESS to CSS.
gulp.task('less', function() {
  return gulp.src('src/*.less')
    .pipe(sourcemaps.init())
    .pipe(less(pkg.less))
    .on('error', notify('less'))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(BUILD));
});

// Compile jade templates to HTML files.
gulp.task('pages', function() {
  return gulp.src('src/index.jade')
    .pipe(jade())
    .on('error', notify('jade'))
    .pipe(gulp.dest(BUILD));
});

// Things that should be copied into `BUILD`.
gulp.task('copy:fonts', function() {
  return gulp.src(pkg.fonts)
    .pipe(gulp.dest(path.join(BUILD, 'fonts')));
});

gulp.task('copy:images', function() {
  return gulp.src('images/{*,**/*}')
    .pipe(gulp.dest(path.join(BUILD, 'images')));
});

gulp.task('copy:electron', function() {
  return merge(
    gulp.src(['main.js', 'package.json']).pipe(gulp.dest(BUILD)),
    gulp.src(['src/electron/*']).pipe(gulp.dest(path.join(BUILD, 'src/electron')))
  );
});

gulp.task('build:npm-install', ['copy:electron'], shell.task('npm install', {
  cwd: BUILD
}));

gulp.task('build:npm-install-release', ['copy:electron'], shell.task('npm install --production', {
  cwd: platform.BUILD
}));

gulp.task('clean', function(done) {
  del(['dist/', 'node_modules/'], done);
});
