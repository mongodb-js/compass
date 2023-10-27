import { inspect } from 'util';
import { ObjectId, EJSON } from 'bson';
import { promises as fs, rmdirSync } from 'fs';
import type Mocha from 'mocha';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import zlib from 'zlib';
import { remote } from 'webdriverio';
import { rebuild } from '@electron/rebuild';
import type { ConsoleMessageType } from 'puppeteer';
import {
  run as packageCompass,
  compileAssets,
} from 'hadron-build/commands/release';
import { redactConnectionString } from 'mongodb-connection-string-url';
export * as Selectors from './selectors';
export * as Commands from './commands';
import * as Commands from './commands';
import type { CompassBrowser } from './compass-browser';
import type { LogEntry } from './telemetry';
import Debug from 'debug';
import semver from 'semver';
import crossSpawn from 'cross-spawn';

const debug = Debug('compass-e2e-tests');

const { gunzip } = zlib;
const { Z_SYNC_FLUSH } = zlib.constants;

const compileAssetsAsync = promisify(compileAssets);
const packageCompassAsync = promisify(packageCompass);

export const COMPASS_PATH = path.dirname(
  require.resolve('mongodb-compass/package.json')
);
export const LOG_PATH = path.resolve(__dirname, '..', '.log');
const OUTPUT_PATH = path.join(LOG_PATH, 'output');
const SCREENSHOTS_PATH = path.join(LOG_PATH, 'screenshots');
const COVERAGE_PATH = path.join(LOG_PATH, 'coverage');

let MONGODB_VERSION = '';
let MONGODB_USE_ENTERPRISE =
  (process.env.MONGODB_VERSION?.endsWith('-enterprise') && 'yes') ?? 'no';

export const MONGODB_TEST_SERVER_PORT = Number(
  process.env.MONGODB_TEST_SERVER_PORT ?? 27091
);

export function updateMongoDBServerInfo() {
  try {
    const { stdout, stderr } = crossSpawn.sync(
      'npm',
      [
        'run',
        '--silent',
        /**
         * The server info update is done through a separate script and not by
         * using a MongoClient directly because doing so causes an unexplainable
         * segfault crash in e2e-coverage task in evergreen CI. Moving this
         * logic to a separate script seems to solve this problem, but if at any
         * point the issue returns, feel free to revert this whole change
         **/
        'server-info',
        '--',
        '--connectionString',
        `mongodb://127.0.0.1:${String(MONGODB_TEST_SERVER_PORT)}`,
      ],
      { encoding: 'utf-8' }
    );
    if (stderr?.length) {
      throw new Error(stderr);
    }
    const { version, enterprise } = JSON.parse(stdout);
    MONGODB_VERSION = version;
    MONGODB_USE_ENTERPRISE = enterprise ? 'yes' : 'no';
    debug(
      `Got server info: v${String(version)} (${
        enterprise ? 'enterprise' : 'community'
      })`
    );
  } catch (err) {
    (err as Error).message =
      'Failed trying to get MongoDB server info:\n\n' + (err as Error).message;
    throw err;
  }
}

export const serverSatisfies = (
  semverCondition: string,
  enterpriseExact?: boolean
) => {
  return (
    semver.satisfies(MONGODB_VERSION, semverCondition, {
      includePrerelease: true,
    }) &&
    (typeof enterpriseExact === 'boolean'
      ? (enterpriseExact && MONGODB_USE_ENTERPRISE === 'yes') ||
        (!enterpriseExact && MONGODB_USE_ENTERPRISE !== 'yes')
      : true)
  );
};

// For the user data dirs
let i = 0;
// For the screenshots
let j = 0;
// For the coverage
let k = 0;

interface Coverage {
  main: string;
  renderer: string;
}

interface RenderLogEntry {
  timestamp: string;
  type: ConsoleMessageType;
  text: string;
  args: unknown;
}

export class Compass {
  browser: CompassBrowser;
  testPackagedApp: boolean;
  needsCloseWelcomeModal: boolean;
  renderLogs: RenderLogEntry[];
  logs: LogEntry[];
  logPath?: string;
  userDataPath?: string;
  appName?: string;

