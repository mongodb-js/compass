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
const ffmpegAfterExtract = require('electron-packager-plugin-non-proprietary-codecs-ffmpeg').default;
const windowsInstallerVersion = require('./windows-installer-version');
const debug = require('debug')('hadron-build:target');
const execFile = promisify(childProcess.execFile);
const mongodbNotaryServiceClient = require('@mongodb-js/mongodb-notary-service-client');
const which = require('which');
const plist = require('plist');
const { signtool } = require('./signtool');
const tarGz = require('./tar-gz');

async function signLinuxPackage(src) {
  debug('Signing ... %s', src);
  await mongodbNotaryServiceClient(src);
  debug('Successfully signed %s', src);
}

async function signWindowsPackage(src) {
  debug('Signing ... %s', src);
  await signtool(src);
  debug('Successfully signed %s', src);
}

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

const supportedPlatforms = [
  { platform: 'darwin', arch: 'x64' },
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'win32', arch: 'x64' }
];

const supportedDistributions = [
  'compass',
  'compass-readonly',
  'compass-isolated'
];

class Target {
  // eslint-disable-next-line complexity
  constructor(dir, opts = {}) {
    this.dir = dir || process.cwd();
    this.out = path.join(this.dir, 'dist');

    const pkg = getPkg(dir);
    this.pkg = pkg;

    const distributions = pkg.config.hadron.distributions;

    _.defaults(opts, { version: process.env.HADRON_APP_VERSION }, pkg, {
      platform: process.platform,
      arch: process.arch,
      sign: true,
      distribution: process.env.HADRON_DISTRIBUTION || distributions.default
    });

    this.distribution = opts.distribution;

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
    this.channel = Target.getChannelFromVersion(this.version);
    if (this.channel !== 'stable') {
      this.slug += `-${this.channel}`;
    }

    this.autoUpdateBaseUrl = _.get(pkg, 'config.hadron.endpoint', null);

    this.asar = { unpack: [], ...pkg.config.hadron.asar };
    this.rebuild = { ...pkg.config.hadron.rebuild };
    this.macosEntitlements = this.src(pkg.config.hadron.macosEntitlements);

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

    debug(
      'target ready',
      _.pick(this, [
        'name',
        'productName',
        'version',
        'platform',
        'arch',
        'channel',
        'assets',
        'packagerOptions',
        'installerOptions'
      ])
    );
  }

