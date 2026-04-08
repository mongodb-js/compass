import path from 'path';
import fs from 'fs';
import electronPath from 'electron';
import url from 'url';
// @ts-expect-error no types for this package
import { electronToChromium } from 'electron-to-chromium';

function requireResolve(module: string) {
  return url.fileURLToPath(import.meta.resolve(module));
}

if (typeof electronPath !== 'string') {
  throw new Error(
    'Running e2e tests in an unsupported runtime: `electronPath` is not a string'
  );
}

export const E2E_WORKSPACE_PATH = path.dirname(
  requireResolve('compass-e2e-tests/package.json')
);
// <root>/packages/compass-e2e-tests
// <root>/packages
// <root>
export const MONOREPO_ROOT_PATH = path.resolve(E2E_WORKSPACE_PATH, '..', '..');
export const COMPASS_DESKTOP_PATH = path.dirname(
  requireResolve('mongodb-compass/package.json')
);
export const COMPASS_WEB_PATH = path.dirname(
  requireResolve('@mongodb-js/compass-web/package.json')
);
export const MOCHA_REPORTER_PATH = requireResolve(
  '@mongodb-js/mocha-config-compass/reporter'
);
export const LOG_PATH = path.resolve(E2E_WORKSPACE_PATH, '.log');
export const LOG_OUTPUT_PATH = path.join(LOG_PATH, 'output');
export const LOG_SCREENSHOTS_PATH = path.join(LOG_PATH, 'screenshots');
export const LOG_COVERAGE_PATH = path.join(LOG_PATH, 'coverage');
// Set coverage to the root of the monorepo so it will be generated for
// everything and not just packages/compass
export const COVERAGE_PATH = (process.env.COVERAGE = MONOREPO_ROOT_PATH);

export const ELECTRON_PATH = electronPath;
export const MONOREPO_ELECTRON_VERSION = JSON.parse(
  fs.readFileSync(requireResolve('electron/package.json'), 'utf8')
).version;
export const MONOREPO_ELECTRON_CHROMIUM_VERSION = electronToChromium(
  MONOREPO_ELECTRON_VERSION
);

export const FIXTURES_PATH = path.join(E2E_WORKSPACE_PATH, 'fixtures');
// Directory provided to the app / browser as a default download folder
export const DOWNLOADS_PATH = path.join(E2E_WORKSPACE_PATH, 'downloads');
