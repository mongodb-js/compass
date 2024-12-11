import { inspect } from 'util';
import { ObjectId, EJSON } from 'bson';
import { promises as fs, rmdirSync } from 'fs';
import type Mocha from 'mocha';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import type { ExecFileOptions, ExecFileException } from 'child_process';
import { promisify } from 'util';
import zlib from 'zlib';
import { remote } from 'webdriverio';
import { rebuild } from '@electron/rebuild';
import type { RebuildOptions } from '@electron/rebuild';
import { run as packageCompass } from 'hadron-build/commands/release';
import { redactConnectionString } from 'mongodb-connection-string-url';
import { getConnectionTitle } from '@mongodb-js/connection-info';
export * as Selectors from './selectors';
export * as Commands from './commands';
import * as Commands from './commands';
import type { CompassBrowser } from './compass-browser';
import type { LogEntry } from './telemetry';
import Debug from 'debug';
import semver from 'semver';
import { CHROME_STARTUP_FLAGS } from './chrome-startup-flags';
import {
  DEFAULT_CONNECTION_STRINGS,
  DEFAULT_CONNECTION_NAMES,
  DEFAULT_CONNECTIONS_SERVER_INFO,
  isTestingWeb,
  isTestingDesktop,
  context,
  assertTestingWeb,
  isTestingAtlasCloudExternal,
} from './test-runner-context';
import {
  ELECTRON_CHROMIUM_VERSION,
  LOG_PATH,
  LOG_COVERAGE_PATH,
  COMPASS_DESKTOP_PATH,
  LOG_OUTPUT_PATH,
  LOG_SCREENSHOTS_PATH,
  ELECTRON_PATH,
} from './test-runner-paths';
import treeKill from 'tree-kill';

