var gulp = require('gulp'),
  exec = require('child_process').exec,
  async = require('async'),
  keepup = require('keepup'),
  path = require('path'),
  fs = require('fs');

var merge = require('merge-stream');

var DMG = path.resolve('../electron/out/R/Scout.app');
var DEST = path.resolve(DMG + '/Contents/Resources/app');
var SERVER = path.resolve('../scout-server');


gulp.task('default', ['build', 'start']);

gulp.task('build', ['copy', 'cleanup']);

// @todo: add back all the proper copies.
gulp.task('copy', function() {
  var brain = gulp.src('../scout-brain/{*,**/*}')
    .pipe(gulp.dest(DEST));

  var index = gulp.src('../{index.js,package.json}')
    .pipe(gulp.dest(DEST + '/'));
  return merge(brain, index);
});

gulp.task('release', ['copy', 'cleanup'], function() {
  // @todo:
  // zip -r mongodb-scout_osx_64.zip MongoDB\ Scout.app/;
  // pipe(github-release);
});

// @todo: add back install task for each scout-*, run
//   npm install --production --target="<electron version [0.25.2]>" --arch="x64" --dist-url="https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist"

// @todo: do not copy any node_modules into dest dir!  they should be handled by the install task.

gulp.task('cleanup', ['copy'], function(cb) {
  var tasks = [],
    blobs = '{test*,doc*,example*,bench*,image*,tool*,lcov-report*,fixture*}',
    paths = [
      '/Frameworks/Scout Helper *.app',
      '/Resources/**/node_modules/**/' + blobs,
      '/Resources/**/node_modules/**/node_modules/**/' + blobs,
      '/Resources/**/node_modules/**/node_modules/**/node_modules/**/' + blobs,
      '/Resources/**/node_modules/**/node_modules/**/node_modules/**/node_modules/**/' + blobs,
      '/Resources/**/node_modules/.bin',
      '/Resources/**/node_modules/**/node_modules/.bin',
      '/Resources/**/node_modules/**/node_modules/**/node_modules/.bin',
      '/Resources/app/static/less',
      '/Resources/app/*.lproj'
    ];

  tasks = paths.map(function(p) {
    return function(done) {
      exec('rm -rf ../electron/out/R/Scout.app/Contents' + p, done);
    };
  });
  async.parallel(tasks, cb);
});

gulp.task('start', function(cb) {
  var bin = DMG + '/Contents/MacOS/Scout';
  var app = keepup(bin)
    .on('crash', function() {
      console.log('app crashed');
      app.reload();
    })
    .on('stderr', function(buf) {
      process.stderr.write(buf);
    })
    .on('data', function(buf) {
      process.stdout.write(buf);
    })
    .on('start', function() {
      cb();
    })
    .on('reload', function() {
      console.log('reloading app');
    });
});
