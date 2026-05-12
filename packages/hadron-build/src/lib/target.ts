import chalk from 'chalk';
import { readFileSync, promises as fsPromises } from 'fs';
import _ from 'lodash';
import semver from 'semver';
import path from 'path';
import normalizePkg from 'normalize-package-data';
import parseGitHubRepoURL from 'parse-github-repo-url';
import type packager from 'electron-packager';
import ffmpegPlugin from 'electron-packager-plugin-non-proprietary-codecs-ffmpeg';
import { windowsInstallerVersion } from './windows-installer-version';
import createDebug from 'debug';
import which from 'which';
import plist from 'plist';
import { sign, getSignedFilename } from './signtool';
import tarGz from './tar-gz';
import { notarize } from './mac-notary-service';
import { validateBuildConfig } from './validate-build-config';

const ffmpegAfterExtract = ffmpegPlugin.default;
const debug = createDebug('hadron-build:target');

export interface Asset {
  name: string;
  path: string;
  downloadCenter?: boolean;
}

export interface TargetAssets {
  assets: Asset[];
  config: {
    distribution: string;
    arch: string;
    platform: string;
    version: string;
    channel: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageJson = Record<string, any>;

type PackagerOptions = Parameters<typeof packager>[0] & {
  'version-string'?: Record<string, string>;
};

function _canBuildInstaller(ext: string): Promise<boolean> {
  let bin: string | null = null;
  let help: string | null = null;

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
    which(bin as string, (err, res) => {
      if (err) {
        debug(`which ${bin} error`, err);
        /* eslint-disable-next-line no-console */
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

function ifEnvironmentCanBuild(
  ext: string,
  fn: () => Promise<unknown>
): Promise<unknown> {
  debug('checking if environment can build installer for %s', ext);
  return _canBuildInstaller(ext).then(function (can) {
    debug('can build installer for %s?', ext, true);
    if (!can) return false;
    return fn();
  });
}

function getPkg(directory: string): PackageJson {
  const _path = path.join(directory, 'package.json');
  /* eslint-disable-next-line no-sync */
  const pkg: PackageJson = JSON.parse(readFileSync(_path, 'utf8'));
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    electronVersion: require('electron/package.json').version,
  });

  return pkg;
}

const supportedPlatforms = [
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'darwin', arch: 'x64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'win32', arch: 'x64' },
];

const supportedDistributions = [
  'compass',
  'compass-readonly',
  'compass-isolated',
];

// eslint-disable-next-line complexity
class Target {
  dir: string;
  out: string;
  pkg: PackageJson;
  distribution: string;
  id: string;
  name: string;
  readonly: boolean;
  isolated: boolean;
  productName: string;
  bundleId?: string;
  upgradeCode?: string;
  version: string;
  installerVersion?: string;
  platform: string;
  arch: string;
  description?: string;
  author: string;
  shortcutFolderName?: string;
  programFilesFolderName?: string;
  slug: string;
  semver: semver.SemVer;
  channel: string;
  autoUpdateBaseUrl: string | null;
  asar: { unpack?: string[] };
  rebuild: Record<string, unknown>;
  macosEntitlements?: string;
  truncatedProductName?: string;
  packagerOptions: PackagerOptions;
  assets!: Asset[];
  installerOptions!: Record<string, unknown>;
  appPath!: string;
  resources!: string;
  resourcesAppDir!: string;
  app_archive_name?: string;
  createInstaller!: () => Promise<void>;

  // Windows
  windows_setup_filename?: string;
  windows_setup_label?: string;
  windows_msi_filename?: string;
  windows_msi_label?: string;
  windows_zip_filename?: string;
  windows_zip_label?: string;
  windows_releases_filename?: string;
  windows_releases_label?: string;
  windows_nupkg_full_filename?: string;
  windows_nupkg_full_label?: string;
  windows_zip_sign_filename?: string;
  windows_zip_sign_label?: string;
  windows_nupkg_full_sign_filename?: string;
  windows_nupkg_full_sign_label?: string;

  // Darwin
  osx_dmg_filename?: string;
  osx_dmg_label?: string;
  osx_zip_filename?: string;
  osx_zip_label?: string;
  osx_zip_sign_filename?: string;
  osx_zip_sign_label?: string;

  // Linux
  linux_deb_filename?: string;
  linux_deb_sign_filename?: string;
  linux_rpm_filename?: string;
  linux_tar_filename?: string;
  linux_tar_sign_filename?: string;
  rhel_tar_filename?: string;
  rhel_tar_sign_filename?: string;

  constructor(dir: string, opts: Record<string, unknown> = {}) {
    this.dir = dir || process.cwd();
    this.out = path.join(this.dir, 'dist');

    const pkg = getPkg(dir);
    this.pkg = pkg;

    const distributions = pkg.config.hadron.distributions;
    const distribution =
      (opts.distribution as string) ?? process.env.HADRON_DISTRIBUTION;

    if (!distribution) {
      throw new Error(
        'You need to explicitly set HADRON_DISTRIBUTION or pass `distribution` option to Target constructor before building Compass'
      );
    }

    if (!supportedDistributions.includes(distribution)) {
      throw new Error(
        `Unknown distribution "${distribution}". Available distributions: ${supportedDistributions.join(
          ', '
        )}`
      );
    }

    _.defaults(opts, { version: process.env.HADRON_APP_VERSION }, pkg, {
      platform: process.platform,
      arch: process.arch,
      sign: true,
      distribution,
    });

    this.distribution = opts.distribution as string;

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
            : undefined,
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

    this.version = opts.version as string;
    this.installerVersion = opts.installerVersion as string | undefined;
    this.platform = opts.platform as string;
    this.arch = opts.arch as string;
    this.description = opts.description as string | undefined;
    this.author = _.get(opts, 'author.name', opts.author) as string;
    this.shortcutFolderName = opts.shortcutFolderName as string | undefined;
    this.programFilesFolderName = opts.programFilesFolderName as
      | string
      | undefined;

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

    // For building a dev building from main. In order to have a consistent version ID
    // based on datetime, we pick it from the evergreen when it was triggered so that
    // its consistent across various builds, irrespective of when each packaging happens.
    if (
      this.channel === 'dev' &&
      process.env.DEV_VERSION_IDENTIFIER &&
      process.env.DEV_VERSION_IDENTIFIER !== ''
    ) {
      this.version = process.env.DEV_VERSION_IDENTIFIER;
      pkg.version = this.version;
      this.semver = new semver.SemVer(this.version);
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
      ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
      platform: this.platform,
      arch: this.arch,
      electronVersion: pkg.electronVersion,
      afterExtract: [
        ffmpegAfterExtract,
      ] as unknown as PackagerOptions['afterExtract'],
    };

    validateBuildConfig(
      this.platform,
      this.pkg.config.hadron.build[this.platform]
    );

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
        'installerOptions',
      ])
    );
  }

  setArchiveName(): void {
    this.app_archive_name =
      this.osx_zip_filename ||
      this.windows_zip_filename ||
      (process.env.IS_RHEL === 'true'
        ? this.rhel_tar_filename
        : this.linux_tar_filename);
  }

  /**
   * Get an absolute path to a source file.
   * @return {String}
   */
  src(...args: (string | undefined)[]): string | undefined {
    if (args[0] === undefined) return undefined;
    return path.join(this.dir, ...(args as string[]));
  }

  /**
   * Get an absolute path to a file in the output directory.
   * @return {String}
   */
  dest(...args: (string | undefined)[]): string {
    if (args[0] === undefined) return undefined as unknown as string;
    return path.join(this.out, ...(args as string[]));
  }

  distRoot(): string {
    if (this.platform === 'darwin') {
      return path.join(this.appPath, '..');
    }
    return path.join(this.appPath);
  }

  async write(filename: string, contents: string | Buffer): Promise<string> {
    let dest = '';
    if (this.platform === 'darwin') {
      dest = path.join(this.appPath, '..', filename);
    } else {
      dest = path.join(this.appPath, filename);
    }
    debug(
      `Writing ${
        Buffer.isBuffer(contents) ? contents.length : contents.length
      } bytes to ${dest}`
    );
    await fsPromises.writeFile(dest, contents);
    return dest; // this is used by the caller
  }

  /**
   * Apply Windows specific configuration.
   */
  configureForWin32(): void {
    const platformSettings = this.pkg.config.hadron.build.win32;
    platformSettings.icon = platformSettings.icon[this.channel];

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
      // This name becomes the .exe name, but it is also used to determine
      // various other parts including the nupkg file and its metadata and the
      // code that makes that validates that the filename does not contain
      // spaces. So basically the .exe we build is not allowed to contain
      // spaces and it is out of our control.
      name: this.productName.replace(/ /g, ''),
      icon: this.src(platformSettings.icon),
      'version-string': {
        CompanyName: this.author,
        FileDescription: this.description,
        ProductName: this.productName,
        InternalName: this.name,
      },
    });

