import path from 'path';
import { remote } from 'webdriverio';
import os from 'os';
import electronPath from 'electron';
// @ts-expect-error no types for this package
import { electronToChromium } from 'electron-to-chromium';
import electronPackageJson from 'electron/package.json';

if (typeof electronPath !== 'string') {
  throw new Error('Can only start the proxy in Node.js runtime');
}

const electronProxyPath = path.resolve(
  path.dirname(require.resolve('@mongodb-js/compass-web/package.json')),
  'scripts',
  'electron-proxy.js'
);

const userDataPath = path.resolve(
  os.tmpdir(),
  `wdio-electron-proxy-${Date.now()}`
);

const electronProxyCapabilities: WebdriverIO.Capabilities = {
  browserName: 'chromium',
  browserVersion: electronToChromium(electronPackageJson.version),
  'goog:chromeOptions': {
    binary: electronPath,
    args: [`--user-data-dir=${userDataPath}`, `--app=${electronProxyPath}`],
  },
};

async function startCompassWebAndSignIn() {
  const username = process.env.E2E_TESTS_COMPASS_WEB_ATLAS_USERNAME;
  const pwd = process.env.E2E_TESTS_COMPASS_WEB_ATLAS_PASSWORD;

  if (!username || !pwd) {
    throw new Error(
      'Cannot autotest compass-web with Atlas without credentials present'
    );
  }

  const electronProxyRemote = await remote({
    capabilities: electronProxyCapabilities,
  });

  // TODO: change the hardcoded url to env vars to match the proxy
  // implementation
  const authenticatePromise = fetch('http://localhost:7777/authenticate', {
    method: 'POST',
  });

  // TODO: maybe switchWindow by the URL matcher instead?
  const authWindowHandler = await electronProxyRemote.waitUntil(async () => {
    const handlers = await electronProxyRemote.getWindowHandles();
    // First window is about:blank, second one is the one we triggered above
    // with `/authenticate` request
    return handlers[1];
  });
  await electronProxyRemote.switchToWindow(authWindowHandler);

  /** Sign in on account.mongodb.com */

  await electronProxyRemote.$('input[name="username"]').waitForEnabled();
  await electronProxyRemote.$('input[name="username"]').setValue(username);

  await electronProxyRemote.$('button=Next').waitForEnabled();
  await electronProxyRemote.$('button=Next').click();

  await electronProxyRemote.$('input[name="password"]').waitForEnabled();
  await electronProxyRemote.$('input[name="password"]').setValue(pwd);

  await electronProxyRemote.$('button=Login').waitForEnabled();
  await electronProxyRemote.$('button=Login').click();

  /** Wait for auth to finish */

  const res = await authenticatePromise;

  if (res.ok === false || !(await res.json()).projectId) {
    throw new Error(
      `Failed to authenticate in Atlas Cloud: ${res.statusText} (${res.status})`
    );
  }
}

void startCompassWebAndSignIn();
