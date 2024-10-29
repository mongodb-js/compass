import gunzip from './gunzip';
import fs from 'fs';
import {
  context,
  DEFAULT_CONNECTIONS,
  DEFAULT_CONNECTIONS_SERVER_INFO,
  isTestingAtlasCloudExternal,
  isTestingDesktop,
  isTestingWeb,
} from './test-runner-context';
import { E2E_WORKSPACE_PATH, LOG_PATH } from './test-runner-paths';
import Debug from 'debug';
import { startTestServer } from '@mongodb-js/compass-test-server';
import crossSpawn from 'cross-spawn';
import kill from 'tree-kill';
import { MongoClient } from 'mongodb';
import { isEnterprise } from 'mongodb-build-info';
import {
  buildCompass,
  compileCompassAssets,
  rebuildNativeModules,
  removeUserDataDir,
} from './compass';
import { getConnectionTitle } from '@mongodb-js/connection-info';

export const globalFixturesAbortController = new AbortController();

function throwIfAborted() {
  if (globalFixturesAbortController.signal.aborted) {
    throw new Error('Mocha run was aborted while global setup was in progress');
  }
}

export let abortRunner: (() => void) | undefined;

const debug = Debug('compass-e2e-tests:mocha-global-fixtures');

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const cleanupFns: (() => Promise<void> | void)[] = [];

/**
 * Main hook that does all the main pre-setup before running tests:
 *  - Unpacks the fixtures
 *  - Starts MongoDB servers for every default connection defined in
 *    DEFAULT_CONNECTIONS
 *  - Starts compass-web sandbox
 *  - Updates server metadata that will be used by tests
 *  - Compiles the desktop app
 */
export async function mochaGlobalSetup(this: Mocha.Runner) {
  abortRunner = () => {
    globalFixturesAbortController.abort();
    this.abort();
  };

  try {
    debug('Unzipping fixtures...');
    await gunzip(
      // Not using absolute paths because Windows fails to resolve glob
      // collectly in this case
      'fixtures/*.gz',
      E2E_WORKSPACE_PATH,
      globalFixturesAbortController.signal
    );

    throwIfAborted();

    debug('X DISPLAY', process.env.DISPLAY);

    if (!context.disableStartStop) {
      for (const connectionInfo of DEFAULT_CONNECTIONS) {
        if (connectionInfo.testServer) {
          debug(
            'Starting MongoDB server for connection %s',
            getConnectionTitle(connectionInfo)
          );
          const server = await startTestServer(connectionInfo.testServer);
          cleanupFns.push(() => {
            debug(
              'Stopping server for connection %s',
              getConnectionTitle(connectionInfo)
            );
            return server.close();
          });
        }
        throwIfAborted();
      }

      if (isTestingWeb(context) && !isTestingAtlasCloudExternal(context)) {
        debug('Starting Compass Web server ...');
        const compassWeb = spawnCompassWeb();
        cleanupFns.push(() => {
          if (compassWeb.pid) {
            debug(`Killing compass-web [${compassWeb.pid}]`);
            kill(compassWeb.pid, 'SIGINT');
          } else {
            debug('No pid for compass-web');
          }
        });
        await waitForCompassWebToBeReady(context.sandboxUrl);
      }
    }

    debug('Getting mongodb server info');
    await updateMongoDBServerInfo();

    throwIfAborted();

    try {
      debug('Clearing out past logs');
      fs.rmdirSync(LOG_PATH, { recursive: true });
    } catch (e) {
      debug('.log dir already removed');
    }

    fs.mkdirSync(LOG_PATH, { recursive: true });

    if (isTestingDesktop(context)) {
      if (context.testPackagedApp) {
        debug('Building Compass before running the tests ...');
        await buildCompass();
      } else {
        debug('Preparing Compass before running the tests');

        if (context.nativeModules) {
          debug('Rebuilding native modules ...');
          await rebuildNativeModules();
        }

        if (context.compile) {
          debug('Compiling Compass assets ...');
          await compileCompassAssets();
        }
      }
    }

    throwIfAborted();

    cleanupFns.push(() => {
      removeUserDataDir();
    });
  } catch (err) {
    if (globalFixturesAbortController.signal.aborted) {
      return;
    }
    throw err;
  }
}

export async function mochaGlobalTeardown() {
  debug('Cleaning up after the tests ...');
  await Promise.allSettled(
    cleanupFns.map((fn) => {
      return fn();
    })
  );
}

function spawnCompassWeb() {
  const proc = crossSpawn.spawn(
    'npm',
    ['run', '--unsafe-perm', 'start', '--workspace', '@mongodb-js/compass-web'],
    {
      env: {
        ...process.env,
        OPEN_BROWSER: 'false', // tell webpack dev server not to open the default browser
        DISABLE_DEVSERVER_OVERLAY: 'true',
        APP_ENV: 'webdriverio',
      },
    }
  );
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

async function waitForCompassWebToBeReady(sandboxUrl: string) {
  let serverReady = false;
  const start = Date.now();
  while (!serverReady) {
    throwIfAborted();
    if (Date.now() - start >= 120_000) {
      throw new Error(
        'The compass-web sandbox is still not running after 120000ms'
      );
    }
    try {
      const res = await fetch(sandboxUrl);
      serverReady = res.ok;
      debug('Web server ready:', serverReady);
    } catch (err) {
      debug('Failed to connect to dev server:', (err as any).message);
    }
    await wait(1000);
  }
}

async function updateMongoDBServerInfo() {
  try {
    for (const { connectionOptions } of DEFAULT_CONNECTIONS) {
      let client: MongoClient | undefined;
      try {
        client = new MongoClient(connectionOptions.connectionString);
        const info = await client.db('admin').command({ buildInfo: 1 });
        DEFAULT_CONNECTIONS_SERVER_INFO.push({
          version: info.version,
          enterprise: isEnterprise(info),
        });
      } finally {
        void client?.close(true);
      }
    }
  } catch (err) {
    debug('Failed to get MongoDB server info:', err);
  }
}
