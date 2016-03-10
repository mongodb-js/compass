#!/usr/bin/env node

/**
 * ## prepublish
 *
 * @see [How Atom does this](https://git.io/vaYu3)
 */
if (require('in-publish').inInstall()) {
  /* eslint no-console: 0 */
  console.log('noop.  @see http://bit.ly/npm-prepublish-flaws');
  process.exit(0);
}

var pkg = require('../package.json');
var format = require('util').format;
var path = require('path');

/**
 * TODO (imlucas) Document and use yargs environment variable support.
 * @see http://yargs.js.org/docs/#methods-envprefix
 */
/**
 * TODO (imlucas) Add examples
 * @see http://yargs.js.org/docs/#methods-examplecmd-desc
 */
var cli = require('mongodb-js-cli')('mongodb-compass:scripts:prepublish');
cli.yargs.usage('$0 [options]')
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .option('platform', {
    describe: 'What platform are we building for?',
    choices: ['win32', 'linux', 'darwin'],
    default: process.platform
  })
  .option('arch', {
    describe: 'What platform architecture are we building for?',
    choices: ['x64', 'x86'],
    default: process.arch
  })
  .option('electron_version', {
    describe: 'What version of electron are we using?',
    default: process.env.npm_package_electron_version || pkg.electron_version
  })
  .option('version', {
    describe: 'What version of the application are we building?',
    default: process.env.npm_package_version || pkg.version
  })
  .option('internal_name', {
    describe: 'What is the kebab cased name of the application?',
    default: process.env.npm_package_name || pkg.name
  })
  .option('product_name', {
    describe: 'What is the name of the application we should display to humans?',
    default: process.env.npm_package_product_name || pkg.product_name
  })
  .option('description', {
    describe: 'What is the description of the application we should display to humans?',
    default: process.env.npm_package_description || pkg.description
  })
  .option('channel', {
    describe: 'What release channel is this build for?',
    choices: ['testing', 'beta', 'stable'],
    default: 'testing'
  })
  .option('sign', {
    describe: 'Should this build be signed?',
    type: 'boolean',
    default: true
  })
  .option('signtool_params', {
    describe: 'What extra cli arguments should be passed to signtool.exe?',
    default: process.env.SIGNTOOL_PARAMS || null
  })
  .option('revision', {
    description: 'revision on evergreen',
    type: 'string',
    default: undefined
  })
  .option('build_variant', {
    description: 'build_variant on evergreen',
    type: 'string',
    default: undefined
  })
  .option('branch_name', {
    description: 'branch_name on evergreen',
    type: 'string',
    default: undefined
  })
  // .command('config', 'View configuration data', function(_yargs) {
  //   return _yargs.option('format', {
  //     choices: ['json', 'yaml', 'table'],
  //     default: 'json'
  //   })
  //   .help();
  // }, function() {
  //   console.log('config', arguments);
  // })
  .help('help')
  .epilogue('a.k.a `npm run release`');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

var ELECTRON_COMPILE_CACHE = path.join(__dirname, '..', '.cache');
var ELECTRON_COMPILE_BIN = path.join(__dirname, '..', 'node_modules',
  '.bin', 'electron-compile');

var del = require('del');
var fs = require('fs-extra');
var _ = require('lodash');
var async = require('async');
var series = require('async').series;
var packager = require('electron-packager');
var run = require('electron-installer-run');
var createDMG = require('electron-installer-dmg');
var codesign = require('electron-installer-codesign');
var license = require('electron-license');

/**
 * TODO (imlucas) Need to make all of these constants/config values
 * accessible via a module and/or command to generate the expansions.yml
 * for evergeen so it can do things like find artifacts that include
 * a version/some other non-constant.
 * @see https://jira.mongodb.org/browse/INT-880
 */
var DIR = path.join(__dirname, '..');
var OUT = path.join(__dirname, '..', 'dist');

var CANONICAL_INSTALLER_FILENAME_PARTS = [
  cli.argv.version,
  cli.argv.platform,
  cli.argv.arch
];

if (cli.argv.channel !== 'stable') {
  CANONICAL_INSTALLER_FILENAME_PARTS.push(cli.argv.channel);
}

/**
 * e.g. 'MongoDB Compass'
 */
var BASENAME = cli.argv.product_name;

var OSX_APPNAME = BASENAME;
var OSX_OUT_X64 = path.join(OUT, format('%s-darwin-x64', OSX_APPNAME));
var OSX_DOT_APP = path.join(OSX_OUT_X64, format('%s.app', OSX_APPNAME));

