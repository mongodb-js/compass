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
var platform = require(path.join(__dirname, 'tasks', process.platform));
gulp.task('build:electron', platform.build);
gulp.task('build:electron-installer', ['build:electron'], platform.installer);

// @todo: debugging...
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');

gulp.task('package:electron', function() {
  return gulp.src(['dist/MongoDB\ Enterprise\ Scout-darwin-x64/*', 'dist/MongoDB\ Enterprise\ Scout-darwin-x64/**/*'])
    .pipe(tar('MongoDB Enterprise Scout-v0.2.0.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('dist/'));
});

var BUILD = 'build/';

// `npm start` calls this.
gulp.task('start', ['build:app', 'build:electron', 'hack:app'], function() {
  platform.start();
  return gulp.start('watch');
});
gulp.task('hack:app', function() {
  return del(platform.BUILD);
});

gulp.task('build:release', function() {
  BUILD = platform.BUILD;
  return gulp.start('build:app-release');
});

gulp.task('build:app', ['pages', 'less', 'js', 'copy', 'build:npm-install'], function() {});
gulp.task('build:app-release', ['pages', 'less', 'js', 'copy', 'build:npm-install-release'], function() {
  return gulp.start('build:electron-installer');
});

// @todo: sourcemaps https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md
gulp.task('js', function() {
  return browserify('./src/index.js', {
    cache: {},
    packageCache: {},
    fullPaths: true,
    debug: false
  })
    .transform('jadeify')
    .bundle()
    .on('error', notify('js'))
    .pipe(source('index.js'))
    .pipe(gulp.dest(BUILD));
});

gulp.task('watch', ['build:app'], function() {
  gulp.watch(['src/{*,**/*}.less', 'styles/*.less'], ['less']);
  gulp.watch(['src/*.jade'], ['pages']);
  gulp.watch('images/{*,**/*}', ['copy images']);
  gulp.watch('fonts/*', ['copy fonts']);
  gulp.watch(['main.js', 'src/electron/*'], ['copy:electron']);
  gulp.watch('package.json', ['copy:electron', 'build:npm-install']);

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
  var started = false;

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
      .pipe(gulp.dest(BUILD))
      .on('end', function() {
        var time = prettyTime(process.hrtime(start));
        gutil.log('Finished', '\'' + gutil.colors.cyan('rebundle') + '\'',
          'after', gutil.colors.magenta(time));
        spinner.start();
        if (!started) {
          started = true;
        }
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
gulp.task('copy', [
  'copy:fonts',
  'copy:images',
  'copy:electron'
]);

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
