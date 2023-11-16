import chalk from 'chalk';
import childProcess from 'child_process';
import download from 'download';
import fs from 'fs';
import _ from 'lodash';
import semver from 'semver';
import path from 'path';
import { promisify } from 'util';
import normalizePkg from 'normalize-package-data';
import parseGitHubRepoURL from 'parse-github-repo-url';
import ffmpegAfterExtract from 'electron-packager-plugin-non-proprietary-codecs-ffmpeg';
import windowsInstallerVersion from './windows-installer-version';

const execFile = promisify(childProcess.execFile);
import mongodbNotaryServiceClient from './notary-service-client';
import which from 'which';
import type { PlistObject } from 'plist';
import plist from 'plist';
import { signtool } from './signtool';
import { tarGz } from './tar-gz';

import createDebug from 'debug';
import type { CreateOptions } from 'electron-installer-dmg';
const debug = createDebug('hadron-build:target');

type CompassDistribution = 'compass' | 'compass-readonly' | 'compass-isolated';

export type TargetOptions = {
  version?: string;
  platform?: string;
  arch?: string;
  distribution?: string;
};

type HadronConfig = {
  endpoint: string;
  protocols: {
    name: string;
    schemes: string[];
  }[];
  distributions: Record<CompassDistribution, DistributionConfig>;
  build: {
    win32?: BuildPlatformConfig;
    darwin?: BuildPlatformConfig;
    linux?: BuildPlatformConfig;
  };
  asar: {
    unpack?: string[];
  };
  rebuild: {
    onlyModules: string[];
  };
  macosEntitlements: string;
};

type DistributionConfig = {
  name: string;
  productName: string;
  bundleId: string;
  'plugins-directory': string;
  upgradeCode: string;
  readonly?: boolean;
  isolated?: boolean;
  metrics_intercom_app_id?: string;
};

type BuildPlatformConfig = {
  setup_icon: any;
  icon: string;
  favicon_url?: string;
  loading_gif?: string;
  background?: string;
  banner?: string;
  app_category_type?: string;
  deb_section?: string;
  rpm_categories?: string[];
  codesign_identity?: string;
  codesign_sha1?: string;
  dmg_background?: string;
};

type LinuxInstallerExt = 'deb' | 'rpm';

type PackageConfig = {
  license: any;
  name: string;
  version: string;
  description: string;
  productName: string;
  author: { name: string };
  electronVersion: string;
  shortcutFolderName: string;
  config: { hadron: HadronConfig };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type PackagerOptions = {
  name?: any;
  appBundleId?: string;
  icon?: any;
  dir: string;
  out: string;
  overwrite: true;
  appCopyright: string;
  buildVersion: string;
  appVersion: string;
  prune: false;
  ignore: string;
  platform: NodeJS.Platform;
  arch: NodeJS.Process['arch'];
  electronVersion: string;
  sign: null;
  afterExtract: ((...args: any[]) => any)[];
  'version-string'?: {
    CompanyName: string;
    FileDescription: string;
    ProductName: string;
    InternalName: string;
  };
};

async function signLinuxPackage(src: string) {
  debug('Signing ... %s', src);
  await mongodbNotaryServiceClient(src);
  debug('Successfully signed %s', src);
}

async function signWindowsPackage(src: string) {
  debug('Signing ... %s', src);
  await signtool(src);
  debug('Successfully signed %s', src);
}

async function canBuildLinuxInstaller(
  ext: LinuxInstallerExt
): Promise<boolean> {
  const builder =
    ext === 'rpm'
      ? { binary: 'rpmbuild', help: 'https://git.io/v1iz7' }
      : ext === 'deb'
      ? { binary: 'fakeroot', help: 'https://git.io/v1iRV' }
      : undefined;

  if (!builder) {
    return true;
  }

  return await which(builder.binary).then(
    () => true,
    (err) => {
      debug(`which ${builder.binary} error`, err);
      /* eslint no-console: 0 */
      console.warn(
        `Skipping ${ext} build. Please see ${builder.help} for required setup.`
      );

      return false;
    }
  );
}

function ifCanBuildLinuxInstaller<T>(ext: 'rpm' | 'deb', fn: () => T) {
  debug('checking if environment can build installer for %s', ext);
  return canBuildLinuxInstaller(ext).then(function (can) {
    debug('can build installer for %s?', ext, true);
    if (!can) return false;
    return fn();
  });
}

function getApplicationPackageJson(directory: string): PackageConfig {
  const packageJsonPath = path.join(directory, 'package.json');
  /* eslint no-sync: 0 */
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  pkg._path = packageJsonPath;
  normalizePkg(pkg);

  if (pkg.repository) {
    const g = parseGitHubRepoURL(pkg.repository.url);
    if (!g) {
      pkg.github_owner = 'mongodb-js';
      pkg.github_repo = 'compass';
    } else {
      pkg.github_owner = g[0];
      pkg.github_repo = g[1];
    }
  }

  _.defaults(pkg, {
    productName: pkg.name,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    electronVersion: require('electron/package.json').version,
  });

  return pkg;
}

type SupportedPlatform = 'darwin' | 'linux' | 'win32';

const supportedPlatforms: {
  platform: SupportedPlatform;
  arch: NodeJS.Process['arch'];
}[] = [
  { platform: 'darwin', arch: 'x64' },
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'win32', arch: 'x64' },
];

