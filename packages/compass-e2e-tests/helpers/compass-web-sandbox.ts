import crossSpawn from 'cross-spawn';
import { remote } from 'webdriverio';
import Debug from 'debug';
import {
  COMPASS_WEB_SANDBOX_RUNNER_PATH,
  COMPASS_WEB_WDIO_USER_DATA_PATH,
  ELECTRON_CHROMIUM_VERSION,
  ELECTRON_PATH,
} from './test-runner-paths';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';

const debug = Debug('compass-e2e-tests:compass-web-sandbox');

/**
 * Setting up in global so that both spawned compass-web and the one started
 * with webdriver will get the values
 */
process.env.OPEN_BROWSER = 'false'; // tell webpack dev server not to open the default browser
process.env.DISABLE_DEVSERVER_OVERLAY = 'false';
process.env.APP_ENV = 'webdriverio';

const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export function spawnCompassWebSandbox() {
  const proc = crossSpawn.spawn(
    'npm',
    ['run', '--unsafe-perm', 'start', '--workspace', '@mongodb-js/compass-web'],
    { env: process.env }
  );
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

export async function waitForCompassWebSandboxToBeReady(
  sandboxUrl: string,
  signal: AbortSignal
) {
  let serverReady = false;
  const start = Date.now();
  while (!serverReady) {
    if (signal.aborted) {
      return;
    }
    if (Date.now() - start >= 120_000) {
      throw new Error(
        'The compass-web sandbox is still not running after 120000ms'
      );
    }
    // No point in trying to fetch sandbox URL right away, give the spawn script
    // some time to run
    await wait(2000);
    try {
      const res = await fetch(sandboxUrl);
      serverReady = res.ok;
      debug('Web server ready:', serverReady);
    } catch (err) {
      debug('Failed to connect to dev server:', (err as any).message);
    }
  }
}

export async function spawnCompassWebSandboxAndSignInToAtlas(
  {
    username,
    password,
    sandboxUrl,
    waitforTimeout,
  }: {
    username: string;
    password: string;
    sandboxUrl: string;
    waitforTimeout: number;
  },
  signal: AbortSignal
) {
  debug('Starting electron-proxy using webdriver ...');

  const electronProxyRemote = await remote({
    capabilities: {
      browserName: 'chromium',
      browserVersion: ELECTRON_CHROMIUM_VERSION,
      'goog:chromeOptions': {
        binary: ELECTRON_PATH,
        args: [
          `--user-data-dir=${COMPASS_WEB_WDIO_USER_DATA_PATH}`,
          `--app=${COMPASS_WEB_SANDBOX_RUNNER_PATH}`,
        ],
      },
      'wdio:enforceWebDriverClassic': true,
    },
    waitforTimeout,
  });

  if (signal.aborted) {
    return electronProxyRemote;
  }

  debug('Signing in to Atlas as %s ...', username);

  const authenticatePromise = fetch(`${sandboxUrl}/authenticate`, {
    method: 'POST',
  });

  const authWindowHandler = await electronProxyRemote.waitUntil(async () => {
    const handlers = await electronProxyRemote.getWindowHandles();
    // First window is about:blank, second one is the one we triggered above
    // with `/authenticate` request
    return handlers[1];
  });
  await electronProxyRemote.switchToWindow(authWindowHandler);

  await electronProxyRemote.$('input[name="username"]').waitForEnabled();
  await electronProxyRemote.$('input[name="username"]').setValue(username);

  await electronProxyRemote.$('button=Next').waitForEnabled();
  await electronProxyRemote.$('button=Next').click();

  await electronProxyRemote.$('input[name="password"]').waitForEnabled();
  await electronProxyRemote.$('input[name="password"]').setValue(password);

  await electronProxyRemote.$('button=Login').waitForEnabled();
  await electronProxyRemote.$('button=Login').click();

  if (signal.aborted) {
    return electronProxyRemote;
  }

  debug('Waiting for the auth to finish ...');

  let authenticatedPromiseSettled = false;

  // Atlas Cloud will periodically remind user to enable MFA (which we can't
  // enable in e2e CI environment), so to account for that, in parallel to
  // waiting for auth to finish, we'll wait for the MFA screen to show up and
  // skip it if it appears
  const [, settledRes] = await Promise.allSettled([
    (async () => {
      const remindMeLaterButton = 'button*=Remind me later';

      await electronProxyRemote.waitUntil(
        async () => {
          return (
            authenticatedPromiseSettled ||
            (await electronProxyRemote.$(remindMeLaterButton).isDisplayed())
          );
        },
        // Takes awhile for the redirect to land on this reminder page when it
        // happens, so no need to bombard the browser with displayed checks
        { interval: 2000 }
      );

      if (authenticatedPromiseSettled) {
        return;
      }

      await electronProxyRemote.$(remindMeLaterButton).click();
    })(),
    authenticatePromise.finally(() => {
      authenticatedPromiseSettled = true;
    }),
  ]);

  if (settledRes.status === 'rejected') {
    throw settledRes.reason;
  }

  const res = settledRes.value;

  if (res.ok === false || !(await res.json()).projectId) {
    throw new Error(
      `Failed to authenticate in Atlas Cloud: ${res.statusText} (${res.status})`
    );
  }

  if (signal.aborted) {
    return electronProxyRemote;
  }

  debug('Waiting for x509 cert to propagate to Atlas clusters ...');

  await fetch(`${sandboxUrl}/x509`);

  return electronProxyRemote;
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
