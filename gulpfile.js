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
var spawn = require('child_process').spawn;

var notify = require('./tasks/notify');
var pkg = require('./package.json');

// Platform specific tasks
var platform = require(path.join(__dirname, 'tasks', process.platform));

gulp.task('dev:configure', function() {
  process.env.NODE_ENV = 'development';
});

gulp.task('release:configure', function() {
  process.env.NODE_ENV = 'production';
});

// `npm start` calls this.
gulp.task('dev', ['dev:build-app', 'dev:build-js', 'dev:remove-unpacked-app'], function() {
  var child = spawn(path.resolve(platform.ELECTRON), ['build/']);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
  child.on('exit', function(code) {
    process.exit(code);
  });
  return gulp.start('dev:watch');
});

gulp.task('dev:build-app', ['dev:configure', 'dev:build-electron'], function() {
  return gulp.start('pages', 'less', 'copy:fonts', 'copy:images', 'copy:electron');
});

gulp.task('dev:remove-unpacked-app', ['dev:build-electron'], function() {
  // deletes the `app` folder in electron build
  // so `platform:start` can just point the electron renderer at `BUILD`
  // and we don't have to do all kinds of crazy copying.
  return del(platform.BUILD);
});
gulp.task('dev:build-electron', platform.build);

// `npm run release` calls this.
gulp.task('release', ['release:build-app'], function() {
  return gulp.start('release:electron:build-installer');
});

gulp.task('release:build-app', [
  'js',
  'pages',
  'less',
  'copy:fonts',
  'copy:images',
  'copy:electron'
]);

gulp.task('release:electron:build-installer', ['release:build-app'], platform.installer);

var bundler = browserify(pkg.browserify).transform('jadeify');
gulp.task('js', ['release:npm-install'], function() {
  return bundler.bundle()
    .on('error', notify('js'))
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build/'));
});

gulp.task('dev:watch', function() {
  gulp.watch(['src/{*,**/*}.less', 'styles/*.less'], ['less']);
  gulp.watch(['src/*.jade'], ['pages']);
  gulp.watch('images/{*,**/*}', ['copy:images']);
  gulp.watch('fonts/*', ['copy:fonts']);
  gulp.watch(['main.js', 'src/electron/*', 'settings.json'], ['copy:electron']);
  gulp.watch('package.json', ['copy:electron', 'dev:npm-install']);
});

/**
 * Gulp's [fast browserify builds recipe](http://git.io/iiCk-A)
 */
gulp.task('dev:build-js', [
  'dev:build-app',
  'dev:npm-install'], function() {
  var b;
  function rebundle(files) {
    if (files) {
      gutil.log('Changed', '\'' + gutil.colors.cyan(files) + '\'');
      gutil.log('Starting', '\'' + gutil.colors.cyan('rebundle') + '\'...');
    }
    return b.bundle()
      .on('error', notify('js'))
      .pipe(source('index.js'))
      .pipe(gulp.dest('build/'))
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
    .pipe(gulp.dest('build/'));
});

// Compile jade templates to HTML files.
gulp.task('pages', function() {
  return gulp.src('src/index.jade')
    .pipe(jade({
      locals: {
        NODE_ENV: process.env.NODE_ENV
      }
    }))
    .on('error', notify('jade'))
    .pipe(gulp.dest('build/'));
});

// Things that should be copied into `build/`.
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
    gulp.src(['main.js', 'package.json', 'settings.json', 'README.md'])
      .pipe(gulp.dest('build/')),
    gulp.src(['src/electron/*'])
      .pipe(gulp.dest('build/src/electron'))
  );
});

gulp.task('dev:npm-install', ['copy:electron'], shell.task('npm install', {
  cwd: 'build/'
}));

gulp.task('release:npm-install', ['copy:electron'], shell.task('npm install --production', {
  cwd: 'build/'
}));

gulp.task('clean', function(done) {
  del(['build/', 'dist/', 'node_modules/'], done);
});
