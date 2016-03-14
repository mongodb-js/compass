#!/usr/bin/env node

/**
 * # config
 */
var pkg = require('../package.json');
var util = require('util');
var format = util.format;
var inspect = util.inspect;
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var async = require('async');
var createDMG = require('electron-installer-dmg');
var codesign = require('electron-installer-codesign');
var electronWinstaller = require('electron-winstaller');
var createCLI = require('mongodb-js-cli');
var Table = require('cli-table');
var yaml = require('js-yaml');
var electronPrebuiltVersion = require('electron-prebuilt/package.json').version;

exports.options = {
  verbose: {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  },
  platform: {
    describe: 'What platform are we building for?',
    choices: ['win32', 'linux', 'darwin'],
    default: process.platform
  },
  arch: {
    describe: 'What platform architecture are we building for?',
    choices: ['x64', 'x86'],
    default: process.arch
  },
  electron_version: {
    describe: 'What version of electron are we using?',
    default: electronPrebuiltVersion
  },
  version: {
    describe: 'What version of the application are we building?',
    default: process.env.npm_package_version || pkg.version
  },
  internal_name: {
    describe: 'What is the kebab cased name of the application?',
    default: process.env.npm_package_name || pkg.name
  },
  product_name: {
    describe: 'What is the name of the application we should display to humans?',
    default: process.env.npm_package_product_name || pkg.product_name
  },
  description: {
    describe: 'What is the description of the application we should display to humans?',
    default: process.env.npm_package_description || pkg.description
  },
  channel: {
    describe: 'What release channel is this build for?',
    choices: ['testing', 'beta', 'stable'],
    default: 'testing'
  },
  sign: {
    describe: 'Should this build be signed?',
    type: 'boolean',
    default: true
  },
  signtool_params: {
    describe: 'What extra cli arguments should be passed to signtool.exe?',
    default: process.env.SIGNTOOL_PARAMS || null
  },
  revision: {
    description: 'revision on evergreen',
    type: 'string',
    default: undefined
  },
  build_variant: {
    description: 'build_variant on evergreen',
    type: 'string',
    default: undefined
  },
  branch_name: {
    description: 'branch_name on evergreen',
    type: 'string',
    default: undefined
  }
};

function canonicalize(cli, CONFIG, paths) {
  var tasks = [];
  paths.map(function(src) {
    var dest = src.replace(/\.(exe|zip|dmg|msi)/,
      CONFIG.canonical_filename_parts.join('-') + '.$1');
    CONFIG.artifacts.push(dest);

    tasks.push(function(cb) {
      cli.debug(format('Copy `%s` to canonical `%s`', src, dest));
      fs.copy(src, dest, cb);
    });
  });

  return function(done) {
    async.parallel(tasks, done);
  };
}

