import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import type { MongoClusterOptions } from 'mongodb-runner';
import yargs from 'yargs';
import type { Argv, CamelCase } from 'yargs';
import { hideBin } from 'yargs/helpers';
import Debug from 'debug';
import fs from 'fs';
import { getAtlasCloudSandboxDefaultConnections } from './compass-web-sandbox';

const debug = Debug('compass-e2e-tests:context');

function buildCommonArgs(yargs: Argv) {
  return yargs
    .option('disable-start-stop', {
      type: 'boolean',
      description:
        'Disables automatically starting (and stopping) default local test mongodb servers and compass-web sandbox',
    })
    .option('test-groups', {
      type: 'number',
      description:
        'Run tests in batches. Sets the total number of test groups to have',
      default: 1,
    })
    .option('test-group', {
      type: 'number',
      description:
        'Run tests in batches. Sets the current test group from the total number',
      default: 1,
    })
    .option('test-filter', {
      type: 'string',
      description: 'Filter the spec files picked up for testing',
      default: '*',
    })
    .option('webdriver-waitfor-timeout', {
      type: 'number',
      description: 'Set a custom default webdriver waitFor timeout',
      default: 1000 * 60 * 2, // 2min, webdriver default is 3s
    })
    .option('webdriver-waitfor-interval', {
      type: 'number',
      description: 'Set a custom default webdriver waitFor interval',
      default: 100, // webdriver default is 500ms
    })
    .option('mocha-timeout', {
      type: 'number',
      description: 'Set a custom default mocha timeout',
      // Kinda arbitrary, but longer than webdriver-waitfor-timeout so the test
      // can fail before Mocha times out
      default: 240_000,
    })
    .option('mocha-bail', {
      type: 'boolean',
      description: 'Bail on the first failing test instead of continuing',
    })
    .option('hadron-distribution', {
      type: 'string',
      description:
        'Configure hadron distribution that will be used when packaging compass for tests (has no effect when testing packaged app)',
      default: 'compass',
    })
    .option('disable-clipboard-usage', {
      type: 'boolean',
      description: 'Disable tests that are relying on clipboard',
      default: false,
    });
}

function buildDesktopArgs(yargs: Argv) {
  return (
    yargs
      .option('test-packaged-app', {
        type: 'boolean',
        description:
          'Test a packaged binary instead of running compiled assets directly with electron binary',
        default: false,
      })
      // Skip this step if you are running tests consecutively and don't need to
      // rebuild modules all the time. Also no need to ever recompile when testing
      // compass-web.
      .option('compile', {
        type: 'boolean',
        description:
          'When not testing a packaged app, re-compile assets before running tests',
        default: true,
      })
      .option('native-modules', {
        type: 'boolean',
        describe:
          'When not testing a packaaged app, re-compile native modules before running tests',
        default: true,
      })
      .epilogue(
        'All command line arguments can be also provided as env vars with `COMPASS_E2E_` prefix:\n\n  COMPASS_E2E_TEST_PACKAGED_APP=true compass-e2e-tests desktop'
      )
  );
}

/**
 * Variables used by a special use-case of running e2e tests against a
 * cloud(-dev).mongodb.com URL. If you're changing anything related to these,
 * make sure that the tests in mms are also updated to account for that
 */
const atlasCloudExternalArgs = [
  'atlas-cloud-external-url',
  'atlas-cloud-external-project-id',
  'atlas-cloud-external-cookies-file',
  'atlas-cloud-external-default-connections-file',
] as const;

type AtlasCloudExternalArgs =
  | typeof atlasCloudExternalArgs[number]
  | CamelCase<typeof atlasCloudExternalArgs[number]>;

const atlasCloudSandboxArgs = [
  'atlas-cloud-sandbox-cloud-config',
  'atlas-cloud-sandbox-username',
  'atlas-cloud-sandbox-password',
  'atlas-cloud-sandbox-dbuser-username',
  'atlas-cloud-sandbox-dbuser-password',
  'atlas-cloud-sandbox-default-connections',
] as const;

type AtlasCloudSandboxArgs =
  | typeof atlasCloudSandboxArgs[number]
  | CamelCase<typeof atlasCloudSandboxArgs[number]>;

let testEnv: 'desktop' | 'web' | undefined;