const supportedDistributions: CompassDistribution[] = [
  'compass',
  'compass-readonly',
  'compass-isolated',
];

export const assertValidPlatformAndArch = (
  platform: string,
  arch: string
): {
  platform: SupportedPlatform;
  arch: NodeJS.Process['arch'];
} => {
  const supportedPlatform = supportedPlatforms.find(
    (supportedPlatform) =>
      supportedPlatform.arch === arch && supportedPlatform.platform === platform
  );

  if (supportedPlatform) {
    return supportedPlatform;
  }

  throw new Error(`unsupported platform and arch pair: ${platform} ${arch}`);
};

export const assertValidDistribution = (
  distribution: string
): CompassDistribution => {
  if (
    distribution === 'compass' ||
    distribution === 'compass-readonly' ||
    distribution === 'compass-isolated'
  ) {
    return distribution;
  }

  throw new Error(`unknown distribution ${distribution}`);
};

const assertNonEmptyString = (val: any): string => {
  if (val && typeof val === 'string') {
    return val;
  }

  throw new Error(`Non empty string expected, received: [${val}]`);
};

const assertValidDistributionConfig = (
  distribution: Partial<DistributionConfig>
): DistributionConfig => {
  return {
    name: assertNonEmptyString(distribution.name),
    productName: assertNonEmptyString(distribution.productName),
    bundleId: assertNonEmptyString(distribution.bundleId),
    'plugins-directory': assertNonEmptyString(
      distribution['plugins-directory']
    ),
    upgradeCode: assertNonEmptyString(distribution.upgradeCode),
    readonly: distribution.readonly,
    isolated: distribution.isolated,
  };
};

type CompassDistributionChannel = 'stable' | 'beta' | 'dev';

type InstallerOptions = {
  dmgPath?: string;
  setupIcon?: string;
  loadingGif?: string;
  icon?: string;
  iconUrl?: string;
  appDirectory?: string | undefined;
  appPath?: string;
  outputDirectory?: string;
  authors?: string;
  version?: string;
  exe?: string;
  setupExe?: string;
  signWithParams?: string;
  title?: string;
  productName?: string;
  description?: string;
  name?: string;
  noMsi?: boolean;
  overwrite?: boolean;
  out?: string;
  identity_display?: string;
  identity?: string;
  deb?: {
    src: string;
    dest: string;
    arch: string;
    icon: string;
    name: string;
    version: string;
    bin: string;
    section: string;
    depends: string[];
    mimeType: string[];
  };
  rpm?: {
    src: string;
    dest: string;
    arch: string;
    icon: string;
    name: string;
    version: string;
    revision: string;
    rename: (dest: string) => string;
    bin: string;
    requires: string[];
    categories: string[];
    license: string;
    mimeType: string[];
  };
  background?: string;
  contents?: {
    x: number;
    y: number;
    type: 'link' | 'file';
    path: string;
  }[];
};

type Asset = {
  name: string;
  path: string;
  downloadCenter?: boolean;
};

export class Target {
  static supportedPlatforms: { platform: string; arch: string }[] =
    supportedPlatforms;
  static supportedDistributions: CompassDistribution[] = supportedDistributions;

