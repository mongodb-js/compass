#!/usr/bin/env ts-node
import path from 'path';
import { glob } from 'glob';
import crossSpawn from 'cross-spawn';
import Mocha from 'mocha';
import Debug from 'debug';
import { context } from './helpers/test-runner-context';
import {
  abortRunner,
  mochaGlobalSetup,
  mochaGlobalTeardown,
} from './helpers/test-runner-global-fixtures';
import { mochaRootHooks } from './helpers/insert-data';
// @ts-expect-error no types for this package
import logRunning from 'why-is-node-running';

const debug = Debug('compass-e2e-tests');

const FIRST_TEST = 'tests/time-to-first-query.test.ts';

// Trigger a mocha abort on interrupt. This doesn't stop the test runner
// immediately as it will still try to finish running the current in-progress
// suite before exiting, but the upside is that we are getting a way more robust
// cleanup where all the after hooks are taken into account as expected rarely
// leaving anythihg "hanging"
async function cleanupOnInterrupt() {
  // First trigger an abort on the mocha runner
  abortRunner?.();
  await runnerPromise;
}

function terminateOnTimeout() {
  // Don't keep logging forever because then evergreen can't kill the job
  // after 10 minutes of inactivity if we get into a broken state
  const timeoutId = setTimeout(() => {
    debug('Mocha is still cleaning up:');
    // Log what's preventing the process from exiting normally to help debug the
    // cases where the process hangs and gets killed 10 minutes later by evergreen
    // because there's no output.
    logRunning(console);
    debug('Terminating the process ...');
    // Just exit now rather than waiting for 10 minutes just so evergreen
    // can kill the task and fail anyway.
    process.exitCode ??= 1;
    process.exit();
  }, 30_000);
  timeoutId.unref();
}

let runnerPromise: Promise<any> | undefined;

async function main() {
  const e2eTestGroupsAmount = context.testGroups;
  const e2eTestGroup = context.testGroup;
  const e2eTestFilter = context.testFilter;

  const tests = (
    await glob(`tests/**/${e2eTestFilter}.{test,spec}.ts`, {
      cwd: __dirname,
    })
  )
    .filter((_value, index, array) => {
      const testsPerGroup = Math.ceil(array.length / e2eTestGroupsAmount);
      const minGroupIndex = (e2eTestGroup - 1) * testsPerGroup;
      const maxGroupIndex = minGroupIndex + testsPerGroup - 1;

      return index >= minGroupIndex && index <= maxGroupIndex;
    })
    .sort((a, b) => {
      // The only test file that's interested in the first-run experience (at the
      // time of writing) is time-to-first-query.ts and that happens to be
      // alphabetically right at the end. Which is fine, but the first test to run
      // will also get the slow first run experience for no good reason unless it is
      // the time-to-first-query.ts test.
      // So yeah.. this is a bit of a micro optimisation.
      if (a === FIRST_TEST) {
        return -1;
      } else if (b === FIRST_TEST) {
        return 1;
      } else {
        return 0;
      }
    });

  debug('Test files:', tests);

  if (tests.length === 0) {
    throw new Error('No tests to run');
  }

  const mocha = new Mocha({
    timeout: context.mochaTimeout,
    bail: context.mochaBail,
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
  debug('Test order:', tests);

  tests.forEach((testPath: string) => {
    mocha.addFile(path.join(__dirname, testPath));
  });

  debug('Running E2E tests');
  runnerPromise = new Promise((resolve) => {
    mocha.run((failures: number) => {
      debug('Finished running e2e tests', { failures });
      process.exitCode = failures ? 1 : 0;
      // Since the webdriverio update something is messing with the terminal's
      // cursor. This brings it back.
      crossSpawn.sync('tput', ['cnorm'], { stdio: 'inherit' });
      terminateOnTimeout();
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