function buildWebArgs(yargs: Argv) {
  return (
    yargs
      .option('browser-name', {
        choices: ['chrome', 'firefox'] as const,
        description: 'Test runner browser name',
        default: 'chrome',
      })
      // https://webdriver.io/docs/driverbinaries/
      //
      // If you leave out browserVersion it will try and find the browser binary
      // on your system. If you specify it it will download that version. The
      // main limitation then is that 'latest' is the only 'semantic' version
      // that is supported for Firefox.
      // https://github.com/puppeteer/puppeteer/blob/ab5d4ac60200d1cea5bcd4910f9ccb323128e79a/packages/browsers/src/browser-data/browser-data.ts#L66
      //
      // Alternatively we can download it ourselves and specify the path to the
      // binary or we can even start and stop chromedriver/geckodriver manually.
      //
      // NOTE: The version of chromedriver or geckodriver in play might also be
      // relevant.
      .option('browser-version', {
        type: 'string',
        description:
          'Test runner browser version (`unset` will not provide an explicit version to webdriver)',
        default: 'latest',
      })
      .option('sandbox-url', {
        type: 'string',
        description: 'Set compass-web sandbox URL',
        default: 'http://localhost:7777',
      })
      .option('test-atlas-cloud-sandbox', {
        type: 'boolean',
        description:
          'Run compass-web tests against a sandbox with a singed in Atlas Cloud user (allows to test Atlas-only functionality that is only available for Cloud UI backend)',
      })
      .options('atlas-cloud-sandbox-cloud-config', {
        choices: ['local', 'dev', 'qa', 'prod'] as const,
        description: 'Atlas Cloud config preset for the sandbox',
      })
      .options('atlas-cloud-sandbox-username', {
        type: 'string',
        description:
          'Atlas Cloud username. Will be used to sign in to an account before running the tests',
      })
      .options('atlas-cloud-sandbox-password', {
        type: 'string',
        description:
          'Atlas Cloud user password. Will be used to sign in to an account before running the tests',
      })
      .options('atlas-cloud-sandbox-dbuser-username', {
        type: 'string',
        description:
          'Atlas Cloud database username. Will be used to prepolulate cluster with data',
      })
      .options('atlas-cloud-sandbox-dbuser-password', {
        type: 'string',
        description:
          'Atlas Cloud user database user password. Will be used to prepolulate cluster with data',
      })
      .options('atlas-cloud-sandbox-default-connections', {
        type: 'string',
        description:
          'Stringified JSON with connections that are expected to be available in the Atlas project',
      })
      .implies({
        'test-atlas-cloud-sandbox': atlasCloudSandboxArgs,
      })
      .option('test-atlas-cloud-external', {
        type: 'boolean',
        description:
          'Run compass-web tests against an external Atlas Cloud URL (e.g., https://cloud-dev.mongodb.com)',
      })
      .option('atlas-cloud-external-url', {
        type: 'string',
        description: 'External URL to run the tests against',
      })
      .option('atlas-cloud-external-project-id', {
        type: 'string',
        description: 'Atlas `projectId` value',
      })
      .option('atlas-cloud-external-cookies-file', {
        type: 'string',
        description:
          'File with a JSON array of cookie values that should contain Atlas Cloud auth cookies',
      })
      .option('atlas-cloud-external-default-connections-file', {
        type: 'string',
        description:
          'File with JSON array of connections (following ConnectionInfo schema) that are expected to be available in the Atlas project',
      })
      .implies({
        'test-atlas-cloud-external': atlasCloudExternalArgs,
      })
      .conflicts({
        'test-atlas-cloud-external': 'test-atlas-cloud-sandbox',
        'test-atlas-cloud-sandbox': 'test-atlas-cloud-external',
      })
      .epilogue(
        'All command line arguments can be also provided as env vars with `COMPASS_E2E_` prefix:\n\n  COMPASS_E2E_TEST_ATLAS_CLOUD_EXTERNAL=true compass-e2e-tests web'
      )
  );
}

const argv = yargs(hideBin(process.argv))
  .scriptName('compass-e2e-tests')
  .env('COMPASS_E2E')
  .detectLocale(false)
  .version(false)
  .strict();