  dir: string;
  out: string;
  pkg: PackageConfig;
  distribution: CompassDistribution;
  name: string;
  readonly: boolean;
  isolated: boolean;
  productName: string;
  bundleId: string;
  upgradeCode: string;
  version: string;
  platform: NodeJS.Platform;
  arch: NodeJS.Process['arch'];
  description: string;
  author: string;
  shortcutFolderName: string;
  slug: string;
  channel: CompassDistributionChannel;
  packagerOptions: PackagerOptions;
  app_archive_name: string | undefined;
  osx_zip_filename: string | undefined;
  windows_zip_filename: string | undefined;
  rhel_tar_filename: string | undefined;
  linux_tar_filename: string | undefined;
  appPath: string;
  windows_setup_filename: string | undefined;
  windows_msi_label: string | undefined;
  windows_msi_filename: string | undefined;
  windows_zip_label: string | undefined;
  windows_releases_label: string | undefined;
  windows_releases_filename: string | undefined;
  windows_nupkg_full_label: string | undefined;
  windows_nupkg_full_filename: string | undefined;
  truncatedProductName: string | undefined;
  osx_dmg_label: string | undefined;
  osx_dmg_filename: string | undefined;
  osx_zip_label: string | undefined;
  linux_deb_filename: string | undefined;
  linux_rpm_filename: string | undefined;
  id: string;
  semver: semver.SemVer;
  autoUpdateBaseUrl: string;
  asar: { unpack: string[] };
  rebuild: { onlyModules: string[] };
  macosEntitlements: string | undefined;
  electronVersion: string;
  resourcesAppDir: string;
  windows_setup_label: string | undefined;
  assets: Asset[];
  installerOptions?: InstallerOptions;
  resources: string;

  createInstaller!: () => Promise<void>;

  // eslint-disable-next-line complexity
  constructor(dir: string, targetOptions: TargetOptions = {}) {
    const pkg = getApplicationPackageJson(dir);

    const envOptions = {
      version: process.env.HADRON_APP_VERSION,
      distribution: process.env.HADRON_DISTRIBUTION,
    };

    const defaultOptions = {
      distribution: 'compass',
      platform: process.platform,
      arch: process.arch,
      sign: true,
    };

    const opts = _.defaults(targetOptions, envOptions, pkg, defaultOptions);

    this.dir = dir || process.cwd();
    this.out = path.join(this.dir, 'dist');
    this.pkg = pkg;

    const allDistributionConfigs = pkg.config.hadron.distributions;

    this.distribution = assertValidDistribution(opts.distribution);
    const distributionConfig = assertValidDistributionConfig({
      ...allDistributionConfigs[this.distribution],
      name:
        process.env.HADRON_PRODUCT ??
        allDistributionConfigs[this.distribution].name,
      productName:
        process.env.HADRON_PRODUCT_NAME ??
        allDistributionConfigs[this.distribution].productName,
      readonly:
        typeof process.env.HADRON_READONLY !== 'undefined'
          ? ['1', 'true'].includes(process.env.HADRON_READONLY)
          : allDistributionConfigs[this.distribution].readonly,
      isolated:
        typeof process.env.HADRON_ISOLATED !== 'undefined'
          ? ['1', 'true'].includes(process.env.HADRON_ISOLATED)
          : allDistributionConfigs[this.distribution].isolated,
    });

    this.id = distributionConfig.name;
    this.name = distributionConfig.name;
    this.readonly = !!distributionConfig.readonly;
    this.isolated = !!distributionConfig.isolated;
    this.productName = distributionConfig.productName;
    this.bundleId = distributionConfig.bundleId;
    this.upgradeCode = distributionConfig.upgradeCode;

    const supportedPlatform = assertValidPlatformAndArch(
      opts.platform,
      opts.arch
    );

    this.version = opts.version;
    this.platform = supportedPlatform.platform;
    this.arch = supportedPlatform.arch;
    this.description = opts.description;
    this.author = opts.author.name;
    this.shortcutFolderName = opts.shortcutFolderName;

    this.slug = this.name;
    this.semver = new semver.SemVer(this.version);
    this.channel = Target.getChannelFromVersion(this.version);

    if (this.channel !== 'stable') {
      this.slug += `-${this.channel}`;
    }

    this.autoUpdateBaseUrl = pkg.config.hadron.endpoint;

    this.asar = { unpack: [], ...pkg.config.hadron.asar };

    this.rebuild = { ...pkg.config.hadron.rebuild };
    this.macosEntitlements = this.src(pkg.config.hadron.macosEntitlements);

    /**
     * Add `channel` suffix to product name, e.g. "Compass Beta".
     */
    if (this.channel !== 'stable') {
      this.productName += ' ' + _.capitalize(this.channel);
    }

    this.electronVersion = pkg.electronVersion;

    this.assets = [];
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
      afterExtract: [ffmpegAfterExtract],
    };

