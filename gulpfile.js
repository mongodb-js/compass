var gulp = require('gulp');
var path = require('path');
var pkg = require('./package.json');
var child_process = require('child_process');
var async = require('async');
var npm = require('which').sync('npm');
var proc = require('child_process');
var os = require('os');
var path = require('path');

// var createInstaller = require('electron-installer');

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
  process.env.DEBUG = 'mon*,sco*';
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
    pkgs = ['ui', 'server', 'brain', 'electron', 'metrics', 'style'];
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

// @todo: make this non-shitty
gulp.task('start', function() {
  dev();
  script('start', ['server']);
  script('start', ['ui']);
  setTimeout(function() {
    var child = proc.spawn('./electron/out/R/Scout.app/Contents/MacOS/Scout', [__dirname]);
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
  }, 1000);
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
  var repo = 'git://github.com/atom/electron.git';

  // clone or fetch
  fs.exists(opts.ELECTRON, function(exists) {
    if (exists) {
      // return done();
      return exec(opts.ELECTRON, 'git pull --rebase', done);
    }
    return exec(process.cwd(), 'git clone ' + repo + ' ' + opts.ELECTRON, done);

  });
};

function build(opts, done) {
  var BUILD_CMD = PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/build.py') + ' -c ' + opts.buildConfig + ' -t ' + opts.projectName;
  async.series({
    bootstrap: exec.bind(null, opts.ELECTRON, PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/bootstrap.py') + ' -v'),
    build: exec.bind(null, opts.ELECTRON, BUILD_CMD),
  }, done);
}

function _npm(opts, cmd, done) {
  var CMD = util.format('%s %s --target=%s --arch=%s --dist-url=%s',
    which.sync('node-gyp'),
    cmd, opts.NODE_VERSION, opts.ARCH, opts.NODE_URL);

  exec(opts.ELECTRON, CMD, done);
}

function node_install(opts, done) {
  _npm(opts, 'install', done);
}

function npm_rebuild(opts, done) {
  // https://github.com/atom/electron/blob/master/docs/tutorial/using-native-node-modules.md#how-to-install-native-modules
  // process.env.HOME = '~/.electron-gyp';
  _npm(opts, 'rebuild', done);
}

function node_build_lib(opts, done) {
  if (process.platform !== 'win32') return done();

  var CMD = PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/build.py') + ' -c ' + opts.buildConfig + '-t generate_node_lib';
  exec(opts.ELECTRON, CMD, done);
}

function configure(opts, done) {
  var rebrandConfig = 'project_name=' + opts.projectName + ' product_name=' + (opts.productName.replace(' ', '\\ '));
  if (process.env.GYP_DEFINES) {
    process.env.GYP_DEFINES += rebrandConfig;
  } else {
    process.env.GYP_DEFINES = rebrandConfig;
  }
  done();
}

function patchIcon(opts, done) {
  var dest = opts.APP + '/Contents/Resources/atom.icns';
  fs.createReadStream('./scout-electron/res/scout.icns')
    .pipe(fs.createWriteStream(dest))
    .on('end', done);
}

function patchInfoPlist(opts, done) {
  var infoPlistPath = opts.APP + '/Contents/Info.plist';
  fs.readFile(infoPlistPath, 'utf-8', function(err, buf) {
    if (err) return done(err);

    var infoPlist = plist.parse(buf);
    infoPlist.CFBundleName = opts.productName;
    infoPlist.CFBundleVersion = opts.productVersion;

    fs.writeFile(infoPlistPath, plist.build(infoPlist), done);
  });
}

function _opts() {
  var opts = {};
  opts.buildConfig = 'Release';
  opts.name = opts.projectName = 'scout';
  opts.productName = 'Scout';
  opts.projectHome = process.cwd();

  opts.PLATFORM = process.platform;
  opts.ELECTRON = opts.projectHome + '/electron';
  opts.NODE_URL = 'https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist';
  opts.EXECUTABLE = opts.productName;
  if (opts.PLATFORM === 'linux') {
    opts.EXECUTABLE = opts.EXECUTABLE.toLowerCase();
  } else if (opts.PLATFORM === 'win32') {
    opts.EXECUTABLE += '.exe';
  }

  opts.APP = opts.ELECTRON + '/out/R/' + opts.productName;
  if (opts.PLATFORM === 'darwin') {
    opts.APP += '.app';
  }
  opts.BREAKPAD_SYMBOLS = opts.ELECTRON + '/out/R/' + opts.productName + '.breakpad.syms';
  opts.NODE_VERSION = '0.25.2';


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
  return opts;
}

gulp.task('build', function(done) {
  var opts = _opts();
  async.series({
    configure: configure.bind(null, opts),
    //    source: source.bind(null, opts),
    //  build: build.bind(null, opts),
    node_install: node_install.bind(null, opts),
    node_build_lib: node_build_lib.bind(null, opts),
    // npm_rebuild: npm_rebuild.bind(null, opts),
    patchIcon: patchIcon.bind(null, opts),
    patchInfoPlist: patchInfoPlist.bind(null, opts)
  }, done);
});

// https://github.com/atom/electron-starter/blob/master/build/tasks/codesign-task.coffee
function unlockKeychain(opts, done) {
  var cmd = util.format('security unlock-keychain -p %s',
    process.env.XCODE_KEYCHAIN_PASSWORD, process.env.XCODE_KEYCHAIN);
  proc.exec(cmd, done);
}
function signApp(opts, done) {
  if (opts.PLATFORM === 'darwin') {
    var cmd = util.format('codesign --deep --force --verbose --sign %s %s',
      process.env.XCODE_SIGNING_IDENTITY, opts.APP);
    proc.exec(cmd, done);
  } else {
    done();
  }
}
gulp.task('sign', function(done) {
  var opts = _opts();
  if (process.platform() === 'darwin' && process.env.XCODE_KEYCHAIN) {
    unlockKeychain(function(err) {
      if (err) return done(err);
      signApp(opts, done);
    });
  } else {
    return done();
  }
});

// @todo: dump debug symbols to opts.BREAKPAD_SYMBOLS
// https://github.com/atom/electron-starter/blob/master/build/tasks/dump-symbols-task.coffee

// @todo: set version
// https://github.com/atom/electron-starter/blob/master/build/tasks/set-version-task.coffee

// @todo: https://github.com/atom/electron-starter/blob/master/build/tasks/set-exe-icon-task.coffee


// @todo: create windows installer
//    https://github.com/domderen/electron-installer/blob/master/src/InstallerFactory.js

// @todo: make the rest of these tasks not asinine:
// https://github.com/atom/electron-starter/tree/master/build/tasks