  constructor(
    browser: CompassBrowser,
    { testPackagedApp = false, needsCloseWelcomeModal = false } = {}
  ) {
    this.browser = browser;
    this.testPackagedApp = testPackagedApp;
    this.needsCloseWelcomeModal = needsCloseWelcomeModal;
    this.logs = [];
    this.renderLogs = [];

    for (const [k, v] of Object.entries(Commands)) {
      this.browser.addCommand(k, (...args) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return v(browser, ...args);
      });
    }

    this.addDebugger();
  }

  async recordLogs(): Promise<void> {
    debug('Setting up renderer log listeners ...');
    const puppeteerBrowser = await this.browser.getPuppeteer();
    const pages = await puppeteerBrowser.pages();
    const page = pages[0];

    // TS infers the type of `message` correctly here, which would conflict with
    // what we get from `import type { ConsoleMessage } from 'puppeteer'`, so we
    // leave out an explicit type annotation.
    page.on('console', (message) => {
      const run = async () => {
        // human and machine readable, always UTC
        const timestamp = new Date().toISOString();

        // startGroup, endGroup, log, table, warning, etc.
        const type = message.type();

        const text = message.text();

        // first arg is usually == text, but not always
        const args = [];
        for (const arg of message.args()) {
          let value;
          try {
            value = await arg.jsonValue();
          } catch (err) {
            // there are still some edge cases we can't easily convert into text
            console.error('could not convert', arg);
            value = '¯\\_(ツ)_/¯';
          }
          args.push(value);
        }

        // uncomment to see browser logs
        //console.log({ timestamp, type, text, args });

        this.renderLogs.push({ timestamp, type, text, args });
      };
      void run();
    });

    // get the app logPath out of electron early in case the app crashes before we
    // close it and load the logs
    this.logPath = await this.browser.execute(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('electron').ipcRenderer.invoke('compass:logPath');
    });

    this.userDataPath = await this.browser.execute(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('electron').ipcRenderer.invoke('compass:userDataPath');
    });

    this.appName = await this.browser.execute(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('electron').ipcRenderer.invoke('compass:appName');
    });
  }

  addDebugger(): void {
    const browser = this.browser;
    const debugClient = debug.extend('webdriver:client');
    const browserProto = Object.getPrototypeOf(browser);

    // We can pull the own property names straight from browser, but brings up a
    // lot of things we're not interested. So this is just a list of the public
    // interface methods.
    const props = Object.getOwnPropertyNames(browserProto).concat(
      '$$',
      '$',
      'addCommand',
      'call',
      'custom$$',
      'custom$',
      'debug',
      'deleteCookies',
      'execute',
      'executeAsync',
      'getCookies',
      'getPuppeteer',
      'getWindowSize',
      'keys',
      'mock',
      'mockClearAll',
      'mockRestoreAll',
      'newWindow',
      'overwriteCommand',
      'pause',
      'react$$',
      'react$',
      'reloadSession',
      'savePDF',
      'saveRecordingScreen',
      'saveScreenshot',
      'setCookies',
      'setTimeout',
      'setWindowSize',
      'switchWindow',
      'throttle',
      'touchAction',
      'uploadFile',
      'url',
      'waitUntil'
    );

    for (const prop of props) {
      // disable emit logging for now because it is very noisy
      if (prop.includes('.') || prop === 'emit') {
        continue;
      }

      const protoDescriptor = Object.getOwnPropertyDescriptor(
        browserProto,
        prop
      );
      const browserDescriptor = Object.getOwnPropertyDescriptor(browser, prop);
      const descriptor = protoDescriptor || browserDescriptor;
      if (!descriptor || typeof descriptor.value !== 'function') {
        continue;
      }

      const origFn = descriptor.value;
      descriptor.value = function (...args: any[]) {
        debugClient(
          `${prop}(${args
            .map((arg) => redact(inspect(arg, { breakLength: Infinity })))
            .join(', ')})`
        );

        const stack = new Error(prop).stack ?? '';

        let result;
        try {
          // eslint-disable-next-line prefer-const
          result = origFn.call(this, ...args);
        } catch (error) {
          // In this case the method threw synchronously
          augmentError(error as Error, stack);
          throw error;
        }

        // Many of the webdriverio browser methods are chainable, so rather just
        // return their objects as is. They are also promises, but resolving
        // them will mess with the chainability.
        if (protoDescriptor && result && result.then) {
          // If the result looks like a promise, resolve it and look for errors
          return result.catch((error: Error) => {
            augmentError(error, stack);
            throw error;
          });
        }

        // return the synchronous result for our browser commands or possibly
        // chainable thing as is for builtin browser commands
        return result;
      };

      Object.defineProperty(
        protoDescriptor ? browserProto : browser,
        prop,
        descriptor
      );
    }
  }

  async stop(test?: Mocha.Hook | Mocha.Test): Promise<void> {
    // TODO: we don't have main logs to write :(
    /*
    const mainLogs = [];
    const mainLogPath = path.join(
      LOG_PATH,
      `electron-main.${nowFormatted}.log`
    );
    debug(`Writing application main process log to ${mainLogPath}`);
    await fs.writeFile(mainLogPath, mainLogs.join('\n'));
    */

    const nowFormatted = formattedDate();

    // name the log files after the closest test if possible to make it easier to find
    const name = test ? pathName(test.fullTitle()) : nowFormatted;

    const renderLogPath = path.join(
      LOG_PATH,
      `electron-render.${nowFormatted}.json`
    );
    debug(`Writing application render process log to ${renderLogPath}`);
    await fs.writeFile(renderLogPath, JSON.stringify(this.renderLogs, null, 2));

    if (!this.testPackagedApp) {
      // coverage
      debug('Writing coverage');
      const coverage: Coverage = await this.browser.executeAsync((done) => {
        void (async () => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const mainCoverage = await require('electron').ipcRenderer.invoke(
            'coverage'
          );
          done({
            main: JSON.stringify(mainCoverage, null, 4),
            renderer: JSON.stringify((window as any).__coverage__, null, 4),
          });
        })();
      });
      const stopIndex = ++k;
      await fs.writeFile(
        path.join(COVERAGE_PATH, `main.${stopIndex}.log`),
        coverage.main
      );
      await fs.writeFile(
        path.join(COVERAGE_PATH, `renderer.${stopIndex}.log`),
        coverage.renderer
      );
    }

    debug('Stopping Compass application');
    await this.browser.deleteSession();

    const compassLog = await getCompassLog(this.logPath ?? '');
    const compassLogPath = path.join(LOG_PATH, `compass-log.${name}.log`);
    debug(`Writing Compass application log to ${compassLogPath}`);
    await fs.writeFile(compassLogPath, compassLog.raw);
    this.logs = compassLog.structured;
  }

  async capturePage(
    imgPathName = `screenshot-${formattedDate()}-${++j}.png`
  ): Promise<boolean> {
    try {
      await this.browser.saveScreenshot(path.join(LOG_PATH, imgPathName));
      return true;
    } catch (err) {
      console.warn((err as Error).stack);
      return false;
    }
  }
}

