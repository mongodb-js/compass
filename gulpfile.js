var browserify = require('browserify');
var watchify = require('watchify');
var jadeify = require('jadeify');
var prettyTime = require('pretty-hrtime');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var CleanCSS = require('less-plugin-clean-css');
var clui = require('clui');
var merge = require('merge-stream');
var shell = require('gulp-shell');
var path = require('path');
var del = require('del');

var notify = require('./tasks/notify');
var pkg = require('./package.json');

// Platform specific tasks
require(path.join(__dirname, 'tasks', process.platform))(gulp);

gulp.task('default', ['develop', 'start']);

gulp.task('develop', ['pages', 'copy', 'less'], function() {
  gulp.watch(['src/{*,**/*}.less', 'styles/*.less'], ['less']);
  gulp.watch(['src/*.jade'], ['pages']);
  gulp.watch('images/{*,**/*}', ['copy:images']);
  gulp.watch('fonts/*', ['copy:fonts']);
  gulp.watch(['main.js', 'src/electron/*'], ['copy:electron']);
  gulp.watch('package.json', ['build:install']);

  var spinner = new clui.Spinner('Watching for changes...');

  /**
   * Gulp's [fast browserify builds recipe](http://git.io/iiCk-A)
   */
  var bundler = watchify(browserify('./src/index.js', {
    cache: {},
    packageCache: {},
    fullPaths: true,
    debug: false
  }))
    .transform('jadeify')
    .on('update', rebundle);

  function rebundle(changed) {
    var start = process.hrtime();
    if (changed) {
      spinner.stop();
      gutil.log('Changed', '\'' + gutil.colors.cyan(changed[1]) + '\'');
    }

    gutil.log('Starting', '\'' + gutil.colors.cyan('rebundle') + '\'...');
    return bundler.bundle()
      .on('error', notify('js'))
      .pipe(source('index.js'))
      .pipe(gulp.dest('build/'))
      .on('end', function() {
        var time = prettyTime(process.hrtime(start));
        gutil.log('Finished', '\'' + gutil.colors.cyan('rebundle') + '\'',
          'after', gutil.colors.magenta(time));
        spinner.start();
      });
  }
  return rebundle();
});

// Compile LESS to CSS.
gulp.task('less', function() {
  return gulp.src('src/*.less')
    .pipe(sourcemaps.init())
    .pipe(less(pkg.less))
    .on('error', notify('less'))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('build'));
});

// Compile jade templates to HTML files.
gulp.task('pages', function() {
  return gulp.src('src/index.jade')
    .pipe(jade())
    .on('error', notify('jade'))
    .pipe(gulp.dest('build'));
});

// Things that should be copied into `build/`.
gulp.task('copy', ['copy:fonts', 'copy:images', 'copy:electron']);

gulp.task('copy:fonts', function() {
  return gulp.src(pkg.fonts)
    .pipe(gulp.dest('build/fonts'));
});

gulp.task('copy:images', function() {
  return gulp.src('images/{*,**/*}')
    .pipe(gulp.dest('build/images'));
});

gulp.task('copy:electron', function() {
  return merge(
    gulp.src(['main.js', 'package.json']).pipe(gulp.dest('build/')),
    gulp.src(['src/electron/*']).pipe(gulp.dest('build/src/electron'))
  );
});

gulp.task('build:install', ['copy:electron'], shell.task('npm install --production', {
  cwd: 'build'
}));

gulp.task('clean', function(done) {
  del(['dist/', 'build/', 'node_modules/'], done);
});

gulp.task('build:js', function() {
  return browserify('src/index.js')
    .transform(jadeify)
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('build'));
});

gulp.task('build:less', function() {
  // Setup less plugin that will clean and compress.
  var cleaner = new CleanCSS({
    root: path.resolve(__dirname, 'src'),
    keepSpecialComments: 0,
    advanced: true
  });

  return gulp.src('src/*.less')
    .pipe(less({
      plugins: [cleaner],
      paths: pkg.less.paths.map(function(p) {
        return path.resolve(__dirname, p);
      })
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('build:app', [
  'copy',
  'pages',
  'build:js',
  'build:less',
  'build:install'
]);

gulp.task('start', [
  'build:app',
  'build:electron',
  'start:electron'
]);
