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
var BIN = path.resolve(DMG + '/Contents/MacOS/Scout');

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
opts.NODE_VERSION = '0.26.0';


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

var rebrandConfig = 'project_name=' + opts.projectName + ' product_name=' + (opts.productName.replace(' ', '\\ '));
if (process.env.GYP_DEFINES) {
  process.env.GYP_DEFINES += rebrandConfig;
} else {
  process.env.GYP_DEFINES = rebrandConfig;
}

gulp.task('default', ['build', 'start']);

gulp.task('build', ['compile']);

// @todo: add back all the proper copies.
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


// @todo: add back install task for each scout-*, run
//   npm install --production --target="<electron version [0.26.0]>" --arch="x64" --dist-url="https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist"

// @todo: do not copy any node_modules into dest dir!  they should be handled by the install task.

gulp.task('cleanup', function(cb) {
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
      proc.exec('rm -rf ../electron/out/R/Scout.app/Contents' + p, done);
    };
  });
  async.parallel(tasks, cb);
});

gulp.task('start', ['build'], function(cb) {
  if (!fs.existsSync(BIN)) {
    return cb(new Error('Electron binary does not exist.  Check your log above for errors.'));
  }

  setTimeout(function() {
    var child = proc.spawn(BIN, [path.resolve(__dirname + '/../')]);
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    cb();
  }, 2000);
});

function exec(cwd, cmd, cb) {
  console.log('cd %s && %s', cwd, cmd);
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

gulp.task('get source', function(done) {
  var repo = 'git://github.com/atom/electron.git';

  fs.exists(opts.ELECTRON, function(exists) {
    if (exists) {
      return exec(opts.ELECTRON, 'git pull --rebase', done);
    }
    exec(process.cwd(), 'git clone ' + repo + ' ' + opts.ELECTRON, function(err) {
      if (err) return done(err);

      exec(opts.ELECTRON, PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/bootstrap.py') + ' -v', done);
    });
  });
});

gulp.task('build source', ['get source'], function(done) {
  var BUILD_CMD = PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/build.py') + ' -c ' + opts.buildConfig + ' -t ' + opts.projectName;
  exec(opts.ELECTRON, BUILD_CMD, done);
});

function _source_npm(cmd, done) {
  var CMD = util.format('%s %s --target=%s --arch=%s --dist-url=%s',
    which.sync('node-gyp'),
    cmd, opts.NODE_VERSION, opts.ARCH, opts.NODE_URL);

  exec(opts.ELECTRON, CMD, done);
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

  var CMD = PYTHON + ' ' + path.resolve(opts.ELECTRON + '/script/build.py') + ' -c ' + opts.buildConfig + '-t generate_node_lib';
  exec(opts.ELECTRON, CMD, done);
});

gulp.task('patch icon', ['build source'], function(done) {
  var dest = opts.APP + '/Contents/Resources/atom.icns';
  fs.createReadStream('./res/scout.icns')
    .pipe(fs.createWriteStream(dest))
    .on('end', done);
});

gulp.task('patch plist', ['build source'], function(done) {
  if (process.platform !== 'darwin') return done();

  var infoPlistPath = opts.APP + '/Contents/Info.plist';
  fs.readFile(infoPlistPath, 'utf-8', function(err, buf) {
    if (err) return done(err);

    var infoPlist = plist.parse(buf);
    console.log('info plist is', infoPlist);
    infoPlist.CFBundleName = opts.productName;
    infoPlist.CFBundleVersion = opts.productVersion;

    fs.writeFile(infoPlistPath, plist.build(infoPlist), done);
  });
});

gulp.task('patch', [
  'patch icon',
  //  'patch plist'
]);

gulp.task('install source', [
  'install source npm deps',
  // 'rebuild soruce npm deps',
  'generate node lib',
  //'patch'
]);

gulp.task('install app', ['install source', 'copy'], function(done) {
  function npm_install(dir, cb) {
    var CMD = util.format('npm install ---production --target=%s --arch=%s --dist-url=%s',
      opts.NODE_VERSION, opts.ARCH, opts.NODE_URL);

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

gulp.task('compile', [
  'get source',
  'build source',
  'install source',
  'install app'
]);

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

var mvm = require('mongodb-version-manager');
gulp.task('get mongo', function(cb) {
  mvm(cb);
});

gulp.task('bundle mongo', ['get mongo'], function() {
  console.log('Copying mongod and mongos to %s', DEST + '/bin');
  return gulp.src(mvm.config.cache + '/mongodb/current/bin/{mongod,mongos}')
    .pipe(gulp.dest(DEST + '/bin'));
});

gulp.task('mongo', ['get mongo', 'bundle mongo']);

// @todo: dump debug symbols to opts.BREAKPAD_SYMBOLS
// https://github.com/atom/electron-starter/blob/master/build/tasks/dump-symbols-task.coffee

// @todo: set version
// https://github.com/atom/electron-starter/blob/master/build/tasks/set-version-task.coffee

// @todo: https://github.com/atom/electron-starter/blob/master/build/tasks/set-exe-icon-task.coffee


// @todo: create windows installer
//    https://github.com/domderen/electron-installer/blob/master/src/InstallerFactory.js

// @todo: make the rest of these tasks not asinine:
// https://github.com/atom/electron-starter/tree/master/build/tasks
