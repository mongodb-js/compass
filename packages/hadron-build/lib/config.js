#!/usr/bin/env node

/**
 * # config
 */
var format = require('util').format;
var path = require('path');
var pkg = require('./package');
var _ = require('lodash');
var async = require('async');
var createDMG = require('electron-installer-dmg');
var codesign = require('electron-installer-codesign');
var electronWinstaller = require('electron-winstaller');
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
  name: {
    describe: 'What is the kebab cased name of the application?',
    default: process.env.npm_package_name || pkg.name
  },
  product_name: {
    describe: 'What is the name of the application we should display to humans?',
    default: pkg.productName
  },
  description: {
    describe: 'What is the description of the application we should display to humans?',
    default: process.env.npm_package_description || pkg.description
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
  favicon_url: {
    description: 'A URL to an ICO file to use as the application icon (e.g. Windows: displayed in Control Panel > Programs and Features)',
    default: _.get(pkg, 'config.hadron.build.win32.favicon_url')
  },
  evergreen_revision: {
    description: 'What revision, aka commit sha1 is evergreen building?',
    type: 'string',
    default: process.env.EVERGREEN_REVISION
  },
  evergreen_build_variant: {
    description: 'build_variant on evergreen',
    type: 'string',
    default: process.env.EVERGREEN_BUILD_VARIANT
  },
  evergreen_branch_name: {
    description: 'branch_name on evergreen',
    type: 'string',
    default: process.env.EVERGREEN_BRANCH_NAME
  },
  github_token: {
    description: 'GitHub API token.',
    default: process.env.GITHUB_TOKEN
  },
  github_owner: {
    default: pkg.github_owner
  },
  github_repo: {
    default: pkg.github_repo
  },
  author: {
    default: pkg.author || pkg.authors
  }
};