    this.appPath = '';
    this.resources = '';

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

    // Make sure each platform configuration assigned these 2 props
    // that we initialize to empty strings otherwise
    assertNonEmptyString(this.appPath);
    assertNonEmptyString(this.resources);
  } // ~ constructor

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
  src(...args: string[]): string {
    return path.join(this.dir, ...args);
  }

  /**
   * Get an absolute path to a file in the output directory.
   * @return {String}
   */
  dest(...args: string[]): string {
    return path.join(this.out, ...args);
  }

  distRoot() {
    if (this.platform === 'darwin') {
      return path.join(this.appPath, '..');
    }

    return path.join(this.appPath);
  }

  async write(filename: string, contents: string) {
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
    const platformSettings = this.pkg.config.hadron.build.win32;

    if (!platformSettings) {
      throw new Error('could not find win32 platform settings in package.json');
    }

    Object.assign(this.packagerOptions, {
      name: this.productName.replace(/ /g, ''),
      icon: this.src(platformSettings.icon),
      'version-string': {
        CompanyName: this.author,
        FileDescription: this.description,
        ProductName: this.productName,
        InternalName: this.name,
      },
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
        name: this.windows_releases_label,
        path: this.dest(this.windows_releases_label),
      },
      {
        name: this.windows_nupkg_full_label,
        path: this.dest(this.windows_nupkg_full_label),
      },
    ];

    this.installerOptions = {
      loadingGif: this.src(assertNonEmptyString(platformSettings.loading_gif)),
      iconUrl: assertNonEmptyString(platformSettings.favicon_url),
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
      await signWindowsPackage(
        path.join(
          assertNonEmptyString(this.installerOptions?.appDirectory),
          assertNonEmptyString(this.installerOptions?.exe)
        )
      );

      const electronWinstaller = await import('electron-winstaller');
      await electronWinstaller.createWindowsInstaller({
        ...this.installerOptions,
        appDirectory: assertNonEmptyString(this.installerOptions?.appDirectory),
      });

      await fs.promises.rename(
        this.dest('RELEASES'),
        this.dest(assertNonEmptyString(this.windows_releases_label))
      );

      const { MSICreator } = await import('@mongodb-js/electron-wix-msi');

      const msiCreator = new MSICreator({
        appDirectory: this.appPath,
        outputDirectory: this.packagerOptions.out,
        exe: this.packagerOptions.name,
        name: this.productName,
        description: this.description,
        manufacturer: this.author,
        version: windowsInstallerVersion(this.version),
        shortcutFolderName: this.shortcutFolderName || this.author,
        programFilesFolderName: this.productName,
        appUserModelId: this.bundleId,
        upgradeCode: this.upgradeCode,
        arch: 'x64',
        extensions: ['WixUtilExtension'],
        ui: {
          chooseDirectory: true,
          images: {
            background: this.src(
              assertNonEmptyString(platformSettings.background)
            ),
            banner: this.src(assertNonEmptyString(platformSettings.banner)),
          },
        },
      });

      await msiCreator.create();
      await msiCreator.compile();

      // sign the MSI
      await signWindowsPackage(this.dest(`${this.packagerOptions.name}.msi`));

      await fs.promises.rename(
        this.dest(`${this.packagerOptions.name}.msi`),
        this.dest(assertNonEmptyString(this.windows_msi_label))
      );
    };
  }

  /**
   * Apply macOS specific configuration.
   */
  configureForDarwin() {
    this.truncatedProductName = this.productName.substring(0, 25);
    const platformSettings = this.pkg.config.hadron.build.darwin;

    if (!platformSettings) {
      throw new Error('darwin configuration missing in package json.');
    }

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
        path: this.dest(this.osx_zip_label),
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
        {
          x: 322,
          y: 243,
          type: 'link',
          path: '/Applications',
        },
        /**
         * Show a shortcut on the left for the application icon.
         */
        {
          x: 93,
          y: 243,
          type: 'file',
          path: this.appPath,
        },
      ],
    };

    this.createInstaller = async () => {
      const appDirectoryName = `${this.productName}.app`;
      const appPath = this.appPath;

      {
        const plistFilePath = path.join(appPath, 'Contents', 'Info.plist');
        const parsedPlistContent = plist.parse(
          await fs.promises.readFile(plistFilePath, 'utf8')
        ) as PlistObject;

        const plistContent: PlistObject = {
          ...parsedPlistContent,
          CFBundleURLTypes: _.get(this.pkg, 'config.hadron.protocols', []).map(
            (protocol) => ({
              CFBundleTypeRole: 'Editor',
              CFBundleURLIconFile: platformSettings.icon,
              CFBundleURLName: protocol.name,
              CFBundleURLSchemes: protocol.schemes,
            })
          ),
        };

        await fs.promises.writeFile(plistFilePath, plist.build(plistContent));
      }

      if (
        process.env.MACOS_NOTARY_KEY &&
        process.env.MACOS_NOTARY_SECRET &&
        process.env.MACOS_NOTARY_CLIENT_URL &&
        process.env.MACOS_NOTARY_API_URL
      ) {
        debug(`Signing and notarizing "${appPath}"`);
        // https://wiki.corp.mongodb.com/display/BUILD/How+to+use+MacOS+notary+service
        debug(
          `Downloading the notary client from ${
            process.env.MACOS_NOTARY_CLIENT_URL
          } to ${path.resolve('macnotary')}`
        );
        await download(process.env.MACOS_NOTARY_CLIENT_URL, 'macnotary', {
          extract: true,
          strip: 1, // remove leading platform + arch directory
        });
        await fs.promises.chmod('macnotary/macnotary', 0o755); // ensure +x is set

        debug(
          `running "zip -y -r '${appDirectoryName}.zip' '${appDirectoryName}'"`
        );
        await execFile(
          'zip',
          ['-y', '-r', `${appDirectoryName}.zip`, appDirectoryName],
          {
            cwd: path.dirname(appPath),
          }
        );
        debug(`sending file to notary service (bundle id = ${this.bundleId})`);
        const macnotaryResult = await execFile(
          path.resolve('macnotary/macnotary'),
          [
            '-t',
            'app',
            '-m',
            'notarizeAndSign',
            '-u',
            process.env.MACOS_NOTARY_API_URL,
            '-b',
            this.bundleId,
            '-f',
            `${appDirectoryName}.zip`,
            '-o',
            `${appDirectoryName}.signed.zip`,
            '--verify',
            ...(this.macosEntitlements ? ['-e', this.macosEntitlements] : []),
          ],
          {
            cwd: path.dirname(appPath),
            encoding: 'utf8',
          }
        );
        debug(
          'macnotary result:',
          macnotaryResult.stdout,
          macnotaryResult.stderr
        );
        debug(
          'ls',
          (
            await execFile('ls', ['-lh'], {
              cwd: path.dirname(appPath),
              encoding: 'utf8',
            })
          ).stdout
        );
        debug('removing existing directory contents');
        await execFile('rm', ['-r', appDirectoryName], {
          cwd: path.dirname(appPath),
        });
        debug(`unzipping with "unzip -u '${appDirectoryName}.signed.zip'"`);
        await execFile('unzip', ['-u', `${appDirectoryName}.signed.zip`], {
          cwd: path.dirname(appPath),
          encoding: 'utf8',
        });
        debug(
          'ls',
          (
            await execFile('ls', ['-lh'], {
              cwd: path.dirname(appPath),
              encoding: 'utf8',
            })
          ).stdout
        );
        debug(
          `removing '${appDirectoryName}.signed.zip' and '${appDirectoryName}.zip'`
        );
        await fs.promises.unlink(`${appPath}.signed.zip`);
        await fs.promises.unlink(`${appPath}.zip`);
      } else {
        console.error(
          chalk.yellow.bold(
            'WARNING: macos notary service credentials not set -- skipping signing and notarization!'
          )
        );
      }
      const { default: createDMG } = await import('electron-installer-dmg');

      if (!this.installerOptions) {
        throw new Error('installerOptions is not defined');
      }

      const dmgOptions: CreateOptions = {
        ...this.installerOptions,
        name: assertNonEmptyString(this.installerOptions.name),
        appPath: assertNonEmptyString(this.installerOptions.appPath),
      };

      await createDMG(dmgOptions);
    };
  }

  /**
   * Apply Linux specific configuration.
   */
  configureForLinux() {
    const platformSettings = this.pkg.config.hadron.build.linux;

    if (!platformSettings) {
      throw new Error(
        'unable to get linux platform settings from package.json'
      );
    }

    this.appPath = this.dest(
      `${this.productName}-${this.platform}-${this.arch}`
    );
    this.resources = path.join(this.appPath, 'resources');

    Object.assign(this.packagerOptions, {
      name: this.productName,
    });

    const debianVersion = this.version;
    const debianArch = this.arch === 'x64' ? 'amd64' : 'i386';
    const debianSection = _.get(platformSettings, 'deb_section');
    this.linux_deb_filename = `${this.slug}_${debianVersion}_${debianArch}.deb`;

    const rhelVersion = [
      this.semver.major,
      this.semver.minor,
      this.semver.patch,
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
        downloadCenter: true,
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
        name: this.rhel_tar_filename,
        path: this.dest(this.rhel_tar_filename),
      },
    ];

    let license = this.pkg.license;
    if (license === 'UNLICENSED') {
      license = `Copyright © ${new Date().getFullYear()} ${
        this.author
      }. All Rights Reserved.`;
    }

    const mimeType = _.get(this.pkg, 'config.hadron.protocols', [])
      .flatMap((protocol) => protocol.schemes)
      .map((scheme) => `x-scheme-handler/${scheme}`);

    this.installerOptions = {
      deb: {
        src: this.appPath,
        dest: this.out,
        arch: debianArch,
        icon: this.src(platformSettings.icon),
        name: this.slug,
        version: debianVersion,
        bin: this.productName,
        section: assertNonEmptyString(debianSection),
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
        rename: (dest) => {
          return path.join(dest, assertNonEmptyString(this.linux_rpm_filename));
        },
        bin: this.productName,
        requires: ['gnome-keyring', 'libsecret'],
        categories: rhelCategories ?? [],
        license: license,
        mimeType,
      },
    };

    const createRpmInstaller = () => {
      return ifCanBuildLinuxInstaller('rpm', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const createRpm = require('electron-installer-redhat');
        debug('creating rpm...', this.installerOptions?.rpm);
        return createRpm(this.installerOptions?.rpm).then(() => {
          return signLinuxPackage(
            this.dest(assertNonEmptyString(this.linux_rpm_filename))
          );
        });
      });
    };

    const createDebInstaller = () => {
      return ifCanBuildLinuxInstaller('deb', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const createDeb = require('electron-installer-debian');
        debug('creating deb...', this.installerOptions?.deb);
        return createDeb(this.installerOptions?.deb).then(() => {
          // We do not sign debs because it doesn't work, see
          // this thread for context:
          //   https://mongodb.slack.com/archives/G2L10JAV7/p1623169331107600
          //
          // return sign(this.dest(this.linux_deb_filename));
          return this.dest(assertNonEmptyString(this.linux_deb_filename));
        });
      });
    };

    const createTarball = () => {
      debug(
        'creating tarball %s -> %s',
        this.appPath,
        this.dest(assertNonEmptyString(this.app_archive_name))
      );

      return tarGz(
        this.appPath,
        this.dest(assertNonEmptyString(this.app_archive_name))
      );
    };

    this.createInstaller = async () => {
      await Promise.all([
        createRpmInstaller(),
        createDebInstaller(),
        createTarball(),
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
  getAssetWithExtension(extname: string) {
    const res = this.assets.filter(function (asset) {
      return path.extname(asset.path) === extname;
    });
    debug('%s -> ', extname, res);

    return res[0];
  }

  static getAssetsForVersion(dir: string, version: string) {
    const configs = supportedDistributions.flatMap((distribution) => {
      return supportedPlatforms.map((platformConfig) => {
        return { ...platformConfig, distribution };
      });
    });

    const assets = configs.flatMap((config) => {
      const target = new Target(dir, { ...config, version });
      return {
        config: { ...config, version: target.version, channel: target.channel },
        assets: target.assets,
      };
    });

    return assets;
  }

  static getChannelFromVersion(version: string): CompassDistributionChannel {
    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    const match = version.match(/-([a-z]+)(\.\d+)?$/);
    if (match) {
      const channel = match[1].toLowerCase();
      if (channel === 'beta' || channel === 'dev') {
        return channel;
      } else {
        throw `Unknown channel ${channel}`;
      }
    }
    return 'stable';
  }

  static getDownloadLinkForAsset(version: string, asset: Asset) {
    const channel = Target.getChannelFromVersion(version);
    const prefix =
      channel && channel !== 'stable' ? `compass/${channel}` : 'compass';
    return `https://downloads.mongodb.com/${prefix}/${asset.name}`;
  }
}
