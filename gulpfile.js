var gulp = require('gulp'),
  path = require('path'),
  pkg = require('./package.json'),
  child_process = require('child_process'),
  async = require('async'),
  npm = require('which').sync('npm');

var run = function(child, task) {
  var args = task.split(' '),
    cmd = args.shift();

  return function(cb) {
    var opts = {
        cwd: path.resolve(__dirname + '/' + pkg.name + '-' + child),
        stdio: 'inherit'
      },
      p = child_process.spawn(cmd, args, opts);

    console.log('> ' + pkg.name + '@' + pkg.version, task, opts.cwd);
    p.on('exit', function(code) {
      console.log('< ' + pkg.name + '@' + pkg.version, task, 'exit ' + code);
      if (code !== 0) return cb(new Error(child + ': ' + task + ' exited with code ' + code));
      cb();
    });
  };
};

function test() {
  process.env.NODE_ENV = 'testing';
}

function dev() {
  process.env.NODE_ENV = 'development';
  process.env.DEBUG = 'mon*';
}

function prod() {
  process.env.NODE_ENV = 'production';
}

function script(name, pkgs, done) {
  if (Array.isArray(name)) {
    return name.map(function(n) {
      return script(n, pkgs, done);
    });
  }

  if (typeof pkgs === 'function') {
    done = pkgs;
    pkgs = ['ui', 'server', 'brain'];
  }

  var args = 'run-script ' + name;
  if (name === 'install') {
    args = 'install';
  }
  async.series(pkgs.map(function(c) {
    return run(c, npm + ' ' + args);
  }), done);
}



gulp.task('install', function(done) {
  dev();
  script('install', done);
});

gulp.task('start', function(done) {
  dev();
  function errorStarting(err) {
    if (err) return done(err);
    process.exit(1);
  }
  script('start', ['ui'], errorStarting);
  script('start', ['server'], errorStarting);
});

gulp.task('test', function(done) {
  test();
  script('test', ['server'], done);
});

gulp.task('default', ['install', 'test']);