const parsedArgs = buildCommonArgs(argv)
  .command(
    ['$0', 'desktop'],
    'Run e2e tests against Compass desktop',
    buildDesktopArgs,
    () => {
      testEnv = 'desktop';
    }
  )
  .command('web', 'Run e2e tests against Compass web', buildWebArgs, () => {
    testEnv = 'web';
  })
  .parse();

type BuilderCallbackParsedArgs<A extends (...args: any[]) => Argv<any>> =
  ReturnType<ReturnType<A>['parseSync']>;

type CommonParsedArgs = BuilderCallbackParsedArgs<typeof buildCommonArgs>;

type DesktopParsedArgs = CommonParsedArgs &
  BuilderCallbackParsedArgs<typeof buildDesktopArgs>;

type WebParsedArgs = CommonParsedArgs &
  BuilderCallbackParsedArgs<typeof buildWebArgs>;

if (!testEnv) {
  throw new Error('Test env was not selected');
}

if ('then' in parsedArgs && typeof parsedArgs.then === 'function') {
  throw new Error('Async args parser is not allowed');
}

export const context = parsedArgs as CommonParsedArgs &
  Partial<DesktopParsedArgs & WebParsedArgs>;

debug('context:', context);

export function isTestingDesktop(ctx = context): ctx is DesktopParsedArgs {
  return testEnv === 'desktop';
}

export function assertTestingDesktop(
  ctx = context
): asserts ctx is DesktopParsedArgs {
  if (!isTestingDesktop(ctx)) {
    throw new Error(
      `Expected tested runtime to be desktop, but got ${String(testEnv)}`
    );
  }
}

export function isTestingWeb(ctx = context): ctx is WebParsedArgs {
  return testEnv === 'web';
}

export function assertTestingWeb(ctx = context): asserts ctx is WebParsedArgs {
  if (!isTestingWeb(ctx)) {
    throw new Error(
      `Expected tested runtime to be web, but got ${String(testEnv)}`
    );
  }
}

export function isTestingAtlasCloudExternal(
  ctx = context
): ctx is WebParsedArgs & {
  [K in AtlasCloudExternalArgs]: NonNullable<WebParsedArgs[K]>;
} {
  return isTestingWeb(ctx) && !!ctx.testAtlasCloudExternal;
}

export function isTestingAtlasCloudSandbox(
  ctx = context
): ctx is WebParsedArgs & {
  [K in AtlasCloudSandboxArgs]: NonNullable<WebParsedArgs[K]>;
} {
  return isTestingWeb(ctx) && !!ctx.testAtlasCloudSandbox;
}

export function assertTestingAtlasCloudSandbox(
  ctx = context
): asserts ctx is WebParsedArgs & {
  [K in AtlasCloudSandboxArgs]: NonNullable<WebParsedArgs[K]>;
} {
  if (!isTestingAtlasCloudSandbox(ctx)) {
    throw new Error(`Expected tested runtime to be web w/ Atlas Cloud account`);
  }
}

const contextForPrinting = Object.fromEntries(
  Object.entries(context).map(([k, v]) => {
    return [k, /password/i.test(k) ? '<secret>' : v];
  })
);

debug('Running tests with the following arguments:', contextForPrinting);

process.env.HADRON_DISTRIBUTION ??= context.hadronDistribution;

process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG ??=
  context.atlasCloudSandboxCloudConfig ?? 'dev';

const testServerVersion =
  process.env.MONGODB_VERSION ?? process.env.MONGODB_RUNNER_VERSION;

export const DEFAULT_CONNECTIONS: (ConnectionInfo & {
  testServer?: Partial<MongoClusterOptions>;
})[] = isTestingAtlasCloudExternal(context)
  ? JSON.parse(
      fs.readFileSync(context.atlasCloudExternalDefaultConnectionsFile, 'utf-8')
    )
  : isTestingAtlasCloudSandbox(context)
  ? getAtlasCloudSandboxDefaultConnections(
      context.atlasCloudSandboxDefaultConnections,
      context.atlasCloudSandboxDbuserUsername,
      context.atlasCloudSandboxDbuserPassword
    )
  : [
      {
        id: 'test-connection-1',
        connectionOptions: {
          connectionString: 'mongodb://127.0.0.1:27091/test',
        },
        testServer: {
          version: testServerVersion,
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
          version: testServerVersion,
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
