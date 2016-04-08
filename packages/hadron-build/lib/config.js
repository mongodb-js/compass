#!/usr/bin/env node

/**
 * # config
 */
var util = require('util');
var format = util.format;
var inspect = util.inspect;
var path = require('path');
var normalizePkg = require('normalize-package-data');
var pkg = normalizePkg(require(path.join(process.cwd, 'package.json')));
var _ = require('lodash');
var async = require('async');
var createDMG = require('electron-installer-dmg');
var codesign = require('electron-installer-codesign');
var electronWinstaller = require('electron-winstaller');
var createCLI = require('mongodb-js-cli');
var Table = require('cli-table');
var parseGitHubRepoURL = require('parse-github-repo-url');
var electronPrebuiltVersion = require('electron-prebuilt/package.json').version;

var parsedGit = parseGitHubRepoURL(pkg.repository.url);


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
  },
  favicon_url: {
    description: 'A URL to an ICO file to use as the application icon (e.g. Windows: displayed in Control Panel > Programs and Features)',
    default: _.get(pkg, 'hadron.build.win32.favicon_url')
  },
  commit_sha1: {
    // TODO (imlucas) evergeen sets an environment variable
    default: 'master'
  },
  github_token: {
    description: 'GitHub API token.',
    default: process.env.GITHUB_TOKEN
  },
  github_owner: {
    default: parsedGit[0]
  },
  github_repo: {
    default: parsedGit[1]
  },
  author: {
    default: pkg.author || pkg.authors
  }
};

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
  var channel = 'stable';
  if (cli.argv.version.indexOf('-beta') > -1) {
    channel = 'beta';
  } else if (cli.argv.version.indexOf('-dev') > -1) {
    channel = 'dev';
  }

  var PRODUCT_NAME = cli.argv.product_name;

  if (channel === 'beta') {
    PRODUCT_NAME += ' (Beta)';
  } else if (channel === 'dev') {
    PRODUCT_NAME += ' (Dev)';
  }

  var ID = cli.argv.internal_name;

  /**
   * TODO (imlucas) beta and dev channels should have different
   * icons.
   */

  /**
   * TODO (imlucas) Make `CONFIG` a proper interface class
   * with implementors based on `platform`.
   */
  var CONFIG = cli.argv;

  /**
   * First add to `CONFIG` the common keys which are
   * not platform specific.
   */
  _.assign(CONFIG, {
    dir: PROJECT_ROOT,
    out: path.join(PROJECT_ROOT, 'dist'),
    overwrite: true,
    'app-copyright': format('%s %s', new Date().getFullYear(), CONFIG.author),
    'build-version': cli.argv.version,
    'app-version': cli.argv.version,
    ignore: new RegExp('node_modules/|.cache/|dist/|test/'),
    platform: cli.argv.platform,
    arch: cli.argv.arch,
    version: cli.argv.electron_version,
    description: cli.argv.description,
    'version-string': {
      CompanyName: CONFIG.author,
      FileDescription: cli.argv.description,
      ProductName: cli.argv.product_name,
      InternalName: cli.argv.internal_name
    },
    images: path.join(process.cwd, 'src', 'app', 'images'),
    favicon_url: cli.argv.favicon_url,
    channel: channel,
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
   * Next, define stubs for platform specific options.
   */
  _.assign(CONFIG, {
    name: null,
    icon: null,
    appPath: null,
    resources: null,
    executable: null,
    assets: [],
    createInstaller: function(done) {
      return done(new TypeError(
        'createInstaller not defined for this platform!'));
    }
  });

  if (cli.argv.platform === 'win32') {
    /**
     * ## Windows Configuration
     */
    var WINDOWS_APPNAME = PRODUCT_NAME.replace(/ /g, '');
    var WINDOWS_OUT_X64 = path.join(CONFIG.out,
      format('%s-win32-x64', WINDOWS_APPNAME));

    var WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');
    var WINDOWS_EXECUTABLE = path.join(WINDOWS_OUT_X64,
      format('%s.exe', WINDOWS_APPNAME));

    var WINDOWS_ICON = path.join(process.cwd,
      _.get(pkg, 'hadron.build.win32.icon'));

    var WINDOWS_LOADING_GIF = path.join(process.cwd,
      _.get(pkg, 'hadron.build.win32.loading_gif'));

    var WINDOWS_OUT_SETUP_EXE = path.join(CONFIG.out,
      format('%sSetup.exe', WINDOWS_APPNAME));

    var WINDOWS_OUT_MSI = path.join(CONFIG.out,
      format('%sSetup.msi', WINDOWS_APPNAME));

    _.assign(CONFIG, {
      name: WINDOWS_APPNAME,
      icon: WINDOWS_ICON,
      loading_gif: WINDOWS_LOADING_GIF,
      sign_with_params: cli.argv.signtool_params,
      appPath: WINDOWS_OUT_X64,
      resources: WINDOWS_RESOURCES,
      executable: WINDOWS_EXECUTABLE,
      assets: [
        {
          name: path.basename(WINDOWS_OUT_SETUP_EXE),
          label: 'Windows Installer',
          path: WINDOWS_OUT_SETUP_EXE
        },
        {
          name: path.basename(WINDOWS_OUT_MSI),
          label: 'Windows Installer Package',
          path: WINDOWS_OUT_MSI
        },
        {
          path: path.join(CONFIG.out, 'RELEASES')
        },
        {
          path: path.join(CONFIG.out, format('%s-%s-full.nupkg',
            WINDOWS_APPNAME, CONFIG['app-version']))
        },
        {
          name: format('%s-windows.zip', ID),
          path: path.join(CONFIG.out, format('%s.zip', WINDOWS_APPNAME))
        }
        /**
         * TODO (imlucas) Uncomment when hadron-endpoint-server deployed.
         path.join(CONFIG.out, format('%s-%s-delta.nupkg', WINDOWS_APPNAME, CONFIG['app-version']));
         */
      ]
    });

    CONFIG.createInstaller = function(done) {
      electronWinstaller.createWindowsInstaller({
        appDirectory: WINDOWS_OUT_X64,
        outputDirectory: CONFIG.out,
        authors: CONFIG['version-string'].CompanyName,
        version: CONFIG['app-version'],
        exe: format('%s.exe', CONFIG.name),
        signWithParams: CONFIG.sign_with_params,
        loadingGif: CONFIG.loading_gif,
        title: PRODUCT_NAME,
        productName: PRODUCT_NAME,
        description: CONFIG.description,
        /**
         * TODO (imlucas) Uncomment when hadron-endpoint-server deployed.
         * remoteReleases: _.get(pkg, 'hadron.endpoint'),
         * remoteToken: process.env.GITHUB_TOKEN,
         */
        /**
         * TODO (imlucas) The ICO file to use as the icon for the
         * generated Setup.exe. Defaults to the weird
         * "present" icon @thomasr mentioned:
         *  https://raw.githubusercontent.com/Squirrel/Squirrel.Windows/master/src/Setup/Setup.ico
         * setupIcon: WINDOWS_ICON,
         */
        iconUrl: CONFIG.favicon_url,
        name: CONFIG.name,
        id: CONFIG.name
      }).then(function(res) {
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
    var OSX_IDENTITY = _.get(pkg, 'hadron.build.darwin.codesign_identity');
    var OSX_IDENTITY_SHA1 = _.get(pkg, 'hadron.build.darwin.codesign_sha1');
    var OSX_RESOURCES = path.join(OSX_DOT_APP, 'Contents', 'Resources');
    var OSX_EXECUTABLE = path.join(OSX_DOT_APP,
      'Contents', 'MacOS', 'Electron');

    var OSX_ICON = path.resolve(process.cwd, _.get(pkg, 'hadron.build.darwin.icon'));

    var OSX_OUT_DMG = path.join(CONFIG.out,
      format('%s.dmg', OSX_APPNAME));

    var OSX_OUT_ZIP = path.join(CONFIG.out,
      format('%s.zip', OSX_APPNAME));

    _.assign(CONFIG, {
      name: OSX_APPNAME,
      icon: OSX_ICON,
      appPath: OSX_DOT_APP,
      resources: OSX_RESOURCES,
      executable: OSX_EXECUTABLE,
      assets: [
        {
          name: format('%s.dmg', ID),
          path: OSX_OUT_DMG
        },
        {
          name: format('%s-mac.zip', ID),
          path: OSX_OUT_ZIP
        }
      ],
      /**
       * Background image for `.dmg`.
       * @see http://npm.im/electron-installer-dmg
       */
      background: path.resolve(process.cwd, _.get(pkg, 'hadron.build.darwin.dmg_background')),
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
      'app-bundle-id': _.get(pkg, 'hadron.build.darwin.app_bundle_id'),
      /**
       * @see http://bit.ly/LSApplicationCategoryType
       */
      'app-category-type': _.get(pkg, 'hadron.build.darwin.app_category_type'),
      protocols: _.get(pkg, 'hadron.protocols')
    });

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
        async.series(tasks, done);
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
      assets: [],
      createInstaller: function(done) {
        cli.warn('Linux installers coming soon!');
        done();
      }
    });
  }

  // Normalize asset names for GitHub or else spaces
  // will automatically be replaced with `.`s.
  CONFIG.assets = CONFIG.assets.map(function(asset) {
    asset.name = asset.name.replace(/ /g, '-').toLowerCase();
    return asset;
  });
  callback(null, CONFIG);
};

module.exports = exports;

var yaml = require('js-yaml');

exports.builder = {
  format: {
    choices: ['table', 'yaml', 'json'],
    description: 'What output format would you like?',
    default: 'table'
  }
};

exports.handler = function(argv) {
  var cli = createCLI('hadron-build:config');
  cli.argv = argv;

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
};
