var gulp = require('gulp');
var webserver = require('gulp-webserver');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var pkg = require('./package.json');
var merge = require('merge-stream');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var CleanCSS = require('less-plugin-clean-css');

gulp.task('as-production', function(done) {
  process.env.NODE_ENV = 'production';
  done();
});

gulp.task('as-dev', function(done) {
  process.env.NODE_ENV = 'development';
  done();
});

gulp.task('metalsmith', function(cb) {
  exec('./node_modules/.bin/metalsmith', cb);
});

gulp.task('watch', function() {
  if (process.env.NODE_ENV === 'production') return;

  gulp.watch(['src/{**/*,*}', 'templates/{*,**/*}'], ['build']);
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
  if (process.env.NODE_ENV === 'production') {
    var cleaner = new CleanCSS({
      root: __dirname + '/src/less',
      keepSpecialComments: 0,
      advanced: true
    });

    return gulp.src('less/index.less')
    .pipe(less({
      plugins: [cleaner],
      paths: pkg.less.paths
    }))
    .pipe(gulp.dest('./build'));
  }
  return gulp.src('less/index.less')
  .pipe(sourcemaps.init())
  .pipe(less(pkg.less))
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./build'));
});

gulp.task('surge', ['build', 'less'], function(cb) {
  var args = ['build', 'scout.surge.sh'];
  var surge = spawn('./node_modules/.bin/surge', args);
  surge.stdout.pipe(process.stdout);
  surge.stderr.pipe(process.stderr);
  surge.on('error', cb);
  surge.on('exit', cb.bind(null, null, null));
});

gulp.task('build', ['metalsmith', 'assets', 'less']);

gulp.task('deploy', ['as-production', 'build', 'surge']);

gulp.task('default', ['as-dev', 'build', 'serve', 'watch']);
