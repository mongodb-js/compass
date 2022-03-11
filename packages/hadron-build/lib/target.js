// eslint-disable-next-line strict
'use strict';
const chalk = require('chalk');
const childProcess = require('child_process');
const download = require('download');
const fs = require('fs');
const _ = require('lodash');
const semver = require('semver');
const path = require('path');
const { promisify } = require('util');
const normalizePkg = require('normalize-package-data');
const parseGitHubRepoURL = require('parse-github-repo-url');
const ffmpegAfterExtract = require('electron-packager-plugin-non-proprietary-codecs-ffmpeg')
  .default;
const windowsInstallerVersion = require('./windows-installer-version');
const debug = require('debug')('hadron-build:target');
const execFile = promisify(childProcess.execFile);

const notary = require('@mongodb-js/mongodb-notary-service-client');

function sign(src) {
  notary(src)
    .then((res) => res && debug(':dancers: successfully signed %s', src))
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
        console.warn(
          `Skipping ${ext} build. Please see ${help} for required setup.`
        );
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

    _.defaults(opts, { version: process.env.HADRON_APP_VERSION }, pkg, {
      platform: process.platform,
      arch: process.arch,
      sign: true
    });

    const distributions = pkg.config.hadron.distributions;
    this.distribution =
      process.env.HADRON_DISTRIBUTION || distributions.default;
    const distOpts = _.defaults(
      {
        name: process.env.HADRON_PRODUCT,
        productName: process.env.HADRON_PRODUCT_NAME,
        readonly:
          typeof process.env.HADRON_READONLY !== 'undefined'
            ? ['1', 'true'].includes(process.env.HADRON_READONLY)
            : undefined,
        isolated:
          typeof process.env.HADRON_ISOLATED !== 'undefined'
            ? ['1', 'true'].includes(process.env.HADRON_ISOLATED)
            : undefined
      },
      distributions[this.distribution]
    );

    this.id = distOpts.name;
    this.name = distOpts.name;
    this.readonly = !!distOpts.readonly;
    this.isolated = !!distOpts.isolated;
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

    this.autoUpdateBaseUrl = _.get(pkg, 'config.hadron.endpoint', null);

    this.asar = { unpack: [], ...pkg.config.hadron.asar };
    this.rebuild = { ...pkg.config.hadron.rebuild };
    this.macosEntitlements = this.src(pkg.config.hadron.macosEntitlements);

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

      this.slug = [this.name, this.channel].join('-');
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
      // We are not packaging node_modules with electron-package, so there is no
      // need to `prune`. This options also breaks when used in combination with
      // lerna hoisting / npm workpaces as some application dependencies can't
      // be resolved in app node_modules
      prune: false,
      ignore: 'node_modules/|.cache/|dist/|test/|.user-data|.deps/',
      platform: this.platform,
      arch: this.arch,
      electronVersion: this.electronVersion,
      sign: null,
      afterExtract: [ffmpegAfterExtract]
    };

    if (this.platform === 'win32') {
      this.configureForWin32();
    } else if (this.platform === 'darwin') {
      this.configureForDarwin();
    } else {
      this.configureForLinux();
    }

    this.setArchiveName();

    this.resourcesAppDir = path.join(this.resources, 'app');

    debug('target ready', this);
  }

  setArchiveName() {
    this.app_archive_name =
      this.osx_zip_filename ||
      this.windows_zip_filename ||
      this.linux_tar_filename;
  }

  /**
   * Get an absolute path to a source file.
   * @return {String}
   */
  src(...args) {
    if (args[0] === undefined) return undefined;
    return path.join(this.dir, ...args);
  }

  /**
   * Get an absolute path to a file in the output directory.
   * @return {String}
   */
  dest(...args) {
    if (args[0] === undefined) return undefined;
    return path.join(this.out, ...args);
  }

  distRoot() {
    if (this.platform === 'darwin') {
      return path.join(this.appPath, '..');
    }

    return path.join(this.appPath);
  }

  async write(filename, contents) {
    let dest = '';
    if (this.platform === 'darwin') {
      dest = path.join(this.appPath, '..', filename);
    } else {
      dest = path.join(this.appPath, filename);
    }
    debug(`Writing ${contents.length} bytes to ${dest}`);
    await fs.promises.writeFile(dest, contents);
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

    this.appPath = this.dest(
      `${this.packagerOptions.name}-${this.platform}-${this.arch}`
    );
    this.resources = this.dest(
      `${this.packagerOptions.name}-${this.platform}-${this.arch}`,
      'resources'
    );
    /**
     * Remove `.` from version tags for NUGET version
     */
    const nuggetVersion = this.version.replace(
      new RegExp(`-${this.channel}\\.(\\d+)`),
      `-${this.channel}$1`
    );

    /**
     * TODO (imlucas) Remove these after evergreen.yml updated to use inline templating.
     */
    this.windows_msi_label = this.windows_msi_filename = `${this.productName.replace(
      /\s/g,
      ''
    )}.msi`;
    this.windows_setup_label = this.windows_setup_filename = `${this.productName}Setup.exe`;
    this.windows_zip_label = this.windows_zip_filename = `${this.productName}-windows.zip`;
    this.windows_nupkg_full_label = this.windows_nupkg_full_filename = `${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`;
    this.windows_releases_label = this.windows_releases_filename = `${this.distribution}-RELEASES`;

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
        path: this.dest(this.windows_releases_label)
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
        path: this.dest(this.windows_nupkg_full_label)
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
    const signWithParams = process.env.NOTARY_AUTH_TOKEN
      ? 'yes'
      : process.env.SIGNTOOL_PARAMS;
    this.installerOptions.signWithParams = signWithParams;

    /**
     * The ICO file to use as the icon for the generated Setup.exe.
     */
    if (platformSettings.setup_icon) {
      this.installerOptions.setupIcon = this.src(platformSettings.setup_icon);
    }

    this.createInstaller = async() => {
      const electronWinstaller = require('electron-winstaller');

      await electronWinstaller.createWindowsInstaller(this.installerOptions);

      await fs.promises.rename(
        this.dest('RELEASES'),
        this.dest(`${this.distribution}-RELEASES`),
      );

      const { MSICreator } = require('@mongodb-js/electron-wix-msi');

      const msiCreator = new MSICreator({
        appDirectory: this.appPath,
        outputDirectory: this.packagerOptions.out,
        exe: this.packagerOptions.name,
        name: this.productName,
        description: this.description,
        manufacturer: this.author,
        version: windowsInstallerVersion(this.installerVersion || this.version),
        signWithParams: signWithParams,
        shortcutFolderName: this.shortcutFolderName || this.author,
        programFilesFolderName: this.programFilesFolderName || this.productName,
        appUserModelId: this.bundleId,
        upgradeCode: this.upgradeCode,
        arch: 'x64',
        extensions: ['WixUtilExtension'],
        ui: {
          chooseDirectory: true,
          images: {
            background: this.src(platformSettings.background),
            banner: this.src(platformSettings.banner)
          }
        }
      });

      await msiCreator.create();
      await msiCreator.compile();
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
    const OSX_DOT_APP = this.dest(
      `${this.productName}-darwin-x64`,
      `${this.productName}.app`
    );
    this.appPath = OSX_DOT_APP;
    this.resources = this.dest(
      `${this.productName}-darwin-x64`,
      `${this.productName}.app`,
      'Contents',
      'Resources'
    );

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
        path: this.dest(this.osx_dmg_label)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`,
        path: this.dest(this.osx_zip_label)
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
      appPath: this.dest(
        `${this.productName}-darwin-x64`,
        `${this.productName}.app`
      ),
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
          path: this.dest(
            `${this.productName}-darwin-x64`,
            `${this.productName}.app`
          )
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

    this.createInstaller = async() => {
      if (process.env.MACOS_NOTARY_KEY &&
          process.env.MACOS_NOTARY_SECRET &&
          process.env.MACOS_NOTARY_CLIENT_URL &&
          process.env.MACOS_NOTARY_API_URL) {
        const appDirectoryName = `${this.productName}.app`;
        const appPath = this.dest(
          `${this.productName}-darwin-x64`,
          appDirectoryName
        );
        debug(`Signing and notarizing "${appPath}"`);
        // https://wiki.corp.mongodb.com/display/BUILD/How+to+use+MacOS+notary+service
        debug(`Downloading the notary client from ${process.env.MACOS_NOTARY_CLIENT_URL} to ${path.resolve('macnotary')}`);
        await download(process.env.MACOS_NOTARY_CLIENT_URL, 'macnotary', {
          extract: true,
          strip: 1 // remove leading platform + arch directory
        });
        await fs.promises.chmod('macnotary/macnotary', 0o755); // ensure +x is set

        debug(`running "zip -y -r '${appDirectoryName}.zip' '${appDirectoryName}'"`);
        await execFile('zip', ['-y', '-r', `${appDirectoryName}.zip`, appDirectoryName], {
          cwd: path.dirname(appPath)
        });
        debug(`sending file to notary service (bundle id = ${this.bundleId})`);
        const macnotaryResult = await execFile(path.resolve('macnotary/macnotary'), [
          '-t', 'app',
          '-m', 'notarizeAndSign',
          '-u', process.env.MACOS_NOTARY_API_URL,
          '-b', this.bundleId,
          '-f', `${appDirectoryName}.zip`,
          '-o', `${appDirectoryName}.signed.zip`,
          // '--verify',
          ...(this.macosEntitlements ? ['-e', this.macosEntitlements] : [])
        ], {
          cwd: path.dirname(appPath),
          encoding: 'utf8'
        });
        debug('macnotary result:', macnotaryResult.stdout, macnotaryResult.stderr);
        debug('ls', (await execFile('ls', ['-lh'], { cwd: path.dirname(appPath), encoding: 'utf8' })).stdout);
        debug('removing existing directory contents');
        await execFile('rm', ['-r', appDirectoryName], {
          cwd: path.dirname(appPath)
        });
        debug(`unzipping with "unzip -u '${appDirectoryName}.signed.zip'"`);
        await execFile('unzip', ['-u', `${appDirectoryName}.signed.zip`], {
          cwd: path.dirname(appPath),
          encoding: 'utf8'
        });
        debug('ls', (await execFile('ls', ['-lh'], { cwd: path.dirname(appPath), encoding: 'utf8' })).stdout);
        debug(`removing '${appDirectoryName}.signed.zip' and '${appDirectoryName}.zip'`);
        await fs.promises.unlink(`${appPath}.signed.zip`);
        await fs.promises.unlink(`${appPath}.zip`);
      } else {
        console.error(chalk.yellow.bold(
          'WARNING: macos notary service credentials not set -- skipping signing and notarization!'));
      }
      const createDMG = require('electron-installer-dmg');
      await createDMG(this.installerOptions);
    };
  }

  /**
   * Apply Linux specific configuration.
   */
  configureForLinux() {
    const platformSettings = _.get(this.pkg, 'config.hadron.build.linux', {});

    this.appPath = this.dest(
      `${this.productName}-${this.platform}-${this.arch}`
    );
    this.resources = path.join(this.appPath, 'resources');

    Object.assign(this.packagerOptions, {
      name: this.productName
    });

    const debianVersion = this.version.replace(/\-/g, '~');
    const debianArch = this.arch === 'x64' ? 'amd64' : 'i386';
    const debianSection = _.get(platformSettings, 'deb_section');
    this.linux_deb_filename = `${this.slug}_${debianVersion}_${debianArch}.deb`;

    const rhelVersion = [
      this.semver.major,
      this.semver.minor,
      this.semver.patch
    ].join('.');
    const rhelRevision = this.semver.prerelease.join('.') || '1';
    const rhelArch = this.arch === 'x64' ? 'x86_64' : 'i386';
    const rhelCategories = _.get(platformSettings, 'rpm_categories');
    this.linux_rpm_filename = `${this.slug}-${this.version}.${rhelArch}.rpm`;

    var isRhel = process.env.EVERGREEN_BUILD_VARIANT === 'rhel';
    this.linux_tar_filename = `${this.slug}-${this.version}-${
      isRhel ? 'rhel' : this.platform
    }-${this.arch}.tar.gz`;

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
      license = `Copyright © ${new Date().getFullYear()} ${
        this.author
      }. All Rights Reserved.`;
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
        depends: ['libsecret-1-0', 'gnome-keyring', 'libgconf-2-4']
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
          'gnome-keyring',
          'libsecret',
          'GConf2'
        ],
        categories: rhelCategories,
        license: license
      }
    };

    const createRpmInstaller = () => {
      return ifEnvironmentCanBuild('rpm', () => {
        const createRpm = require('electron-installer-redhat');
        debug('creating rpm...', this.installerOptions.rpm);
        return createRpm(this.installerOptions.rpm).then(() => {
          return sign(this.dest(this.linux_rpm_filename));
        });
      });
    };

    const createDebInstaller = () => {
      return ifEnvironmentCanBuild('deb', () => {
        const createDeb = require('electron-installer-debian');
        debug('creating deb...', this.installerOptions.deb);
        return createDeb(this.installerOptions.deb).then(() => {
          // We do not sign debs because it doesn't work, see
          // this thread for context:
          //   https://mongodb.slack.com/archives/G2L10JAV7/p1623169331107600
          //
          // return sign(this.dest(this.linux_deb_filename));
          return this.dest(this.linux_deb_filename);
        });
      });
    };

    const createTarball = () => {
      debug(
        'creating tarball %s -> %s',
        tar(this.appPath, this.dest(this.linux_tar_filename))
      );
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
