import gunzip from './gunzip';
import fs from 'fs';
import {
  assertTestingAtlasCloud,
  ATLAS_CLOUD_TEST_UTILS,
  context,
  DEFAULT_CONNECTIONS,
  DEFAULT_CONNECTIONS_SERVER_INFO,
  getCloudUrlsFromContext,
  isTestingAtlasCloud,
  isTestingDesktop,
  isTestingWeb,
  RUN_ID,
} from './test-runner-context';
import { E2E_WORKSPACE_PATH, LOG_PATH } from './test-runner-paths';
import Debug from 'debug';
import { startTestServer } from '@mongodb-js/compass-test-server';
import { MongoClient } from 'mongodb';
import { isEnterprise } from 'mongodb-build-info';
import {
  buildCompass,
  compileCompassAssets,
  rebuildNativeModules,
  removeUserDataDir,
  screenshotPathName,
  startBrowser,
} from './compass';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import {
  buildCompassWebPackage,
  spawnCompassWebSandbox,
  spawnCompassWebStaticServer,
  waitForCompassWebSandboxToBeReady,
  waitForCompassWebStaticAssetsToBeReady,
} from './compass-web-sandbox';
import { template } from 'lodash';
import { randomBytes } from 'crypto';
import { isAtlasCloudPage } from './commands/atlas-cloud/utils';

export const globalFixturesAbortController = new AbortController();

function throwIfAborted() {
  if (globalFixturesAbortController.signal.aborted) {
    throw new Error('Mocha run was aborted while global setup was in progress');
  }
}

export let abortRunner: (() => void) | undefined;

const debug = Debug('compass-e2e-tests:mocha-global-fixtures');

const cleanupFns: (() => Promise<void> | void)[] = [];