interface StartCompassOptions {
  firstRun?: boolean;
  noWaitForConnectionScreen?: boolean;
  extraSpawnArgs?: string[];
  wrapBinary?: (binary: string) => Promise<string> | string;
}

let defaultUserDataDir: string | undefined;

export function removeUserDataDir(): void {
  if (!defaultUserDataDir) {
    return;
  }
  debug('Removing user data');
  try {
    // this is sync so we can use it in cleanup() in index.ts
    rmdirSync(defaultUserDataDir, { recursive: true });
  } catch (e) {
    debug(
      `Failed to remove temporary user data directory at ${defaultUserDataDir}:`
    );
    debug(e);
  }
}

async function getCompassExecutionParameters(): Promise<{
  testPackagedApp: boolean;
  binary: string;
}> {
  const testPackagedApp = ['1', 'true'].includes(
    process.env.TEST_PACKAGED_APP ?? ''
  );
  const binary = testPackagedApp
    ? getCompassBinPath(await getCompassBuildMetadata())
    : require('electron');
  return { testPackagedApp, binary };
}

export async function runCompassOnce(args: string[], timeout = 30_000) {
  const { binary } = await getCompassExecutionParameters();
  debug('spawning compass...', {
    binary,
    COMPASS_PATH,
    defaultUserDataDir,
    args,
    timeout,
  });
  const { stdout, stderr } = await promisify(execFile)(
    binary,
    [
      COMPASS_PATH,
      '--ignore-additional-command-line-flags',
      `--user-data-dir=${String(defaultUserDataDir)}`,
      '--no-sandbox', // See below
      ...args,
    ],
    { timeout }
  );
  debug('Ran compass with args', { args, stdout, stderr });
  return { stdout, stderr };
}