    const packagerName = this.packagerOptions.name as string;
    this.appPath = this.dest(`${packagerName}-${this.platform}-${this.arch}`);
    this.resources = this.dest(
      `${packagerName}-${this.platform}-${this.arch}`,
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
      this.windows_nupkg_full_filename = `${packagerName}-${nuggetVersion}-full.nupkg`;

    this.windows_zip_sign_label = this.windows_zip_sign_filename =
      getSignedFilename(this.windows_zip_filename as string);
    this.windows_nupkg_full_sign_label = this.windows_nupkg_full_sign_filename =
      getSignedFilename(this.windows_nupkg_full_filename as string);

    this.assets = [
      {
        name: this.windows_setup_label,
        path: this.dest(this.windows_setup_label),
        downloadCenter: true,
      },
      {
        name: this.windows_msi_label,
        path: this.dest(this.windows_msi_label),
        downloadCenter: true,
      },
      {
        name: this.windows_zip_label,
        path: this.dest(this.windows_zip_label),
        downloadCenter: true,
      },
      {
        name: this.windows_zip_sign_label,
        path: this.dest(this.windows_zip_sign_label),
      },
      {
        name: this.windows_releases_label,
        path: this.dest(this.windows_releases_label),
      },
      {
        name: this.windows_nupkg_full_label,
        path: this.dest(this.windows_nupkg_full_label),
      },
      {
        name: this.windows_nupkg_full_sign_label,
        path: this.dest(this.windows_nupkg_full_sign_label),
      },
    ];

    this.installerOptions = {
      loadingGif: this.src(platformSettings.loading_gif),
      iconUrl: platformSettings.favicon_url,
      appDirectory: this.appPath,
      outputDirectory: this.packagerOptions.out,
      // NOTE: This also becomes the name of the shortcut folder. Will be
      // "MongoDB Inc" if it uses this.author. Tempting to use
      // this.shortcutFolderName so it becomes MongoDB like for the .msi, but
      // who knows what else will be affected.
      authors: this.author,
      version: this.version,
      exe: `${packagerName}.exe`,
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
      name: packagerName,
      noMsi: true,
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

    this.createInstaller = async () => {
      // sign the main application .exe
      await sign(
        path.join(
          this.installerOptions.appDirectory as string,
          this.installerOptions.exe as string
        )
      );

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const electronWinstaller = require('electron-winstaller');
      await electronWinstaller.createWindowsInstaller(this.installerOptions);

      await fsPromises.rename(
        this.dest('RELEASES'),
        this.dest(this.windows_releases_label as string)
      );

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MSICreator } = require('@mongodb-js/electron-wix-msi');

      const msiCreator = new MSICreator({
        appDirectory: this.appPath,
        outputDirectory: this.packagerOptions.out,
        exe: packagerName,
        name: this.productName,
        // NOTE: falling back to author would result in MongoDB Inc
        shortcutFolderName: this.shortcutFolderName || this.author,
        shortcutName: this.productName,
        description: this.description,
        manufacturer: this.author,
        version: windowsInstallerVersion(
          (this.installerVersion || this.version) as string
        ),
        programFilesFolderName: this.programFilesFolderName || this.productName,
        appUserModelId: this.bundleId,
        upgradeCode: this.upgradeCode,
        arch: 'x64',
        extensions: ['WixUtilExtension'],
        ui: {
          chooseDirectory: true,
          images: {
            background: this.src(platformSettings.background),
            banner: this.src(platformSettings.banner),
          },
        },
      });

      await msiCreator.create();
      await msiCreator.compile();

      // sign the MSI
      await sign(this.dest(packagerName + '.msi'));

      await fsPromises.rename(
        this.dest(packagerName + '.msi'),
        this.dest(this.windows_msi_label as string)
      );

      // sign the nupkg
      await sign(this.dest(this.windows_nupkg_full_filename as string));
    };
  }

