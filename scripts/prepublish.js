#!/usr/bin/env node

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
  .help('help')
  .epilogue('a.k.a `npm run release`');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

var ELECTRON_COMPILE_CACHE = path.join(__dirname, '..', '.cache');
var ELECTRON_COMPILE_BIN = path.join(__dirname, '..', 'node_modules',
  '.bin', 'electron-compile');

var inInstall = require('in-publish').inInstall();
var del = require('del');
var fs = require('fs-extra');
var license = require('electron-license');
var _ = require('lodash');
var async = require('async');
var series = require('async').series;
var packager = require('electron-packager');
var run = require('electron-installer-run');

/**
 * TODO (imlucas) Need to make all of these constants/config values
 * accessible via a module and/or command to generate the expansions.yml
 * for evergeen so it can do things like find artifacts that include
 * a version/some other non-constant.
 */
var DIR = path.join(__dirname, '..');
var OUT = path.join(__dirname, '..', 'dist');

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

var WINDOWS_APPNAME = _.trim(BASENAME, ' ');
var WINDOWS_OUT_X64 = path.join(OUT, format('%s-win32-x64', WINDOWS_APPNAME));
var WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');
var WINDOWS_EXECUTABLE = path.join(WINDOWS_OUT_X64,
    format('%s.exe', WINDOWS_APPNAME));
var WINDOWS_ICON = path.resolve(__dirname, format(
  '../src/images/win32/%s.ico', cli.argv.internal_name));
var WINDOWS_SIGNTOOL_PARAMS = cli.argv.signtool_params;

var WINDOWS_OUT_SETUP_EXE = path.join(
    WINDOWS_OUT_X64, format('%sSetup.exe', WINDOWS_APPNAME));

var LINUX_APPNAME = cli.argv.internal_name;
var LINUX_OUT_X64 = path.join(OUT, format('%s-linux-x64', LINUX_APPNAME));
var LINUX_EXECUTABLE = path.join(LINUX_OUT_X64, LINUX_APPNAME);
var LINUX_RESOURCES = path.join(LINUX_OUT_X64, 'resources');

var createSquirrelWindowsInstaller = require('electron-installer-squirrel-windows');

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
    createInstaller: createSquirrelWindowsInstaller.bind(null, CONFIG)
  });
  cli.info('Windows is the target platform and has the config: ' + JSON.stringify(CONFIG, null, 2));
}

if (cli.argv.platform === 'darwin') {
  var createDMG = require('electron-installer-dmg');
  var codesign = require('electron-installer-codesign');

  var OSX_CREATE_INSTALLER = function(done) {
    cli.info('Creating `.dmg` installer');

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
} else {
  _.assign(CONFIG, {
    name: LINUX_APPNAME,
    resources: LINUX_RESOURCES,
    executable: LINUX_EXECUTABLE,
    installer_destination: null,
    appPath: LINUX_OUT_X64,
    createInstaller: function(done) {
      cli.warn('Linux installers coming soon!');
      done();
    }
  });
  cli.info('Linux is the target platform and has the config: ' + JSON.stringify(CONFIG, null, 2));
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
 * ## 1. Create Application
 *
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
 * ## 2. Cleanup scaffold
 *
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
    del(globsToDelete).then(function() {
      done(null, true);
    });
  }
}

/**
 *
 * @param {Function} done
 */
function compileApplicationUI(done) {
  var DEST = path.join(CONFIG.resources, 'app', '.cache');
  function runElectronCompile(cb) {
    var args = [
      '--appDir',
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
  ], done);
}

/**
 * ## Transforms
 *
 * Run after `createBrandedApplication` but before `createBrandedInstaller`.
*/
/**
 * Replace the LICENSE file `electron-packager` creates w/ a LICENSE
 * file specific to the project.
 *
 * @param {Function} done
 */