var OSX_IDENTITY = 'Developer ID Application: Matt Kangas (ZD3CL9MT3L)';
var OSX_IDENTITY_SHA1 = '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A';
var OSX_RESOURCES = path.join(OSX_DOT_APP, 'Contents', 'Resources');
var OSX_EXECUTABLE = path.join(OSX_DOT_APP, 'Contents', 'MacOS', 'Electron');
var OSX_ICON = path.resolve(__dirname, format('../src/app/images/darwin/%s.icns', cli.argv.internal_name));
var OSX_OUT_DMG = path.join(OUT, format('%s.dmg', OSX_APPNAME));
var OSX_OUT_DMG_CANONICAL = OSX_OUT_DMG.replace('.dmg',
  format('-%s.dmg', CANONICAL_INSTALLER_FILENAME_PARTS.join('-')));


var WINDOWS_APPNAME = BASENAME.replace(/ /g, '');
var WINDOWS_OUT_X64 = path.join(OUT, format('%s-win32-x64', WINDOWS_APPNAME));
var WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');
var WINDOWS_EXECUTABLE = path.join(WINDOWS_OUT_X64,
  format('%s.exe', WINDOWS_APPNAME));
var WINDOWS_ICON = path.resolve(__dirname, format(
  '../src/images/win32/%s.ico', cli.argv.internal_name));
var WINDOWS_SIGNTOOL_PARAMS = cli.argv.signtool_params;

var WINDOWS_SETUP_FILENAME = format('%sSetup.exe', WINDOWS_APPNAME);
var WINDOWS_OUT_SETUP_EXE = path.join(OUT, WINDOWS_SETUP_FILENAME);
var WINDOWS_OUT_SETUP_EXE_CANONICAL = WINDOWS_OUT_SETUP_EXE
  .replace('.exe', format('-%s.exe',
    CANONICAL_INSTALLER_FILENAME_PARTS.join('-')));

var LINUX_APPNAME = cli.argv.internal_name;
var LINUX_OUT_X64 = path.join(OUT, format('%s-linux-x64', LINUX_APPNAME));
var LINUX_EXECUTABLE = path.join(LINUX_OUT_X64, LINUX_APPNAME);
var LINUX_RESOURCES = path.join(LINUX_OUT_X64, 'resources');

/**
 * Build the options object to pass to `electron-packager`
 * and various `electron-installer-*` modules.
 */
var CONFIG = {};
_.assign(CONFIG, {
  dir: DIR,
  out: OUT,
  overwrite: true,
  'app-copyright': format('%s MongoDB Inc.', new Date().getFullYear()),
  'build-version': cli.argv.version,
  'app-version': cli.argv.version,
  ignore: new RegExp('node_modules/|.cache/|dist/|test/|scripts/'),
  platform: cli.argv.platform,
  arch: cli.argv.arch,
  version: cli.argv.electron_version,
  'version-string': {
    CompanyName: 'MongoDB Inc.',
    FileDescription: cli.argv.description,
    ProductName: cli.argv.product_name,
    InternalName: cli.argv.name
  },
  /**
   * TODO (imlucas) Move to a cli option: `com_id`?
   */
  'app-bundle-id': 'com.mongodb.compass',
  /**
   * TODO (imlucas) Move to a cli option:
   * `.option('category', {choices: ['productivity', <others from http://bit.ly/LSApplicationCategoryType>]}`
   * @see http://bit.ly/LSApplicationCategoryType
   */
  'app-category-type': 'public.app-category.productivity',
  protocols: [
    {
      name: 'MongoDB Prototcol',
      schemes: ['mongodb']
    }
  ],
  createInstaller: function(done) {
    return done(new TypeError('createInstaller not defined for this platform!'));
  }
});