  setArchiveName() {
    this.app_archive_name =
      this.osx_zip_filename ||
      this.windows_zip_filename ||
      (process.env.EVERGREEN_BUILD_VARIANT === 'rhel'
        ? this.rhel_tar_filename
        : this.linux_tar_filename);
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

    return dest; // this is used by the caller
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

    this.windows_setup_label =
      this.windows_setup_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.exe`;
    this.windows_msi_label =
      this.windows_msi_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.msi`;
    this.windows_zip_label =
      this.windows_zip_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`;
    this.windows_releases_label =
      this.windows_releases_filename = `${this.slug}-RELEASES`;
    this.windows_nupkg_full_label =
      this.windows_nupkg_full_filename = `${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`;

    this.assets = [
      {
        name: this.windows_setup_label,
        path: this.dest(this.windows_setup_label),
        downloadCenter: true
      },
      {
        name: this.windows_msi_label,
        path: this.dest(this.windows_msi_label),
        downloadCenter: true
      },
      {
        name: this.windows_zip_label,
        path: this.dest(this.windows_zip_label),
        downloadCenter: true
      },
      {
        name: this.windows_releases_label,
        path: this.dest(this.windows_releases_label)
      },
      {
        name: this.windows_nupkg_full_label,
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

      // This setting will prompt winstaller to try to sign files
      // for the installer with signtool.exe
      //
      // The intended use is to pass custom flags for the signtool.exe bundled
      // inside winstaller.
      //
      // We replace signtool.exe with an "emulated version" that is signing files
      // via notary service in the postinstall script.
      //
      // Here we just set any parameter so that signtool.exe is invoked.
      //
      // @see https://jira/mongodb.org/browse/BUILD-920
      signWithParams: 'sign',
      title: this.productName,
      productName: this.productName,
      description: this.description,
      name: this.packagerOptions.name,
      noMsi: true
    };

    /**
     * @see https://jira/mongodb.org/browse/BUILD-920
     */

    /**
     * The ICO file to use as the icon for the generated Setup.exe.
     */
    if (platformSettings.setup_icon) {
      this.installerOptions.setupIcon = this.src(platformSettings.setup_icon);
    }

    this.createInstaller = async() => {
      // sign the main application .exe
      await signWindowsPackage(
        path.join(this.installerOptions.appDirectory, this.installerOptions.exe));

      const electronWinstaller = require('electron-winstaller');
      await electronWinstaller.createWindowsInstaller(this.installerOptions);

      await fs.promises.rename(
        this.dest('RELEASES'),
        this.dest(this.windows_releases_label),
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

      // sign the MSI
      await signWindowsPackage(this.dest(this.packagerOptions.name + '.msi'));

      await fs.promises.rename(
        this.dest(this.packagerOptions.name + '.msi'),
        this.dest(this.windows_msi_label),
      );
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

    const destDir = `${this.productName}-${this.platform}-${this.arch}`;

    // this.resources = OSX_RESOURCES;
    this.appPath = this.dest(destDir, `${this.productName}.app`);
    this.resources = this.dest(
      destDir,
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

    this.osx_dmg_label =
      this.osx_dmg_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.dmg`;
    this.osx_zip_label =
      this.osx_zip_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`;

    this.assets = [
      {
        name: this.osx_dmg_label,
        path: this.dest(this.osx_dmg_label),
        downloadCenter: true,
      },
      {
        name: this.osx_zip_label,
        path: this.dest(this.osx_zip_label)
      }
    ];

    this.installerOptions = {
      dmgPath: this.dest(this.osx_dmg_filename),
      title: this.truncatedProductName, // actually names the dmg
      overwrite: true,
      out: this.out,
      icon: this.packagerOptions.icon,
      identity_display: platformSettings.codesign_identity,
      identity: platformSettings.codesign_sha1,
      appPath: this.appPath,
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
          path: this.appPath
        }
      ]
    };

    this.createInstaller = async() => {
      const appDirectoryName = `${this.productName}.app`;
      const appPath = this.appPath;

      {
        const plistFilePath = path.join(appPath, 'Contents', 'Info.plist');
        const plistContents = plist.parse(await fs.promises.readFile(plistFilePath, 'utf8'));

        plistContents.CFBundleURLTypes =
        _.get(this.pkg, 'config.hadron.protocols', [])
          .map(protocol => ({
            CFBundleTypeRole: 'Editor',
            CFBundleURLIconFile: platformSettings.icon,
            CFBundleURLName: protocol.name,
            CFBundleURLSchemes: protocol.schemes
          }));
        await fs.promises.writeFile(plistFilePath, plist.build(plistContents));
      }

      if (process.env.MACOS_NOTARY_KEY &&
          process.env.MACOS_NOTARY_SECRET &&
          process.env.MACOS_NOTARY_CLIENT_URL &&
          process.env.MACOS_NOTARY_API_URL) {
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
          '--verify',
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

    const debianVersion = this.version;
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
    this.linux_tar_filename = `${this.slug}-${this.version}-${this.platform}-${this.arch}.tar.gz`;
    this.rhel_tar_filename = `${this.slug}-${this.version}-rhel-${this.arch}.tar.gz`;

    this.assets = [
      {
        name: this.linux_deb_filename,
        path: this.dest(this.linux_deb_filename),
        downloadCenter: true
      },
      {
        name: this.linux_rpm_filename,
        path: this.dest(this.linux_rpm_filename),
        downloadCenter: true
      },
      {
        name: this.linux_tar_filename,
        path: this.dest(this.linux_tar_filename)
      },
      {
        name: this.rhel_tar_filename,
        path: this.dest(this.rhel_tar_filename)
      }
    ];

    var license = this.pkg.license;
    if (license === 'UNLICENSED') {
      license = `Copyright © ${new Date().getFullYear()} ${
        this.author
      }. All Rights Reserved.`;
    }

    const mimeType =
      _.get(this.pkg, 'config.hadron.protocols', [])
        .flatMap(protocol => protocol.schemes)
        .map(scheme => `x-scheme-handler/${scheme}`);
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
        depends: ['libsecret-1-0', 'gnome-keyring'],
        mimeType
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
          'gnome-keyring',
          'libsecret',
        ],
        categories: rhelCategories,
        license: license,
        mimeType
      }
    };

    const createRpmInstaller = () => {
      return ifEnvironmentCanBuild('rpm', () => {
        const createRpm = require('electron-installer-redhat');
        debug('creating rpm...', this.installerOptions.rpm);
        return createRpm(this.installerOptions.rpm).then(() => {
          return signLinuxPackage(this.dest(this.linux_rpm_filename));
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
        this.appPath,
        this.dest(this.app_archive_name)
      );

      return tarGz(this.appPath, this.dest(this.app_archive_name));
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

  static getAssetsForVersion(dir, version) {
    const configs = supportedDistributions.flatMap((distribution) => {
      return supportedPlatforms.map((platformConfig) => {
        return { ...platformConfig, distribution };
      });
    });

    const assets = configs.flatMap((config) => {
      const target = new Target(dir, { ...config, version });
      return {
        config: { ...config, version: target.version, channel: target.channel },
        assets: target.assets
      };
    });

    return assets;
  }

  static getChannelFromVersion(version) {
    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    const match = version.match(/-([a-z]+)(\.\d+)?$/);
    if (match) {
      return match[1].toLowerCase();
    }
    return 'stable';
  }

  static getDownloadLinkForAsset(version, asset) {
    const channel = Target.getChannelFromVersion(version);
    const prefix =
      channel && channel !== 'stable' ? `compass/${channel}` : 'compass';
    return `https://downloads.mongodb.com/${prefix}/${asset.name}`;
  }
}

Target.supportedPlatforms = supportedPlatforms;

Target.supportedDistributions = supportedDistributions;

module.exports = Target;
