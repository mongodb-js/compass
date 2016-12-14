'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const async = require('async');
const which = require('which');
const tarPack = require('tar-pack').pack;
const Target = require('./target');

exports.get = (cli, callback) => {
  /**
   * a.k.a What directory is package.json in?
   */
  const PROJECT_ROOT = _.get(cli, 'argv.cwd', process.cwd());

  cli.debug(`Loading project's root package.json from ${path.join(PROJECT_ROOT, 'package.json')}`);
  /**
   * Ensure the package.json is read from the configured
   * project root.
   */
  const PKG = require(path.join(PROJECT_ROOT, 'package.json'));

  /**
   * Build the options object to pass to `electron-packager`
   * and various `electron-installer-*` modules.
   */
  let name = _.get(cli, 'argv.name', PKG.name);
  let version = _.get(cli.argv, 'version', PKG.version);
  let PRODUCT_NAME = _.get(cli, 'argv.product_name', PKG.productName);
  let platform = _.get(cli, 'argv.platform', process.platform);
  let arch = _.get(cli, 'argv.arch', process.arch);

  /**
   * TODO (imlucas) beta and dev channels should have different
   * icons.
   */

  /**
   * TODO (imlucas) Migrating from `CONFIG` a proper interface class
   * with implementors based on `platform` called `Target`'s'.
   */
  const target = new Target({
    name: name,
    version: version,
    productName: PRODUCT_NAME
  });

  let CONFIG = _.omit(cli.argv, [
    '_', 'help', 'verbose', 'sign', 'format', '$0',
    'signtool_params', 'favicon_url'
  ]);

  /**
   * First add to `CONFIG` the common keys which are
   * not platform specific.
   */
  CONFIG.id = target.id;
  CONFIG.slug = target.slug;
  CONFIG.out = path.join(PROJECT_ROOT, 'dist');
  platform = platform;
  CONFIG.arch = arch;
  CONFIG.channel = target.channel;
  CONFIG.productName = target.productName;
  CONFIG.productNameTitleCase = target.productName.replace(/ /g, '');
  CONFIG.dir = PROJECT_ROOT;
  CONFIG.version = version;

  CONFIG.packagerOptions = {
    dir: PROJECT_ROOT,
    out: path.join(PROJECT_ROOT, 'dist'),
    overwrite: true,
    'app-copyright': `${new Date().getFullYear()} ${CONFIG.author}`,
    'build-version': CONFIG.version,
    'app-version': CONFIG.version,
    ignore: 'node_modules/|.cache/|dist/|test/|.user-data|.deps/',
    platform: platform,
    arch: CONFIG.arch,
    version: CONFIG.electron_version,
    sign: null
  };

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

  if (platform === 'win32') {
    /**
     * ## Windows Configuration
     */
    // TODO (imlucas) electron-packager calls this `basename`.
    const WINDOWS_OUT_X64 = CONFIG.dest(`${CONFIG.productNameTitleCase}-win32-x64`);

    const WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');

    const WINDOWS_ICON = CONFIG.src(_.get(PKG, 'config.hadron.build.win32.icon'));

    const WINDOWS_OUT_SETUP_EXE = CONFIG.dest(`${CONFIG.productName}Setup.exe`);

    const WINDOWS_OUT_MSI = CONFIG.dest(`${CONFIG.productName}Setup.msi`);

    CONFIG.appPath = WINDOWS_OUT_X64;
    CONFIG.resources = WINDOWS_RESOURCES;

    CONFIG.windows_msi_label = CONFIG.windows_msi_filename = path.basename(WINDOWS_OUT_MSI);
    CONFIG.windows_setup_label = CONFIG.windows_setup_filename = path.basename(WINDOWS_OUT_SETUP_EXE);
    CONFIG.windows_zip_label = CONFIG.windows_zip_filename = `${CONFIG.productName}-windows.zip`;

    const nugget = {
      name: CONFIG.productName.replace(/ /g, ''),
      /**
       * Remove `.` from version tags for NUGET version
       */
      version: CONFIG.version.replace(new RegExp(`-${CONFIG.channel}\\.(\\d+)`), `-${CONFIG.channel}$1`)
    };

    CONFIG.windows_nupkg_full_label = CONFIG.windows_nupkg_full_filename = `${nugget.name}-${nugget.version}-full.nupkg`;

    CONFIG.assets = [
      {
        name: `${CONFIG.id}-${CONFIG.version}-${platform}-${CONFIG.arch}.exe`,
        path: CONFIG.dest(CONFIG.windows_setup_filename)
      },
      {
        name: `${CONFIG.id}-${CONFIG.version}-${platform}-${CONFIG.arch}.msi`,
        path: CONFIG.dest(CONFIG.windows_msi_filename)
      },
      {
        name: `${CONFIG.id}-${CONFIG.version}-${platform}-${CONFIG.arch}.zip`,
        path: CONFIG.dest(CONFIG.windows_zip_filename)
      },
      {
        name: 'RELEASES',
        path: CONFIG.dest('RELEASES')
      },
      {
        name: 'LICENSE',
        path: CONFIG.dest('LICENSE')
      },
      {
        name: 'version',
        path: CONFIG.dest('version')
      },
      {
        name: CONFIG.windows_nupkg_full_filename,
        path: CONFIG.dest(CONFIG.windows_nupkg_full_filename)
      }
    ];

    /**
     * TODO (imlucas) Uncomment when hadron-endpoint-server deployed.
     path.join(CONFIG.out, format('%s-%s-delta.nupkg', WINDOWS_APPNAME, CONFIG['app-version']));
     */

    _.assign(CONFIG.packagerOptions, {
      name: CONFIG.productNameTitleCase,
      icon: WINDOWS_ICON,
      'version-string': {
        CompanyName: CONFIG.author,
        FileDescription: CONFIG.description,
        ProductName: CONFIG.productName,
        InternalName: CONFIG.name
      }
    });

    CONFIG.installerOptions = {
      loadingGif: CONFIG.src(_.get(PKG, 'config.hadron.build.win32.loading_gif')),
      signWithParams: cli.argv.signtool_params,
      iconUrl: cli.argv.favicon_url,
      appDirectory: CONFIG.appPath,
      outputDirectory: CONFIG.out,
      authors: CONFIG.author,
      version: CONFIG.version,
      exe: `${CONFIG.packagerOptions.name}.exe`,
      setupExe: CONFIG.windows_setup_filename,
      title: CONFIG.productName,
      productName: CONFIG.productName,
      description: CONFIG.description,
      name: nugget.name
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
      const electronWinstaller = require('electron-winstaller');
      electronWinstaller.createWindowsInstaller(CONFIG.installerOptions)
        .then(function(res) {
          cli.debug('Successfully created installers', res);
          done();
        }, done);
    };
  } else if (platform === 'darwin') {
    /**
     * ## OS X Configuration
     */
    const createDMG = require('electron-installer-dmg');
    const codesign = require('electron-installer-codesign');

    const OSX_APPNAME = CONFIG.productName;
    const OSX_OUT_X64 = CONFIG.dest(`${OSX_APPNAME}-darwin-x64`);
    const OSX_DOT_APP = path.join(OSX_OUT_X64, `${OSX_APPNAME}.app`);
    const OSX_RESOURCES = path.join(OSX_DOT_APP, 'Contents', 'Resources');

    const OSX_ICON = CONFIG.src(_.get(PKG, 'config.hadron.build.darwin.icon', `${CONFIG.id}.icns`));

    const OSX_OUT_DMG = CONFIG.dest(`${OSX_APPNAME}.dmg`);

    const OSX_OUT_ZIP = CONFIG.dest(`${OSX_APPNAME}.zip`);

    _.assign(CONFIG.packagerOptions, {
      name: OSX_APPNAME,
      icon: OSX_ICON,
      'app-bundle-id': cli.argv.app_bundle_id || _.get(PKG,
        'config.hadron.build.darwin.app_bundle_id'),
      /**
       * @see http://bit.ly/LSApplicationCategoryType
       */
      'app-category-type': _.get(PKG,
        'config.hadron.build.darwin.app_category_type',
        'public.app-category.productivity'
      ),
      protocols: _.get(PKG, 'config.hadron.protocols', [])
    });

    if (CONFIG.channel !== 'stable') {
      CONFIG.packagerOptions['app-bundle-id'] += `.${CONFIG.channel}`;
    }

    CONFIG.osx_dmg_label = CONFIG.osx_dmg_filename = path.basename(OSX_OUT_DMG);
    CONFIG.osx_zip_label = CONFIG.osx_zip_filename = path.basename(OSX_OUT_ZIP);

    CONFIG.appPath = OSX_DOT_APP;
    CONFIG.resources = OSX_RESOURCES;
    CONFIG.assets = [
      {
        name: `${CONFIG.id}-${CONFIG.version}-${platform}-${CONFIG.arch}.dmg`,
        path: OSX_OUT_DMG
      },
      {
        name: `${CONFIG.id}-${CONFIG.version}-${platform}-${CONFIG.arch}.zip`,
        path: OSX_OUT_ZIP
      }
    ];

    const OSX_IDENTITY = _.get(PKG, 'config.hadron.build.darwin.codesign_identity');
    const OSX_IDENTITY_SHA1 = _.get(PKG, 'config.hadron.build.darwin.codesign_sha1');

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
      background: CONFIG.src(_.get(PKG, 'config.hadron.build.darwin.dmg_background',
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
          x: 322,
          y: 243,
          type: 'link',
          path: '/Applications'
        },
        /**
         * Show a shortcut on the left for the application icon.
         */
        {
          x: 93,
          y: 243,
          type: 'file',
          path: OSX_DOT_APP
        }
      ]
    };

    /**
     * TODO (imlucas) Auto-generate homebrew cask.
     *
     * @see https://github.com/caskroom/homebrew-versions/blob/master/Casks/mongodb-compass-beta.rb
     * @see https://caskroom.github.io/
     */
    // const url = 'https://s3.mysite.com/hadron-#{version}-darwin-x64.dmg';
    // const caskContents = dedent`cask '${CONFIG.id}' do
    //   version '1.5.0-beta.0'
    //   sha256 '${sha_of_dmg_contents}'
    //
    //   url "${url}"
    //   name '${CONFIG.productName}'
    //   homepage '${product_url_or_homepage_url_from_packagejson}'
    //
    //   app '${CONFIG.productName}.app'
    // end`;
    // // write caskContents to `${CONFIG.id}.rb` asset

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
    const LINUX_OUT_X64 = CONFIG.dest(`${CONFIG.productName}-linux-x64`);
    const LINUX_RESOURCES = path.join(LINUX_OUT_X64, 'resources');

    const LINUX_ICON = CONFIG.src(_.get(PKG, 'config.hadron.build.linux.icon'));

    const LINUX_OUT_DEB = CONFIG.dest(`${CONFIG.slug}-${CONFIG.version}-${CONFIG.arch}.deb`);
    const LINUX_OUT_RPM = CONFIG.dest(`${CONFIG.slug}.${CONFIG.version}.${CONFIG.arch}.rpm`);
    const LINUX_OUT_TAR = CONFIG.dest(`${CONFIG.slug}-${CONFIG.version}-${platform}-${CONFIG.arch}.tar.gz`);
    const LINUX_OUT_ZIP = CONFIG.dest(`${CONFIG.slug}.zip`);

    _.assign(CONFIG.packagerOptions, {
      name: CONFIG.productName
    });

    CONFIG.resources = LINUX_RESOURCES;
    CONFIG.appPath = LINUX_OUT_X64;
    CONFIG.assets = [
      {
        name: `${CONFIG.slug}-${CONFIG.version}-${platform}-${CONFIG.arch}.tar.gz`,
        path: LINUX_OUT_TAR
      },
      {
        name: `${CONFIG.slug}-${CONFIG.version}-${platform}-${CONFIG.arch}.deb`,
        path: LINUX_OUT_DEB
      },
      {
        name: `${CONFIG.slug}.${CONFIG.version}.${platform}.${CONFIG.arch}.rpm`,
        path: LINUX_OUT_RPM
      },
      {
        name: `${CONFIG.slug}-${CONFIG.version}-${platform}-${CONFIG.arch}.zip`,
        path: LINUX_OUT_ZIP
      }
    ];

    CONFIG.createInstaller = (done) => {
      async.parallel([
        function(cb) {
          which('rpmbuild', function(err) {
            if (err) {
              cli.warn('Your environment is not configured correctly to build ' +
              'rpm packages. Please see https://git.io/v1iz7');
              return cb();
            }
            /**
             * TODO (imlucas) Use pretty Redhat metadata and options.
             * @see https://github.com/unindented/electron-installer-redhat#options
             */
            const rpmOptions = {
              src: LINUX_OUT_X64,
              dest: CONFIG.out,
              arch: CONFIG.arch,
              icon: LINUX_ICON,
              name: CONFIG.slug,
              version: [target.semver.major, target.semver.minor, target.semver.patch].join('.'),
              revision: target.semver.prerelease.join('.') || '1'
            };
            cli.debug('calling electron-installer-redhat with options', rpmOptions);
            const createRpm = require('electron-installer-redhat');
            createRpm(rpmOptions, cb);
          });
        },
        function(cb) {
          which('fakeroot', function(err) {
            if (err) {
              cli.warn('Your environment is not configured correctly to build ' +
              'debian packages. Please see https://git.io/v1iRV');
              return cb();
            }
            /**
             * TODO (imlucas) Use pretty debian metadata and options.
             * @see https://github.com/unindented/electron-installer-debian#options
             */
            const debOptions = {
              src: LINUX_OUT_X64,
              dest: CONFIG.out,
              arch: CONFIG.arch,
              icon: LINUX_ICON,
              name: CONFIG.slug,
              version: CONFIG.version.replace(/\./g, '~')
            };
            cli.debug('calling electron-installer-debian with options', debOptions);
            const createDeb = require('electron-installer-debian');
            createDeb(debOptions, cb);
          });
        },
        /**
         * Create tarball
         */
        function(cb) {
          tarPack(LINUX_OUT_X64)
           .pipe(fs.createWriteStream(LINUX_OUT_TAR))
           .on('error', function(err) {
             cb(err);
           })
           .on('close', function() {
             cb();
           });
        }
      ], function(err, res) {
        if (err) {
          return done(err);
        }
        cli.debug('created linux installers', res);
        /**
         * TODO (imlucas) Integrate with notary-service to sign assets.
         */
        done();
      });
    };
  }

  if (callback) {
    return callback(null, CONFIG);
  }
  return CONFIG;
};

module.exports = exports;
