#!/usr/bin/env npx ts-node
import assert from 'node:assert/strict';
import { createWriteStream, existsSync, promises as fs } from 'node:fs';
import path from 'node:path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import https from 'https';
import { pick } from 'lodash';
import { handler as writeBuildInfo } from 'hadron-build/commands/info';
import type { Package, Installer } from './installers/types';
import { installMacDMG } from './installers/mac-dmg';
import {
  assertBuildInfoIsOSX,
  assertBuildInfoIsRHEL,
  assertBuildInfoIsUbuntu,
  assertBuildInfoIsWindows,
  assertCommonBuildInfo,
} from './helpers/buildinfo';
import { testAutoUpdateFrom } from './smoketests/auto-update-from';

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
  .option('version', {
    type: 'string',
    // For dev versions we need this from evergreen. For beta or stable (or by
    // default, ie. when testing a locally packaged app) we get it from the
    // package.json
    default: process.env.DEV_VERSION_IDENTIFIER,
    description:
      'Will be read from packages/compass/package.json if not specified',
  })
  .option('platform', {
    type: 'string',
    choices: ['win32', 'darwin', 'linux'],
    demandOption: true,
    default: process.env.PLATFORM ?? process.platform,
  })
  .option('arch', {
    type: 'string',
    choices: ['x64', 'arm64'],
    demandOption: true,
    default: process.env.ARCH ?? process.arch,
  })
  .option('package', {
    type: 'string',
    choices: [
      'windows_setup',
      'windows_msi',
      'windows_zip',
      'osx_dmg',
      'osx_zip',
      'linux_deb',
      'linux_tar',
      'linux_rpm',
      'rhel_tar',
    ],
    demandOption: true,
    description: 'Which package to test',
  })
  .option('skipDownload', {
    type: 'boolean',
    description: "Don't download all assets before starting",
  })
  .check((argv) => {
    if (!argv.skipDownload) {
      if (!(argv.bucketName && argv.bucketKeyPrefix)) {
        throw new Error(
          'Either supply EVERGREEN_BUCKET_NAME and EVERGREEN_BUCKET_KEY_PREFIX or specify --skip-download'
        );
      }
    }

    return true;
  });

type SmokeTestsContext = {
  bucketName?: string;
  bucketKeyPrefix?: string;
  version?: string;
  platform: 'win32' | 'darwin' | 'linux';
  arch: 'x64' | 'arm64';
  package:
    | 'windows_setup'
    | 'windows_msi'
    | 'windows_zip'
    | 'osx_dmg'
    | 'osx_zip'
    | 'linux_deb'
    | 'linux_tar'
    | 'linux_rpm'
    | 'rhel_tar';
  skipDownload?: boolean;
};

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
      'version',
      'platform',
      'arch',
      'package',
    ])
  );

  const compassDir = path.resolve(__dirname, '..', '..', 'packages', 'compass');
  // use the specified DEV_VERSION_IDENTIFIER if set or load version from packages/compass/package.json
  const version = context.version ?? (await readPackageVersion(compassDir));
  const outPath = path.resolve(__dirname, 'hadron-build-info.json');

  // build-info
  const infoArgs = {
    format: 'json',
    dir: compassDir,
    version,
    platform: context.platform,
    arch: context.arch,
    out: outPath,
  };
  console.log('infoArgs', infoArgs);
  writeBuildInfo(infoArgs);
  const buildInfo = await readJson(infoArgs.out);

  assertCommonBuildInfo(buildInfo);

  let match:
    | { filename: string; installer: Installer; updatable: boolean }
    | undefined = undefined;

  if (context.package === 'windows_setup') {
    assertBuildInfoIsWindows(buildInfo);
    // TODO
  } else if (context.package === 'windows_msi') {
    assertBuildInfoIsWindows(buildInfo);
    // TODO
  } else if (context.package === 'windows_zip') {
    assertBuildInfoIsWindows(buildInfo);
    // TODO
  } else if (context.package === 'osx_dmg') {
    assertBuildInfoIsOSX(buildInfo);

    const filename = buildInfo.osx_dmg_filename;
    match = {
      filename,
      installer: installMacDMG,
      // The tests need to know whether to expect the path where auto-update
      // works automatically or if Compass will only notify the user of an
      // update.
      updatable: true,
    };
  } else if (context.package === 'osx_zip') {
    assertBuildInfoIsOSX(buildInfo);
    // TODO
  } else if (context.package === 'linux_deb') {
    assertBuildInfoIsUbuntu(buildInfo);
    // TODO
  } else if (context.package === 'linux_tar') {
    assertBuildInfoIsUbuntu(buildInfo);
    // TODO
  } else if (context.package === 'linux_rpm') {
    assertBuildInfoIsRHEL(buildInfo);
    // TODO
  } else if (context.package === 'rhel_tar') {
    assertBuildInfoIsRHEL(buildInfo);
    // TODO
  }

  if (match) {
    const pkg: Package = {
      // we need appName because it is the name of the executable inside the
      // package, regardless of what the package filename is named or where it
      // gets installed
      appName: buildInfo.productName,
      packageFilepath: path.join(compassDir, 'dist', match.filename),
      updatable: match.updatable,
      // TODO: releaseFilepath once we download the most recent released version too
      installer: match.installer,
    };

    if (!context.skipDownload) {
      assert(
        context.bucketName !== undefined &&
          context.bucketKeyPrefix !== undefined
      );
      await fs.mkdir(path.dirname(pkg.packageFilepath), { recursive: true });
      const url = `https://${context.bucketName}.s3.amazonaws.com/${context.bucketKeyPrefix}/${match.filename}`;
      console.log(url);
      await downloadFile(url, pkg.packageFilepath);

      // TODO: we need to also download releaseFilepath once we have that
    }

    if (!existsSync(pkg.packageFilepath)) {
      throw new Error(
        `${pkg.packageFilepath} does not exist. Did you forget to download or package?`
      );
    }

    // TODO: installing either the packaged file or the released file is better
    // done as part of tests so we can also clean up and install one after the
    // other, but that's for a separate PR.
    /*
    console.log('installing', pkg.packageFilepath);
    const installedInfo = await pkg.installer({
      appName: pkg.appName,
      filepath: pkg.packageFilepath,
    });
    console.log('testing', installedInfo.appPath);
    await testInstalledApp(pkg, installedInfo);
    */
    await testAutoUpdateFrom(pkg);
    // TODO:
    //await testAutoUpdateTo(pkg);
  } else {
    throw new Error(`${context.package} not implemented`);
  }
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

/*
function testInstalledApp(
  pkg: Package,
  appInfo: InstalledAppInfo
): Promise<void> {
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
        COMPASS_APP_NAME: pkg.appName,
        COMPASS_APP_PATH: appInfo.appPath,
      },
    }
  );
}
*/

run()
  .then(function () {
    console.log('done');
  })
  .catch(function (err) {
    console.error(err.stack);
    process.exit(1);
  });
