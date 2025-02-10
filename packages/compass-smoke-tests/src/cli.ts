#!/usr/bin/env npx ts-node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pick } from 'lodash';
import { SUPPORTED_TESTS } from './tests/types';
import { type SmokeTestsContext } from './context';
import { SUPPORTED_PACKAGES } from './packages';
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

async function run() {
  const context: SmokeTestsContext = argv.parseSync();

  console.log(`Running tests`);

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

  for (const testName of context.tests) {
    console.log(testName);

    if (testName === 'time-to-first-query') {
      await testTimeToFirstQuery(context);
    } else if (testName === 'auto-update-from') {
      await testAutoUpdateFrom(context);
    } else if (testName === 'auto-update-to') {
      await testAutoUpdateTo(context);
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
