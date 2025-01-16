#!/usr/bin/env npx ts-node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pick } from 'lodash';
import { installMacDMG } from './installers/mac-dmg';
import { execute } from './installers/helpers';
import {
  type PackageDetails,
  readPackageDetails,
  writeAndReadPackageDetails,
} from './helpers/smoke-test/build-info';
import { createSandbox } from './helpers/smoke-test/directories';
import { downloadFile } from './helpers/smoke-test/downloads';
import { SUPPORTED_PACKAGES } from './helpers/smoke-test/packages';
import { type SmokeTestsContext } from './helpers/smoke-test/context';
import { installMacZIP } from './installers/mac-zip';

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
  });

type TestSubject = PackageDetails & { filepath: string };

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
    ])
  );

  const cleanups: (() => void | Promise<void>)[] = [
    () => {
      console.log('Cleaning up sandbox');
      fs.rmSync(context.sandboxPath, { recursive: true });
    },
  ];
  const { kind, buildInfo, filepath } = await getTestSubject(context);

  try {
    const appName = buildInfo.productName;
    if (kind === 'osx_dmg') {
      const { appPath, uninstall } = installMacDMG({
        appName,
        filepath,
        destinationPath: context.sandboxPath,
      });
      cleanups.push(uninstall);

      runTest({ appName, appPath });
    } else if (kind === 'osx_zip') {
      const { appPath, uninstall } = installMacZIP({
        appName,
        filepath,
        destinationPath: context.sandboxPath,
      });
      cleanups.push(uninstall);

      runTest({ appName, appPath });
    } else {
      throw new Error(`Testing '${kind}' packages is not yet implemented`);
    }
  } finally {
    await Promise.all(cleanups.map((cleanup) => cleanup()));
  }
}

type RunTestOptions = {
  appName: string;
  appPath: string;
};

function runTest({ appName, appPath }: RunTestOptions) {
  execute(
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
        COMPASS_APP_NAME: appName,
        COMPASS_APP_PATH: appPath,
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
    process.exitCode = 1;
  });
