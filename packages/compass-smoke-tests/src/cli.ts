#!/usr/bin/env npx ts-node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pick } from 'lodash';
import {
  type PackageDetails,
  readPackageDetails,
  writeAndReadPackageDetails,
} from './build-info';
import { createSandbox } from './directories';
import { downloadFile } from './downloads';
import { type PackageKind, SUPPORTED_PACKAGES } from './packages';
import { getLatestRelease } from './releases';
import { SUPPORTED_TESTS } from './tests/types';
import { type SmokeTestsContext } from './context';

import { installMacDMG } from './installers/mac-dmg';
import { installMacZIP } from './installers/mac-zip';
import { installWindowsZIP } from './installers/windows-zip';
import { installWindowsMSI } from './installers/windows-msi';

import { testTimeToFirstQuery } from './tests/time-to-first-query';
import { testAutoUpdateFrom } from './tests/auto-update-from';
import { testAutoUpdateTo } from './tests/auto-update-to';

const SUPPORTED_PLATFORMS = ['win32', 'darwin', 'linux'] as const;
const SUPPORTED_ARCHS = ['x64', 'arm64'] as const;

function isSupportedPlatform(
  value: unknown
): value is typeof SUPPORTED_PLATFORMS[number] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  return SUPPORTED_PLATFORMS.includes(value as any);
}

function isSupportedArch(
  value: unknown
): value is typeof SUPPORTED_ARCHS[number] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  return SUPPORTED_ARCHS.includes(value as any);
}

function getDefaultPlatform() {
  const {
    platform,
    env: { PLATFORM },
  } = process;
  if (isSupportedPlatform(PLATFORM)) {
    return PLATFORM;
  } else if (isSupportedPlatform(platform)) {
    return platform;
  }
}

function getDefaultArch() {
  const {
    arch,
    env: { ARCH },
  } = process;
  if (isSupportedArch(ARCH)) {
    return ARCH;
  } else if (isSupportedArch(arch)) {
    return arch;
  }
}

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
  .option('platform', {
    choices: SUPPORTED_PLATFORMS,
    demandOption: true,
    default: getDefaultPlatform(),
  })
  .option('arch', {
    choices: SUPPORTED_ARCHS,
    demandOption: true,
    default: getDefaultArch(),
  })
  .option('package', {
    type: 'string',
    choices: SUPPORTED_PACKAGES,
    demandOption: true,
    description: 'Which package to test',
  })
  .option('forceDownload', {
    type: 'boolean',
    description: 'Force download all assets before starting',
  })
  .option('localPackage', {
    type: 'boolean',
    description: 'Use the local package instead of downloading',
  })
  .option('skipCleanup', {
    type: 'boolean',
    description: 'Do not delete the sandbox after a run',
    default: false,
  })
  .option('tests', {
    type: 'array',
    string: true,
    choices: SUPPORTED_TESTS,
    description: 'Which tests to run',
  })
  .default('tests', SUPPORTED_TESTS.slice());

type TestSubject = PackageDetails & {
  filepath: string;
  /**
   * Is the package unsigned?
   * In which case we'll expect auto-updating to fail.
   */
  unsigned?: boolean;
};

/**
 * Either finds the local package or downloads the package
 */
async function getTestSubject(
  context: SmokeTestsContext
): Promise<TestSubject> {
  if (context.localPackage) {
    const compassDistPath = path.resolve(
      __dirname,
      '../../packages/compass/dist'
    );
    const buildInfoPath = path.resolve(compassDistPath, 'target.json');
    assert(
      fs.existsSync(buildInfoPath),
      `Expected '${buildInfoPath}' to exist`
    );
    const details = readPackageDetails(context.package, buildInfoPath);
    return {
      ...details,
      filepath: path.resolve(compassDistPath, details.filename),
      unsigned: true,
    };
  } else {
    assert(
      context.bucketName !== undefined && context.bucketKeyPrefix !== undefined,
      'Bucket name and key prefix are needed to download'
    );
    const details = writeAndReadPackageDetails(context);
    const filepath = await downloadFile({
      url: `https://${context.bucketName}.s3.amazonaws.com/${context.bucketKeyPrefix}/${details.filename}`,
      targetFilename: details.filename,
      clearCache: context.forceDownload,
    });

    return { ...details, filepath };
  }
}

function getInstaller(kind: PackageKind) {
  if (kind === 'osx_dmg') {
    return installMacDMG;
  } else if (kind === 'osx_zip') {
    return installMacZIP;
  } else if (kind === 'windows_zip') {
    return installWindowsZIP;
  } else if (kind === 'windows_msi') {
    return installWindowsMSI;
  } else {
    throw new Error(`Installer for '${kind}' is not yet implemented`);
  }
}

async function run() {
  const context: SmokeTestsContext = {
    ...argv.parseSync(),
    sandboxPath: createSandbox(),
  };

  console.log(`Running tests in ${context.sandboxPath}`);

  console.log(
    'context',
    pick(context, [
      'forceDownload',
      'bucketName',
      'bucketKeyPrefix',
      'platform',
      'arch',
      'package',
      'tests',
    ])
  );

  const {
    kind,
    appName,
    filepath,
    buildInfo: { channel, version },
    autoUpdatable,
  } = await getTestSubject(context);
  const install = getInstaller(kind);

  try {
    if (context.tests.length === 0) {
      console.log('Warning: not performing any tests. Pass --tests.');
    }

    for (const testName of context.tests) {
      const installerPath =
        testName === 'auto-update-to'
          ? await getLatestRelease(
              channel,
              context.arch,
              kind,
              context.forceDownload
            )
          : filepath;

      const { appPath, uninstall } = install({
        appName,
        filepath: installerPath,
        destinationPath: context.sandboxPath,
      });

      try {
        if (testName === 'time-to-first-query') {
          // Auto-update does not work on mac in CI at the moment. So in that case
          // we just run the E2E tests to make sure the app at least starts up.
          testTimeToFirstQuery({
            appName,
            appPath,
          });
        }
        if (testName === 'auto-update-from') {
          await testAutoUpdateFrom({
            appName,
            appPath,
            autoUpdatable,
          });
        }
        if (testName === 'auto-update-to') {
          assert(
            context.bucketKeyPrefix !== undefined,
            'Bucket key prefix is needed to download'
          );

          await testAutoUpdateTo({
            appName,
            appPath,
            autoUpdatable,
            channel,
            bucketKeyPrefix: context.bucketKeyPrefix,
            version,
          });
        }
      } finally {
        await uninstall();
      }
    }
  } finally {
    if (context.skipCleanup) {
      console.log(`Skipped cleaning up sandbox: ${context.sandboxPath}`);
    } else {
      console.log(`Cleaning up sandbox: ${context.sandboxPath}`);
      fs.rmSync(context.sandboxPath, { recursive: true });
    }
  }
}

run()
  .then(function () {
    console.log('done');
  })
  .catch(function (err) {
    console.error(err.stack);
    process.exitCode = 1;
  });
