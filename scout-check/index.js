var dc = require('dependency-check');

function check(mode, done) {
  var pkg = require(process.cwd() + '/package.json');
  pkg['dependency-check'] = pkg['dependency-check'] || {
    entries: [],
    ignore: []
  };

  var opts = {
    path: process.cwd() + '/package.json',
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
      console.log('Success: ' + successMsg);
      return done();
    }
    console.error('Error: ' + errMsg + '. To fix this, run:\n\n    ' + corrector + '\n');
    return done(new Error(errMsg));
  });
}

var jshint = require('gulp-jshint');
var jsfmt = require('gulp-jsfmt');

module.exports = function(gulp, src) {
  src = src || './*.js';

  gulp.task('format', function() {
    return gulp.src(src)
      .pipe(jsfmt.format({}));
  });

  gulp.task('lint', function() {
    return gulp.src(src)
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
};

