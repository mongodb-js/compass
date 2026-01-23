import crossSpawn from 'cross-spawn';
import { execFile } from 'child_process';
import { promisify } from 'util';
import Debug from 'debug';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';

const debug = Debug('compass-e2e-tests:compass-web-sandbox');

/**
 * Setting up in global so that both spawned compass-web and the one started
 * with webdriver will get the values
 */
process.env.OPEN_BROWSER = 'false'; // tell webpack dev server not to open the default browser
process.env.DISABLE_DEVSERVER_OVERLAY = 'true';
process.env.APP_ENV = 'webdriverio';
process.env.COMPASS_WEB_EXPOSE_INTERNALS = 'true';

const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const waitUntil = async (
  fn: () => boolean | Promise<boolean>,
  signal: AbortSignal,
  timeoutMs = 120_000,
  timeoutMessage = `Timed out while waiting for`,
  intervalMs = 2000
): Promise<void> => {
  let done = false;
  const start = Date.now();
  while (!done) {
    if (signal.aborted) {
      return;
    }
    if (Date.now() - start >= timeoutMs) {
      throw new Error(timeoutMessage);
    }
    await wait(intervalMs);
    done = await fn();
  }
};

export function spawnCompassWebSandbox(signal: AbortSignal) {
  const proc = crossSpawn.spawn(
    'npm',
    ['run', '--unsafe-perm', 'start', '--workspace', '@mongodb-js/compass-web'],
    { env: process.env, signal }
  );
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

export async function waitForCompassWebSandboxToBeReady(
  sandboxUrl: string,
  signal: AbortSignal
) {
  await waitUntil(
    async () => {
      try {
        const res = await fetch(sandboxUrl);
        debug('Web server ready:', res.ok);
        return res.ok;
      } catch (err) {
        debug('Failed to connect to dev server:', (err as any).message);
        return false;
      }
    },
    signal,
    120_000,
    'The compass-web sandbox is still not running after 2 mins'
  );
}

export function buildCompassWebPackage(signal: AbortSignal) {
  return promisify(execFile)(
    'npm',
    ['run', 'compile', '--workspace', '@mongodb-js/compass-web'],
    { env: process.env, signal }
  );
}

export function spawnCompassWebStaticServer(signal: AbortSignal) {
  const proc = crossSpawn.spawn(
    'npm',
    [
      'run',
      '--unsafe-perm',
      'serve-dist',
      '--workspace',
      '@mongodb-js/compass-web',
    ],
    { env: process.env, signal }
  );
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

export async function waitForCompassWebStaticAssetsToBeReady(
  assetUrl: string,
  signal: AbortSignal
) {
  await waitUntil(
    async () => {
      try {
        const res = await fetch(assetUrl, {
          method: 'HEAD',
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    signal,
    120_000,
    'Compass-web assets are still not ready after 2 mins'
  );
}

export const getAtlasCloudSandboxDefaultConnections = (
  connectionsString: string,
  dbUser: string,
  dbPassword: string
) => {
  type AtlasCloudSandboxDefaultConnections = Record<
    string,
    { standard: string; standardSrv: string }
  >;
  const connections: AtlasCloudSandboxDefaultConnections =
    JSON.parse(connectionsString);
  return Object.entries(connections).map(([name, cluster]): ConnectionInfo => {
    const str = new ConnectionString(cluster.standardSrv ?? cluster.standard);
    str.username = dbUser;
    str.password = dbPassword;
    return {
      id: name,
      connectionOptions: { connectionString: String(str) },
      favorite: { name },
    };
  });
};