const killAsync = async (pid: number, signal?: string) => {
  return new Promise<void>((resolve, reject) => {
    treeKill(pid, signal ?? 'SIGTERM', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const debug = Debug('compass-e2e-tests');

const { gunzip } = zlib;
const { Z_SYNC_FLUSH } = zlib.constants;

const packageCompassAsync = promisify(packageCompass);

// should we test compass-web (true) or compass electron (false)?
export const TEST_COMPASS_WEB = isTestingWeb();

/*
A helper so we can easily find all the tests we're skipping in compass-web.
Reason is there so you can fill it in and have it show up in search results
in a scannable manner. It is not being output at present because the tests will
be logged as pending anyway.
*/
export function skipForWeb(
  test: Mocha.Runnable | Mocha.Context,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reason: string
) {
  if (TEST_COMPASS_WEB) {
    test.skip();
  }
}

export const DEFAULT_CONNECTION_STRING_1 = DEFAULT_CONNECTION_STRINGS[0];
// NOTE: in browser.setupDefaultConnections() we don't give the first connection an
// explicit name, so it gets a calculated one based off the connection string
export const DEFAULT_CONNECTION_NAME_1 = DEFAULT_CONNECTION_NAMES[0];

// for testing multiple connections
export const DEFAULT_CONNECTION_STRING_2 = DEFAULT_CONNECTION_STRINGS[1];
// NOTE: in browser.setupDefaultConnections() the second connection gets given an explicit name
export const DEFAULT_CONNECTION_NAME_2 = DEFAULT_CONNECTION_NAMES[1];

export const serverSatisfies = (
  semverCondition: string,
  enterpriseExact?: boolean
) => {
  const { version, enterprise } = DEFAULT_CONNECTIONS_SERVER_INFO[0];
  return (
    semver.satisfies(version, semverCondition, {
      includePrerelease: true,
    }) &&
    (typeof enterpriseExact === 'boolean'
      ? (enterpriseExact && enterprise) || (!enterpriseExact && !enterprise)
      : true)
  );
};

// For the user data dirs and logs
let runCounter = 0;

interface Coverage {
  main?: string;
  renderer?: string;
}

interface RenderLogEntry {
  timestamp: string;
  type: string;
  text: string;
  args: unknown;
}
interface CompassOptions {
  mode: 'electron' | 'web';
  writeCoverage?: boolean;
  needsCloseWelcomeModal?: boolean;
}

export class Compass {
  name: string;
  browser: CompassBrowser;
  mode: 'electron' | 'web';
  writeCoverage: boolean;
  needsCloseWelcomeModal: boolean;
  renderLogs: RenderLogEntry[];
  logs: LogEntry[];
  logPath?: string;
  userDataPath?: string;
  appName?: string;
  mainProcessPid?: number;

  constructor(
    name: string,
    browser: CompassBrowser,
    {
      mode,
      writeCoverage = false,
      needsCloseWelcomeModal = false,
    }: CompassOptions
  ) {
    this.name = name;
    this.browser = browser;
    this.mode = mode;
    this.writeCoverage = writeCoverage;
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

  async recordElectronLogs(): Promise<void> {
    debug('Setting up renderer log listeners ...');
    const puppeteerBrowser = await this.browser.getPuppeteer();
    const pages = await puppeteerBrowser.pages();
    const page = pages[0];

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
    [this.logPath, this.userDataPath, this.appName, this.mainProcessPid] =
      await this.browser.execute(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcRenderer } = require('electron');
        return Promise.all([
          ipcRenderer.invoke('compass:logPath'),
          ipcRenderer.invoke('compass:userDataPath'),
          ipcRenderer.invoke('compass:appName'),
          ipcRenderer.invoke('compass:mainProcessPid'),
        ] as const);
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

  async stopElectron(): Promise<void> {
    const renderLogPath = path.join(
      LOG_PATH,
      `electron-render.${this.name}.json`
    );
    debug(`Writing application render process log to ${renderLogPath}`);
    await fs.writeFile(renderLogPath, JSON.stringify(this.renderLogs, null, 2));

    if (this.writeCoverage) {
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
      if (coverage.main) {
        await fs.writeFile(
          path.join(LOG_COVERAGE_PATH, `main.${this.name}.log`),
          coverage.main
        );
      }
      if (coverage.renderer) {
        await fs.writeFile(
          path.join(LOG_COVERAGE_PATH, `renderer.${this.name}.log`),
          coverage.renderer
        );
      }
    }

    const copyCompassLog = async () => {
      const compassLog = await getCompassLog(this.logPath ?? '');
      const compassLogPath = path.join(
        LOG_PATH,
        `compass-log.${this.name}.log`
      );
      debug(`Writing Compass application log to ${compassLogPath}`);
      await fs.writeFile(compassLogPath, compassLog.raw);
      return compassLog;
    };

    // Copy log files before stopping in case that stopping itself fails and needs to be debugged
    await copyCompassLog();

    debug(`Stopping Compass application [${this.name}]`);
    await this.browser.deleteSession({ shutdownDriver: true });

    this.logs = (await copyCompassLog()).structured;
  }

  async stopBrowser(): Promise<void> {
    const logging: any[] = await this.browser.execute(function () {
      return (window as any).logging;
    });
    const lines = logging.map((log) => JSON.stringify(log));
    const text = lines.join('\n');
    const compassLogPath = path.join(LOG_PATH, `compass-log.${this.name}.log`);
    debug(`Writing Compass application log to ${compassLogPath}`);
    await fs.writeFile(compassLogPath, text);

    debug(`Stopping Compass application [${this.name}]`);
    await this.browser.deleteSession({ shutdownDriver: true });
  }

  async stop(): Promise<void> {
    if (TEST_COMPASS_WEB) {
      await this.stopBrowser();
    } else {
      await this.stopElectron();
    }
  }
}

interface StartCompassOptions {
  firstRun?: boolean;
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
  const testPackagedApp = isTestingDesktop(context) && context.testPackagedApp;
  const binary = testPackagedApp
    ? getCompassBinPath(await getCompassBuildMetadata())
    : ELECTRON_PATH;
  return { testPackagedApp, binary };
}

function execFileIgnoreError(
  path: string,
  args: readonly string[],
  opts: ExecFileOptions
): Promise<{
  error: ExecFileException | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    execFile(path, args, opts, function (error, stdout, stderr) {
      resolve({
        error,
        stdout,
        stderr,
      });
    });
  });
}

export async function runCompassOnce(args: string[], timeout = 30_000) {
  const { binary } = await getCompassExecutionParameters();
  debug('spawning compass...', {
    binary,
    COMPASS_DESKTOP_PATH,
    defaultUserDataDir,
    args,
    timeout,
  });
  // For whatever reason, running the compass CLI frequently completes what it
  // was set to do and then exits the process with error code 1 and no other
  // output. So while figuring out what's going on, don't ever throw but do log
  // the error. Assertions that follow runCompassOnce() can then check if it did
  // what it was supposed to do and fail if it didn't.
  const { error, stdout, stderr } = await execFileIgnoreError(
    binary,
    [
      COMPASS_DESKTOP_PATH,
      // When running binary without webdriver, we need to pass the same flags
      // as we pass when running with webdriverio to have similar behaviour.
      ...CHROME_STARTUP_FLAGS,
      `--user-data-dir=${String(defaultUserDataDir)}`,
      ...args,
    ],
    {
      timeout,
      env: {
        ...process.env,
        // prevent xdg-settings: unknown desktop environment error logs
        DE: 'generic',
      },
    }
  );
  debug('Ran compass with args', { args, error, stdout, stderr });
  return { stdout, stderr };
}

async function processCommonOpts({
  // true unless otherwise specified
  firstRun = true,
}: StartCompassOptions = {}) {
  const nowFormatted = formattedDate();
  let needsCloseWelcomeModal: boolean;

  // If this is not the first run, but we want it to be, delete the user data
  // dir so it will be recreated below.
  if (defaultUserDataDir && firstRun) {
    removeUserDataDir();
    // windows seems to be weird about us deleting and recreating this dir, so
    // just make a new one for next time
    defaultUserDataDir = undefined;
    needsCloseWelcomeModal = true;
  } else {
    // Need to close the welcome modal if firstRun is undefined or true, because
    // in those cases we do not pass --showed-network-opt-in=true, but only
    // if Compass hasn't been run before (i.e. defaultUserDataDir is defined)
    needsCloseWelcomeModal = !defaultUserDataDir && firstRun;
  }

  // Calculate the userDataDir once so it will be the same between runs. That
  // way we can test first run vs second run experience.
  if (!defaultUserDataDir) {
    defaultUserDataDir = path.join(
      os.tmpdir(),
      `user-data-dir-${Date.now().toString(32)}-${runCounter}`
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
  await fs.mkdir(LOG_OUTPUT_PATH, { recursive: true });
  await fs.mkdir(LOG_SCREENSHOTS_PATH, { recursive: true });
  await fs.mkdir(LOG_COVERAGE_PATH, { recursive: true });

  // https://webdriver.io/docs/options/#webdriver-options
  const webdriverOptions = {
    logLevel: 'warn' as const, // info is super verbose right now
    outputDir: webdriverLogPath,
  };

  // https://webdriver.io/docs/options/#webdriverio
  const wdioOptions = {
    waitforTimeout: context.webdriverWaitforTimeout,
    waitforInterval: context.webdriverWaitforInterval,
  };

  process.env.DEBUG = `${process.env.DEBUG ?? ''},mongodb-compass:main:logging`;
  process.env.MONGODB_COMPASS_TEST_LOG_DIR = path.join(LOG_PATH, 'app');
  process.env.CHROME_LOG_FILE = chromedriverLogPath;

  // https://peter.sh/experiments/chromium-command-line-switches/
  // https://www.electronjs.org/docs/latest/api/command-line-switches
  const chromeArgs: string[] = [
    ...CHROME_STARTUP_FLAGS,
    `--user-data-dir=${defaultUserDataDir}`,
  ];

  return {
    needsCloseWelcomeModal,
    webdriverOptions,
    wdioOptions,
    chromeArgs,
  };
}

async function startCompassElectron(
  name: string,
  opts: StartCompassOptions = {}
): Promise<Compass> {
  runCounter++;
  const { testPackagedApp, binary } = await getCompassExecutionParameters();

  const { needsCloseWelcomeModal, webdriverOptions, wdioOptions, chromeArgs } =
    await processCommonOpts(opts);

  if (!testPackagedApp) {
    // https://www.electronjs.org/docs/latest/tutorial/automated-testing#with-webdriverio
    chromeArgs.push(`--app=${COMPASS_DESKTOP_PATH}`);
  }

  if (opts.firstRun === false) {
    chromeArgs.push('--showed-network-opt-in=true');
  }

  // Logging output from Electron, even before the app loads any JavaScript
  const electronLogFile = path.join(LOG_PATH, `electron-${runCounter}.log`);
  chromeArgs.push(
    // See https://www.electronjs.org/docs/latest/api/command-line-switches#--enable-loggingfile
    '--enable-logging=file',
    // See https://www.electronjs.org/docs/latest/api/command-line-switches#--log-filepath
    `--log-file=${electronLogFile}`
  );

  if (opts.extraSpawnArgs) {
    chromeArgs.push(...opts.extraSpawnArgs);
  }

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

  const maybeWrappedBinary = (await opts.wrapBinary?.(binary)) ?? binary;

  process.env.APP_ENV = 'webdriverio';
  // For webdriverio env we are changing appName so that keychain records do not
  // overlap with anything else
  process.env.HADRON_PRODUCT_NAME_OVERRIDE = 'MongoDB Compass WebdriverIO';

  // Guide cues might affect too many tests in a way where the auto showing of the cue prevents
  // clicks from working on elements. Dealing with this case-by-case is way too much work, so
  // we disable the cues completely for the e2e tests
  process.env.DISABLE_GUIDE_CUES = 'true';

  const options = {
    automationProtocol: 'webdriver' as const,
    capabilities: {
      browserName: 'chromium',
      browserVersion: ELECTRON_CHROMIUM_VERSION,
      // https://chromedriver.chromium.org/capabilities#h.p_ID_106
      'goog:chromeOptions': {
        binary: maybeWrappedBinary,
        args: chromeArgs,
      },
      // from https://github.com/webdriverio-community/wdio-electron-service/blob/32457f60382cb4970c37c7f0a19f2907aaa32443/packages/wdio-electron-service/src/launcher.ts#L102
      'wdio:enforceWebDriverClassic': true,
    },
    'wdio:chromedriverOptions': {
      // TODO: enable logging so we don't have to debug things blindly
    },
    ...webdriverOptions,
    ...wdioOptions,
  };

  debug('Starting compass via webdriverio with the following configuration:');
  debug(JSON.stringify(options, null, 2));

  let browser: CompassBrowser;

  try {
    browser = (await remote(options)) as CompassBrowser;
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
          /(MongoDB Compass|Electron|electron|chromedriver)/.test(p.name))
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

    for (const p of filteredProcesses) {
      await killAsync(p.pid);
    }
    throw err;
  }

  const compass = new Compass(name, browser, {
    mode: 'electron',
    writeCoverage: !testPackagedApp,
    needsCloseWelcomeModal,
  });

  await compass.recordElectronLogs();

  return compass;
}

export type StoredAtlasCloudCookies = {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expirationDate: number;
}[];

export async function startBrowser(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  opts: StartCompassOptions = {}
) {
  assertTestingWeb(context);

  runCounter++;
  const { webdriverOptions, wdioOptions } = await processCommonOpts();

  // webdriverio removed RemoteOptions. It is now
  // Capabilities.WebdriverIOConfig, but Capabilities is not exported
  const options = {
    capabilities: {
      browserName: context.browserName,
      ...(context.browserVersion && {
        browserVersion: context.browserVersion,
      }),

      // from https://github.com/webdriverio-community/wdio-electron-service/blob/32457f60382cb4970c37c7f0a19f2907aaa32443/packages/wdio-electron-service/src/launcher.ts#L102
      'wdio:enforceWebDriverClassic': true,
    },
    ...webdriverOptions,
    ...wdioOptions,
  };

  debug('Starting browser via webdriverio with the following configuration:');
  debug(JSON.stringify(options, null, 2));

  const browser: CompassBrowser = (await remote(options)) as CompassBrowser;

  if (isTestingAtlasCloudExternal(context)) {
    const {
      atlasCloudExternalCookiesFile,
      atlasCloudExternalUrl,
      atlasCloudExternalProjectId,
    } = context;

    // To be able to use `setCookies` method, we need to first open any page on
    // the same domain as the cookies we are going to set
    // https://webdriver.io/docs/api/browser/setCookies/
    await browser.navigateTo(`${atlasCloudExternalUrl}/404`);

    type StoredAtlasCloudCookies = {
      name: string;
      value: string;
      domain: string;
      path: string;
      secure: boolean;
      httpOnly: boolean;
      expirationDate: number;
    }[];

    const cookies: StoredAtlasCloudCookies = JSON.parse(
      await fs.readFile(atlasCloudExternalCookiesFile, 'utf8')
    );

    await browser.setCookies(
      cookies
        .filter((cookie) => {
          // These are the relevant cookies for auth:
          // https://github.com/10gen/mms/blob/6d27992a6ab9ab31471c8bcdaa4e347aa39f4013/server/src/features/com/xgen/svc/cukes/helpers/Client.java#L122-L130
          return (
            cookie.name.includes('mmsa-') ||
            cookie.name.includes('mdb-sat') ||
            cookie.name.includes('mdb-srt')
          );
        })
        .map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
        }))
    );

    await browser.navigateTo(
      `${atlasCloudExternalUrl}/v2/${atlasCloudExternalProjectId}#/explorer`
    );
  } else {
    await browser.navigateTo(context.sandboxUrl);
  }

  const compass = new Compass(name, browser, {
    mode: 'web',
    writeCoverage: false,
    needsCloseWelcomeModal: false,
  });

  return compass;
}

/**
 * @param {string} logPath The compass application log path
 * @returns {Promise<CompassLog>}
 */
async function getCompassLog(
  logPath: string
): Promise<{ raw: Buffer; structured: any[] }> {
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
  compassPath = COMPASS_DESKTOP_PATH
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

  const rebuildOptions: RebuildOptions = {
    ...rebuildConfig,
    electronVersion,
    buildPath: compassPath,
    // monorepo root, so that the root packages are also inspected
    projectRootPath: path.resolve(compassPath, '..', '..'),
  };
  await rebuild(rebuildOptions);
}

export async function compileCompassAssets(
  compassPath = COMPASS_DESKTOP_PATH
): Promise<void> {
  await promisify(execFile)('npm', ['run', 'compile'], { cwd: compassPath });
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
    await fs.stat(metadata.appPath as string);
    debug('Existing Compass found', metadata);
    return metadata;
  } catch (e: unknown) {
    debug('Existing Compass build not found', e);
    throw new Error(
      `Compass package metadata doesn't exist. Make sure you built Compass before running e2e tests: ${
        (e as Error).message
      }`
    );
  }
}

export async function buildCompass(
  force = false,
  compassPath = COMPASS_DESKTOP_PATH
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

export async function init(
  name?: string,
  opts: StartCompassOptions = {}
): Promise<Compass> {
  name = pathName(name ?? formattedDate());

  // Unfortunately mocha's type is that this.test inside a test or hook is
  // optional even though it always exists. So we have a lot of
  // this.test?.fullTitle() and therefore we hopefully won't end up with a lot
  // of dates in filenames in reality.
  const compass = TEST_COMPASS_WEB
    ? await startBrowser(name, opts)
    : await startCompassElectron(name, opts);

  const { browser } = compass;

  // For browser.executeAsync(). Trying to see if it will work for browser.execute() too.
  await browser.setTimeout({ script: 5_000 });

  if (TEST_COMPASS_WEB) {
    // larger window for more consistent results
    const [width, height] = await browser.execute(() => {
      // in case setWindowSize() below doesn't work
      window.resizeTo(window.screen.availWidth, window.screen.availHeight);

      return [window.screen.availWidth, window.screen.availHeight];
    });
    // getting available width=1512, height=944 in electron on mac which is arbitrary
    debug(`available width=${width}, height=${height}`);
    try {
      // window.resizeTo() doesn't work on firefox
      await browser.setWindowSize(width, height);
    } catch (err: any) {
      console.error(err?.stack);
    }
  } else {
    await browser.execute(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ipcRenderer } = require('electron');
      void ipcRenderer.invoke('compass:maximize');
    });
  }

  if (compass.needsCloseWelcomeModal) {
    await browser.closeWelcomeModal();
  }

  return compass;
}

