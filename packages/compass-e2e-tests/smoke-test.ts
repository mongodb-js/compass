#!/usr/bin/env npx ts-node
import assert from 'node:assert/strict';
import { createWriteStream, existsSync, promises as fs } from 'node:fs';
import path from 'node:path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import https from 'https';
import { pick } from 'lodash';
import { handler as writeBuildInfo } from 'hadron-build/commands/info';
import type { InstalledAppInfo, Package } from './installers/types';
import { installMacDMG } from './installers/mac-dmg';
import { execute } from './installers/helpers';

const argv = yargs(hideBin(process.argv))
  .scriptName('smoke-tests')
  .detectLocale(false)
  .version(false)
  .strict()
  .option('bucketName', {
    type: 'string',
    default: process.env.EVERGREEN_BUCKET_NAME,
  })
  .option('bucketKeyPrefix', {
    type: 'string',
    default: process.env.EVERGREEN_BUCKET_KEY_PREFIX,
  })
  .option('devVersion', {
    type: 'string',
    // For dev versions we need this from evergreen. For beta or stable (or by
    // default, ie. when testing a locally packaged app) we get it from the
    // package.json
    default: process.env.DEV_VERSION_IDENTIFIER,
  })
  .option('isWindows', {
    type: 'boolean',
    default: process.env.IS_WINDOWS === 'true',
  })
  .option('isOSX', {
    type: 'boolean',
    default: process.env.IS_OSX === 'true',
  })
  .option('isRHEL', {
    type: 'boolean',
    default: process.env.IS_RHEL === 'true',
  })
  .option('isUbuntu', {
    type: 'boolean',
    default: process.env.IS_UBUNTU === 'true',
  })
  .option('arch', {
    type: 'string',
    choices: ['x64', 'arm64'],
    demandOption: true,
    default: process.env.ARCH ?? process.arch,
  })
  .option('skipDownload', {
    type: 'boolean',
    description: "Don't download all assets before starting",
  })
  .option('extension', {
    type: 'string',
    description:
      'If specified it will only run the smoke tests for the specified installer/package',
  })
  .check((argv) => {
    if (!argv.skipDownload) {
      if (!(argv.bucketName && argv.bucketKeyPrefix)) {
        throw new Error(
          'Either supply EVERGREEN_BUCKET_NAME and EVERGREEN_BUCKET_KEY_PREFIX or specify --skip-download'
        );
      }
    }

    // hadron-build info can only do one platform & arch at a time
    const platformsCount = [
      argv.isWindows,
      argv.isOSX,
      argv.isUbuntu,
      argv.isRHEL,
    ].filter((x) => x).length;
    if (platformsCount !== 1) {
      throw new Error(
        'Set exactly one of IS_WINDOWS, IS_OSX, IS_UBUNTU, IS_RHEL to true'
      );
    }

    return true;
  });

type SmokeTestsContext = ReturnType<typeof argv['parseSync']>;

async function readJson<T extends object>(...segments: string[]): Promise<T> {
  const result = JSON.parse(
    await fs.readFile(path.join(...segments), 'utf8')
  ) as unknown;
  assert(typeof result === 'object' && result !== null, 'Expected an object');
  return result as T;
}

async function readPackageVersion(packagePath: string) {
  const pkg = await readJson(packagePath, 'package.json');
  assert(
    'version' in pkg && typeof pkg.version === 'string',
    'Expected a package version'
  );
  return pkg.version;
}

async function run() {
  const parsedArgs = argv.parseSync();

  const context = parsedArgs as SmokeTestsContext;

  console.log(
    'context',
    pick(context, [
      'skipDownload',
      'bucketName',
      'bucketKeyPrefix',
      'devVersion',
      'isWindows',
      'isOSX',
      'isRHEL',
      'isUbuntu',
      'arch',
      'extension',
    ])
  );

  const compassDir = path.resolve(__dirname, '..', '..', 'packages', 'compass');
  // use the specified DEV_VERSION_IDENTIFIER if set or load version from packages/compass/package.json
  const version = context.devVersion ?? (await readPackageVersion(compassDir));
  const platform = platformFromContext(context);
  const outPath = path.resolve(__dirname, 'hadron-build-info.json');

  // build-info
  const infoArgs = {
    format: 'json',
    dir: compassDir,
    version,
    platform,
    arch: context.arch,
    out: outPath,
  };
  console.log('infoArgs', infoArgs);
  writeBuildInfo(infoArgs);
  const buildInfo = await readJson(infoArgs.out);

  assertCommonBuildInfo(buildInfo);

  // filter the extensions given the platform (isWindows, isOSX, isUbuntu, isRHEL) and extension
  const { isWindows, isOSX, isRHEL, isUbuntu, extension } = context;

  const packages = getFilteredPackages(compassDir, buildInfo, {
    isWindows,
    isOSX,
    isRHEL,
    isUbuntu,
    extension,
  });

  if (!context.skipDownload) {
    await Promise.all(
      packages.map(async ({ filename, filepath }) => {
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        const url = `https://${context.bucketName}.s3.amazonaws.com/${context.bucketKeyPrefix}/${filename}`;
        console.log(url);
        return downloadFile(url, filepath);
      })
    );
  }

  verifyPackagesExist(packages);

  // TODO(COMPASS-8533): extract or install each package and then test the Compass binary
  for (const pkg of packages) {
    let appInfo: InstalledAppInfo | undefined = undefined;

    console.log('installing', pkg.filepath);

    if (pkg.filename.endsWith('.dmg')) {
      appInfo = await installMacDMG(buildInfo.productName, pkg);
    }

    // TODO: all the other installers go here

    if (appInfo) {
      console.log('testing', appInfo.appPath);
      await testInstalledApp(appInfo);
    } else {
      console.log(`no app got installed for ${pkg.filename}`);
    }
  }
}

