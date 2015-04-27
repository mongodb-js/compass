var gulp = require('gulp');
var webserver = require('gulp-webserver');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var pkg = require('./package.json');
var merge = require('merge-stream');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var CleanCSS = require('less-plugin-clean-css');

gulp.task('default', ['build', 'serve', 'watch']);

gulp.task('build', ['metalsmith', 'assets', 'less']);

gulp.task('metalsmith', function(cb) {
  exec('./node_modules/.bin/metalsmith', cb);
});

gulp.task('watch', function() {
  gulp.watch(['src/{**/*,*}', 'templates/*'], ['build']);
  gulp.watch(['less/*.less'], ['less']);
});

gulp.task('serve', function() {
  return gulp.src('./build')
  .pipe(webserver({
    host: 'localhost',
    port: 8000,
    open: true,
    directoryListing: false,
    livereload: true
  }));
});

gulp.task('assets', ['metalsmith'], function() {
  var subtasks = [];
  subtasks.push.apply(subtasks, pkg.fonts.map(function(p) {
    return gulp.src(p).pipe(gulp.dest('./build/fonts'));
  }));

  return merge.apply(null, subtasks);
});

gulp.task('less', function() {
  return gulp.src('less/index.less')
  .pipe(sourcemaps.init())
  .pipe(less(pkg.less))
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./build'));
});

gulp.task('less-production', function() {
  var cleaner = new CleanCSS({
    root: __dirname + '/src/less',
    keepSpecialComments: 0,
    advanced: true
  });

  var css = gulp.src('less/index.less')
  .pipe(less({
    plugins: [cleaner],
    paths: pkg.less.paths
  }))
  .pipe(gulp.dest('./build'));

  return css;
});

gulp.task('build-production', ['metalsmith', 'assets', 'less-production']);

gulp.task('surge', ['build-production', 'less-production'], function(cb) {
  var args = ['build', 'scout.surge.sh'];
  var surge = spawn('./node_modules/.bin/surge', args);
  surge.stdout.pipe(process.stdout);
  surge.stderr.pipe(process.stderr);
  surge.on('error', cb);
  surge.on('exit', cb.bind(null, null, null));
});

gulp.task('deploy', ['build-production', 'surge']);
