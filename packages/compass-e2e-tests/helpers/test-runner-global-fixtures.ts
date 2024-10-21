import gunzip from './gunzip';
import path from 'path';
import fs from 'fs';
import {
  DEFAULT_CONNECTION_PORTS,
  DEFAULT_CONNECTIONS_SERVER_INFO,
  DISABLE_START_STOP,
  E2E_WORKSPACE_PATH,
  LOG_PATH,
  SKIP_COMPASS_DESKTOP_COMPILE,
  SKIP_NATIVE_MODULE_REBUILD,
  TEST_COMPASS_DESKTOP_PACKAGED_APP,
  TEST_COMPASS_WEB,
} from './test-runner-context';
import Debug from 'debug';
import type { MongoCluster } from '@mongodb-js/compass-test-server';
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

const debug = Debug('compass-e2e-tests:mocha-global-fixtures');

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const cleanupFns: (() => Promise<void> | void)[] = [];

const servers: MongoCluster[] = [];

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
  debug('Unzipping fixtures...');
  await gunzip(path.join(E2E_WORKSPACE_PATH, 'fixtures', '*.gz'));

  debug('X DISPLAY', process.env.DISPLAY);

  if (!DISABLE_START_STOP) {
    debug('Starting MongoDB servers');

    for (const port of DEFAULT_CONNECTION_PORTS) {
      const server = await startTestServer({
        args: ['--port', port],
        version:
          process.env.MONGODB_VERSION ?? process.env.MONGODB_RUNNER_VERSION,
      });
      servers.push(server);
      cleanupFns.push(() => {
        debug('Stopping server at port %s', port);
        return server.close();
      });
    }

    if (TEST_COMPASS_WEB) {
      debug('Starting Compass Web');
      const compassWeb = spawnCompassWeb();
      cleanupFns.push(() => {
        if (compassWeb.pid) {
          debug(`Killing compass-web [${compassWeb.pid}]`);
          kill(compassWeb.pid, 'SIGINT');
        } else {
          debug('No pid for compass-web');
        }
      });
      await waitForCompassWebToBeReady();
    }
  }

  debug('Getting mongodb server info');
  await updateMongoDBServerInfo();

  try {
    debug('Clearing out past logs');
    fs.rmdirSync(LOG_PATH, { recursive: true });
  } catch (e) {
    debug('.log dir already removed');
  }

  fs.mkdirSync(LOG_PATH, { recursive: true });

  if (TEST_COMPASS_DESKTOP_PACKAGED_APP) {
    debug('Building Compass before running the tests ...');
    await buildCompass();
  } else {
    debug('Preparing Compass before running the tests');

    if (!SKIP_NATIVE_MODULE_REBUILD) {
      debug('Rebuilding native modules ...');
      await rebuildNativeModules();
    }

    if (!SKIP_COMPASS_DESKTOP_COMPILE) {
      debug('Compiling Compass assets ...');
      await compileCompassAssets();
    }
  }

  cleanupFns.push(() => {
    removeUserDataDir();
  });
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
  const proc = crossSpawn.spawn('npm', [
    'run',
    '--unsafe-perm',
    'start-web',
    '--workspace',
    '@mongodb-js/compass-web',
  ]);
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

async function waitForCompassWebToBeReady() {
  let serverReady = false;
  const start = Date.now();
  while (!serverReady) {
    if (Date.now() - start >= 120_000) {
      throw new Error(
        'The compass-web sandbox is still not running after 120000ms'
      );
    }
    try {
      const res = await fetch('http://localhost:7777');
      serverReady = res.ok;
      debug('Web server ready:', serverReady);
    } catch (err) {
      debug('Failed to connect to dev server', err);
    }
    await wait(1000);
  }
}

async function updateMongoDBServerInfo() {
  try {
    const [info1, info2] = await Promise.all(
      servers.map(async (server) => {
        let client: MongoClient | undefined;
        try {
          client = new MongoClient(server.connectionString);
          const info = await client.db('admin').command({ buildInfo: 1 });
          return {
            version: info.version,
            enterprise: isEnterprise(info),
          };
        } finally {
          void client?.close(true);
        }
      })
    );
    DEFAULT_CONNECTIONS_SERVER_INFO.push(info1, info2);
  } catch (err) {
    debug('Failed to get MongoDB server info:', err);
  }
}
