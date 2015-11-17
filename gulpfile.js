/**
 * # Welcome to Compass's gulpfile!
 *
 * Here are a few tips to guide you on your quest:
 *
 * - [Gulp](http://gulpjs.com) is a toolkit for workflow automation
 * - Use the `DEBUG` environment variable if you run into trouble! @see http://npm.im/debug
 * - Check out the [gulp cookbook](http://git.io/vGye8) for more info
 * - Remember to smile and floss
 */
var path = require('path');
var spawn = require('child_process').spawn;
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
var del = require('del');
var sequence = require('run-sequence');
var watch = require('gulp-watch');
var notify = require('./tasks/notify');
var pkg = require('./package.json');

// Platform specific tasks
var platform = require(path.join(__dirname, 'tasks', process.platform));

// Where we'll put everything so it runs in Electron.
// var DEST = path.join(platform.RESOURCES, 'app');

/**
 * # release
 *
 * `npm run release` calls this to build Compass
 * and generate installers for users.
 */
gulp.task('release', function(done) {
  process.env.NODE_ENV = 'production';
  sequence(
    'build',
    'electron:build',
    'electron:build-installer'
    , done);
});

/**
 * # build
 */
gulp.task('build', function(done) {
  sequence(
    [
      'build:pages',
      'build:less',
      'copy:fonts',
      'copy:images',
      'copy:text',
      'copy:js',
      'copy:package.json'
    ],
    'npm:install',
    'build:js'
    , done);
});

/**
 * # dev
 *
 * `npm start` calls this which you call at least once a day
 * so if there is something bugging you, post a message in flowdock!
 */
gulp.task('dev', function(done) {
  process.env.NODE_ENV = 'development';
  sequence(
    'build',
    'electron:build',
    'electron:start',
    'watch'
    , done);
});

/**
 * # watch
 *
 * Once you build the app and start it up, the next thing you'll want to do
 * is actually change things. `watch` handles applying the correct
 * tasks to your change so you can actually view the results.
 */
gulp.task('watch', function() {
  gulp.watch(['src/{*,**/*}.less', 'styles/*.less'], ['build:less']);
  gulp.watch(['src/*.jade'], ['build:pages']);
  gulp.watch('images/{*,**/*}', ['copy:images']);
  gulp.watch('fonts/*', ['copy:fonts']);
  gulp.watch(['src/electron/{*,**/*}'], ['copy:js']);
  gulp.watch('package.json', function() {
    gutil.log('package.json changed!');
    sequence('copy:package.json', 'npm:install');
  });

  /**
   * @todo (imlucas) fix tiny-lr so it actually works with
   * npm@3...
   *   var livereload = require('gulp-livereload');
   *   // Fix so tiny-lr actually works with npm@3
   *   var opts = {
   *     livereload: path.resolve(
   *       require.resolve('livereload-js'),
   *       '../dist/livereload.js')
   *   };
   *   .pipe(livereload(opts));
   *
   *   livereload.listen(opts);
  */

  // Copy any changes from `build/` into electron's
  // `resources/app` so changes are actually reflected.
  gulp.src(['build/{*,**/*,!node_modules/*}'])
    .pipe(watch('build/{*,**/*,!node_modules/*}'))
    .pipe(gulp.dest(path.join(platform.RESOURCES, 'app')));
});

/**
 * Use browserify to compile the UI js.
 */
var jadeify = require('jadeify');
gulp.task('build:js', function() {
  var bundler = browserify(pkg.browserify).transform(jadeify);
  if (process.env.NODE_ENV === 'production') {
    return bundler.bundle()
      .on('error', notify('js'))
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps: true
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('build/'));
  }
  // @see [fast browserify builds recipe](http://git.io/iiCk-A)
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

/**
 * Compile LESS to CSS.
 */
gulp.task('build:less', function() {
  return gulp.src('src/*.less')
    .pipe(sourcemaps.init())
    .pipe(less(pkg.less))
    .on('error', notify('less'))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('build/'));
});

/**
 * Compile jade templates to static HTML files.
 * require('*.jade') statements you see in `src`
 * are compiled via the `jadeify` browserify transform.
 * @see build:js
 */
gulp.task('build:pages', function() {
  return gulp.src('src/index.jade')
    .pipe(jade({
      locals: {
        NODE_ENV: process.env.NODE_ENV
      }
    }))
    .on('error', notify('jade'))
    .pipe(gulp.dest('build/'));
});

/**
 * ## electron
 */
gulp.task('electron:start', function() {
  var child = spawn(path.resolve(platform.ELECTRON), [], {
    env: process.env
  });
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
  child.on('exit', function(code) {
    process.exit(code);
  });
});

gulp.task('electron:build', function(done) {
  platform.build(function(err) {
    if (err) {
      return done(err);
    }
    done();
  });
});

gulp.task('electron:build-installer', platform.installer);

/**
 * ## Things that should be copied into `build/`.
 */
gulp.task('copy:fonts', function() {
  return gulp.src(pkg.fonts)
    .pipe(gulp.dest('build/fonts'));
});

gulp.task('copy:images', function() {
  return gulp.src('images/{*,**/*}')
    .pipe(gulp.dest('build/images'));
});

gulp.task('copy:package.json', function() {
  return gulp.src('package.json')
    .pipe(gulp.dest('build/'));
});

gulp.task('copy:text', function() {
  return gulp.src(['README.md'])
    .pipe(gulp.dest('build/'));
});

// Copy non-UI js into the build.
gulp.task('copy:js', function() {
  return merge(
    gulp.src(['main.js'])
      .pipe(gulp.dest('build/')),
    gulp.src(['src/electron/{*,**/*}'])
      .pipe(gulp.dest('build/src/electron'))
  );
});

gulp.task('npm:install', shell.task('npm install --production --quiet --loglevel error', {
  cwd: 'build/'
}));

gulp.task('clean', function(done) {
  del(['build/', 'dist/', 'node_modules/'], done);
});