var assert = require('assert');
exports.get = function(cli, callback) {
  /**
   * a.k.a What directory is package.json in?
   */
  var PROJECT_ROOT = process.cwd();

  /**
   * Build the options object to pass to `electron-packager`
   * and various `electron-installer-*` modules.
   */
  var channel = 'stable';
  if (cli.argv.version.indexOf('-beta') > -1) {
    channel = 'beta';
  } else if (cli.argv.version.indexOf('-dev') > -1) {
    channel = 'dev';
  }

  var PRODUCT_NAME = cli.argv.product_name;
  assert(cli.argv.product_name);

  if (channel === 'beta') {
    PRODUCT_NAME += ' Beta';
  } else if (channel === 'dev') {
    PRODUCT_NAME += ' Dev';
  }

  var ID = cli.argv.name;

  /**
   * TODO (imlucas) beta and dev channels should have different
   * icons.
   */

  /**
   * TODO (imlucas) Make `CONFIG` a proper interface class
   * with implementors based on `platform`.
   */
  var CONFIG = _.omit(cli.argv, [
    '_', 'help', 'verbose', 'sign', 'format', '$0',
    'signtool_params', 'favicon_url'
  ]);

  var IGNORE_DIRECTORIES = 'node_modules/|.cache/|dist/|test/|.user-data';

  CONFIG.packagerOptions = {
    dir: PROJECT_ROOT,
    out: path.join(PROJECT_ROOT, 'dist'),
    overwrite: true,
    'app-copyright': format('%s %s', new Date().getFullYear(), CONFIG.author),
    'build-version': CONFIG.version,
    'app-version': CONFIG.version,
    ignore: IGNORE_DIRECTORIES,
    platform: CONFIG.platform,
    arch: CONFIG.arch,
    version: CONFIG.electron_version,
    sign: null
  };
  /**
   * First add to `CONFIG` the common keys which are
   * not platform specific.
   */
  CONFIG.out = path.join(PROJECT_ROOT, 'dist');
  CONFIG.platform = cli.argv.platform;
  CONFIG.arch = cli.argv.arch;
  CONFIG.channel = channel;

  if (cli.argv.platform === 'win32') {
    /**
     * ## Windows Configuration
     */
    var WINDOWS_APPNAME = PRODUCT_NAME.replace(/ /g, '');
    var WINDOWS_OUT_X64 = path.join(CONFIG.out,
      format('%s-win32-x64', WINDOWS_APPNAME));

    var WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');

    var WINDOWS_ICON = path.join(process.cwd(),
      _.get(pkg, 'config.hadron.build.win32.icon'));

    var WINDOWS_LOADING_GIF = path.join(process.cwd(),
      _.get(pkg, 'config.hadron.build.win32.loading_gif'));

    var WINDOWS_OUT_SETUP_EXE = path.join(CONFIG.out,
      format('%sSetup.exe', CONFIG.packagerOptions.name));

    var WINDOWS_OUT_MSI = path.join(CONFIG.out,
      format('%sSetup.msi', PRODUCT_NAME));

    CONFIG.appPath = WINDOWS_OUT_X64;
    CONFIG.resources = WINDOWS_RESOURCES;

    CONFIG.windows_msi_filename = path.basename(WINDOWS_OUT_MSI);
    CONFIG.windows_msi_label = 'Windows Installer Package';

    CONFIG.windows_setup_filename = path.basename(WINDOWS_OUT_SETUP_EXE);
    CONFIG.windows_setup_label = 'Windows Installer';

    CONFIG.windows_zip_filename = format('%s.zip', WINDOWS_APPNAME);
    CONFIG.windows_zip_label = 'Windows Zip';

    CONFIG.windows_nupkg_full_filename = format('%s-%s-full.nupkg',
      WINDOWS_APPNAME, CONFIG.version);
    CONFIG.windows_nupkg_full_label = format('%s-%s-full.nupkg',
      WINDOWS_APPNAME, CONFIG.version);

    CONFIG.assets = [
      {
        name: path.basename(WINDOWS_OUT_SETUP_EXE),
        label: 'Windows Installer',
        path: WINDOWS_OUT_SETUP_EXE
      },
      {
        name: path.basename(WINDOWS_OUT_MSI),
        label: CONFIG.windows_msi_label,
        path: WINDOWS_OUT_MSI
      },
      {
        name: 'RELEASES',
        path: path.join(CONFIG.out, 'RELEASES')
      },
      {
        name: format('%s-%s-full.nupkg',
          WINDOWS_APPNAME, CONFIG.version),
        path: path.join(CONFIG.out, format('%s-%s-full.nupkg',
          WINDOWS_APPNAME, CONFIG.version))
      },
      {
        name: format('%s-windows.zip', ID),
        path: path.join(CONFIG.out, format('%s.zip', WINDOWS_APPNAME))
      }
      /**
       * TODO (imlucas) Uncomment when hadron-endpoint-server deployed.
       path.join(CONFIG.out, format('%s-%s-delta.nupkg', WINDOWS_APPNAME, CONFIG['app-version']));
       */
    ];

    _.assign(CONFIG.packagerOptions, {
      name: WINDOWS_APPNAME,
      icon: WINDOWS_ICON,
      'version-string': {
        CompanyName: CONFIG.author,
        FileDescription: CONFIG.description,
        ProductName: PRODUCT_NAME,
        InternalName: CONFIG.name
      }
    });

    CONFIG.installerOptions = {
      loadingGif: WINDOWS_LOADING_GIF,
      signWithParams: cli.argv.signtool_params,
      iconUrl: cli.argv.favicon_url,
      appDirectory: WINDOWS_OUT_X64,
      outputDirectory: CONFIG.out,
      authors: CONFIG.author,
      version: CONFIG.version,
      exe: format('%s.exe', CONFIG.packagerOptions.name),
      setupExe: format('%sSetup.exe', CONFIG.packagerOptions.name),
      title: PRODUCT_NAME,
      productName: PRODUCT_NAME,
      description: CONFIG.description,
      name: CONFIG.name.replace('-', '_'),
      id: CONFIG.name.replace('-', '_')
      /**
       * TODO (imlucas) Uncomment when hadron-endpoint-server deployed.
       * remoteReleases: _.get(pkg, 'config.hadron.endpoint'),
       * remoteToken: process.env.GITHUB_TOKEN,
       */
      /**
       * TODO (imlucas) The ICO file to use as the icon for the
       * generated Setup.exe. Defaults to the weird
       * "present" icon @thomasr mentioned:
       *  https://raw.githubusercontent.com/Squirrel/Squirrel.Windows/master/src/Setup/Setup.ico
       * setupIcon: WINDOWS_ICON
       */
    };

    CONFIG.createInstaller = function(done) {
      electronWinstaller.createWindowsInstaller(CONFIG.installerOptions)
        .then(function(res) {
          cli.debug('Successfully created installers', res);
          done();
        }, done);
    };
  } else if (cli.argv.platform === 'darwin') {
    /**
     * ## OS X Configuration
     */
    var OSX_APPNAME = PRODUCT_NAME;
    var OSX_OUT_X64 = path.join(CONFIG.out,
      format('%s-darwin-x64', OSX_APPNAME));
    var OSX_DOT_APP = path.join(OSX_OUT_X64, format('%s.app', OSX_APPNAME));
    var OSX_IDENTITY = _.get(pkg, 'config.hadron.build.darwin.codesign_identity');
    var OSX_IDENTITY_SHA1 = _.get(pkg, 'config.hadron.build.darwin.codesign_sha1');
    var OSX_RESOURCES = path.join(OSX_DOT_APP, 'Contents', 'Resources');

    var OSX_ICON = path.resolve(process.cwd(),
      _.get(pkg, 'config.hadron.build.darwin.icon'));

    var OSX_OUT_DMG = path.join(CONFIG.out,
      format('%s.dmg', OSX_APPNAME));

    var OSX_OUT_ZIP = path.join(CONFIG.out,
      format('%s.zip', OSX_APPNAME));

    _.assign(CONFIG.packagerOptions, {
      name: OSX_APPNAME,
      icon: OSX_ICON,
      'app-bundle-id': _.get(pkg, 'config.hadron.build.darwin.app_bundle_id'),
      /**
       * @see http://bit.ly/LSApplicationCategoryType
       */
      'app-category-type': _.get(pkg, 'config.hadron.build.darwin.app_category_type'),
      protocols: _.get(pkg, 'config.hadron.protocols')
    });

    CONFIG.osx_dmg_filename = path.basename(OSX_OUT_DMG);
    CONFIG.osx_dmg_label = 'OS X Installer';

    CONFIG.osx_zip_filename = path.basename(OSX_OUT_ZIP);
    CONFIG.osx_zip_label = 'OS X Zip';

    CONFIG.appPath = OSX_DOT_APP;
    CONFIG.resources = OSX_RESOURCES;
    CONFIG.assets = [
      {
        name: format('%s.dmg', ID),
        path: OSX_OUT_DMG
      },
      {
        name: format('%s-mac.zip', ID),
        path: OSX_OUT_ZIP
      }
    ];

    CONFIG.installerOptions = {
      dmgPath: OSX_OUT_DMG,
      title: PRODUCT_NAME,
      overwrite: true,
      out: CONFIG.out,
      icon: OSX_ICON,
      identity_display: OSX_IDENTITY,
      identity: OSX_IDENTITY_SHA1,
      appPath: OSX_DOT_APP,
      /**
       * Background image for `.dmg`.
       * @see http://npm.im/electron-installer-dmg
       */
      background: path.resolve(process.cwd(),
        _.get(pkg, 'config.hadron.build.darwin.dmg_background')),
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
      ]
    };

    CONFIG.createInstaller = function(done) {
      var tasks = [];
      var opts = CONFIG.installerOptions;
      codesign.isIdentityAvailable(opts.identity_display, function(err, available) {
        if (err) {
          return done(err);
        }
        if (available) {
          tasks.push(_.partial(codesign, {
            identity: opts.identity,
            appPath: opts.appPath
          }));
        } else {
          codesign.printWarning();
        }

        tasks.push(_.partial(createDMG, opts));
        async.series(tasks, done);
      });
    };
  } else {
    /**
     * ## Linux Configuration
     */
    var LINUX_APPNAME = cli.argv.name;
    var LINUX_OUT_X64 = path.join(CONFIG.out,
      format('%s-linux-x64', LINUX_APPNAME));
    var LINUX_RESOURCES = path.join(LINUX_OUT_X64, 'resources');

    _.assign(CONFIG.packagerOptions, {
      name: LINUX_APPNAME
    });

    CONFIG.resources = LINUX_RESOURCES;
    CONFIG.appPath = LINUX_OUT_X64;
    CONFIG.assets = [];

    CONFIG.createInstaller = function(done) {
      cli.warn('Linux installers coming soon!');
      done();
    };
  }

  // Normalize asset names for GitHub or else spaces
  // will automatically be replaced with `.`s.
  // CONFIG.assets = CONFIG.assets.map(function(asset) {
  //   if (asset.name !== 'RELEASES') {
  //     asset.name = asset.name.replace(/ /g, '-').toLowerCase();
  //   }
  //   return asset;
  // });
  if (callback) {
    return callback(null, CONFIG);
  }
  return CONFIG;
};

module.exports = exports;
