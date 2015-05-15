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
var mvm = require('mongodb-version-manager');

var PYTHON = which.sync('python');

var BUILD_CONFIG = 'Release';
var PROJECT_NAME = 'scout';
var PRODUCT_NAME = 'Scout';
var PRODUCT_VERSION = require('../package.json').version;

var HOME = path.resolve(__dirname + '/../');
var PLATFORM = process.platform;
var ELECTRON = HOME + '/electron';
var NODE_URL = 'https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist';
var EXECUTABLE = PRODUCT_NAME;
if (PLATFORM === 'linux') {
  EXECUTABLE = EXECUTABLE.toLowerCase();
} else if (PLATFORM === 'win32') {
  EXECUTABLE += '.exe';
}

var APP = ELECTRON + '/out/R/' + PRODUCT_NAME;
if (PLATFORM === 'darwin') {
  APP += '.app';
}

var BREAKPAD_SYMBOLS = ELECTRON + '/out/R/' + PRODUCT_NAME + '.breakpad.syms';

// @todo: lookup dynamically from ../electron/atom.gyp
var NODE_VERSION = '0.26.0';
var ARCH = (PLATFORM === 'darwin') ? 'x64' : (PLATFORM === 'win32') ? 'ia32' : process.arch;

var GYP_DEFINES = 'project_name=' + PROJECT_NAME + ' product_name=' + PRODUCT_NAME.replace(' ', '\\ ');
if (process.env.GYP_DEFINES) {
  process.env.GYP_DEFINES += GYP_DEFINES;
} else {
  process.env.GYP_DEFINES = GYP_DEFINES;
}

var DEST = path.resolve(APP + '/Contents/Resources/app');
var BIN = path.resolve(APP + '/Contents/MacOS/' + PRODUCT_NAME);

