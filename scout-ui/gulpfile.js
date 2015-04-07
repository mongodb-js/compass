var browserify = require('browserify'),
  watchify = require('watchify'),
  jadeify = require('jadeify'),
  notifier = require('node-notifier'),
  prettyTime = require('pretty-hrtime'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  gulp = require('gulp'),
  webserver = require('gulp-webserver'),
  gutil = require('gulp-util'),
  less = require('gulp-less'),
  jade = require('gulp-jade'),
  deploy = require('gulp-gh-pages'),
  uglify = require('gulp-uglify'),
  sourcemaps = require('gulp-sourcemaps'),
  CleanCSS = require('less-plugin-clean-css'),
  clui = require('clui'),
  merge = require('merge-stream'),
  dc = require('dependency-check'),
  jshint = require('gulp-jshint'),
  jsfmt = require('gulp-jsfmt'),
  pkg = require('./package.json'),
  util = require('util');

gulp.task('default', ['develop']);

/**
 * Helper for catching error events on vinyl-source-stream's and showing
 * a nice native notification and printing a cleaner error message to
 * the console.
 */
function notify(titlePrefix) {
  return function(err) {
    var title = titlePrefix + ' error',
      message = err.message;

    if (err.fileName) {
      var filename = err.fileName.replace(__dirname + '/', '');
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

function check(mode, done) {
  var opts = {
    path: __dirname + '/package.json',
    entries: pkg['dependency-check'].entries,
    ignore: pkg['dependency-check'].ignore
  };

  function filterIgnored(results) {
    return results.filter(function(name) {
      return opts.ignore.indexOf(name) === -1;
    });
  }

  dc(opts, function(err, data) {
    if (err) return done(err);
    var pkg = data.package;
    var deps = data.used;
    var results, errMsg, successMsg, corrector;

    if (mode === 'extra') {
      results = filterIgnored(dc.extra(pkg, deps, {
        excludeDev: true
      }));
      errMsg = 'Modules in package.json not used in code';
      corrector = 'npm uninstall --save ' + results.join(' ') + ';';
      successMsg = 'All dependencies in package.json are used in the code';
    } else {
      results = filterIgnored(dc.missing(pkg, deps));
      errMsg = 'Dependencies not listed in package.json';
      successMsg = 'All dependencies used in the code are listed in package.json';
      corrector = 'npm install --save ' + results.join(' ') + ';';
    }

    if (results.length === 0) {
      gutil.log(gutil.colors.green('Success') + ' ' + successMsg);
      return done();
    }
    gutil.log(gutil.colors.red('Error') + ' ' + errMsg + '. To fix this, run:\n\n    ' + corrector + '\n');
    return done(new Error(errMsg));
  });
}

gulp.task('serve', function() {
  return gulp.src('dist')
    .pipe(webserver({
      host: 'localhost',
      port: 3000,
      open: true,
      directoryListing: false,
      livereload: true
    }));
});

gulp.task('testserver', function() {
  return gulp.src('dist')
    .pipe(webserver({
      host: 'localhost',
      port: 3001
    }));
});

gulp.task('develop', ['pages', 'assets', 'less', 'serve'], function() {
  gulp.watch(['src/{*,**/*}.less'], ['less']);
  gulp.watch(['src/*.jade'], ['pages']);
  gulp.watch(['src/img/*'], ['assets']);

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
      .pipe(gulp.dest('dist/'))
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
    .pipe(gulp.dest('dist'));
});

// Compile jade templates to HTML files.
gulp.task('pages', function() {
  return gulp.src('src/index.jade')
    .pipe(jade())
    .on('error', notify('jade'))
    .pipe(gulp.dest('dist/'));
});

// Copies all static asset files into dist
gulp.task('assets', function() {
  var subtasks = [];
  subtasks.push(gulp.src('src/img/{*,**/*}').pipe(gulp.dest('dist/img')));

  subtasks.push.apply(subtasks, pkg.fonts.map(function(p) {
    return gulp.src(p).pipe(gulp.dest('dist/fonts'));
  }));

  return merge.apply(null, subtasks);
});

gulp.task('format', function() {
  return gulp.src('src/{*,**/*}.js')
    .pipe(jsfmt.format({}));
});

gulp.task('lint', function() {
  return gulp.src('src/{*,**/*}.js')
    .pipe(jshint({}));
});

gulp.task('check dependencies', function(done) {
  check('missing', function(err) {
    if (err) return done(err);
    check('extra', done);
  });
});


// @todo: npm-check-updates
gulp.task('check', ['format', 'lint', 'check dependencies']);

// Build in production mode.
gulp.task('build', ['assets', 'pages'], function() {
  var js = browserify('./src/index.js')
    .transform(jadeify)
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('dist/'));

  // Setup less plugin that will clean and compress.
  var cleaner = new CleanCSS({
    root: __dirname + '/src',
    keepSpecialComments: 0,
    advanced: true
  });

  var css = gulp.src('src/*.less')
    .pipe(less({
      plugins: [cleaner],
      paths: pkg.less.paths
    }))
    .pipe(gulp.dest('dist'));

  return merge(js, css);
});

// Deploy to gh pages if we're on master.
// Automatically triggered by wercker when a build in master passes tests.
gulp.task('deploy', ['check', 'build'], function() {
  var opts = {
    branch: 'gh-pages', // org/username uses master, else gh-pages
    message: '[ci skip] gh-pages deploy ' + (process.env.GIT_COMMIT_MESSAGE || '')
  };

  // if (process.env.GITHUB_TOKEN) {
  //   opts.remoteUrl = util.format('https://%s@github.com/mongodb-js/mongodb-js.github.io.git',
  //     process.env.GITHUB_TOKEN);
  // }

  return gulp.src('dist/{*,**/*}')
    .pipe(deploy(opts));
});
