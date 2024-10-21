#!/usr/bin/env ts-node
import path from 'path';
import { glob } from 'glob';
import crossSpawn from 'cross-spawn';
// @ts-expect-error it thinks process does not have getActiveResourcesInfo
import { getActiveResourcesInfo } from 'process';
import Mocha from 'mocha';
import Debug from 'debug';
import {
  MOCHA_BAIL,
  MOCHA_DEFAULT_TIMEOUT,
} from './helpers/test-runner-context';
import {
  mochaGlobalSetup,
  mochaGlobalTeardown,
} from './helpers/test-runner-global-fixtures';
import { mochaRootHooks } from './helpers/insert-data';

const debug = Debug('compass-e2e-tests');

const allowedArgs = [
  '--test-compass-web',
  '--no-compile',
  '--no-native-modules',
  '--test-packaged-app',
  '--disable-start-stop',
  '--bail',
];

for (const arg of process.argv) {
  if (arg.startsWith('--') && !allowedArgs.includes(arg)) {
    throw Error(
      `Unknown command argument "${arg}". Usage:\n\n  npm run test ${allowedArgs
        .map((arg) => `[${arg}]`)
        .join(' ')}\n`
    );
  }
}

const FIRST_TEST = 'tests/time-to-first-query.test.ts';

function getResources() {
  const resources: Record<string, number> = {};
  for (const resource of getActiveResourcesInfo()) {
    if (resources[resource] === undefined) {
      resources[resource] = 0;
    }
    ++resources[resource];
  }
  return resources;
}

// Trigger a mocha abort on interrupt. This doesn't stop the test runner
// immediately as it will still try to finish running the current in-progress
// suite before exiting, but the upside is that we are getting a way more robust
// cleanup where all the after hooks are taken into account as expected rarely
// leaving anythihg "hanging"
async function cleanupOnInterrupt() {
  // First trigger an abort on the mocha runner and wait for it to finish the
  // cleanup
  runner?.abort();
  await runnerPromise;

  // Since the webdriverio update something is messing with the terminal's
  // cursor. This brings it back.
  crossSpawn.sync('tput', ['cnorm'], { stdio: 'inherit' });

  // Log what's preventing the process from exiting normally to help debug the
  // cases where the process hangs and gets killed 10 minutes later by evergreen
  // because there's no output.
  const intervalId = setInterval(() => {
    console.log(getResources());
  }, 1_000);

  // Don't keep logging forever because then evergreen can't kill the job after
  // 10 minutes of inactivity if we get into a broken state
  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);

    // Just exit now rather than waiting for 10 minutes just so evergreen can
    // kill the task and fail anyway.
    process.exit(process.exitCode ?? 1);
  }, 60_000);

  // No need to hold things up for a minute if there's nothing else preventing
  // the process from exiting.
  intervalId.unref();
  timeoutId.unref();
}

let runner: Mocha.Runner | undefined;
let runnerPromise: Promise<any> | undefined;

async function main() {
  const e2eTestGroupsAmount = parseInt(process.env.E2E_TEST_GROUPS || '1');
  const e2eTestGroup = parseInt(process.env.E2E_TEST_GROUP || '1');

  const rawTests = (
    await glob('tests/**/*.{test,spec}.ts', {
      cwd: __dirname,
    })
  ).filter((value, index, array) => {
    const testsPerGroup = Math.ceil(array.length / e2eTestGroupsAmount);
    const minGroupIndex = (e2eTestGroup - 1) * testsPerGroup;
    const maxGroupIndex = minGroupIndex + testsPerGroup - 1;

    return index >= minGroupIndex && index <= maxGroupIndex;
  });

  console.info('Test files:', rawTests);

  // The only test file that's interested in the first-run experience (at the
  // time of writing) is time-to-first-query.ts and that happens to be
  // alphabetically right at the end. Which is fine, but the first test to run
  // will also get the slow first run experience for no good reason unless it is
  // the time-to-first-query.ts test.
  // So yeah.. this is a bit of a micro optimisation.
  const tests = [FIRST_TEST, ...rawTests.filter((t) => t !== FIRST_TEST)];

  const mocha = new Mocha({
    timeout: MOCHA_DEFAULT_TIMEOUT,
    bail: MOCHA_BAIL,
    reporter: require.resolve('@mongodb-js/mocha-config-compass/reporter'),
  });

  // @ts-expect-error mocha types are incorrect, global setup this is bound to
  // runner, not context
  mocha.globalSetup(mochaGlobalSetup);
  mocha.enableGlobalSetup(true);

  mocha.globalTeardown(mochaGlobalTeardown);
  mocha.enableGlobalTeardown(true);

  mocha.rootHooks(mochaRootHooks);

  // print the test order for debugging purposes and so we can tweak the groups later
  console.log('test order', tests);

  tests.forEach((testPath: string) => {
    mocha.addFile(path.join(__dirname, testPath));
  });

  debug('Running E2E tests');
  runnerPromise = new Promise((resolve) => {
    runner = mocha.run((failures: number) => {
      process.exitCode = failures ? 1 : 0;
      resolve(failures);
    });
  });
}

process.once('SIGINT', () => {
  debug(`Process was interrupted. Waiting for mocha to abort and clean-up ...`);
  void (async () => {
    await cleanupOnInterrupt();
    process.kill(process.pid, 'SIGINT');
  })();
});

process.once('SIGTERM', () => {
  debug(`Process was terminated. Waiting for mocha to abort and clean-up ...`);
  void (async () => {
    await cleanupOnInterrupt();
    process.kill(process.pid, 'SIGTERM');
  })();
});

process.once('uncaughtException', (err: Error) => {
  debug('Uncaught exception:');
  console.error(err.stack || err.message || err);
  debug('Waiting for mocha to abort and clean-up ...');
  process.exitCode = 1;
  void cleanupOnInterrupt();
});

process.on('unhandledRejection', (err: Error) => {
  debug('Unhandled exception:');
  console.error(err.stack || err.message || err);
  debug('Waiting for mocha to abort and clean-up ...');
  process.exitCode = 1;
  void cleanupOnInterrupt();
});

async function run() {
  await main();
}

void run();