if (cli.argv.platform === 'win32') {
  _.assign(CONFIG, {
    name: WINDOWS_APPNAME,
    icon: WINDOWS_ICON,
    sign_with_params: WINDOWS_SIGNTOOL_PARAMS,
    appPath: WINDOWS_OUT_X64,
    resources: WINDOWS_RESOURCES,
    executable: WINDOWS_EXECUTABLE,
    installer_destination: WINDOWS_OUT_SETUP_EXE,
    installer_destination_canonical: WINDOWS_OUT_SETUP_EXE_CANONICAL,
    createInstaller: function(done) {
      var opts = _.clone(CONFIG);
      opts.path = opts.appPath;
      opts.version = opts['app-version'];
      opts.loading_gif = path.join(__dirname, '..', 'src',
        'app', 'images', 'win32', 'mongodb-compass-installer-loading.gif');

      var electronInstaller = require('electron-winstaller');
      electronInstaller.createWindowsInstaller({
        appDirectory: WINDOWS_OUT_X64,
        outputDirectory: OUT,
        authors: 'MongoDB Inc.',
        exe: 'MongoDBCompass.exe',
        signWithParams: CONFIG.signtool_params,
        loadingGif: opts.loading_gif,
        title: cli.argv.product_name,
        productName: cli.argv.product_name,
        description: CONFIG.description,
        // setupIcon: WINDOWS_ICON,
        // iconUrl: 'https://www.mongodb.org/assets/global/favicon-1d2d833bba579ce81fcff283e0fd2be6769949a54650c8558a631a03af71f7f2.ico',
        name: 'MongoDBCompass',
        id: 'MongoDBCompass'
      }).then(function() {
        var EXE = path.join(OUT, 'MongoDB CompassSetup.exe');
        // var MSI = path.join(OUT, 'MongoDB CompassSetup.msi');
        async.parallel([EXE].map(function(p) {
          return fs.move.bind(null, p, p.replace(/ /g, ''));
        }), function(err) {
          if (err) {
            return done(err);
          }
          cli.ok('Successfully created installers');
          done();
        });
      }, done);
    }
  });
  cli.info('Windows is the target platform and has the config: ' + JSON.stringify(CONFIG, null, 2));
} else if (cli.argv.platform === 'darwin') {
  var OSX_CREATE_INSTALLER = function(done) {
    var tasks = [];
    codesign.isIdentityAvailable(OSX_IDENTITY, function(err, available) {
      if (err) {
        return done(err);
      }
      if (available && cli.argv.sign) {
        tasks.push(_.partial(codesign, {
          identity: OSX_IDENTITY_SHA1,
          appPath: OSX_DOT_APP
        }));
      } else {
        codesign.printWarning();
      }

      tasks.push(_.partial(createDMG, CONFIG));
      series(tasks, function(_err) {
        if (_err) {
          return done(_err);
        }
        done(null, OSX_OUT_DMG);
      });
    });
  };

  _.assign(CONFIG, {
    name: OSX_APPNAME,
    icon: OSX_ICON,
    appPath: OSX_DOT_APP,
    resources: OSX_RESOURCES,
    executable: OSX_EXECUTABLE,
    installer_destination: OSX_OUT_DMG,
    installer_destination_canonical: OSX_OUT_DMG_CANONICAL,
    /**
     * Background image for `.dmg`.
     * @see http://npm.im/electron-installer-dmg
     */
    background: path.resolve(__dirname, '../src/app/images/darwin/background.png'),
    /**
     * Layout for `.dmg`.
     * The following only modifies "x","y" values from defaults.
     * @see http://npm.im/electron-installer-dmg
     */
    contents: [
      /**
       * Show a shortcut on the right to `Applications` folder.
       */
      {
        x: 450,
        y: 344,
        type: 'link',
        path: '/Applications'
      },
      /**
       * Show a shortcut on the left for the application icon.
       */
      {
        x: 192,
        y: 344,
        type: 'file',
        path: OSX_DOT_APP
      }
    ],
    createInstaller: OSX_CREATE_INSTALLER
  });
  cli.info('OS X is the target platform and has the config: ' + JSON.stringify(CONFIG, null, 2));
// ----
} else {
  _.assign(CONFIG, {
    name: LINUX_APPNAME,
    resources: LINUX_RESOURCES,
    executable: LINUX_EXECUTABLE,
    installer_destination: null,
    installer_destination_canonical: null,
    appPath: LINUX_OUT_X64,
    createInstaller: function(done) {
      cli.warn('Linux installers coming soon!');
      done();
    }
  });
  cli.info('Linux is the target platform and has the config: ' + JSON.stringify(CONFIG, null, 2));
}

/**
 * TODO (imlucas) When `electron-installer-zip` is published,
 * include in this list (osx autoupdates).
 *
 * TODO (imlucas) On Windows for autoupdates we'll also need
 * to add `-delta.nupkg`, `-full.nupkg` and `RELEASES`
 * http://npm.im/electron-installer-squirrel-windows creates.
 */
