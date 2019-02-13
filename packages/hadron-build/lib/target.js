'use strict';

const fs = require('fs');
const _ = require('lodash');
const semver = require('semver');
const path = require('path');
const normalizePkg = require('normalize-package-data');
const parseGitHubRepoURL = require('parse-github-repo-url');
const ffmpegAfterExtract = require('electron-packager-plugin-non-proprietary-codecs-ffmpeg').default;
const debug = require('debug')('hadron-build:target');

const notary = require('mongodb-notary-service-client');

function sign(src) {
  notary(src).then((res) => res && debug(':dancers: successfully signed %s', src))
  .catch((nerr) => debug('Notary failed!', nerr));
}


const tarPack = require('tar-pack').pack;

function tar(srcDirectory, dest) {
  return new Promise(function(resolve, reject) {
    tarPack(srcDirectory)
     .pipe(fs.createWriteStream(dest))
     .on('error', function(err) {
       reject(err);
     })
     .on('close', function() {
       resolve(dest);
     });
  });
}

const pify = require('pify');
const which = require('which');

function _canBuildInstaller(ext) {
  var bin = null;
  var help = null;

  if (ext === 'rpm') {
    bin = 'rpmbuild';
    help = 'https://git.io/v1iz7';
  } else if (ext === 'deb') {
    bin = 'fakeroot';
    help = 'https://git.io/v1iRV';
  } else {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    which(bin, (err, res) => {
      if (err) {
        debug(`which ${bin} error`, err);
        /* eslint no-console: 0 */
        console.warn(`Skipping ${ext} build. Please see ${help} for required setup.`);
        return resolve(false);
      }
      debug(`which ${bin}? ${res}`);
      resolve(true);
    });
  });
}

function ifEnvironmentCanBuild(ext, fn) {
  debug('checking if environment can build installer for %s', ext);
  return _canBuildInstaller(ext).then(function(can) {
    debug('can build installer for %s?', ext, true);
    if (!can) return false;
    return fn();
  });
}


function getPkg(directory) {
  const _path = path.join(directory, 'package.json');
  /* eslint no-sync: 0 */
  const pkg = JSON.parse(fs.readFileSync(_path));
  pkg._path = _path;
  normalizePkg(pkg);

  if (pkg.repository) {
    const g = parseGitHubRepoURL(pkg.repository.url);
    pkg.github_owner = g[0];
    pkg.github_repo = g[1];
  }

  // TODO (imlucas) As of electron@1.4.11, `electron-prebuilt` deprecated.
  // Need to switch everything over to `electron` package name.
  //
  // var electronVersion;
  // try {
  //   electronVersion = require('electron-prebuilt/package.json').version;
  // } catch (e) {
  //   electronVersion = require('electron/package.json').version;
  // }
  _.defaults(pkg, {
    productName: pkg.name,
    author: pkg.authors,
    electronVersion: require('electron/package.json').version
  });

  return pkg;
}


class Target {
  constructor(dir, opts = {}) {
    this.dir = dir || process.cwd();
    this.out = path.join(this.dir, 'dist');

    const pkg = getPkg(dir);
    this.pkg = pkg;

    _.defaults(opts, pkg, {
      platform: process.platform,
      arch: process.arch,
      sign: true
    });

    const distributions = pkg.config.hadron.distributions;
    this.distribution = process.env.HADRON_DISTRIBUTION || distributions.default;
    const distOpts = distributions[this.distribution];

    this.id = distOpts.name;
    this.name = distOpts.name;
    this.productName = distOpts.productName;
    this.bundleId = distOpts.bundleId;
    this.upgradeCode = distOpts.upgradeCode;

    this.version = opts.version;
    this.installerVersion = opts.installerVersion;
    this.platform = opts.platform;
    this.arch = opts.arch;
    this.description = opts.description;
    this.author = _.get(opts, 'author.name', opts.author);
    this.shortcutFolderName = opts.shortcutFolderName;
    this.programFilesFolderName = opts.programFilesFolderName;

    this.slug = this.name;
    this.semver = new semver.SemVer(this.version);
    this.channel = 'stable';

    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    const mtch = this.version.match(/-([a-z]+)(\.\d+)?$/);
    if (mtch) {
      this.channel = mtch[1].toLowerCase();
      this.slug += `-${this.channel}`;
    }

    if (this.channel === 'dev' && process.env.ALPHA) {
      this.version = [
        this.semver.major,
        this.semver.minor,
        this.semver.patch
      ].join('.');

      const moment = require('moment');
      this.version += `-alpha.${moment().format('YYYYMMDDHHmm')}`;

      pkg.version = this.version;
      this.semver = new semver.SemVer(this.version);
      this.channel = 'alpha';

      this.slug = [
        this.name,
        this.channel
      ].join('-');
    }

    /**
     * Add `channel` suffix to product name, e.g. "Atom Beta".
     */
    if (this.channel !== 'stable') {
      this.productName += ' ' + _.capitalize(this.channel);
    }

    this.packagerOptions = {
      dir: this.dir,
      out: this.out,
      overwrite: true,
      appCopyright: `${new Date().getFullYear()} ${this.author}`,
      buildVersion: this.version,
      appVersion: this.version,
      ignore: 'node_modules/|.cache/|dist/|test/|.user-data|.deps/',
      platform: this.platform,
      arch: this.arch,
      electronVersion: this.electronVersion,
      sign: null,
      afterExtract: [
        ffmpegAfterExtract
      ],
      tmpdir: false
    };

    if (this.platform === 'win32') {
      this.configureForWin32();
    } else if (this.platform === 'darwin') {
      this.configureForDarwin();
    } else {
      this.configureForLinux();
    }
    debug('target ready', this);
  }
  /**
   * Get an absolute path to a source file.
   * @return {String}
   */
  src(...args) {
    if (_.first(args) === undefined) return undefined;
    args.unshift(this.dir);
    return path.join.apply(path, args);
  }

