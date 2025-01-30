#!/usr/bin/env npx ts-node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pick } from 'lodash';
import { execute, executeAsync } from './execute';
import {
  type PackageDetails,
  readPackageDetails,
  writeAndReadPackageDetails,
} from './build-info';
import { createSandbox } from './directories';
import { downloadFile } from './downloads';
import { type PackageKind, SUPPORTED_PACKAGES } from './packages';
import { type SmokeTestsContext } from './context';

import { installMacDMG } from './installers/mac-dmg';
import { installMacZIP } from './installers/mac-zip';
import { installWindowsZIP } from './installers/windows-zip';
import { installWindowsMSI } from './installers/windows-msi';

const SUPPORTED_PLATFORMS = ['win32', 'darwin', 'linux'] as const;
const SUPPORTED_ARCHS = ['x64', 'arm64'] as const;

const SUPPORTED_TESTS = ['time-to-first-query', 'auto-update-from'] as const;

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

  const { kind, appName, filepath, autoUpdatable } = await getTestSubject(
    context
  );
  const install = getInstaller(kind);

  try {
    if (context.tests.length === 0) {
      console.log('Warning: not performing any tests. Pass --tests.');
    }

    for (const testName of context.tests) {
      const { appPath, uninstall } = install({
        appName,
        filepath,
        destinationPath: context.sandboxPath,
      });

      try {
        if (testName === 'time-to-first-query') {
          // Auto-update does not work on mac in CI at the moment. So in that case
          // we just run the E2E tests to make sure the app at least starts up.
          runTimeToFirstQuery({
            appName,
            appPath,
          });
        }
        if (testName === 'auto-update-from') {
          await runUpdateTest({
            appName,
            appPath,
            autoUpdatable,
            testName,
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

async function importUpdateServer() {
  try {
    return (await import('compass-mongodb-com')).default;
  } catch (err: unknown) {
    console.log('Remember to npm link compass-mongodb-com');
    throw err;
  }
}

async function startAutoUpdateServer() {
  console.log('Starting auto-update server');
  const { httpServer, updateChecker, start } = (await importUpdateServer())();
  start();
  await once(updateChecker, 'refreshed');

  return httpServer;
}

type RunE2ETestOptions = {
  appName: string;
  appPath: string;
};

function runTimeToFirstQuery({ appName, appPath }: RunE2ETestOptions) {
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
      // We need to use a shell to get environment variables setup correctly
      shell: true,
      env: {
        ...process.env,
        COMPASS_APP_NAME: appName,
        COMPASS_APP_PATH: appPath,
      },
    }
  );
}

type RunUpdateTestOptions = {
  appName: string;
  appPath: string;
  autoUpdatable?: boolean;
  testName: string;
};

async function runUpdateTest({
  appName,
  appPath,
  autoUpdatable,
  testName,
}: RunUpdateTestOptions) {
  process.env.PORT = '0'; // dynamic port
  process.env.UPDATE_CHECKER_ALLOW_DOWNGRADES = 'true';

  const server = await startAutoUpdateServer();

  const address = server.address();
  assert(typeof address === 'object' && address !== null);
  const port = address.port;
  const HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE = `http://localhost:${port}`;
  console.log({ HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE });

  try {
    // must be async because the update server is running in the same process
    await executeAsync(
      'npm',
      [
        'run',
        '--unsafe-perm',
        'test-packaged',
        '--workspace',
        'compass-e2e-tests',
        '--',
        '--test-filter=auto-update',
      ],
      {
        // We need to use a shell to get environment variables setup correctly
        shell: true,
        env: {
          ...process.env,
          HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE,
          AUTO_UPDATE_UPDATABLE: (!!autoUpdatable).toString(),
          TEST_NAME: testName,
          COMPASS_APP_NAME: appName,
          COMPASS_APP_PATH: appPath,
        },
      }
    );
  } finally {
    console.log('Stopping auto-update server');
    server.close();
    delete process.env.UPDATE_CHECKER_ALLOW_DOWNGRADES;
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