async function startCompass(opts: StartCompassOptions = {}): Promise<Compass> {
  const { testPackagedApp, binary } = await getCompassExecutionParameters();
  const nowFormatted = formattedDate();
  let needsCloseWelcomeModal: boolean;

  // If this is not the first run, but we want it to be, delete the user data
  // dir so it will be recreated below.
  if (defaultUserDataDir && opts.firstRun) {
    removeUserDataDir();
    // windows seems to be weird about us deleting and recreating this dir, so
    // just make a new one for next time
    defaultUserDataDir = undefined;
    needsCloseWelcomeModal = true;
  } else {
    // Need to close the welcome modal if firstRun is undefined or true, because
    // in those cases we do not pass --showed-network-opt-in=true, but only
    // if Compass hasn't been run before (i.e. defaultUserDataDir is defined)
    needsCloseWelcomeModal = !defaultUserDataDir && opts.firstRun !== false;
  }

  // Calculate the userDataDir once so it will be the same between runs. That
  // way we can test first run vs second run experience.
  if (!defaultUserDataDir) {
    defaultUserDataDir = path.join(
      os.tmpdir(),
      `user-data-dir-${Date.now().toString(32)}-${++i}`
    );
  }
  const chromedriverLogPath = path.join(
    LOG_PATH,
    `chromedriver.${nowFormatted}.log`
  );
  const webdriverLogPath = path.join(LOG_PATH, 'webdriver');

  // Ensure that the user data dir exists
  await fs.mkdir(defaultUserDataDir, { recursive: true });

  // Chromedriver will fail if log path doesn't exist, webdriver doesn't care,
  // for consistency let's mkdir for both of them just in case
  await fs.mkdir(path.dirname(chromedriverLogPath), { recursive: true });
  await fs.mkdir(webdriverLogPath, { recursive: true });
  await fs.mkdir(OUTPUT_PATH, { recursive: true });
  await fs.mkdir(SCREENSHOTS_PATH, { recursive: true });
  await fs.mkdir(COVERAGE_PATH, { recursive: true });

  const chromeArgs = [];

  if (!testPackagedApp) {
    // https://www.electronjs.org/docs/latest/tutorial/automated-testing#with-webdriverio
    chromeArgs.push(`--app=${COMPASS_PATH}`);
    //process.chdir(COMPASS_PATH); // TODO: do we need this?
  }

  // https://peter.sh/experiments/chromium-command-line-switches/
  // https://www.electronjs.org/docs/latest/api/command-line-switches
  chromeArgs.push(
    // Allow options such as --user-data-dir to pass through the command line
    // flag validation code.
    '--ignore-additional-command-line-flags',
    `--user-data-dir=${defaultUserDataDir}`,
    // Chromecast feature that is enabled by default in some chrome versions
    // and breaks the app on Ubuntu
    '--media-router=0',
    // Evergren RHEL ci runs everything as root, and chrome will not start as
    // root without this flag
    '--no-sandbox',

    // Use the Atlas dev server for generative ai and atlas requests (cloud-dev).
    '--atlasServiceBackendPreset=atlas-dev',

    // chomedriver options
    // TODO: cant get this to work
    //`--log-path=${chromedriverLogPath}`,
    //'--verbose',

    // electron/chromium options
    // TODO: cant get this to work either
    //'--enable-logging=file',
    //`--log-file=${chromedriverLogPath}`,
    //'--log-level=INFO',
    //'--v=1',
    // --vmodule=pattern

    // by default make sure we get the welcome modal
    ...(opts.firstRun === false ? ['--showed-network-opt-in=true'] : []),

    ...(opts.extraSpawnArgs ?? [])
  );

  // Electron on Windows interprets its arguments in a weird way where
  // the second positional argument inserted by webdriverio (about:blank)
  // throws it off and won't let it start because it then interprets the first
  // positional argument as an app path.
  if (
    process.platform === 'win32' &&
    chromeArgs.some((arg) => !arg.startsWith('--'))
  ) {
    chromeArgs.push('--');
  }

  // webdriverio automatically prepends '--' to options that do not already have it.
  // We need the ability to pass positional arguments, though.
  // https://github.com/webdriverio/webdriverio/blob/1825c633aead82bc650dff1f403ac30cff7c7cb3/packages/devtools/src/launcher.ts#L37-L39
  (chromeArgs as any).map = function () {
    return [...this];
  };

  // https://webdriver.io/docs/options/#webdriver-options
  const webdriverOptions = {
    logLevel: 'info' as const,
    outputDir: webdriverLogPath,
  };

  // https://webdriver.io/docs/options/#webdriverio
  const wdioOptions = {
    // default is 3000ms
    waitforTimeout: process.env.COMPASS_TEST_DEFAULT_WAITFOR_TIMEOUT
      ? Number(process.env.COMPASS_TEST_DEFAULT_WAITFOR_TIMEOUT)
      : 120_000, // shorter than the test timeout so the exact line will fail, not the test
    // default is 500ms
    waitforInterval: process.env.COMPASS_TEST_DEFAULT_WAITFOR_INTERVAL
      ? Number(process.env.COMPASS_TEST_DEFAULT_WAITFOR_INTERVAL)
      : 100,
  };

  const maybeWrappedBinary = (await opts.wrapBinary?.(binary)) ?? binary;

  process.env.APP_ENV = 'webdriverio';
  // For webdriverio env we are changing appName so that keychain records do not
  // overlap with anything else
  process.env.HADRON_PRODUCT_NAME_OVERRIDE = 'MongoDB Compass WebdriverIO';
  process.env.DEBUG = `${process.env.DEBUG ?? ''},mongodb-compass:main:logging`;
  process.env.MONGODB_COMPASS_TEST_LOG_DIR = path.join(LOG_PATH, 'app');
  process.env.CHROME_LOG_FILE = chromedriverLogPath;

  // Guide cues might affect too many tests in a way where the auto showing of the cue prevents
  // clicks from working on elements. Dealing with this case-by-case is way too much work, so
  // we disable the cues completely for the e2e tests
  process.env.DISABLE_GUIDE_CUES = 'true';

  const options = {
    capabilities: {
      browserName: 'chrome',
      // https://chromedriver.chromium.org/capabilities#h.p_ID_106
      'goog:chromeOptions': {
        binary: maybeWrappedBinary,
        args: chromeArgs,
      },
      // more chrome options
      /*
      'loggingPrefs': {
        browser: 'ALL',
        driver: 'ALL'
      },
      'goog:loggingPrefs': {
        browser: 'ALL',
        driver: 'ALL'
      }
      */
    },
    ...webdriverOptions,
    ...wdioOptions,
    ...opts,
  };

  debug('Starting compass via webdriverio with the following configuration:');
  debug(JSON.stringify(options, null, 2));

  let browser: CompassBrowser;

  try {
    browser = await remote(options);
  } catch (err) {
    debug('Failed to start remote webdriver session', {
      error: (err as Error).stack,
    });
    // Sometimes when webdriver fails to start the remote session, we end up
    // with a running app that hangs the test runner in CI causing the run to
    // fail with idle timeout. We will try to clean up a potentially hanging app
    // before rethrowing an error

    // ps-list is ESM-only in recent versions.
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const { default: psList }: typeof import('ps-list') = await eval(
      `import('ps-list')`
    );
    const processList = await psList();

    const filteredProcesses = processList.filter((p) => {
      return (
        p.ppid === process.pid &&
        (p.cmd?.startsWith(binary) ||
          /(MongoDB Compass|Electron|electron)/.test(p.name))
      );
    });

    debug(
      filteredProcesses.length === 0
        ? `Found no application running that need to be closed (following processes were spawned by this: ${processList
            .filter((p) => {
              return p.ppid === process.pid;
            })
            .map((p) => {
              return p.name;
            })
            .join(', ')})`
        : `Found following applications running: ${filteredProcesses
            .map((p) => {
              return p.name;
            })
            .join(', ')}`
    );

    filteredProcesses.forEach((p) => {
      try {
        debug(`Killing process ${p.name} with PID ${p.pid}`);
        if (process.platform === 'win32') {
          crossSpawn.sync('taskkill', ['/PID', String(p.pid), '/F', '/T']);
        } else {
          process.kill(p.pid);
        }
      } catch (err) {
        debug(`Failed to kill process ${p.name} with PID ${p.pid}`, {
          error: (err as Error).stack,
        });
      }
    });
    throw err;
  }

  const compass = new Compass(browser, {
    testPackagedApp,
    needsCloseWelcomeModal,
  });

  await compass.recordLogs();

  return compass;
}

