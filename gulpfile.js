var browserify = require('browserify');
var watchify = require('watchify');
var prettyTime = require('pretty-hrtime');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less');
var jade = require('gulp-jade');

var sourcemaps = require('gulp-sourcemaps');

var clui = require('clui');
var merge = require('merge-stream');
var shell = require('gulp-shell');
var path = require('path');
var del = require('del');

var notify = require('./tasks/notify');
var pkg = require('./package.json');

// Platform specific tasks
require(path.join(__dirname, 'tasks', process.platform)).tasks(gulp);

// `npm start` calls this.
gulp.task('default', ['build', 'start electron', 'watch']);

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
    gutil.log('Starting', '\'' + gutil.colors.cyan('rebundle') + '\'...');
  }
  return bundler.bundle()
    .on('error', notify('js'))
    .pipe(source('index.js'))
    .pipe(gulp.dest('build/'))
    .on('end', function() {
      var time = prettyTime(process.hrtime(start));
      gutil.log('Finished', '\'' + gutil.colors.cyan('rebundle') + '\'',
        'after', gutil.colors.magenta(time));
      if (changed) {
        spinner.start();
      }
    });
}

gulp.task('build', [
  'pages',
  'less',
  'js',
  'copy'
]);

gulp.task('js', function(cb) {
  bundler.bundle()
    .on('error', notify('js'))
    .on('error', cb)
    .pipe(source('index.js'))
    .pipe(gulp.dest('build/'))
    .on('end', cb);
});

gulp.task('watch', function() {
  gulp.watch(['src/{*,**/*}.less', 'styles/*.less'], ['less']);
  gulp.watch(['src/*.jade'], ['pages']);
  gulp.watch('images/{*,**/*}', ['copy images']);
  gulp.watch('fonts/*', ['copy fonts']);
  gulp.watch(['main.js', 'src/electron/*'], ['copy app electron files']);
  gulp.watch('package.json', ['install build']);

  gulp.watch('build/*.js', ['copy build files to electron']);
  return rebundle(true);
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
gulp.task('copy', [
  'copy fonts',
  'copy images',
  'copy app electron files'
]);

gulp.task('copy fonts', function() {
  return gulp.src(pkg.fonts)
    .pipe(gulp.dest('build/fonts'));
});

gulp.task('copy fonts', function() {
  return gulp.src(pkg.fonts)
    .pipe(gulp.dest('build/fonts'));
});

gulp.task('copy images', function() {
  return gulp.src('images/{*,**/*}')
    .pipe(gulp.dest('build/images'));
});

gulp.task('copy app electron files', function() {
  return merge(
    gulp.src(['main.js', 'package.json']).pipe(gulp.dest('build/')),
    gulp.src(['src/electron/*']).pipe(gulp.dest('build/src/electron'))
  );
});

gulp.task('install build', ['copy'], shell.task('npm install', {
  cwd: 'build'
}));

gulp.task('clean', function(done) {
  del(['dist/', 'build/', 'node_modules/'], done);
});
