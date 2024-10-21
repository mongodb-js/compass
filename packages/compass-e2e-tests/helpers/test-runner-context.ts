import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';
import path from 'path';
import electronPath from 'electron';
import electronPackageJson from 'electron/package.json';
// @ts-expect-error no types for this package
import { electronToChromium } from 'electron-to-chromium';

if (typeof electronPath !== 'string') {
  throw new Error(
    'Running e2e tests in an unsupported runtime: `electron` is not a string'
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

export const TEST_COMPASS_WEB = process.argv.includes('--test-compass-web');
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

export const DEFAULT_CONNECTIONS: ConnectionInfo[] = [
  {
    id: 'test-connection-1',
    connectionOptions: {
      connectionString: 'mongodb://127.0.0.1:27091/test',
    },
  },
  {
    id: 'test-connection-2',
    connectionOptions: {
      connectionString: 'mongodb://127.0.0.1:27092/test',
    },
    favorite: {
      name: 'connection-2',
    },
  },
];

export const DEFAULT_CONNECTION_STRINGS = DEFAULT_CONNECTIONS.map((info) => {
  return info.connectionOptions.connectionString;
});

export const DEFAULT_CONNECTION_NAMES = DEFAULT_CONNECTIONS.map((info) => {
  return getConnectionTitle(info);
});

export const DEFAULT_CONNECTION_PORTS = DEFAULT_CONNECTIONS.map((info) => {
  const str = new ConnectionString(info.connectionOptions.connectionString);
  return str.hosts[0].split(':')[1];
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
