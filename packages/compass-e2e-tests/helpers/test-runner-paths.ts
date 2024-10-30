import path from 'path';
import electronPath from 'electron';
import electronPackageJson from 'electron/package.json';
// @ts-expect-error no types for this package
import { electronToChromium } from 'electron-to-chromium';
import os from 'os';

if (typeof electronPath !== 'string') {
  throw new Error(
    'Running e2e tests in an unsupported runtime: `electronPath` is not a string'
  );
}

export const E2E_WORKSPACE_PATH = path.dirname(
  require.resolve('compass-e2e-tests/package.json')
);
// <root>/packages/compass-e2e-tests
// <root>/packages
// <root>
export const MONOREPO_ROOT_PATH = path.resolve(E2E_WORKSPACE_PATH, '..', '..');
export const COMPASS_DESKTOP_PATH = path.dirname(
  require.resolve('mongodb-compass/package.json')
);
export const COMPASS_WEB_PATH = path.dirname(
  require.resolve('@mongodb-js/compass-web/package.json')
);
export const LOG_PATH = path.resolve(E2E_WORKSPACE_PATH, '.log');
export const LOG_OUTPUT_PATH = path.join(LOG_PATH, 'output');
export const LOG_SCREENSHOTS_PATH = path.join(LOG_PATH, 'screenshots');
export const LOG_COVERAGE_PATH = path.join(LOG_PATH, 'coverage');
// Set coverage to the root of the monorepo so it will be generated for
// everything and not just packages/compass
export const COVERAGE_PATH = (process.env.COVERAGE = MONOREPO_ROOT_PATH);

export const ELECTRON_PATH = electronPath;
export const ELECTRON_VERSION = electronPackageJson.version;
export const ELECTRON_CHROMIUM_VERSION = electronToChromium(ELECTRON_VERSION);

export const COMPASS_WEB_SANDBOX_RUNNER_PATH = path.resolve(
  path.dirname(require.resolve('@mongodb-js/compass-web/package.json')),
  'scripts',
  'electron-proxy.js'
);
export const COMPASS_WEB_WDIO_USER_DATA_PATH = path.resolve(
  os.tmpdir(),
  `wdio-electron-proxy-${Date.now()}`
);