export async function cleanup(compass?: Compass): Promise<void> {
  if (!compass) {
    debug('no compass to close');
    return;
  }

  let timeoutId;
  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    timeoutId = setTimeout(() => {
      console.error(`It took too long to close compass [${compass.name}]`);
      resolve('timeout');
    }, 30000);
  });

  const closePromise = (async function close(): Promise<'closed'> {
    try {
      await compass.stop();
    } catch (err) {
      debug(`An error occurred while stopping compass: [${compass.name}]`);
      debug(err);
      try {
        // make sure the process can exit
        await compass.browser.deleteSession({ shutdownDriver: true });
      } catch (_) {
        debug('browser already closed');
      }
    }
    clearTimeout(timeoutId);
    return 'closed';
  })();

  debug(`Closing compass [${compass.name}]`);
  const result = await Promise.race([timeoutPromise, closePromise]);
  if (result === 'timeout') {
    debug('Closing compass timed out.');
    if (compass.mainProcessPid) {
      // this only works for the electron use case
      try {
        debug(`Trying to manually kill Compass [${compass.name}]`);
        await killAsync(compass.mainProcessPid);
      } catch {
        /* already logged ... */
      }
    }
  }
}

function pathName(text: string) {
  return text
    .replace(/ /g, '-') // spaces to dashes
    .replace(/[^a-z0-9-_]/gi, ''); // strip everything non-ascii (for now)
}

