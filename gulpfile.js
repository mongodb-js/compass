var browserify = require('browserify');
var watchify = require('watchify');
var jadeify = require('jadeify');
var notifier = require('node-notifier');
var prettyTime = require('pretty-hrtime');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var webserver = require('gulp-webserver');
var gutil = require('gulp-util');
var less = require('gulp-less');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var CleanCSS = require('less-plugin-clean-css');
var clui = require('clui');
var merge = require('merge-stream');
var pkg = require('./package.json');
var shell = require('gulp-shell');
var path = require('path');
var del = require('del');

gulp.task('default', ['develop', 'start']);

/**
 * Helper for catching error events on vinyl-source-stream's and showing
 * a nice native notification and printing a cleaner error message to
 * the console.
 */
function notify(titlePrefix) {
  return function(err) {
    var title = titlePrefix + ' error';
    var message = err.message;

    if (err.fileName) {
      var filename = err.fileName.replace(path.join(__dirname, path.sep), '');
      title = titlePrefix + ' error' + filename;
    }

    if (err.lineNumber) {
      message = err.lineNumber + ': ' + err.message.split(' in file ')[0].replace(/`/g, '"');
    }

    notifier.notify({
      title: title,
      message: message
    });
    console.log(err);
    gutil.log(gutil.colors.red.bold(title), message);
  };
}

gulp.task('testserver', function() {
  return gulp.src('build')
    .pipe(webserver({
      host: 'localhost',
      port: 3001
    }));
});

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

gulp.task('build:install', ['copy:electron'], shell.task('npm install', {
  cwd: 'build'
}));

var product_name = 'MongoDB Enterprise Scout';
var osx_artifact = path.join('dist', product_name + '-darwin-x64', product_name + '.app');
gulp.task('build:osx', ['build:osx:electron', 'build:osx:installer']);
gulp.task('build:osx:electron', [
  'copy:electron',
  'build:install',
  'build:js',
  'build:less'
], shell.task([
  'electron-packager build "' + product_name + '" ',
  ' --out=dist',
  ' --platform=darwin',
  ' --arch=x64',
  ' --version=' + pkg.electron.version,
  ' --icon="images/darwin/scout.icns"',
  ' --overwrite',
  ' --prune',
  ' --app-bundle-id=com.mongodb.scout',
  ' --app-version=' + pkg.version,
  ' --sign="Developer ID Application: Matt Kangas"'
].join('')));

gulp.task('build:osx:installer', ['build:osx:electron'], shell.task([
  'electron-builder "' + osx_artifact + '" --platform=osx --out="dist" --config=dist-config.json'
].join('')));

var win_artifact = path.join('dist', product_name + '-win32-ia32');
gulp.task('build:win', ['build:win:electron', 'build:win:installer']);
gulp.task('build:win:electron', [
  'copy:electron',
  'build:install',
  'build:js',
  'build:less'
], shell.task([
  'electron-packager build "' + product_name + '" ',
  ' --out=dist',
  ' --platform=win32',
  ' --arch=ia32',
  ' --version=' + pkg.electron.version,
  ' --icon="images/win32/scout.ico"',
  ' --overwrite',
  ' --prune',
  ' --asar',
  ' --app-version=' + pkg.version
].join('')));

gulp.task('build:win:installer', ['build:win:electron'], shell.task([
  'electron-builder "' + win_artifact + '" --platform=win --out="dist" --config=dist-config.json'
].join('')));

gulp.task('start:electron', ['build:osx:electron'], shell.task('open "' + osx_artifact + '"', {
  env: {
    NODE_ENV: 'development',
    DEBUG: 'mong*,sco*'
  }
}));

gulp.task('start', [
  'build:app',
  'build:osx:electron',
  'start:electron'
]);

gulp.task('clean', function(done) {
  del(['dist/', 'build/', 'node_modules/'], done);
});

gulp.task('build:app', ['copy', 'pages', 'build:install']);

gulp.task('release', [
  'build:app',
  'build:osx',
  'build:win'
]);

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

// Build in production mode.
gulp.task('build', [
  'copy',
  'pages',
  'build:js',
  'build:less',
  'build:install',
  'build:electron-packager'
]);