var ARTIFACTS = [];
if (CONFIG.installer_destination) {
  ARTIFACTS.push.apply([CONFIG.installer_destination,
    CONFIG.installer_destination_canonical]);
}

if (CONFIG.sign_with_params) {
  cli.info(format('This build will be signed using `signtool.exe` with params `%s`',
    CONFIG.sign_with_params));
}

/**
 * TODO (imlucas) Make each of the `@public` functions below available
 * as yargs commands so we can easily test just 1 piece of the entire flow.
 */

/**
 * Run `electron-packager`
 *
 * @param {Function} done
 * @api public
 */
function createBrandedApplication(done) {
  cli.debug('running electron-packager to create branded application');
  fs.exists(CONFIG.appPath, function(exists) {
    if (exists) {
      cli.debug('`%s` already exists.  skipping packager run.', CONFIG.appPath);
      return done(null, false);
    }
    packager(CONFIG, function(err, res) {
      if (err) {
        return done(err);
      }
      cli.ok('Packager result is: ' + JSON.stringify(res, null, 2));
      done(null, true);
    });
  });
}

/**
 * For some platforms, there will be extraneous (to us) folders generated
 * we can remove to make the generated branded app less cluttered and easier
 * to debug.
 *
 * @param {Function} done
 * @api public
 */
function cleanupBrandedApplicationScaffold(done) {
  if (CONFIG.platform !== 'darwin') {
    done(null, true);
  } else {
    var globsToDelete = [
      path.join(OSX_DOT_APP, 'Contents', 'Resources', '*.lproj')
    ];
    cli.info('cleaning up extraneous files generated by packager ' + JSON.stringify(globsToDelete, null, 2));
    del(globsToDelete, {
      force: true
    }).then(function() {
      done(null, true);
    });
  }
}

/**
 * Run `electron-compile`.
 *
 * @param {Function} done
 * @api public
 */
function compileApplicationUI(done) {
  var DEST = path.join(CONFIG.resources, 'app', '.cache');
  function runElectronCompile(cb) {
    var args = [
      '--appdir',
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '..', 'src')
    ];
    var opts = {
      env: process.env
    };
    run(ELECTRON_COMPILE_BIN, args, opts, cb);
  }

  cli.info('Compiling application UI');

  async.series([
    fs.remove.bind(null, DEST),
    fs.remove.bind(null, ELECTRON_COMPILE_CACHE),
    runElectronCompile,
    fs.move.bind(null, ELECTRON_COMPILE_CACHE, DEST)
  ], function(err) {
    if (err) {
      return done(err);
    }

    cli.ok(format('Compiled application UI to `%s`', DEST));
    done();
  });
}

/**
 * Replace the LICENSE file `electron-packager` creates w/ a LICENSE
 * file specific to the project.
 *
 * @param {Function} done
 * @api public
 */
function writeLicenseFile(done) {
  var LICENSE_DEST = path.join(CONFIG.appPath, '..', 'LICENSE');
  license.build({
    path: path.join(__dirname, '..')
  }, function(err, contents) {
    if (err) {
      return done(err);
    }

    fs.writeFile(LICENSE_DEST, contents, function(_err) {
      if (_err) {
        cli.error(_err);
        return done(_err);
      }
      cli.ok(format('LICENSE written to `%s`', LICENSE_DEST));
      done();
    });
  });
}

/**
 * Replace the version file `electron-packager` creates w/ a version
 * file specific to the project.
 * @param {Function} done
 * @api public
 */
function writeVersionFile(done) {
  var VERSION_DEST = path.join(CONFIG.appPath, '..', 'version');
  cli.info(format('Writing version file to `%s`', VERSION_DEST));
  fs.writeFile(VERSION_DEST, pkg.version, function(err) {
    if (err) {
      cli.error(err);
      return done(err);
    }
    cli.ok(format('version file written to `%s`', VERSION_DEST));
    done();
  });
}

/**
 * Update the project's `./package.json` (like npm does when it
 * installs a package) for inclusion in the application
 * `electron-packager` creates.
 *
 * TODO (imlucas)
 * electron-packager will create and overwrite it, eg:
 * - remove all `scripts`
 * - merge buildinfo.json into it
 * - this will serve as the `config.json` referenced in JIRA tickets!
 *
 * @param {Function} done
 * @api public
 */