function exec(cwd, cmd, cb) {
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

gulp.task('default', ['build', 'start']);

gulp.task('copy', ['install source'], function() {
  var electron = gulp.src(['./{index.js,package.json,lib/*.js}'])
    .pipe(gulp.dest(DEST + '/scout-electron'));

  var brain = gulp.src(['../scout-brain/{index.js,package.json,lib/*.js,lib/**/*}',])
    .pipe(gulp.dest(DEST + '/scout-brain'));

  var client = gulp.src(['../scout-client/{index.js,package.json,lib/*.js,lib/**/*}'])
    .pipe(gulp.dest(DEST + '/scout-client'));

  var data = gulp.src(['../scout-data/{index.js,*.json,lib/*.js,bin/*}'])
    .pipe(gulp.dest(DEST + '/scout-data'));

  var metrics = gulp.src(['../scout-metrics/{index.js,*.json,lib/*.js}'])
    .pipe(gulp.dest(DEST + '/scout-metrics'));

  var server = gulp.src([
    '../scout-server/{index.js,package.json,bin/*,lib/*,lib/**/*,res/*,res/**/*}',
  ])
    .pipe(gulp.dest(DEST + '/scout-server'));

  var index = gulp.src('../{index.js,package.json}')
    .pipe(gulp.dest(DEST + '/'));
  return merge(index, electron, brain, client, data, metrics, server);
});

gulp.task('start', ['build'], function(cb) {
  if (!fs.existsSync(BIN)) {
    return cb(new Error('Electron binary does not exist.  Check your log above for errors.'));
  }
  var child = proc.spawn(BIN, [path.resolve(__dirname + '/../')]);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
  cb();
});

gulp.task('get source', function(done) {
  var repo = 'git://github.com/atom/electron.git';
  fs.exists(ELECTRON, function(exists) {
    if (exists) {
      return exec(ELECTRON, 'git pull --rebase', done);
    }
    exec(process.cwd(), 'git clone ' + repo + ' ' + ELECTRON, function(err) {
      if (err) return done(err);

      exec(ELECTRON, PYTHON + ' ' + path.resolve(ELECTRON + '/script/bootstrap.py') + ' -v', done);
    });
  });
});

gulp.task('build source', ['get source'], function(done) {
  var BUILD_CMD = PYTHON + ' ' + path.resolve(ELECTRON + '/script/build.py') + ' -c ' + BUILD_CONFIG + ' -t ' + PROJECT_NAME;
  exec(ELECTRON, BUILD_CMD, done);
});

function _source_npm(cmd, done) {
  var CMD = util.format('%s %s --target=%s --arch=%s --dist-url=%s',
    which.sync('node-gyp'),
    cmd, NODE_VERSION, ARCH, NODE_URL);

  exec(ELECTRON, CMD, done);
}

gulp.task('install source npm deps', ['build source'], function(done) {
  _source_npm('install', done);
});

gulp.task('rebuild soruce npm deps', ['build source'], function(done) {
  // https://github.com/atom/electron/blob/master/docs/tutorial/using-native-node-modules.md#how-to-install-native-modules
  // process.env.HOME = '~/.electron-gyp';
  _source_npm('rebuild', done);
});

gulp.task('generate node lib', ['build source'], function(done) {
  if (process.platform !== 'win32') return done();

  var CMD = PYTHON + ' ' + path.resolve(ELECTRON + '/script/build.py') + ' -c ' + BUILD_CONFIG + '-t generate_node_lib';
  exec(ELECTRON, CMD, done);
});

gulp.task('patch icon', ['build source'], function() {
  var dest = APP + '/Contents/Resources/atom.icns';
  return fs.createReadStream('./res/scout.icns')
    .pipe(fs.createWriteStream(dest));
});

gulp.task('patch plist', ['build source'], function(done) {
  if (process.platform !== 'darwin') return done();

  var infoPlistPath = APP + '/Contents/Info.plist';
  fs.readFile(infoPlistPath, 'utf-8', function(err, buf) {
    if (err) return done(err);

    var infoPlist = plist.parse(buf);
    infoPlist.CFBundleName = PRODUCT_NAME;
    infoPlist.CFBundleVersion = PRODUCT_VERSION;
    infoPlist.CFBundleIdentifier = 'com.mongodb.' + PROJECT_NAME,

    fs.writeFile(infoPlistPath, plist.build(infoPlist), done);
  });
});

gulp.task('install source', [
  'install source npm deps',
  // 'rebuild soruce npm deps',
  'generate node lib',
  'patch icon',
  'patch plist'
]);

gulp.task('install app', ['install source', 'copy'], function(done) {
  function npm_install(dir, cb) {
    var CMD = util.format('npm install ---production --target=%s --arch=%s --dist-url=%s',
      NODE_VERSION, ARCH, NODE_URL);

    exec(DEST + '/' + dir, CMD, cb);
  }

  async.parallel([
    'scout-brain',
    'scout-client',
    'scout-data',
    'scout-electron',
    'scout-metrics',
    'scout-server',
  ].map(function(d) {
    return function(cb) {
      npm_install(d, cb);
    };
  }), done);
});

gulp.task('build', [
  'get source',
  'build source',
  'install source',
  'install mongo',
  'install app'
]);

// https://github.com/atom/electron-starter/blob/master/build/tasks/codesign-task.coffee
function unlockKeychain(done) {
  var cmd = util.format('security unlock-keychain -p %s',
    process.env.XCODE_KEYCHAIN_PASSWORD, process.env.XCODE_KEYCHAIN);
  proc.exec(cmd, done);
}
function signApp(done) {
  if (PLATFORM === 'darwin') {
    var cmd = util.format('codesign --deep --force --verbose --sign %s %s',
      process.env.XCODE_SIGNING_IDENTITY, APP);
    proc.exec(cmd, done);
  } else {
    done();
  }
}
gulp.task('sign', function(done) {
  if (process.platform() === 'darwin' && process.env.XCODE_KEYCHAIN) {
    unlockKeychain(function(err) {
      if (err) return done(err);
      signApp(done);
    });
  } else {
    return done();
  }
});

gulp.task('get mongo', function(cb) {
  mvm(cb);
});

gulp.task('embed mongo', ['get mongo'], function() {
  return gulp.src(mvm.config.cache + '/mongodb/current/bin/{mongod,mongos}')
    .pipe(gulp.dest(DEST + '/bin'));
});

gulp.task('install mongo', ['get mongo', 'embed mongo']);

// @todo: dump debug symbols to BREAKPAD_SYMBOLS
// https://github.com/atom/electron-starter/blob/master/build/tasks/dump-symbols-task.coffee

// @todo: set version
// https://github.com/atom/electron-starter/blob/master/build/tasks/set-version-task.coffee

// @todo: https://github.com/atom/electron-starter/blob/master/build/tasks/set-exe-icon-task.coffee

// @todo: create windows installer
//    https://github.com/domderen/electron-installer/blob/master/src/InstallerFactory.js

// @todo: make the rest of these tasks not asinine:
// https://github.com/atom/electron-starter/tree/master/build/tasks
