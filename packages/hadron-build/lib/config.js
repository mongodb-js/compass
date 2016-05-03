'use strict';

const assert = require('assert');
const path = require('path');
const pkg = require('./package');
const _ = require('lodash');
const async = require('async');
const createDMG = require('electron-installer-dmg');
const codesign = require('electron-installer-codesign');
const electronWinstaller = require('electron-winstaller');
const electronPrebuiltVersion = require('electron-prebuilt/package.json').version;

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

exports.get = (cli, callback) => {
  /**
   * a.k.a What directory is package.json in?
   */
  const PROJECT_ROOT = process.cwd();

  /**
   * Build the options object to pass to `electron-packager`
   * and various `electron-installer-*` modules.
   */
  let channel = 'stable';
  if (cli.argv.version.indexOf('-beta') > -1) {
    channel = 'beta';
  } else if (cli.argv.version.indexOf('-dev') > -1) {
    channel = 'dev';
  }

  let PRODUCT_NAME = cli.argv.product_name;
  assert(cli.argv.product_name);

  if (channel === 'beta') {
    PRODUCT_NAME += ' Beta';
  } else if (channel === 'dev') {
    PRODUCT_NAME += ' Dev';
  }

  let ID = cli.argv.name;

  /**
   * TODO (imlucas) beta and dev channels should have different
   * icons.
   */

  /**
   * TODO (imlucas) Make `CONFIG` a proper interface class
   * with implementors based on `platform`.
   */
  let CONFIG = _.omit(cli.argv, [
    '_', 'help', 'verbose', 'sign', 'format', '$0',
    'signtool_params', 'favicon_url'
  ]);

  CONFIG.packagerOptions = {
    dir: PROJECT_ROOT,
    out: path.join(PROJECT_ROOT, 'dist'),
    overwrite: true,
    'app-copyright': `${new Date().getFullYear()} ${CONFIG.author}`,
    'build-version': CONFIG.version,
    'app-version': CONFIG.version,
    ignore: 'node_modules/|.cache/|dist/|test/|.user-data',
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
  CONFIG.productName = PRODUCT_NAME;
  CONFIG.dir = PROJECT_ROOT;

  CONFIG.src = function() {
    let args = Array.prototype.slice.call(arguments);
    if (args[0] === undefined) return undefined;

    args.unshift(CONFIG.dir);
    return path.join.apply(path, args);
  };

  CONFIG.dest = function() {
    let args = Array.prototype.slice.call(arguments, 0);
    if (args[0] === undefined) return undefined;

    args.unshift(CONFIG.out);
    return path.join.apply(path, args);
  };

  if (cli.argv.platform === 'win32') {
    /**
     * ## Windows Configuration
     */
    const WINDOWS_APPNAME = CONFIG.productName.replace(/ /g, '');
    // TODO (imlucas) electron-packager calls this `basename`.
    const WINDOWS_OUT_X64 = CONFIG.dest(`${CONFIG.productName}-win32-x64`);

    const WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');

    const WINDOWS_ICON = CONFIG.src(_.get(pkg, 'config.hadron.build.win32.icon'));

    const WINDOWS_OUT_SETUP_EXE = CONFIG.dest(`${WINDOWS_APPNAME}Setup.exe`);

    const WINDOWS_OUT_MSI = CONFIG.dest(`${CONFIG.productName}Setup.msi`);

    CONFIG.appPath = WINDOWS_OUT_X64;
    CONFIG.resources = WINDOWS_RESOURCES;

    CONFIG.windows_msi_filename = path.basename(WINDOWS_OUT_MSI);
    CONFIG.windows_msi_label = 'Windows Installer Package';

    CONFIG.windows_setup_filename = path.basename(WINDOWS_OUT_SETUP_EXE);
    CONFIG.windows_setup_label = 'Windows Installer';

    CONFIG.windows_zip_filename = `${WINDOWS_APPNAME}-windows.zip`;
    CONFIG.windows_zip_label = 'Windows Zip';

    CONFIG.windows_nupkg_full_filename = `${WINDOWS_APPNAME}-${CONFIG.version}-full.nupkg`;
    CONFIG.windows_nupkg_full_label = `${WINDOWS_APPNAME}-${CONFIG.version}-full.nupkg`;

    CONFIG.assets = [
      {
        name: CONFIG.windows_setup_filename,
        label: CONFIG.windows_setup_label,
        path: CONFIG.windows_setup_filename
      },
      {
        name: CONFIG.windows_msi_filename,
        label: CONFIG.windows_msi_label,
        path: CONFIG.windows_msi_filename
      },
      {
        name: 'RELEASES',
        path: 'RELEASES'
      },
      {
        name: CONFIG.windows_nupkg_full_filename,
        label: CONFIG.windows_nupkg_full_label,
        path: CONFIG.windows_nupkg_full_filename
      },
      {
        name: CONFIG.windows_zip_filename,
        label: CONFIG.windows_zip_label,
        path: CONFIG.windows_zip_filename
      }
      /**
       * TODO (imlucas) Uncomment when hadron-endpoint-server deployed.
       path.join(CONFIG.out, format('%s-%s-delta.nupkg', WINDOWS_APPNAME, CONFIG['app-version']));
       */
    ];

    _.assign(CONFIG.packagerOptions, {
      name: CONFIG.productName,
      icon: WINDOWS_ICON,
      'version-string': {
        CompanyName: CONFIG.author,
        FileDescription: CONFIG.description,
        ProductName: CONFIG.productName,
        InternalName: CONFIG.name
      }
    });

    CONFIG.installerOptions = {
      loadingGif: CONFIG.src(_.get(pkg, 'config.hadron.build.win32.loading_gif')),
      signWithParams: cli.argv.signtool_params,
      iconUrl: cli.argv.favicon_url,
      appDirectory: CONFIG.appPath,
      outputDirectory: CONFIG.out,
      authors: CONFIG.author,
      version: CONFIG.version,
      exe: `${WINDOWS_APPNAME}.exe`,
      setupExe: `${WINDOWS_APPNAME}Setup.exe`,
      title: CONFIG.productName,
      productName: CONFIG.productName,
      description: CONFIG.description,
      name: WINDOWS_APPNAME
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

    CONFIG.createInstaller = (done) => {
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
    const OSX_APPNAME = CONFIG.productName;
    const OSX_OUT_X64 = CONFIG.dest(`${OSX_APPNAME}-darwin-x64`);
    const OSX_DOT_APP = path.join(OSX_OUT_X64, `${OSX_APPNAME}.app`);
    const OSX_RESOURCES = path.join(OSX_DOT_APP, 'Contents', 'Resources');

    const OSX_ICON = CONFIG.src(_.get(pkg, 'config.hadron.build.darwin.icon', `${ID}.icns`));

    const OSX_OUT_DMG = CONFIG.dest(`${OSX_APPNAME}.dmg`);

    const OSX_OUT_ZIP = CONFIG.dest(`${OSX_APPNAME}.zip`);

    _.assign(CONFIG.packagerOptions, {
      name: OSX_APPNAME,
      icon: OSX_ICON,
      'app-bundle-id': cli.argv.app_bundle_id || _.get(pkg,
        'config.hadron.build.darwin.app_bundle_id'),
      /**
       * @see http://bit.ly/LSApplicationCategoryType
       */
      'app-category-type': _.get(pkg,
        'config.hadron.build.darwin.app_category_type',
        'public.app-category.productivity'
      ),
      protocols: _.get(pkg, 'config.hadron.protocols', [])
    });

    if (CONFIG.channel !== 'stable') {
      CONFIG.packagerOptions['app-bundle-id'] += `.${CONFIG.channel}`;
    }

    CONFIG.osx_dmg_filename = path.basename(OSX_OUT_DMG);
    CONFIG.osx_dmg_label = 'OS X Installer';

    CONFIG.osx_zip_filename = path.basename(OSX_OUT_ZIP);
    CONFIG.osx_zip_label = 'OS X Zip';

    CONFIG.appPath = OSX_DOT_APP;
    CONFIG.resources = OSX_RESOURCES;
    CONFIG.assets = [
      {
        name: `${ID}.dmg`,
        path: OSX_OUT_DMG
      },
      {
        name: `${ID}-mac.zip`,
        path: OSX_OUT_ZIP
      }
    ];

    const OSX_IDENTITY = _.get(pkg, 'config.hadron.build.darwin.codesign_identity');
    const OSX_IDENTITY_SHA1 = _.get(pkg, 'config.hadron.build.darwin.codesign_sha1');
    CONFIG.installerOptions = {
      dmgPath: OSX_OUT_DMG,
      title: CONFIG.productName,
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
      background: CONFIG.src(_.get(pkg, 'config.hadron.build.darwin.dmg_background',
        'background.png')),
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

    CONFIG.createInstaller = (done) => {
      let tasks = [];
      const opts = CONFIG.installerOptions;
      codesign.isIdentityAvailable(opts.identity_display, (err, available) => {
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
    var LINUX_OUT_X64 = CONFIG.dest(`${LINUX_APPNAME}-linux-x64`);
    var LINUX_RESOURCES = path.join(LINUX_OUT_X64, 'resources');

    _.assign(CONFIG.packagerOptions, {
      name: LINUX_APPNAME
    });

    CONFIG.resources = LINUX_RESOURCES;
    CONFIG.appPath = LINUX_OUT_X64;
    CONFIG.assets = [];

    CONFIG.createInstaller = (done) => {
      cli.warn('Linux installers coming soon!');
      done();
    };
  }

  if (callback) {
    return callback(null, CONFIG);
  }
  return CONFIG;
};

module.exports = exports;
