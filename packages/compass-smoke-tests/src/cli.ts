#!/usr/bin/env npx ts-node
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pick } from 'lodash';
import createDebug from 'debug';

import { SUPPORTED_TESTS } from './tests/types';
import { type SmokeTestsContext } from './context';
import { SUPPORTED_PACKAGES } from './packages';
import { testTimeToFirstQuery } from './tests/time-to-first-query';
import { testAutoUpdateFrom } from './tests/auto-update-from';
import { testAutoUpdateTo } from './tests/auto-update-to';
import { deleteSandboxesDirectory } from './directories';
import { dispatchAndWait, getRefFromGithubPr } from './dispatch';

const debug = createDebug('compass:smoketests');

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

function getDefaultRef() {
  // TODO: Read this from an environment variable if possible
  return cp
    .spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    })
    .stdout.trim();
}

yargs(hideBin(process.argv))
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
  .command(
    '$0',
    'Run smoke tests',
    (argv) =>
      argv
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
          description: 'Do not delete the sandboxes after a run',
          default: false,
        })
        .option('skipUninstall', {
          type: 'boolean',
          description: 'Do not uninstall after a run',
          default: false,
        })
        .option('tests', {
          type: 'array',
          string: true,
          choices: SUPPORTED_TESTS,
          description: 'Which tests to run',
        })
        .default('tests', SUPPORTED_TESTS.slice()),
    async (args) => {
      await run(args);
    }
  )
  .command(
    'dispatch',
    'Dispatch smoke tests on GitHub and watch to completion',
    (argv) =>
      argv
        .option('github-pr-number', {
          type: 'number',
          description: 'GitHub PR number used to determine ref',
        })
        .option('ref', {
          type: 'string',
          description: 'Git reference to dispatch the workflow from',
          default: getDefaultRef(),
        }),
    async ({ bucketName, bucketKeyPrefix, ref, githubPrNumber }) => {
      const { GITHUB_TOKEN } = process.env;
      assert(
        typeof GITHUB_TOKEN === 'string',
        'Expected a GITHUB_TOKEN environment variable'
      );
      assert(
        typeof bucketName === 'string' && typeof bucketKeyPrefix === 'string',
        'Bucket name and key prefix are needed to download'
      );

      await dispatchAndWait({
        githubToken: GITHUB_TOKEN,
        ref:
          typeof githubPrNumber === 'number'
            ? await getRefFromGithubPr({
                githubToken: GITHUB_TOKEN,
                githubPrNumber,
              })
            : ref,
        devVersion: process.env.DEV_VERSION_IDENTIFIER,
        evergreenTaskUrl: process.env.EVERGREEN_TASK_URL,
        bucketName,
        bucketKeyPrefix,
      });
    }
  )
  .parseAsync()
  .then(
    () => {
      debug('done');
    },
    (err) => {
      console.error(err.stack);
      process.exitCode = 1;
    }
  );

async function run(context: SmokeTestsContext) {
  function cleanupMaybe() {
    if (context.skipCleanup) {
      console.log('Skipped cleanup of sandboxes');
    } else {
      debug('Cleaning up sandboxes');
      try {
        deleteSandboxesDirectory();
      } catch (err) {
        if (err instanceof Error) {
          console.warn(`Failed cleaning sandboxes: ${err.message}`);
        } else {
          throw err;
        }
      }
    }
  }

  process.once('SIGTERM', cleanupMaybe);
  process.once('SIGINT', cleanupMaybe);
  process.once('exit', cleanupMaybe);

  debug(`Running tests`);

  debug(
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
    debug(`Running ${testName}`);

    if (testName === 'time-to-first-query') {
      await testTimeToFirstQuery(context);
    } else if (testName === 'auto-update-from') {
      await testAutoUpdateFrom(context);
    } else if (testName === 'auto-update-to') {
      await testAutoUpdateTo(context);
    }
  }
}