/**
 * @param {string} logPath The compass application log path
 * @returns {Promise<CompassLog>}
 */
async function getCompassLog(logPath: string): Promise<any> {
  const names = await fs.readdir(logPath);
  const logNames = names.filter((name) => name.endsWith('_log.gz'));

  if (!logNames.length) {
    debug('no log output indicator found!');
    return { raw: Buffer.from(''), structured: [] };
  }

  // find the latest log file
  let latest = 0;
  let lastName = logNames[0];
  for (const name of logNames.slice(1)) {
    const id = name.slice(0, name.indexOf('_'));
    const time = new ObjectId(id).getTimestamp().valueOf();
    if (time > latest) {
      latest = time;
      lastName = name;
    }
  }

  const filename = path.join(logPath, lastName);
  debug('reading Compass application logs from', filename);
  const contents = await promisify(gunzip)(await fs.readFile(filename), {
    finishFlush: Z_SYNC_FLUSH,
  });
  return {
    raw: contents,
    structured: contents
      .toString()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return EJSON.parse(line);
        } catch {
          return { unparsabableLine: line };
        }
      }),
  };
}

function formattedDate(): string {
  // Mimicking webdriver path with this for consistency
  return new Date().toISOString().replace(/:/g, '-').replace(/Z$/, '');
}