function platformFromContext(
  context: SmokeTestsContext
): typeof process.platform {
  if (context.isWindows) {
    return 'win32';
  }

  if (context.isOSX) {
    return 'darwin';
  }

  if (context.isRHEL || context.isUbuntu) {
    return 'linux';
  }

  return process.platform;
}

type PackageFilterConfig = Pick<
  SmokeTestsContext,
  'isWindows' | 'isOSX' | 'isRHEL' | 'isUbuntu' | 'extension'
>;

// subsets of the hadron-build info result

const commonKeys = ['productName'];
type CommonBuildInfo = Record<typeof commonKeys[number], string>;

function assertCommonBuildInfo(
  buildInfo: unknown
): asserts buildInfo is CommonBuildInfo {
  assert(
    typeof buildInfo === 'object' && buildInfo !== null,
    'Expected buildInfo to be an object'
  );
  for (const key of commonKeys) {
    assert(key in buildInfo, `Expected buildInfo to have '${key}'`);
  }
}

const windowsFilenameKeys = [
  'windows_setup_filename',
  'windows_msi_filename',
  'windows_zip_filename',
  'windows_nupkg_full_filename',
] as const;
type WindowsBuildInfo = Record<typeof windowsFilenameKeys[number], string>;

const osxFilenameKeys = ['osx_dmg_filename', 'osx_zip_filename'] as const;
type OSXBuildInfo = Record<typeof osxFilenameKeys[number], string>;

const ubuntuFilenameKeys = [
  'linux_deb_filename',
  'linux_tar_filename',
] as const;
type UbuntuBuildInfo = Record<typeof ubuntuFilenameKeys[number], string>;

const rhelFilenameKeys = ['linux_rpm_filename', 'rhel_tar_filename'] as const;
type RHELBuildInfo = Record<typeof rhelFilenameKeys[number], string>;

function buildInfoIsWindows(buildInfo: any): buildInfo is WindowsBuildInfo {
  for (const key of windowsFilenameKeys) {
    if (!buildInfo[key]) {
      return false;
    }
  }
  return true;
}

function buildInfoIsOSX(buildInfo: any): buildInfo is OSXBuildInfo {
  for (const key of osxFilenameKeys) {
    if (!buildInfo[key]) {
      return false;
    }
  }
  return true;
}

function buildInfoIsUbuntu(buildInfo: any): buildInfo is UbuntuBuildInfo {
  for (const key of ubuntuFilenameKeys) {
    if (!buildInfo[key]) {
      return false;
    }
  }
  return true;
}

function buildInfoIsRHEL(buildInfo: any): buildInfo is RHELBuildInfo {
  for (const key of rhelFilenameKeys) {
    if (!buildInfo[key]) {
      return false;
    }
  }
  return true;
}

function getFilteredPackages(
  compassDir: string,
  buildInfo: any,
  config: PackageFilterConfig
): Package[] {
  let names: string[] = [];

  if (config.isWindows) {
    if (!buildInfoIsWindows(buildInfo)) {
      throw new Error('missing windows package keys');
    }
    names = windowsFilenameKeys.map((key) => buildInfo[key]);
  } else if (config.isOSX) {
    if (!buildInfoIsOSX(buildInfo)) {
      throw new Error('missing osx package keys');
    }
    names = osxFilenameKeys.map((key) => buildInfo[key]);
  } else if (config.isRHEL) {
    if (!buildInfoIsRHEL(buildInfo)) {
      throw new Error('missing rhel package keys');
    }
    names = rhelFilenameKeys.map((key) => buildInfo[key]);
  } else if (config.isUbuntu) {
    if (!buildInfoIsUbuntu(buildInfo)) {
      throw new Error('missing ubuntu package keys');
    }
    names = ubuntuFilenameKeys.map((key) => buildInfo[key]);
  }

  const extension = config.extension;

  return names
    .filter((filename) => !extension || filename.endsWith(extension))
    .map((filename) => {
      return {
        filename,
        filepath: path.join(compassDir, 'dist', filename),
      };
    });
}

async function downloadFile(url: string, targetFile: string): Promise<void> {
  return await new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const code = response.statusCode ?? 0;

        if (code >= 400) {
          return reject(new Error(response.statusMessage));
        }

        // handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
          return resolve(downloadFile(response.headers.location, targetFile));
        }

        // save the file to disk
        const fileWriter = createWriteStream(targetFile)
          .on('finish', () => {
            resolve();
          })
          .on('error', (error: any) => {
            reject(error);
          });

        response.pipe(fileWriter);
      })
      .on('error', (error: any) => {
        reject(error);
      });
  });
}

function verifyPackagesExist(packages: Package[]): void {
  for (const { filepath } of packages) {
    if (!existsSync(filepath)) {
      throw new Error(
        `${filepath} does not exist. Did you forget to download or package?`
      );
    }
  }
}

function testInstalledApp(appInfo: InstalledAppInfo): Promise<void> {
  return execute(
    'npm',
    [
      'run',
      '--unsafe-perm',
      'test-packaged',
      '--workspace',
      'compass-e2e-tests',
      '--',
      '--test-filter=time-to-first-query',
    ],
    {
      env: {
        ...process.env,
        COMPASS_APP_NAME: appInfo.appName,
        COMPASS_APP_PATH: appInfo.appPath,
      },
    }
  );
}

run()
  .then(function () {
    console.log('done');
  })
  .catch(function (err) {
    console.error(err.stack);
    process.exit(1);
  });