  /**
   * Apply macOS specific configuration.
   */
  configureForDarwin(): void {
    this.truncatedProductName = this.productName.substring(0, 25);
    const platformSettings = this.pkg.config.hadron.build.darwin;
    platformSettings.icon = platformSettings.icon[this.channel];

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
      protocols: _.get(this, 'config.hadron.protocols', []),
    });

    if (this.channel !== 'stable') {
      this.packagerOptions.appBundleId = `${this.bundleId}.${this.channel}`;
    }

    this.osx_dmg_label =
      this.osx_dmg_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.dmg`;
    this.osx_zip_label =
      this.osx_zip_filename = `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`;
    this.osx_zip_sign_label = this.osx_zip_sign_filename = getSignedFilename(
      this.osx_zip_filename
    );

    this.assets = [
      {
        name: this.osx_dmg_label,
        path: this.dest(this.osx_dmg_label),
        downloadCenter: true,
      },
      {
        name: this.osx_zip_label,
        path: this.dest(this.osx_zip_label),
      },
      {
        name: this.osx_zip_sign_label,
        path: this.dest(this.osx_zip_sign_label),
      },
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
        { x: 322, y: 243, type: 'link', path: '/Applications' },
        /**
         * Show a shortcut on the left for the application icon.
         */
        { x: 93, y: 243, type: 'file', path: this.appPath },
      ],
    };

    this.createInstaller = async () => {
      const appPath = this.appPath;

      {
        const plistFilePath = path.join(appPath, 'Contents', 'Info.plist');
        const plistContents = plist.parse(
          await fsPromises.readFile(plistFilePath, 'utf8')
        ) as Record<string, unknown>;

        plistContents.CFBundleURLTypes = _.get(
          this.pkg,
          'config.hadron.protocols',
          []
        ).map((protocol: { name: string; schemes: string[] }) => ({
          CFBundleTypeRole: 'Editor',
          CFBundleURLIconFile: platformSettings.icon,
          CFBundleURLName: protocol.name,
          CFBundleURLSchemes: protocol.schemes,
        }));

        // Merge extra plist options if provided in darwin build config
        const extraPlistOptionsPath = _.get(
          platformSettings,
          'extra_plist_options'
        );
        if (extraPlistOptionsPath) {
          const extraPlistFilePath = this.src(extraPlistOptionsPath);
          const extraPlistContents = plist.parse(
            await fsPromises.readFile(extraPlistFilePath as string, 'utf8')
          ) as Record<string, unknown>;
          Object.assign(plistContents, extraPlistContents);
        }

        await fsPromises.writeFile(plistFilePath, plist.build(plistContents));
      }

      const isNotarizationPossible =
        process.env.MACOS_NOTARY_KEY &&
        process.env.MACOS_NOTARY_SECRET &&
        process.env.MACOS_NOTARY_CLIENT_URL &&
        process.env.MACOS_NOTARY_API_URL;

      const notarizationOptions = {
        bundleId: this.bundleId as string,
        macosEntitlements: this.macosEntitlements,
      };

      if (isNotarizationPossible) {
        await notarize(appPath, notarizationOptions);
      } else {
        /* eslint-disable-next-line no-console */
        console.error(
          chalk.yellow.bold(
            'WARNING: macos notary service credentials not set -- skipping signing and notarization of .app!'
          )
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createDMG } = require('electron-installer-dmg');
      // electron-installer-dmg rejects setting both .dmgPath and .out
      const installerOptions = { ...this.installerOptions };
      delete installerOptions.out;
      await createDMG(installerOptions);

      if (isNotarizationPossible) {
        await notarize(
          this.installerOptions.dmgPath as string,
          notarizationOptions
        );
      } else {
        /* eslint-disable-next-line no-console */
        console.error(
          chalk.yellow.bold(
            'WARNING: macos notary service credentials not set -- skipping signing and notarization of .dmg!'
          )
        );
      }
    };
  }

  /**
   * Apply Linux specific configuration.
   */
  configureForLinux(): void {
    const platformSettings = this.pkg.config.hadron.build.linux;
    platformSettings.icon = platformSettings.icon[this.channel];

    this.appPath = this.dest(
      `${this.productName}-${this.platform}-${this.arch}`
    );
    this.resources = path.join(this.appPath, 'resources');

    Object.assign(this.packagerOptions, { name: this.productName });

    const debianVersion = this.version;
    const debianArch = this.arch === 'x64' ? 'amd64' : 'i386';
    const debianSection = _.get(platformSettings, 'deb_section');
    this.linux_deb_filename = `${this.slug}_${debianVersion}_${debianArch}.deb`;
    this.linux_tar_filename = `${this.slug}-${this.version}-${this.platform}-${this.arch}.tar.gz`;
    this.linux_deb_sign_filename = getSignedFilename(this.linux_deb_filename);
    this.linux_tar_sign_filename = getSignedFilename(this.linux_tar_filename);

    const rhelVersion = [
      this.semver.major,
      this.semver.minor,
      this.semver.patch,
    ].join('.');
    const rhelRevision = this.semver.prerelease.join('.') || '1';
    const rhelArch = this.arch === 'x64' ? 'x86_64' : 'i386';
    const rhelCategories = _.get(platformSettings, 'rpm_categories');
    this.linux_rpm_filename = `${this.slug}-${this.version}.${rhelArch}.rpm`;
    this.rhel_tar_filename = `${this.slug}-${this.version}-rhel-${this.arch}.tar.gz`;
    this.rhel_tar_sign_filename = getSignedFilename(this.rhel_tar_filename);

    this.assets = [
      {
        name: this.linux_deb_filename,
        path: this.dest(this.linux_deb_filename),
        downloadCenter: true,
      },
      {
        name: this.linux_deb_sign_filename,
        path: this.dest(this.linux_deb_sign_filename),
      },
      {
        name: this.linux_rpm_filename,
        path: this.dest(this.linux_rpm_filename),
        downloadCenter: true,
      },
      {
        name: this.linux_tar_filename,
        path: this.dest(this.linux_tar_filename),
      },
      {
        name: this.linux_tar_sign_filename,
        path: this.dest(this.linux_tar_sign_filename),
      },
      { name: this.rhel_tar_filename, path: this.dest(this.rhel_tar_filename) },
      {
        name: this.rhel_tar_sign_filename,
        path: this.dest(this.rhel_tar_sign_filename),
      },
    ];

    let license = this.pkg.license as string;
    if (license === 'UNLICENSED') {
      license = `Copyright © ${new Date().getFullYear()} ${
        this.author
      }. All Rights Reserved.`;
    }

    const mimeType = _.get(this.pkg, 'config.hadron.protocols', [])
      .flatMap((protocol: { schemes: string[] }) => protocol.schemes)
      .map((scheme: string) => `x-scheme-handler/${scheme}`);

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
        mimeType,
      },
      rpm: {
        src: this.appPath,
        dest: this.out,
        arch: rhelArch,
        icon: this.src(platformSettings.icon),
        name: this.slug,
        version: rhelVersion,
        revision: rhelRevision,
        rename: (dest: string) => {
          return path.join(dest, this.linux_rpm_filename as string);
        },
        bin: this.productName,
        requires: ['gnome-keyring', 'libsecret'],
        categories: rhelCategories,
        license,
        mimeType,
      },
    };

    const createRpmInstaller = (): Promise<unknown> => {
      return ifEnvironmentCanBuild('rpm', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const createRpm = require('electron-installer-redhat');
        debug('creating rpm...', this.installerOptions.rpm);
        return createRpm(this.installerOptions.rpm).then(() => {
          return sign(this.dest(this.linux_rpm_filename as string));
        });
      });
    };

    const createDebInstaller = (): Promise<unknown> => {
      return ifEnvironmentCanBuild('deb', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const createDeb = require('electron-installer-debian');
        debug('creating deb...', this.installerOptions.deb);
        return createDeb(this.installerOptions.deb).then(() => {
          return sign(this.dest(this.linux_deb_filename as string));
        });
      });
    };

    const createTarball = (): Promise<void> => {
      debug(
        'creating tarball %s -> %s',
        this.appPath,
        this.dest(this.app_archive_name as string)
      );
      return tarGz(
        this.appPath,
        this.dest(this.app_archive_name as string)
      ).then(() => {
        return sign(this.dest(this.app_archive_name as string));
      });
    };

    this.createInstaller = () => {
      return Promise.all([
        createRpmInstaller(),
        createDebInstaller(),
        createTarball(),
      ]).then(() => undefined);
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
  getAssetWithExtension(extname: string): Asset | undefined {
    const res = this.assets.filter(function (asset) {
      return path.extname(asset.path) === extname;
    });
    debug('%s -> ', extname, res);
    return res[0];
  }

  static getAssetsForVersion(dir: string, version: string): TargetAssets[] {
    const configs = supportedDistributions.flatMap((distribution) => {
      return supportedPlatforms.map((platformConfig) => {
        return { ...platformConfig, distribution };
      });
    });

    return configs.flatMap((config) => {
      const target = new Target(dir, { ...config, version });
      return {
        config: { ...config, version: target.version, channel: target.channel },
        assets: target.assets,
      };
    });
  }

  static getChannelFromVersion(version: string): string {
    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    const match = version.match(/-([a-z]+)(\.\d+)?$/);
    if (match) {
      return match[1].toLowerCase();
    }
    return 'stable';
  }

  static getDownloadLinkForAsset(version: string, asset: Asset): string {
    const channel = Target.getChannelFromVersion(version);
    const prefix =
      channel && channel !== 'stable' ? `compass/${channel}` : 'compass';
    return `https://downloads.mongodb.com/${prefix}/${asset.name}`;
  }

  static readonly supportedPlatforms = supportedPlatforms;
  static readonly supportedDistributions = supportedDistributions;
}

export default Target;