export async function rebuildNativeModules(
  compassPath = COMPASS_PATH
): Promise<void> {
  const fullCompassPath = require.resolve(
    path.join(compassPath, 'package.json')
  );
  const {
    config: {
      hadron: { rebuild: rebuildConfig },
    },
  } = JSON.parse(await fs.readFile(fullCompassPath, 'utf8'));

  const fullElectronPath = require.resolve('electron/package.json');
  const electronVersion = JSON.parse(
    await fs.readFile(fullElectronPath, 'utf8')
  ).version;

  await rebuild({
    ...rebuildConfig,
    electronVersion,
    buildPath: compassPath,
    // monorepo root, so that the root packages are also inspected
    projectRootPath: path.resolve(compassPath, '..', '..'),
  });
}

export async function compileCompassAssets(
  compassPath = COMPASS_PATH
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore some weirdness from util-callbackify
  await compileAssetsAsync({ dir: compassPath });
}

async function getCompassBuildMetadata(): Promise<BinPathOptions> {
  try {
    let metadata;
    if (process.env.COMPASS_APP_PATH && process.env.COMPASS_APP_NAME) {
      metadata = {
        appPath: process.env.COMPASS_APP_PATH,
        packagerOptions: { name: process.env.COMPASS_APP_NAME },
      };
    } else {
      metadata = require('mongodb-compass/dist/target.json');
    }
    // Double-checking that Compass app path exists, not only the metadata
    await fs.stat(metadata.appPath);
    debug('Existing Compass found', metadata);
    return metadata;
  } catch (e: any) {
    debug('Existing Compass build not found', e);
    throw new Error(
      `Compass package metadata doesn't exist. Make sure you built Compass before running e2e tests: ${e.message}`
    );
  }
}

export async function buildCompass(
  force = false,
  compassPath = COMPASS_PATH
): Promise<void> {
  if (!force) {
    try {
      await getCompassBuildMetadata();
      return;
    } catch (e) {
      // No compass build found, let's build it
    }
  }

  await packageCompassAsync({
    dir: compassPath,
    skip_installer: true,
  });
}

type BinPathOptions = {
  appPath: string;
  packagerOptions: {
    name: string;
  };
};

