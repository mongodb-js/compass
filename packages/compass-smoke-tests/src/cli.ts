#!/usr/bin/env npx ts-node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import crossSpawn from 'cross-spawn';
import kill from 'tree-kill';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pick } from 'lodash';
import { execute } from './execute';
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
    ])
  );

  const { kind, filepath, appName, autoUpdatable } = await getTestSubject(
    context
  );
  const install = getInstaller(kind);

  try {
    const { appPath, uninstall } = install({
      appName,
      filepath,
      destinationPath: context.sandboxPath,
    });

    try {
      const server = startAutoUpdateServer({
        allowDowngrades: true,
        port: 8080,
      });
      try {
        runTest({
          appName,
          appPath,
          autoUpdatable,
          testName: 'AUTO_UPDATE_FROM',
        });
      } finally {
        if (server.pid) {
          console.log('Stopping auto-update server');
          kill(server.pid, 'SIGINT');
        } else {
          console.log('cannnot stop auto-update server because no pid');
        }
      }
    } finally {
      await uninstall();
    }
  } finally {
    console.log('Cleaning up sandbox');
    fs.rmSync(context.sandboxPath, { recursive: true });
  }
}

type AutoUpdateServerOptions = {
  port: number;
  allowDowngrades?: boolean;
};

function startAutoUpdateServer({
  port,
  allowDowngrades,
}: AutoUpdateServerOptions) {
  const env: Record<string, string> = {
    ...process.env,
    PORT: port.toString(),
  };
  if (allowDowngrades) {
    env.UPDATE_CHECKER_ALLOW_DOWNGRADES = 'true';
  }

  // a git repo that is not published to npm that evergreen clones for us in CI
  // next to the Compass code
  const cwd = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'compass-mongodb-com'
  );

  if (!fs.existsSync(cwd)) {
    throw new Error(`compass-mongodb-com does not exist: ${cwd}`);
  }

  console.log('Starting auto-update server', cwd);
  return crossSpawn.spawn('npm', ['run', 'start'], {
    env,
    cwd,
    stdio: 'inherit',
    shell: true,
  });
}

type RunTestOptions = {
  appName: string;
  appPath: string;
  autoUpdatable?: boolean;
  testName: string;
};

function runTest({
  appName,
  appPath,
  autoUpdatable,
  testName,
}: RunTestOptions) {
  execute(
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
        HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE: 'http://localhost:8080',
        AUTO_UPDATE_UPDATABLE: (!!autoUpdatable).toString(),
        TEST_NAME: testName,
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