  /**
   * Get an absolute path to a file in the output directory.
   * @return {String}
   */
  dest(...args) {
    if (_.first(args) === undefined) return undefined;
    args.unshift(this.out);
    return path.join.apply(path, args);
  }

  write(filename, contents) {
    return new Promise((resolve, reject) => {
      let dest = '';
      if (this.platform === 'darwin') {
        dest = path.join(this.appPath, '..', filename);
      } else {
        dest = path.join(this.appPath, filename);
      }
      debug(`Writing ${contents.length} bytes to ${dest}`);
      fs.writeFile(dest, contents, err => {
        if (err) {
          return reject(err);
        }
        resolve(dest);
      });
    });
  }

  /**
   * Apply Windows specific configuration.
   */
  configureForWin32() {
    const platformSettings = _.get(this.pkg, 'config.hadron.build.win32', {});

    /**
     * TODO (imlucas) Delta support for Windows auto-update.
     *
     * Will produce another asset: `${nugget.name}-${nugget.name}-delta.nupkg`
     *
     * To enable, set the options below for installerOptions:
     * remoteReleases: _.get(pkg, 'config.hadron.endpoint'),
     * remoteToken: this.githubToken,
     */
    Object.assign(this.packagerOptions, {
      name: this.productName.replace(/ /g, ''),
      icon: this.src(platformSettings.icon),
      'version-string': {
        CompanyName: this.author,
        FileDescription: this.description,
        ProductName: this.productName,
        InternalName: this.name
      }
    });

    this.appPath = this.dest(`${this.packagerOptions.name}-${this.platform}-${this.arch}`);
    this.resources = this.dest(`${this.packagerOptions.name}-${this.platform}-${this.arch}`, 'resources');
    /**
     * Remove `.` from version tags for NUGET version
     */
    const nuggetVersion = this.version.replace(new RegExp(`-${this.channel}\\.(\\d+)`), `-${this.channel}$1`);

    /**
     * TODO (imlucas) Remove these after evergreen.yml updated to use inline templating.
     */
    this.windows_msi_label = this.windows_msi_filename = `${this.productName.replace(/\s/g, '')}.msi`;
    this.windows_setup_label = this.windows_setup_filename = `${this.productName}Setup.exe`;
    this.windows_zip_label = this.windows_zip_filename = `${this.productName}-windows.zip`;
    this.windows_nupkg_full_label = this.windows_nupkg_full_filename = `${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`;

    this.assets = [
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.exe`,
        path: this.dest(this.windows_setup_label)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.msi`,
        path: this.dest(this.windows_msi_label)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`,
        path: this.dest(this.windows_zip_label)
      },
      {
        name: `${this.slug}-RELEASES`,
        path: this.dest('RELEASES')
      },
      {
        name: 'LICENSE',
        path: this.dest('LICENSE')
      },
      {
        name: 'version',
        path: this.dest('version')
      },
      {
        name: `${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`,
        path: this.dest(`${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`)
      }
    ];

    this.installerOptions = {
      loadingGif: this.src(platformSettings.loading_gif),
      iconUrl: platformSettings.favicon_url,
      appDirectory: this.appPath,
      outputDirectory: this.packagerOptions.out,
      authors: this.author,
      version: this.version,
      exe: `${this.packagerOptions.name}.exe`,
      setupExe: this.windows_setup_filename,
      title: this.productName,
      productName: this.productName,
      description: this.description,
      name: this.packagerOptions.name,
      noMsi: true
    };

    /**
     * @see https://jira/mongodb.org/browse/BUILD-920
     */
    const signWithParams = process.env.NOTARY_AUTH_TOKEN ? 'yes' : process.env.SIGNTOOL_PARAMS;
    this.installerOptions.signWithParams = signWithParams;

    /**
     * The ICO file to use as the icon for the generated Setup.exe.
     */
    if (platformSettings.setup_icon) {
      this.installerOptions.setupIcon = this.src(platformSettings.setup_icon);
    }

    this.createInstaller = () => {
      const electronWinstaller = require('electron-winstaller');
      return electronWinstaller
        .createWindowsInstaller(this.installerOptions)
        .then(() => {
          const { MSICreator } = require('@mongodb-js/electron-wix-msi');
          const msiCreator = new MSICreator({
            appDirectory: this.appPath,
            outputDirectory: this.packagerOptions.out,
            exe: this.packagerOptions.name,
            name: this.productName,
            description: this.description,
            manufacturer: this.author,
            version: this.installerVersion || this.version,
            signWithParams: signWithParams,
            shortcutFolderName: this.shortcutFolderName || this.author,
            programFilesFolderName: this.programFilesFolderName || this.productName,
            appUserModelId: this.bundleId,
            upgradeCode: this.upgradeCode,
            ui: {
              chooseDirectory: true
            }
          });

          return msiCreator.create().then(() => {
            return msiCreator.compile();
          });
        });
    };
  }

  /**
   * Apply macOS specific configuration.
   */
  configureForDarwin() {
    this.truncatedProductName = this.productName.substring(0, 25);
    const platformSettings = _.get(this.pkg, 'config.hadron.build.darwin', {
      app_category_type: 'public.app-category.productivity',
      icon: `${this.id}.icns`
    });


    // this.resources = OSX_RESOURCES;
    const OSX_DOT_APP = this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`);
    this.appPath = OSX_DOT_APP;
    this.resources = this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`, 'Contents', 'Resources');

    Object.assign(this.packagerOptions, {
      name: this.productName,
      icon: this.src(platformSettings.icon),
      appBundleId: this.bundleId,
      appCategoryType: platformSettings.app_category_type,
      protocols: _.get(this, 'config.hadron.protocols', [])
    });

    if (this.channel !== 'stable') {
      this.packagerOptions.appBundleId += `.${this.channel}`;
    }

    this.osx_dmg_label = this.osx_dmg_filename = `${this.productName}.dmg`;
    this.osx_zip_label = this.osx_zip_filename = `${this.productName}.zip`;

    this.assets = [
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.dmg`,
        path: this.dest(`${this.productName}.dmg`)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`,
        path: this.dest(`${this.productName}.zip`)
      }
    ];

    this.installerOptions = {
      dmgPath: this.dest(`${this.productName}.dmg`),
      title: this.truncatedProductName, // actually names the dmg
      overwrite: true,
      out: this.out,
      icon: this.packagerOptions.icon,
      identity_display: platformSettings.codesign_identity,
      identity: platformSettings.codesign_sha1,
      appPath: this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`),
      /**
       * Background image for `.dmg`.
       * @see http://npm.im/electron-installer-dmg
       */
      background: this.src(platformSettings.dmg_background || 'background.png'),
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
          path: this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`)
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

    this.createInstaller = () => {
      return new Promise((resolve, reject) => {
        const tasks = [];
        const opts = this.installerOptions;
        const async = require('async');
        const createDMG = require('electron-installer-dmg');
        const codesign = require('electron-installer-codesign');
        codesign.isIdentityAvailable(opts.identity_display, (err, available) => {
          if (err) {
            return reject(err);
          }
          if (available) {
            tasks.push(_.partial(codesign, {
              identity: opts.identity,
              appPath: this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`)
            }));
          } else {
            codesign.printWarning();
          }

          tasks.push(_.partial(createDMG, opts));
          async.series(tasks, _err => {
            if (_err) {
              return reject(_err);
            }
            resolve();
          });
        });
      });
    };
  }

  /**
   * Apply Linux specific configuration.
   */
  configureForLinux() {
    const platformSettings = _.get(this.pkg, 'config.hadron.build.linux', {});

    this.appPath = this.dest(`${this.productName}-${this.platform}-${this.arch}`);
    this.resources = path.join(this.appPath, 'resources');

    Object.assign(this.packagerOptions, {
      name: this.productName
    });

    const debianVersion = this.version.replace(/\-/g, '~');
    const debianArch = this.arch === 'x64' ? 'amd64' : 'i386';
    const debianSection = _.get(platformSettings, 'deb_section');
    this.linux_deb_filename = `${this.slug}_${debianVersion}_${debianArch}.deb`;

    const rhelVersion = [this.semver.major, this.semver.minor, this.semver.patch].join('.');
    const rhelRevision = this.semver.prerelease.join('.') || '1';
    const rhelArch = this.arch === 'x64' ? 'x86_64' : 'i386';
    const rhelCategories = _.get(platformSettings, 'rpm_categories');
    this.linux_rpm_filename = `${this.slug}-${this.version}.${rhelArch}.rpm`;

    var isRhel = process.env.EVERGREEN_BUILD_VARIANT === 'rhel';
    this.linux_tar_filename = `${this.slug}-${this.version}-${isRhel ? 'rhel' : this.platform}-${this.arch}.tar.gz`;

    this.assets = [
      {
        name: this.linux_deb_filename,
        path: this.dest(this.linux_deb_filename)
      },
      {
        name: this.linux_rpm_filename,
        path: this.dest(this.linux_rpm_filename)
      },
      {
        name: this.linux_tar_filename,
        path: this.dest(this.linux_tar_filename)
      }
    ];

    var license = this.pkg.license;
    if (license === 'UNLICENSED') {
      license = `Copyright © ${new Date().getFullYear()} ${this.author}. All Rights Reserved.`;
    }

    this.installerOptions = {
      deb: {
        src: this.appPath,
        dest: this.out,
        arch: debianArch,
        icon: this.src(platformSettings.icon),
        name: this.slug,
        version: debianVersion,
        bin: this.productName,
        section: debianSection,
        depends: [
          'libsecret-1-0',
          'libgconf-2-4'
        ]
      },
      rpm: {
        src: this.appPath,
        dest: this.out,
        arch: rhelArch,
        icon: this.src(platformSettings.icon),
        name: this.slug,
        version: rhelVersion,
        revision: rhelRevision,
        rename: (dest) => {
          return path.join(dest, this.linux_rpm_filename);
        },
        bin: this.productName,
        requires: [
          'lsb-core-noarch',
          'libXScrnSaver',
          'libsecret',
          'GConf2'
        ],
        categories: rhelCategories,
        license: license
      }
    };

    const createRpmInstaller = () => {
      return ifEnvironmentCanBuild('rpm', () => {
        const createRpm = pify(require('electron-installer-redhat'));
        debug('creating rpm...', this.installerOptions.rpm);
        return createRpm(this.installerOptions.rpm).then(() => {
          return sign(this.dest(this.linux_rpm_filename));
        });
      });
    };

    const createDebInstaller = () => {
      return ifEnvironmentCanBuild('deb', () => {
        const createDeb = pify(require('electron-installer-debian'));
        debug('creating deb...', this.installerOptions.deb);
        return createDeb(this.installerOptions.deb).then(() => {
          return sign(this.dest(this.linux_deb_filename));
        });
      });
    };

    const createTarball = () => {
      debug('creating tarball %s -> %s', tar(this.appPath, this.dest(this.linux_tar_filename)));
      return tar(this.appPath, this.dest(this.linux_tar_filename));
    };

    this.createInstaller = () => {
      return Promise.all([
        createRpmInstaller(),
        createDebInstaller(),
        createTarball()
      ]);
    };
  }

  /**
   * Get an asset from the manifest by file extension.
   * @param {String} extname
   * @return {null|Asset}
   * @example
   * target.getAssetWithExtension('.zip')
   * >>> {name: 'hadron-app-darwin-x64.zip', path:...}
   * target.getAssetWithExtension('.k7z')
   * >>> null
   */
  getAssetWithExtension(extname) {
    const res = this.assets.filter(function(asset) {
      return path.extname(asset.path) === extname;
    });
    debug('%s -> ', extname, res);

    return res[0];
  }
}

module.exports = Target;