export function getCompassBinPath({
  appPath,
  packagerOptions,
}: BinPathOptions): string {
  const { name } = packagerOptions;

  switch (process.platform) {
    case 'win32':
      return path.join(appPath, `${name}.exe`);
    case 'linux':
      return path.join(appPath, name);
    case 'darwin':
      return path.join(appPath, 'Contents', 'MacOS', name);
    default:
      throw new Error(
        `Unsupported platform: don't know where the app binary is for ${process.platform}`
      );
  }
}

function augmentError(error: Error, stack: string) {
  const lines = stack.split('\n');
  const strippedLines = lines.filter((line, index) => {
    // try to only contain lines that originated in this workspace
    if (index === 0) {
      return true;
    }
    if (line.startsWith('    at augmentError')) {
      return false;
    }
    if (line.startsWith('    at Object.descriptor.value [as')) {
      return false;
    }
    if (line.includes('node_modules')) {
      return false;
    }
    if (line.includes('helpers/')) {
      return true;
    }
    if (line.includes('tests/')) {
      return true;
    }
    return false;
  });

  if (strippedLines.length === 1) {
    return;
  }

  error.stack = `${error.stack ?? ''}\nvia ${strippedLines.join('\n')}`;
}

export async function beforeTests(
  opts: StartCompassOptions = {}
): Promise<Compass> {
  const compass = await startCompass(opts);

  const { browser } = compass;

  if (compass.needsCloseWelcomeModal) {
    await browser.closeWelcomeModal();
  }
  if (!opts.noWaitForConnectionScreen) {
    await browser.waitForConnectionScreen();
  }

  return compass;
}

export async function afterTests(
  compass?: Compass,
  test?: Mocha.Hook | Mocha.Test
): Promise<void> {
  if (!compass) {
    return;
  }

  if (test && test.state === undefined) {
    // if there's no state, then it is probably because the before() hook failed
    const filename = screenshotPathName(`${test.fullTitle()}-hook`);
    await compass.capturePage(filename);
  }

  let timeoutId;
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      console.error('It took too long to close compass');
      resolve();
    }, 30000);
  });

  const closePromise = (async function close(): Promise<void> {
    try {
      await compass.stop(test);
    } catch (err) {
      debug('An error occurred while stopping compass:');
      debug(err);
      try {
        // make sure the process can exit
        await compass.browser.deleteSession();
      } catch (_) {
        debug('browser already closed');
      }
    }
    clearTimeout(timeoutId);
    return;
  })();

  return Promise.race([timeoutPromise, closePromise]);
}

function pathName(text: string) {
  return text
    .replace(/ /g, '-') // spaces to dashes
    .replace(/[^a-z0-9-_]/gi, ''); // strip everything non-ascii (for now)
}

function screenshotPathName(text: string) {
  return `screenshot-${pathName(text)}.png`;
}

/**
 * @param {string} filename
 */
export function outputFilename(filename: string): string {
  return path.join(OUTPUT_PATH, filename);
}

export async function afterTest(
  compass: Compass,
  test?: Mocha.Hook | Mocha.Test
): Promise<void> {
  if (test && test.state === 'failed') {
    await compass.capturePage(screenshotPathName(test.fullTitle()));
  }
}

const SENSITIVE_ENV_VARS = [
  'E2E_TESTS_ATLAS_PASSWORD',
  'E2E_TESTS_ATLAS_IAM_ACCESS_KEY_ID',
  'E2E_TESTS_ATLAS_IAM_SECRET_ACCESS_KEY',
];

function redact(value: string): string {
  for (const field of SENSITIVE_ENV_VARS) {
    if (process.env[field] === undefined) {
      continue;
    }

    const quoted = `'${process.env[field] as string}'`;
    // /regex/s would be ideal, but we'd have to escape the value to not be
    // interpreted as a regex.
    while (value.indexOf(quoted) !== -1) {
      value = value.replace(quoted, "'$" + field + "'");
    }
  }

  // This is first going to try and parse the value as a connection string
  // before falling back to some regular expressions. Sometimes we pass a
  // connection string to a command, more often there's a connection string deep
  // in there somewhere.
  value = redactConnectionString(value, { replacementString: '<redacted>' });

  return value;
}
