import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import path from 'path';
import electronPath from 'electron';
import electronPackageJson from 'electron/package.json';
// @ts-expect-error no types for this package
import { electronToChromium } from 'electron-to-chromium';
import type { MongoClusterOptions } from 'mongodb-runner';

if (typeof electronPath !== 'string') {
  throw new Error(
    'Running e2e tests in an unsupported runtime: `electronPath` is not a string'
  );
}

// TODO: Probably time to use some arg parser for this already
export const ALLOWED_RUNNER_ARGS = [
  '--test-compass-web',
  '--no-compile',
  '--no-native-modules',
  '--test-packaged-app',
  '--disable-start-stop',
  '--bail',
];

/**
 * Variables used by a special use-case of running e2e tests against a
 * cloud(-dev).mongodb.com URL. If you're changing anything related to these,
 * make sure that the tests in mms are also updated to account for that
 */
export const TEST_ATLAS_CLOUD_EXTERNAL_URL =
  process.env.TEST_ATLAS_CLOUD_EXTERNAL_URL;
export const TEST_ATLAS_CLOUD_EXTERNAL_COOKIES_FILE =
  process.env.TEST_ATLAS_CLOUD_EXTERNAL_COOKIES_FILE;
export const TEST_ATLAS_CLOUD_EXTERNAL_GROUP_ID =
  process.env.TEST_ATLAS_CLOUD_EXTERNAL_GROUP_ID;
const TEST_ATLAS_CLOUD_EXTERNAL_DEFAULT_CONNECTIONS: ConnectionInfo[] | null =
  JSON.parse(process.env.TEST_ATLAS_CLOUD_DEFAULT_CONNECTIONS ?? 'null');

const ALL_ATLAS_CLOUD_EXTERNAL_VARS = [
  TEST_ATLAS_CLOUD_EXTERNAL_URL,
  TEST_ATLAS_CLOUD_EXTERNAL_COOKIES_FILE,
  TEST_ATLAS_CLOUD_EXTERNAL_GROUP_ID,
  TEST_ATLAS_CLOUD_EXTERNAL_DEFAULT_CONNECTIONS,
];

export const TEST_ATLAS_CLOUD_EXTERNAL = ALL_ATLAS_CLOUD_EXTERNAL_VARS.some(
  (val) => {
    return !!val;
  }
);

if (
  TEST_ATLAS_CLOUD_EXTERNAL &&
  ALL_ATLAS_CLOUD_EXTERNAL_VARS.some((val) => {
    return !val;
  })
) {
  throw new Error(
    'Trying to test Atlas Cloud external URL but some required variables are missing'
  );
}

export const TEST_COMPASS_WEB =
  process.argv.includes('--test-compass-web') || TEST_ATLAS_CLOUD_EXTERNAL;
export const TEST_COMPASS_DESKTOP = !TEST_COMPASS_WEB;
export const TEST_COMPASS_DESKTOP_PACKAGED_APP = process.argv.includes(
  '--test-packaged-app'
);
// Skip this step if you are running tests consecutively and don't need to
// rebuild modules all the time. Also no need to ever recompile when testing
// compass-web.
export const SKIP_COMPASS_DESKTOP_COMPILE =
  process.argv.includes('--no-compile') && !TEST_COMPASS_WEB;
// Skip this step if you want to run tests against your own compilation (e.g, a
// dev build or a build running in watch mode that autorecompiles). Also no need
// to recompile when testing compass-web.
export const SKIP_NATIVE_MODULE_REBUILD =
  process.argv.includes('--no-native-modules') && !TEST_COMPASS_WEB;
export const DISABLE_START_STOP = process.argv.includes('--disable-start-stop');
export const MOCHA_BAIL = process.argv.includes('--bail');

export const COMPASS_WEB_BROWSER_NAME = process.env.BROWSER_NAME ?? 'chrome';
// https://webdriver.io/docs/driverbinaries/
//
// If you leave out browserVersion it will try and find the browser binary on
// your system. If you specify it it will download that version. The main
// limitation then is that 'latest' is the only 'semantic' version that is
// supported for Firefox.
// https://github.com/puppeteer/puppeteer/blob/ab5d4ac60200d1cea5bcd4910f9ccb323128e79a/packages/browsers/src/browser-data/browser-data.ts#L66
//
// Alternatively we can download it ourselves and specify the path to the binary
// or we can even start and stop chromedriver/geckodriver manually.
//
// NOTE: The version of chromedriver or geckodriver in play might also be
// relevant.
export const COMPASS_WEB_BROWSER_VERSION =
  process.env.BROWSER_VERSION === 'unset'
    ? undefined
    : process.env.BROWSER_VERSION ?? 'latest';
export const COMPASS_WEB_SANDBOX_URL = 'http://localhost:7777';

const MONGODB_TESTSERVER_VERSION =
  process.env.MONGODB_VERSION ?? process.env.MONGODB_RUNNER_VERSION;

export const DEFAULT_CONNECTIONS: (ConnectionInfo & {
  testServer?: Partial<MongoClusterOptions>;
})[] =
  TEST_ATLAS_CLOUD_EXTERNAL && TEST_ATLAS_CLOUD_EXTERNAL_DEFAULT_CONNECTIONS
    ? TEST_ATLAS_CLOUD_EXTERNAL_DEFAULT_CONNECTIONS
    : [
        {
          id: 'test-connection-1',
          connectionOptions: {
            connectionString: 'mongodb://127.0.0.1:27091/test',
          },
          testServer: {
            version: MONGODB_TESTSERVER_VERSION,
            topology: 'replset',
            secondaries: 0,
            args: ['--port', '27091'],
          },
        },
        {
          id: 'test-connection-2',
          connectionOptions: {
            connectionString: 'mongodb://127.0.0.1:27092/test',
          },
          favorite: {
            name: 'connection-2',
            color: 'Iris',
          },
          testServer: {
            version: MONGODB_TESTSERVER_VERSION,
            topology: 'replset',
            secondaries: 0,
            args: ['--port', '27092'],
          },
        },
      ];

export const DEFAULT_CONNECTION_STRINGS = DEFAULT_CONNECTIONS.map((info) => {
  return info.connectionOptions.connectionString;
});

export const DEFAULT_CONNECTION_NAMES = DEFAULT_CONNECTIONS.map((info) => {
  return getConnectionTitle(info);
});

export const DEFAULT_CONNECTIONS_SERVER_INFO: {
  version: string;
  enterprise: boolean;
}[] = [];

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

export const WEBDRIVER_DEFAULT_WAITFOR_TIMEOUT = process.env
  .COMPASS_TEST_DEFAULT_WAITFOR_TIMEOUT
  ? Number(process.env.COMPASS_TEST_DEFAULT_WAITFOR_TIMEOUT)
  : 120_000; // default is 3000ms
export const WEBDRIVER_DEFAULT_WAITFOR_INTERVAL = process.env
  .COMPASS_TEST_DEFAULT_WAITFOR_INTERVAL
  ? Number(process.env.COMPASS_TEST_DEFAULT_WAITFOR_INTERVAL)
  : 100; // default is 500ms
// Kinda arbitrary, but longer than WEBDRIVER_DEFAULT_WAITFOR_TIMEOUT so the
// test can fail before Mocha times out
export const MOCHA_DEFAULT_TIMEOUT = WEBDRIVER_DEFAULT_WAITFOR_TIMEOUT * 2;
