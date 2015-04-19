var gulp = require('gulp');
var path = require('path');
var pkg = require('./package.json');
var child_process = require('child_process');
var async = require('async');
var npm = require('which').sync('npm');
var proc = require('child_process');
var os = require('os');
var path = require('path');

// var createInstaller = require('atom-shell-installer');

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
    pkgs = ['ui', 'server', 'brain', 'atom', 'metrics'];
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

gulp.task('test', function(done) {
  test();
  script('test', ['server'], done);
});

gulp.task('default', ['install', 'test']);

gulp.task('start', function() {
  var child = proc.spawn('./atom-shell/out/R/Scout.app/Contents/MacOS/Scout', [__dirname]);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
});

// @todo: remove default_app in Resources

var fs = require('fs');
var path = require('path');
var which = require('which');
var util = require('util');
var proc = require('child_process');
var async = require('async');
var plist = require('plist');


var PYTHON = which.sync('python');

function exec(cwd, cmd, cb) {
  console.log('exec: cd ' + cwd + ' && ' + cmd);

  var args = cmd.split(' ');
  var bin = args.shift();
  var child = proc.spawn(bin, args, {
    cwd: cwd
  });
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
  child.on('exit', function() {
    cb();
  });
}

var source = function(opts, done) {
  var repo = 'git://github.com/atom/atom-shell.git';

  // clone or fetch
  fs.exists(opts.ATOM_SHELL_HOME, function(exists) {
    if (exists) {
      // return done();
      return exec(opts.ATOM_SHELL_HOME, 'git pull --rebase', done);
    }
    return exec(process.cwd(), 'git clone ' + repo + ' ' + opts.ATOM_SHELL_HOME, done);

  });
};

function build(opts, done) {
  var BUILD_CMD = PYTHON + ' ' + path.resolve(opts.ATOM_SHELL_HOME + '/script/build.py') + ' -t' + opts.projectName;
  async.series({
    bootstrap: exec.bind(null, opts.ATOM_SHELL_HOME, PYTHON + ' ' + path.resolve(opts.ATOM_SHELL_HOME + '/script/bootstrap.py') + ' -v'),
    build: exec.bind(null, opts.ATOM_SHELL_HOME, BUILD_CMD),
  }, done);
}

function _npm(opts, cmd, done) {
  var CMD = util.format('node %s %s --target=%s --arch=%s --dist-url=%s',
  which.sync('node-gyp'),
  cmd, opts.NODE_VERSION, opts.ARCH, opts.ATOM_NODE_URL);

  exec(opts.ATOM_SHELL_HOME, CMD, done);
}

function node_install(opts, done) {
  _npm(opts, 'install', done);
}

// @todo: need to set HOME=~/.atom-shell-gyp
// https://github.com/atom/atom-shell/blob/master/docs/tutorial/using-native-node-modules.md#how-to-install-native-modules
function npm_rebuild(opts, done) {
  _npm(opts, 'rebuild', done);
}

function node_build_lib(opts, done) {
  if (process.platform !== 'win32') return done();

  var CMD = PYTHON + ' ' + path.resolve(opts.ATOM_SHELL_HOME + '/script/build.py') + ' -c' + opts.buildConfig + '-t generate_node_lib';
  exec(opts.ATOM_SHELL_HOME, CMD, done);
}

function configure(opts, done) {
  var rebrandConfig = "project_name=" + opts.projectName + " product_name=" + (opts.productName.replace(' ', '\\ '));
  if (process.env.GYP_DEFINES) {
    process.env.GYP_DEFINES += rebrandConfig;
  } else {
    process.env.GYP_DEFINES = rebrandConfig;
  }
  done();
}

function patchIcon(opts, done) {
  var dest = opts.ATOM_SHELL_OUT + '/R/' + opts.productName + '.app/Contents/Resources/atom.icns';
  fs.createReadStream('./scout-atom/res/scout.icns')
  .pipe(fs.createWriteStream(dest))
  .on('end', done);
}

function patchInfoPlist(opts, done) {
  var infoPlistPath = opts.ATOM_SHELL_OUT + '/R/' + opts.productName + '.app/Contents/Info.plist';
  fs.readFile(infoPlistPath, 'utf-8', function(err, buf) {
    if (err) return done(err);

    var infoPlist = plist.parse(buf);
    infoPlist.CFBundleName = opts.productName;
    infoPlist.CFBundleVersion = opts.productVersion;

    fs.writeFile(infoPlistPath, plist.build(infoPlist), done);
  });
}

gulp.task('build', function(done) {
  var opts = {};
  opts.buildConfig = 'Release';
  opts.projectName = 'scout';
  opts.productName = 'Scout';
  opts.ATOM_SHELL_HOME = process.cwd() + '/atom-shell';
  opts.ATOM_SHELL_OUT = opts.ATOM_SHELL_HOME + '/out';
  opts.ATOM_NODE_URL = 'https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist';

  opts.NODE_VERSION = process.env.ATOM_NODE_VERSION || '0.23.0';

  opts.projectHome = process.cwd();

  opts.ARCH = (function() {
    switch (process.platform) {
      case 'darwin':
        return 'x64';
      case 'win32':
        return 'ia32';
      default:
        return process.arch;
    }
  })();

  async.series({
    configure: configure.bind(null, opts),
    source: source.bind(null, opts),
    build: build.bind(null, opts),
    node_install: node_install.bind(null, opts),
    node_build_lib: node_build_lib.bind(null, opts),
    npm_rebuild: npm_rebuild.bind(null, opts),
    patchIcon: patchIcon.bind(null, opts),
    patchInfoPlist: patchInfoPlist.bind(null, opts)
  }, done);
});

// @todo: codesign --verbose --deep --force --sign "Company, LLC." Atom.app
//    https://github.com/atom/atom-shell/issues/171

// @todo: create windows installer
//    https://github.com/domderen/atom-shell-installer/blob/master/src/InstallerFactory.js
