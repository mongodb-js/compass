#!/usr/bin/env ts-node
import path from 'path';
import { glob } from 'glob';
import Mocha from 'mocha';
import Debug from 'debug';
import { context } from './helpers/test-runner-context';
import {
  globalFixturesAbortController,
  mochaGlobalSetup,
  mochaGlobalTeardown,
} from './helpers/test-runner-global-fixtures';
import { mochaRootHooks } from './helpers/mongo-clients';
import type { SignalConstants } from 'os';

const debug = Debug('compass-e2e-tests');

const FIRST_TEST = 'tests/time-to-first-query.test.ts';

let runnerPromise: Promise<[Error, undefined] | [null, number]> | undefined;

async function main() {
  const e2eTestGroupsAmount = context.testGroups;
  const e2eTestGroup = context.testGroup;
  const e2eTestFilter = Array.isArray(context.testFilter)
    ? context.testFilter
    : [context.testFilter];

  const tests = (
    await Promise.all(
      e2eTestFilter.map((filter) => {
        return glob(`tests/**/${filter}.{test,spec}.ts`, {
          cwd: __dirname,
        });
      })
    )
  )
    .flat()
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
  return (runnerPromise = new Promise((resolve) => {
    // mocha will not handle non-test errors inside the run loop, so to make
    // sure that runner promise settles correctly, we set up our own error
    // listeners
    const onError = (err: Error) => {
      removeListeners();
      resolve([err, undefined]);
    };
    const removeListeners = () => {
      process.off('uncaughtException', onError);
      process.off('unhandledRejection', onError);
    };
    process.on('uncaughtException', onError);
    process.on('unhandledRejection', onError);
    mocha.run((failures: number) => {
      removeListeners();
      resolve([null, failures]);
    });
  }));
}

const onSignal = (signal: keyof SignalConstants) => {
  void (async () => {
    if (
      // Second signal coming, just kill the process
      globalFixturesAbortController.signal.aborted ||
      // Don't wait when "skip teardown" because it can take minutes of retries
      // before it finally times out, the process exits back to the terminal but
      // some zombie child stays around and keeps logging.. We only use bail
      // locally when working on tests manually and in that case we probably
      // don't care about the cleanup. If you see a test you're working on
      // waiting for something that's never going to happen then you probably
      // want to kill it and get back control immediately.
      context.mochaSkipTeardown
    ) {
      debug('Exiting ...');
      process.off(signal, onSignal);
    } else {
      debug(
        `Process was interrupted. Waiting for mocha to abort and clean-up (press ^C again to skip the wait) ...`
      );
      // Trigger a mocha abort on interrupt. This doesn't stop the test runner
      // immediately as it will still try to finish running the current
      // in-progress suite before exiting, but the upside is that we are getting
      // a way more robust cleanup where all the after hooks are taken into
      // account as expected rarely leaving anythihg "hanging"
      globalFixturesAbortController.abort(new Error('Process was interrupted'));
      await runnerPromise;
    }
    process.kill(process.pid, signal);
  })();
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, onSignal);
}

async function run() {
  const [err, failedSpecs] = await main();
  if (globalFixturesAbortController.signal.aborted) {
    return;
  }
  if (err) {
    throw err;
  }
  process.exitCode = failedSpecs;
}

void run();
