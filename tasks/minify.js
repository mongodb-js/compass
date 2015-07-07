var jadeify = require('jadeify');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var CleanCSS = require('less-plugin-clean-css');
var less = require('gulp-less');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));

module.exports.tasks = function(gulp) {
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
};