exports.get = function(cli, callback) {
  /**
   * a.k.a What directory is package.json in?
   */
  var PROJECT_ROOT = path.join(__dirname, '..');

  /**
   * Directory for application's image assets.
   */
  var IMAGES = path.join(PROJECT_ROOT, 'src', 'app', 'images');

  /**
   * Build the options object to pass to `electron-packager`
   * and various `electron-installer-*` modules.
   */
  var CONFIG = {};

  /**
   * First add to `CONFIG` the common keys which are
   * not platform specific.
   */
  _.assign(CONFIG, {
    dir: PROJECT_ROOT,
    out: path.join(PROJECT_ROOT, 'dist'),
    overwrite: true,
    'app-copyright': format('%s MongoDB Inc.', new Date().getFullYear()),
    'build-version': cli.argv.version,
    'app-version': cli.argv.version,
    ignore: new RegExp('node_modules/|.cache/|dist/|test/|scripts/'),
    platform: cli.argv.platform,
    arch: cli.argv.arch,
    version: cli.argv.electron_version,
    description: cli.argv.description,
    'version-string': {
      CompanyName: 'MongoDB Inc.',
      FileDescription: cli.argv.description,
      ProductName: cli.argv.product_name,
      InternalName: cli.argv.internal_name
    },
    images: path.join(__dirname, '..', 'src', 'app', 'images'),
    table: function() {
      /**
       * Print the assembled `CONFIG` data as a nice table.
       */
      var configTable = new Table({
        head: ['Key', 'Value']
      });
      _.forIn(CONFIG.serialize(), function(value, key) {
        configTable.push([key, inspect(value, {
          depth: null,
          colors: true
        })]);
      });
      return configTable.toString();
    },
    serialize: function() {
      return _.omit(CONFIG, function(value) {
        return _.isFunction(value) || _.isRegExp(value);
      });
    }
  });

  /**
   * @see `canonicalizeFilename(CONFIG, paths, done)`
   */
  CONFIG.canonical_filename_parts = [
    cli.argv.version,
    cli.argv.platform,
    cli.argv.arch
  ];

  if (cli.argv.channel !== 'stable') {
    CONFIG.canonical_filename_parts.push(cli.argv.channel);
  }

  /**
   * Next, define stubs for platform specific options.
   */
  _.assign(CONFIG, {
    name: null,
    icon: null,
    appPath: null,
    resources: null,
    executable: null,
    artifacts: [],
    createInstaller: function(done) {
      return done(new TypeError(
        'createInstaller not defined for this platform!'));
    }
  });

  if (cli.argv.platform === 'win32') {
    /**
     * ## Windows Configuration
     */
    var WINDOWS_APPNAME = cli.argv.product_name.replace(/ /g, '');
    var WINDOWS_OUT_X64 = path.join(CONFIG.out, format('%s-win32-x64', WINDOWS_APPNAME));
    var WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');
    var WINDOWS_EXECUTABLE = path.join(WINDOWS_OUT_X64,
      format('%s.exe', WINDOWS_APPNAME));
    var WINDOWS_ICON = path.resolve(__dirname, format(
      '../src/images/win32/%s.ico', cli.argv.internal_name));
    var WINDOWS_SIGNTOOL_PARAMS = cli.argv.signtool_params;
    var WINDOWS_LOADING_GIF = path.join(IMAGES,
      'win32', 'mongodb-compass-installer-loading.gif');

    var WINDOWS_OUT_SETUP_EXE = path.join(CONFIG.out,
      format('%sSetup.exe', WINDOWS_APPNAME));

    var WINDOWS_OUT_MSI = path.join(CONFIG.out,
      format('%sSetup.msi', WINDOWS_APPNAME));

    var WINDOWS_OUT_FULL_NUPKG = path.join(CONFIG.out,
      format('%s-%s-full.nupkg', WINDOWS_APPNAME, CONFIG['app-version']));

    var WINDOWS_OUT_RELEASES = path.join(CONFIG.out, 'RELEASES');

    /**
     * TODO (imlucas) When we get to autoupdates, uncomment
     * below and add to CONFIG.artifacts.
     *  var WINDOWS_OUT_DELTA_NUPKG = path.join(CONFIG.out,
     *  format('%s-%s-delta.nupkg', WINDOWS_APPNAME, CONFIG['app-version']));
     */
    _.assign(CONFIG, {
      name: WINDOWS_APPNAME,
      icon: WINDOWS_ICON,
      loading_gif: WINDOWS_LOADING_GIF,
      sign_with_params: WINDOWS_SIGNTOOL_PARAMS,
      appPath: WINDOWS_OUT_X64,
      resources: WINDOWS_RESOURCES,
      executable: WINDOWS_EXECUTABLE,
      artifacts: [
        WINDOWS_OUT_SETUP_EXE,
        WINDOWS_OUT_MSI,
        WINDOWS_OUT_RELEASES,
        WINDOWS_OUT_FULL_NUPKG
      ]
    });

    var canonicalizeWindowsArtifacts = canonicalize(cli, CONFIG, [
      WINDOWS_OUT_SETUP_EXE,
      WINDOWS_OUT_MSI
    ]);

    CONFIG.createInstaller = function(done) {
      electronWinstaller.createWindowsInstaller({
        appDirectory: WINDOWS_OUT_X64,
        outputDirectory: CONFIG.out,
        authors: CONFIG['version-string'].CompanyName,
        version: CONFIG['app-version'],
        exe: format('%s.exe', CONFIG.name),
        signWithParams: CONFIG.signtool_params,
        loadingGif: CONFIG.loading_gif,
        title: CONFIG.name,
        productName: CONFIG.name,
        description: CONFIG.description,
        /**
         * TODO (imlucas) The ICO file to use as the icon for the
         * generated Setup.exe. Defaults to the weird
         * "present" icon @thomasr mentioned:
         *  https://raw.githubusercontent.com/Squirrel/Squirrel.Windows/master/src/Setup/Setup.ico
         * setupIcon: WINDOWS_ICON,
         */
        /**
         * TODO (imlucas) A URL to an ICO file to use as the application icon
         * (displayed in Control Panel > Programs and Features). Defaults
         * to the Atom icon.
         * Defaults to:
         * 'https://raw.githubusercontent.com/atom/electron/master/atom/browser/resources/win/atom.ico',
         * iconUrl: 'https://www.mongodb.org/assets/global/favicon-1d2d833bba579ce81fcff283e0fd2be6769949a54650c8558a631a03af71f7f2.ico',
         */
        name: CONFIG.name,
        id: CONFIG.name
      }).then(function(res) {
        cli.debug('Successfully created installers', res);
        canonicalizeWindowsArtifacts(done);
      }, done);
    };
  } else if (cli.argv.platform === 'darwin') {
    /**
     * ## OS X Configuration
     */
    var OSX_APPNAME = cli.argv.product_name;
    var OSX_OUT_X64 = path.join(CONFIG.out, format('%s-darwin-x64',
      OSX_APPNAME));
    var OSX_DOT_APP = path.join(OSX_OUT_X64, format('%s.app', OSX_APPNAME));
    var OSX_IDENTITY = 'Developer ID Application: Matt Kangas (ZD3CL9MT3L)';
    var OSX_IDENTITY_SHA1 = '90E39AA7832E95369F0FC6DAF823A04DFBD9CF7A';
    var OSX_RESOURCES = path.join(OSX_DOT_APP, 'Contents', 'Resources');
    var OSX_EXECUTABLE = path.join(OSX_DOT_APP, 'Contents', 'MacOS', 'Electron');
    var OSX_ICON = path.resolve(__dirname, format('../src/app/images/darwin/%s.icns', cli.argv.internal_name));
    var OSX_OUT_DMG = path.join(CONFIG.out, format('%s.dmg', OSX_APPNAME));

    _.assign(CONFIG, {
      name: OSX_APPNAME,
      icon: OSX_ICON,
      appPath: OSX_DOT_APP,
      resources: OSX_RESOURCES,
      executable: OSX_EXECUTABLE,
      artifacts: [
        OSX_OUT_DMG
      ],
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
      /**
       * TODO (imlucas) Move to a cli option: `com_id`?
       */
      'app-bundle-id': 'com.mongodb.compass',
      /**
       * TODO (imlucas) Move to a cli option:
       * `.option('category', {choices: ['productivity',
       *   <others from http://bit.ly/LSApplicationCategoryType>]}`
       * @see http://bit.ly/LSApplicationCategoryType
       */
      'app-category-type': 'public.app-category.productivity',
      protocols: [
        {
          name: 'MongoDB Prototcol',
          schemes: ['mongodb']
        }
      ]
    });

    var canonicalizeDarwinArtifacts = canonicalize(cli, CONFIG, [
      OSX_OUT_DMG
    ]);

    CONFIG.createInstaller = function(done) {
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
        async.series(tasks, function(_err) {
          if (_err) {
            return done(_err);
          }
          canonicalizeDarwinArtifacts(done);
        });
      });
    };
  } else {
    /**
     * ## Linux Configuration
     */
    var LINUX_APPNAME = cli.argv.internal_name;
    var LINUX_OUT_X64 = path.join(CONFIG.out,
      format('%s-linux-x64', LINUX_APPNAME));
    var LINUX_EXECUTABLE = path.join(LINUX_OUT_X64, LINUX_APPNAME);
    var LINUX_RESOURCES = path.join(LINUX_OUT_X64, 'resources');

    _.assign(CONFIG, {
      name: LINUX_APPNAME,
      resources: LINUX_RESOURCES,
      executable: LINUX_EXECUTABLE,
      appPath: LINUX_OUT_X64,
      createInstaller: function(done) {
        cli.warn('Linux installers coming soon!');
        done();
      }
    });
  }
  callback(null, CONFIG);
};


function main(cli) {
  exports.get(cli, function(err, CONFIG) {
    cli.abortIfError(err);
    /* eslint no-console: 0 */
    if (cli.argv.format === 'json') {
      console.log(JSON.stringify(CONFIG.serialize(), null, 2));
    } else if (cli.argv.format === 'yaml') {
      console.log(yaml.dump(CONFIG.serialize()));
    } else {
      console.log(CONFIG.table());
    }
  });
}

var configCLI = createCLI('mongodb-compass:scripts:config');
configCLI.yargs.usage('$0 [options]')
  .options(exports.options)
  .option('format', {
    choices: ['table', 'yaml', 'json'],
    description: 'What output format would you like?',
    default: 'table'
  })
  .help('help');

if (configCLI.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

/**
 * ## Main
 */
if (configCLI.argv.$0 && configCLI.argv.$0.indexOf('config.js') === -1) {
  module.exports = exports;
} else {
  main(configCLI);
}
