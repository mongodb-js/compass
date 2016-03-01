#!/usr/bin/env node

var pkg = require('../package.json');
var format = require('util').format;
var inInstall = require('in-publish').inInstall();

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
  .option('name', {
    describe: 'What is the dasherized name of the application?',
    default: process.env.npm_package_name || pkg.name
  })
  .option('product_name', {
    describe: 'What is the name of the application we should display to humans?',
    default: process.env.npm_package_product_name || pkg.product_name
  })
  .epilogue('a.k.a `npm run release`');

if (cli.argv.verbose) {
  process.env.DEBUG = '*';
}

var path = require('path');
var fs = require('fs');
var license = require('electron-license');
var _ = require('lodash');
var async = require('async');
var packager = require('electron-packager');

var CONFIG = {
  name: 'MongoDBCompass',
  dir: path.join(__dirname, '..'),
  out: path.join(__dirname, '..', 'dist'),
  overwrite: true,
  // prune: true
};

_.assign(CONFIG, {
  platform: cli.argv.platform,
  arch: cli.argv.arch,
  version: cli.argv.electron_version
});

if (cli.argv.platform === 'win32') {
  var APP_PATH = path.resolve(__dirname, '../dist/MongoDBCompass-win32-x64');
  var ELECTRON = path.join(APP_PATH, 'MongoDBCompass.exe');
  var RESOURCES = path.join(APP_PATH, 'resources');
  var HOME = APP_PATH;

  CONFIG['version-string'] = {
    CompanyName: 'MongoDB Inc.',
    LegalCopyright: format('%s MongoDB Inc.', new Date().getFullYear()),
    FileDescription: 'The MongoDB GUI.',
    FileVersion: cli.argv.version,
    ProductVersion: cli.argv.version,
    ProductName: cli.argv.product_name,
    InternalName: cli.argv.name
  };

  CONFIG.icon = path.resolve(__dirname, '../src/images/win32/mongodb-compass.ico');

  CONFIG.sign_with_params = process.env.SIGNTOOL_PARAMS;
  if (CONFIG.sign_with_params) {
    cli.ok(format('This build will be signed using `signtool.exe` with params `%s`',
      CONFIG.sign_with_params));
  }

  CONFIG.createInstaller = require('electron-installer-squirrel-windows').bind(null, CONFIG);
} else if (cli.argv.platform === 'darwin') {
  CONFIG.name = cli.argv.product_name;
  var NAME = cli.argv.product_name;
  var PACKAGE = path.join('dist', NAME + '-darwin-x64');
  var APP_PATH = path.join(PACKAGE, NAME + '.app');
  var ELECTRON = path.join(APP_PATH, 'Contents', 'MacOS', 'Electron');
  var RESOURCES = path.join(APP_PATH, 'Contents', 'Resources');
  var HOME = PACKAGE;

  _.assign(CONFIG, {
    icon: path.resolve(__dirname, '../src/app/images/darwin/mongodb-compass.icns'),
    'app-bundle-id': 'com.mongodb.compass',
    'app-version': cli.argv.version,
    protocols: [
      {
        name: 'MongoDB Prototcol',
        schemes: ['mongodb']
      }
    ]
  });
  _.assign(CONFIG, {
    appPath: APP_PATH,
    background: path.resolve(__dirname, '../src/app/images/darwin/background.png'),
    // The following only modifies "x","y" values from defaults
    contents: [
      {
        x: 450,
        y: 344,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 192,
        y: 344,
        type: 'file',
        path: path.resolve(process.cwd(), APP_PATH)
      }
    ]
  });

  CONFIG.CODESIGN_IDENTITY_COMMON_NAME = 'Developer ID Application: Matt Kangas (ZD3CL9MT3L)';
  CONFIG.CODESIGN_IDENTITY_SHA1 = '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A';

  var createDMG = require('electron-installer-dmg');
  var codesign = require('electron-installer-codesign');
  CONFIG.createInstaller = function(done) {
    cli.debug('creating installer...');

    var tasks = [];
    codesign.isIdentityAvailable(CONFIG.CODESIGN_IDENTITY_COMMON_NAME, function(err, available) {
      if (err) {
        return done(err);
      }
      if (available) {
        tasks.push(_.partial(codesign, {
          identity: CONFIG.CODESIGN_IDENTITY_SHA1,
          appPath: APP_PATH
        }));
      } else {
        codesign.printWarning();
      }

      tasks.push(_.partial(createDMG, CONFIG));
      async.series(tasks, function(_err) {
        if (_err) {
          return done(_err);
        }
        done(null, path.join(CONFIG.out, CONFIG.name + '.dmg'));
      });
    });
  }
} else {
  var APP_PATH = path.resolve(__dirname, '../dist/MongoDBCompass-linux-x64');
  var ELECTRON = path.join(APP_PATH, 'MongoDBCompass');
  var RESOURCES = path.join(APP_PATH, 'resources');
  var HOME = APP_PATH;

  CONFIG.createInstaller = function(done) {
    cli.warn('Linux installers coming soon!');
    done();
  };
}

cli.debug('CONFIG is', '%j', CONFIG);

/**
 * TODO (imlucas) Break these up into yargs subcommands.
 */

/**
 * ## Create Application
 *
 * Run `electron-packager`
 */
function createBrandedApplication(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      cli.debug('`%s` already exists.  skipping packager run.', APP_PATH);
      return done(null, false);
    }
    packager(CONFIG, function(err, res) {
      if (err) {
        return done(err);
      }
      cli.debug('Packager result', res);
      done(null, true);
    });
  });
}

/**
 * ## Installers
 */
function createBrandedInstaller(done) {
  CONFIG.createInstaller(done);
}

/**
 * ## Transforms
 *
 * Run after `createBrandedApplication` but before
 * `createBrandedInstaller`.
 */
function writeLicenseFile(done) {
  license.build({
    path: path.join(__dirname, '..')
  }, function(err, contents) {
    if (err) {
      return done(err);
    }

    fs.writeFile(path.join(HOME, 'LICENSE'), contents, done);
  });
}

function writeVersionFile(done) {
  fs.writeFile(path.join(HOME, 'version'), pkg.version, done);
}

/**
 * TODO (imlucas) Update `./package.json` to live under the dir
 * electron-packager will create and overwrite it, eg:
 * - remove all `scripts`
 * - merge buildinfo.json into it
 * - this will serve as the `config.json` referenced in JIRA tickets!
 */
function transformPackageJson(done) {
  done();
}

if (inInstall) {
  cli.info('noop.  @see http://bit.ly/npm-prepublish-flaws');
  process.exit(0);
}

async.series([
  createBrandedApplication,
  writeLicenseFile,
  writeVersionFile,
  transformPackageJson,
  createBrandedInstaller
], function(err) {
  cli.abortIfError(err);
  cli.ok('created installer');
});