async function createAtlasCloudResources() {
  assertTestingAtlasCloud(context);

  debug('Creating Atlas Cloud resources...');

  const compass = await startBrowser(
    'Global setup: creating Atlas Cloud resources'
  );

  cleanupFns.push(() => {
    return compass.stop();
  });

  throwIfAborted();

  const usingExistingResources = !!context.atlasCloudProjectId;

  try {
    if (!usingExistingResources) {
      debug('Creating user...');

      const atlasCloudUsername = template(
        ATLAS_CLOUD_TEST_UTILS.testUserUsernameTemplate
      )({ username: `compass-usr-${RUN_ID}` });

      const atlasCloudPassword = randomBytes(20).toString('hex');

      const { projectId: atlasCloudProjectId } =
        await compass.browser.createAtlasUser(
          atlasCloudUsername,
          atlasCloudPassword
        );

      cleanupFns.push(() => {
        return compass.browser.deleteAtlasUser(atlasCloudUsername);
      });

      Object.assign(context, {
        atlasCloudProjectId,
        atlasCloudUsername,
        atlasCloudPassword,
      });
    } else {
      // If user was provided, sign in before proceeding: some of the next
      // commands will require auth
      await compass.browser.signInToAtlas(
        context.atlasCloudUsername,
        context.atlasCloudPassword
      );

      throwIfAborted();
    }
  } catch (e) {
    await compass.browser.screenshot(
      screenshotPathName('Global setup: create Atlas user failed')
    );
    throw e;
  }

  debug('Navigate to project page');

  const { cloudUrl } = getCloudUrlsFromContext();

  // Select the project we're going to be working on before doing anything
  // else (if we just created a user, we will already be there)
  await compass.browser.navigateTo(
    `${cloudUrl}/v2/${context.atlasCloudProjectId}#/clusters`
  );

  throwIfAborted();

  await compass.browser.waitUntil(
    () => {
      return isAtlasCloudPage(
        compass.browser,
        cloudUrl,
        context.atlasCloudProjectId
      );
    },
    { interval: 2000 }
  );

  throwIfAborted();

  // TODO: remove after this is rolled out to everybody
  debug('Activating "loadFromCDN" feature flag for the project...');

  await compass.browser.changeConfigServiceFeatureFlag(
    'mms.featureFlag.dataExplorerCompassWeb.loadFromCDN',
    context.atlasCloudProjectId,
    'enabled'
  );

  // TODO: remove when tests are accounting for this
  debug('Disabling "restoreWorkspaces" feature flag...');

  await compass.browser.changeConfigServiceFeatureFlag(
    'mms.featureFlag.dataExplorerCompassWeb.restoreWorkspaces',
    context.atlasCloudProjectId,
    'disabled'
  );

  throwIfAborted();

  debug('Configuring db access to the project...');

  const atlasCloudDbuserUsername = `dbusr-${RUN_ID}`;
  const atlasCloudDbuserPassword = randomBytes(20).toString('hex');

  await compass.browser.configureDefaultProjectDbAccess(
    atlasCloudDbuserUsername,
    atlasCloudDbuserPassword
  );

  throwIfAborted();

  Object.assign(context, {
    atlasCloudDbuserUsername,
    atlasCloudDbuserPassword,
  });

  try {
    if (context.atlasCloudDefaultCluster.length === 0) {
      debug('Provisioning cluster...');

      // Atlas limits the naming to something like /^[\w\d-]{,23}$/ (and will
      // auto truncate if it's too long) so we're very limited in terms of how
      // unique this name can be, it doesn't matter too much for CI runs where
      // resources are provisioned automatically
      const testClusterName = `e2e-${RUN_ID}`;

      const connectionString =
        await compass.browser.createAtlasClusterForDefaultProject(
          atlasCloudDbuserUsername,
          atlasCloudDbuserPassword,
          testClusterName,
          'GeoSharded' // Atlas cloud test suite currently requires a geosharded cluster
        );

      DEFAULT_CONNECTIONS.push({
        id: testClusterName,
        connectionOptions: { connectionString },
        favorite: { name: testClusterName },
      });
    } else {
      debug('Resolving connection strings for selected clusters...');

      const connectionStrings =
        await compass.browser.getClusterConnectionStringsFromNames(
          context.atlasCloudDefaultCluster,
          atlasCloudDbuserUsername,
          atlasCloudDbuserPassword
        );

      DEFAULT_CONNECTIONS.push(
        ...connectionStrings.map(([testClusterName, connectionString]) => {
          return {
            id: testClusterName,
            connectionOptions: { connectionString },
            favorite: { name: testClusterName },
          };
        })
      );
    }
  } catch (e) {
    await compass.browser.screenshot(
      screenshotPathName('Global setup: Atlas cluster provisioning failed')
    );
    throw e;
  }

  throwIfAborted();

  await compass.stop();
}

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

      if (isTestingAtlasCloud(context)) {
        // Both tasks can take a decent amount of time and are not overlapping
        // with each other, so we can run them in parallel
        await Promise.all([
          createAtlasCloudResources(),
          (async () => {
            if (context.compile) {
              debug('Building compass-web library ...');
              await buildCompassWebPackage(
                globalFixturesAbortController.signal
              );
            }
          })(),
        ]);

        debug('Starting static server for the compass-web assets ...');
        const cleanupServer = spawnCompassWebStaticServer(
          globalFixturesAbortController.signal
        );
        cleanupFns.push(cleanupServer);
        await waitForCompassWebStaticAssetsToBeReady(
          `${context.sandboxUrl}/assets-manifest.json`,
          globalFixturesAbortController.signal
        );
      } else if (isTestingWeb(context)) {
        debug('Starting compass-web sandbox ...');
        const cleanupSandbox = spawnCompassWebSandbox(
          globalFixturesAbortController.signal
        );
        cleanupFns.push(cleanupSandbox);
        await waitForCompassWebSandboxToBeReady(
          context.sandboxUrl,
          globalFixturesAbortController.signal
        );
      }
    }

    debug('Getting mongodb server info');
    await updateMongoDBServerInfo();

    throwIfAborted();

    try {
      debug('Clearing out past logs');
      fs.rmdirSync(LOG_PATH, { recursive: true });
    } catch {
      debug('.log dir already removed');
    }

    fs.mkdirSync(LOG_PATH, { recursive: true });

    if (isTestingDesktop(context)) {
      if (context.testPackagedApp) {
        debug('Maybe building Compass before running the tests ...');
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
    // If we ended up here, something failed (or canceled) during initial setup.
    // Mocha will not run the teardown in this case, so we have to do it
    // ourselves to take care of all already registered cleanup functions
    void mochaGlobalTeardown();
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
      // We get a mix of sync and non-sync functions here. Awaiting even the
      // sync ones just makes the logic simpler
      return Promise.resolve(fn());
    })
  );
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