export function screenshotPathName(text: string) {
  return `screenshot-${pathName(text)}.png`;
}

/**
 * @param {string} filename
 */
export function outputFilename(filename: string): string {
  return path.join(LOG_OUTPUT_PATH, filename);
}

export async function screenshotIfFailed(
  compass: Compass,
  test?: Mocha.Hook | Mocha.Test
): Promise<void> {
  // NOTE: you cannot use this inside a test because the test wouldn't be marked
  // as failed yet. It is made for use inside an afterEach() to go with the
  // pattern where we init() compass in a before() hook and cleanup() in an
  // after() hook.
  if (test) {
    if (test.state === undefined) {
      // if there's no state, then it is probably because the before() hook failed
      await compass.browser.screenshot(
        screenshotPathName(`${test.fullTitle()}-hook`)
      );
    } else if (test.state === 'failed') {
      await compass.browser.screenshot(screenshotPathName(test.fullTitle()));
    }
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

export function subtestTitle(
  test: Mocha.Runnable | undefined,
  step: string
): string {
  // Sometimes we start and stop compass multiple times in the same test. In
  // that case it is handy to give them unique names. That's what this function
  // is for.
  const title = test?.fullTitle() ?? formattedDate();
  return `${title}_${step}`;
}

export function positionalArgs(positionalArgs: string[]) {
  return function wrapBinary(binary: string): string {
    process.env.BINARY = binary;

    process.env.POSITIONAL_ARGS =
      process.platform === 'win32'
        ? positionalArgs.join('_varsep_')
        : positionalArgs.join(' ');

    const wrapperPath =
      process.platform === 'win32'
        ? path.join(__dirname, '..', 'positional-args', 'positional-args.exe')
        : path.join(__dirname, '..', 'scripts', 'positional-args.sh');

    console.log({
      binary: process.env.BINARY,
      args: process.env.POSITIONAL_ARGS,
      wrapperPath,
    });

    return wrapperPath;
  };
}

export function connectionNameFromString(connectionString: string): string {
  return getConnectionTitle({ connectionOptions: { connectionString } });
}
