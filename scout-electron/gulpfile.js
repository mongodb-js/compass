var gulp = require('gulp');
var keepup = require('keepup');
var fs = require('fs');
var path = require('path');
var which = require('which');
var util = require('util');
var proc = require('child_process');
var async = require('async');
var plist = require('plist');
var merge = require('merge-stream');

var PYTHON = which.sync('python');
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

gulp.task('start', function() {
  setTimeout(function() {
    var child = proc.spawn(path.resolve('../electron/out/R/Scout.app/Contents/MacOS/Scout'), [path.resolve(__dirname + '/../')]);
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
  }, 1000);
});

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
    exec(process.cwd(), 'git clone ' + repo + ' ' + opts.ELECTRON, function(err) {
      if (err) return done(err);
      bootstrap(opts, done);
    });
  });
};

function bootstrap(opts, done) {
  exec(opts.ELECTRON, PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/bootstrap.py') + ' -v', done);
}

function build(opts, done) {
  var BUILD_CMD = PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/build.py') + ' -c ' + opts.buildConfig + ' -t ' + opts.projectName;
  exec(opts.ELECTRON, BUILD_CMD, done);
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
  fs.createReadStream('./res/scout.icns')
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
  opts.projectHome = path.resolve(__dirname + '/../');

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
    source: source.bind(null, opts),
    build: build.bind(null, opts),
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