function writeLicenseFile(done) {
  license.build({
    path: path.join(__dirname, '..')
  }, function(err, contents) {
    if (err) {
      return done(err);
    }

    fs.writeFile(path.join(CONFIG.appPath, '..', 'LICENSE'), contents, done);
  });
}

/**
 * Replace the version file `electron-packager` creates w/ a version
 * file specific to the project.
 * @param {Function} done
 * @api public
 */
function writeVersionFile(done) {
  fs.writeFile(path.join(CONFIG.appPath, '..', 'version'), pkg.version, done);
}

/**
 * Update the project's `./package.json` (like npm does when it installs a package)
 * for inclusion in the application `electron-packager` creates.
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
  var packageKeysToRemove = [
    'scripts',
    'devDependencies',
    'dependency-check',
    'repository',
    'check'
  ];
  var contents = _.omit(pkg, packageKeysToRemove);

  /**
   * TODO (imlucas) Because we're shipping the compiled application UI,
   * we can also safely delete large packages that won't actually be used.
   * There are lots of others.  This is just to experiment and see how much
   * time/space can be saved.
   */
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
  fs.writeJson(path.join(CONFIG.resources, 'app', 'package.json'), contents, done);
}

function installDependencies(done) {
  var args = [
    'install',
    '--production'
  ];
  cli.info('Running npm install');
  var opts = {
    env: process.env,
    cwd: path.join(CONFIG.resources, 'app')
  };
  run('npm', args, opts, done);
}

function finalizeApplication(done) {
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
    path.join(CONFIG.resources, 'app', 'scripts'),
    path.join(CONFIG.resources, 'app', '{' + DOT_FILES.join(',') + '}')
  ];

  cli.info('removing extraneous files' + JSON.stringify(globsToDelete, null, 2));
  del(globsToDelete).then(function() {
    done(null, true);
  });
}

/**
 * ## Installers
 *
 * @param {Function} done
 * @api public
 */
function createBrandedInstaller(done) {
  CONFIG.createInstaller(done);
}

function canonicalizeBrandedInstallerFilename(done) {
  if (!CONFIG.installer_destination) {
    return done();
  }

  var detailledFilenameParts = [
    CONFIG['app-version'],
    CONFIG.platform,
    CONFIG.arch
  ];

  if (cli.argv.channel !== 'stable') {
    detailledFilenameParts.push(cli.argv.channel);
  }

  if (CONFIG.platform === 'win32') {
    var windowsDest = CONFIG.installer_destination
      .replace('.exe', format('-%s.exe', detailledFilenameParts.join('-')));
    cli.info('Copying Windows installer to `' + windowsDest + '`');

    return fs.copy(CONFIG.installer_destination, windowsDest, done);
  }

  if (CONFIG.platform === 'darwin') {
    var osxDest = CONFIG.installer_destination
      .replace('.dmg', format('-%s.dmg', detailledFilenameParts.join('-')));
    cli.info('Copying OSX installer to `' + osxDest + '`');

    return fs.copy(CONFIG.installer_destination, osxDest, done);
  }
  return done(new TypeError('Unknown platform `' + cli.argv.platform + '`. ' +
    ' If you\'re trying to add linux installer or mac app store support, email lucas@mongodb.com :)'));
}

/**
 * ## Main
 */
if (inInstall) {
  cli.info('noop.  @see http://bit.ly/npm-prepublish-flaws');
  process.exit(0);
} else {
  cli.spinner('Creating installer');

  async.series([
    createBrandedApplication,
    cleanupBrandedApplicationScaffold,
    compileApplicationUI,
    writeLicenseFile,
    writeVersionFile,
    transformPackageJson,
    installDependencies,
    finalizeApplication,
    createBrandedInstaller,
    canonicalizeBrandedInstallerFilename
  ], function(err) {
    cli.abortIfError(err);
    cli.ok(format('Installer successfully written to `%s`.', CONFIG.installer_destination));
  });
}