function transformPackageJson(done) {
  var PACKAGE_JSON_DEST = path.join(CONFIG.resources, 'app', 'package.json');
  var packageKeysToRemove = [
    'scripts',
    'devDependencies',
    'dependency-check',
    'repository',
    'check'
  ];
  var contents = _.omit(pkg, packageKeysToRemove);
  if (!contents.config) {
    contents.config = {};
  }
  _.defaults(contents.config, {
    NODE_ENV: process.env.NODE_ENV || 'production',
    build_time: new Date().toISOString(),
    channel: cli.argv.channel,
    revision: cli.argv.revision,
    build_variant: cli.argv.build_variant,
    branch_name: cli.argv.branch_name
  });

  cli.info('Writing package.json: ' + JSON.stringify(contents, null, 2));
  fs.writeJson(PACKAGE_JSON_DEST, contents, done);
}

/**
 * TODO (imlucas) Cache this... http://npm.im/npm-cache ?
 * @see [generate-module-cache-task.coffee](https://git.io/vaY0O)
 * @see [native-compile-cache](https://git.io/vaY0a)
 * @see [module-cache.coffee](https://git.io/vaY0K)
 *
 * @param {Function} done
 * @api public
 */
function installDependencies(done) {
  var args = [
    'install',
    '--production'
  ];
  cli.info('Installing dependencies');
  var opts = {
    env: process.env,
    cwd: path.join(CONFIG.resources, 'app')
  };
  run('npm', args, opts, function(err) {
    if (err) {
      cli.err(err);
      return done(err);
    }
    cli.ok('Dependencies installed');
    done();
  });
}

/**
 * TODO (imlucas) Needs a better name.
 *
 * @param {Function} done
 * @api public
 */
function finalizeApplication(done) {
  if (CONFIG.platform !== 'darwin') {
    done();
    return;
  }
  var DOT_FILES = [
    '.DS_Store',
    '.eslint*',
    '.evergreen*',
    '.travis*',
    '.npm*',
    '.jsfmt*',
    '.git*',
    'report*'
  ];
  var globsToDelete = [
    path.join(CONFIG.resources, 'app', 'test'),
    path.join(CONFIG.resources, 'app', 'scripts')
  ];

  if (CONFIG.platform === 'darwin') {
    globsToDelete.push(path.join(CONFIG.resources,
      'app', '{' + DOT_FILES.join(',') + '}'));
  }

  cli.info('Checking for extraneous files to remove:\n' +
    JSON.stringify(globsToDelete, null, 2));

  del(globsToDelete).then(function(paths) {
    if (paths.length === 0) {
      cli.ok('No extraneous files to remove');
    } else {
      cli.ok(format('%s extraneous files removed', paths.length));
    }
    done(null, true);
  }, function(err) {
    cli.err(err);
    done(err);
  });
}

/**
 * TODO (imlucas) Stub for improved windows installation.
 * @see How atom does this: https://git.io/vaY4O
 * @param {Function} done
 */
function createApplicationAsar(done) {
  done();
}

/**
 * TODO (imlucas) Stub for autoupdates.  Use `electron-installer-zip`.
 * @param {Function} done
 */
function createApplicationZip(done) {
  done();
}

/**
 * Create the application installer.
 *
 * @param {Function} done
 * @api public
 */
function createBrandedInstaller(done) {
  cli.info('Creating installer');
  CONFIG.createInstaller(function(err) {
    if (err) {
      return done(err);
    }
    if (CONFIG.installer_destination) {
      cli.ok(format('Installer written to `%s`', CONFIG.installer_destination));
    }
    done();
  });
}

function canonicalizeBrandedInstallerFilename(done) {
  if (!CONFIG.installer_destination) {
    return done();
  }
  cli.info(format('Copy `%s` to `%s`', CONFIG.installer_destination,
    CONFIG.installer_destination_canonical));

  fs.copy(CONFIG.installer_destination,
    CONFIG.installer_destination_canonical, done);
}

function main() {
  async.series([
    createBrandedApplication,
    cleanupBrandedApplicationScaffold,
    compileApplicationUI,
    writeLicenseFile,
    writeVersionFile,
    transformPackageJson,
    installDependencies,
    finalizeApplication,
    createApplicationAsar,
    createApplicationZip,
    createBrandedInstaller,
    canonicalizeBrandedInstallerFilename
  ], function(err) {
    cli.abortIfError(err);
    cli.ok(format('Successfully built `%s`.', CONFIG.appPath));
    cli.info('Build artifacts:\n' + ARTIFACTS.map(function(p) {
      return '- ' + p + '\n';
    }));
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('prepublish.js') === -1) {
  module.exports = exports;
} else {
  main();
}
