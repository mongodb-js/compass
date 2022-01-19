// TODO: add back ts-check
const { ObjectId } = require('bson');
const { promises: fs } = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const {
  gunzip,
  constants: { Z_SYNC_FLUSH },
} = require('zlib');
const { remote } = require('webdriverio');
const { rebuild } = require('electron-rebuild');
const debug = require('debug')('compass-e2e-tests');
const {
  run: packageCompass,
  compileAssets,
} = require('hadron-build/commands/release');
const Selectors = require('./selectors');
const { addCommands } = require('./commands');

const compileAssetsAsync = promisify(compileAssets);
const packageCompassAsync = promisify(packageCompass);

const COMPASS_PATH = path.dirname(
  require.resolve('mongodb-compass/package.json')
);

const LOG_PATH = path.resolve(__dirname, '..', '.log');

const OUTPUT_PATH = path.join(LOG_PATH, 'output');

function getAtlasConnectionOptions() {
  const missingKeys = [
    'E2E_TESTS_ATLAS_HOST',
    'E2E_TESTS_ATLAS_USERNAME',
    'E2E_TESTS_ATLAS_PASSWORD',
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    const keysStr = missingKeys.join(', ');
    if (process.env.ci || process.env.CI) {
      throw new Error(`Missing required environmental variable(s): ${keysStr}`);
    }
    return null;
  }

  const {
    E2E_TESTS_ATLAS_HOST: host,
    E2E_TESTS_ATLAS_USERNAME: username,
    E2E_TESTS_ATLAS_PASSWORD: password,
  } = process.env;

  return { host, username, password, srvRecord: true };
}

// For the tmpdirs
let i = 0;
// For the screenshots
let j = 0;
// For the html
//let k = 0;

async function startCompass(
  testPackagedApp = ['1', 'true'].includes(process.env.TEST_PACKAGED_APP),
  opts = {}
) {
  const compass = {};

  const nowFormatted = formattedDate();

  const userDataDir = path.join(
    os.tmpdir(),
    `user-data-dir-${Date.now().toString(32)}-${++i}`
  );
  const chromedriverLogPath = path.join(
    LOG_PATH,
    `chromedriver.${nowFormatted}.log`
  );
  const webdriverLogPath = path.join(LOG_PATH, 'webdriver');

  await fs.mkdir(userDataDir, { recursive: true });
  // Chromedriver will fail if log path doesn't exist, webdriver doesn't care,
  // for consistency let's mkdir for both of them just in case
  await fs.mkdir(path.dirname(chromedriverLogPath), { recursive: true });
  await fs.mkdir(webdriverLogPath, { recursive: true });
  await fs.mkdir(OUTPUT_PATH, { recursive: true });

  const binary = testPackagedApp
    ? getCompassBinPath(await getCompassBuildMetadata())
    : require('electron');
  const chromeArgs = [];

  if (!testPackagedApp) {
    // https://www.electronjs.org/docs/latest/tutorial/automated-testing#with-webdriverio
    chromeArgs.push(`--app=${COMPASS_PATH}`);
    //process.chdir(COMPASS_PATH); // TODO: do we need this?
  }

  // https://peter.sh/experiments/chromium-command-line-switches/
  // https://www.electronjs.org/docs/latest/api/command-line-switches
  chromeArgs.push(
    `--user-data-dir=${userDataDir}`,
    // Chromecast feature that is enabled by default in some chrome versions
    // and breaks the app on Ubuntu
    '--media-router=0',
    // Evergren RHEL ci runs everything as root, and chrome will not start as
    // root without this flag
    '--no-sandbox'

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
  );

  // https://webdriver.io/docs/options/#webdriver-options
  const webdriverOptions = {
    // TODO: If we redirect the logs to a file we can't see them in stdout.
    // Although they are quite verbose so perhaps we do need addDebugger and
    // just write these to a file.
    logLevel: 'info',
    outputDir: webdriverLogPath,
  };

  // https://webdriver.io/docs/options/#webdriverio
  const wdioOptions = {
    waitforTimeout: 5000, // default is 3000ms
    waitforInterval: 100, // default is 500ms
  };

  process.env.APP_ENV = 'webdriverio';
  process.env.DEBUG = `${process.env.DEBUG || ''},mongodb-compass:main:logging`;
  process.env.MONGODB_COMPASS_TEST_LOG_DIR = path.join(LOG_PATH, 'app');
  process.env.CHROME_LOG_FILE = chromedriverLogPath;

  const options = {
    capabilities: {
      browserName: 'chrome',
      // https://chromedriver.chromium.org/capabilities#h.p_ID_106
      'goog:chromeOptions': {
        binary,
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

  // It's missing methods that we will add in a moment
  // @ts-expect-error
  const browser = await remote(options);
  compass.browser = browser;

  const puppeteerBrowser = await browser.getPuppeteer();
  const pages = await puppeteerBrowser.pages();
  const page = pages[0];

  compass.renderLogs = [];

  page.on('console', async (message) => {
    // human and machine readable, always UTC
    const timestamp = new Date().toISOString();

    // startGroup, endGroup, log, table, warning, etc.
    const type = message.type();

    const text = message.text();
    const stackTrace = message.stackTrace();

    // first arg is usually == text, but not always
    const args = [];
    for (const arg of message.args()) {
      args.push(await arg.jsonValue());
    }

    // uncomment to see browser logs
    //console.log({ timestamp, type, text, args, stackTrace });

    compass.renderLogs.push({ timestamp, type, text, args, stackTrace });
  });

  // get the app logPath out of electron early in case the app crashes before we
  // close it and load the logs
  const logPath = await browser.execute(() => {
    return require('electron').ipcRenderer.invoke('compass:logPath');
  });

  addCommands(compass);
  // TODO: do we need this?
  //addDebugger(compass);

  compass.stop = async () => {
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

    const renderLogPath = path.join(
      LOG_PATH,
      `electron-render.${nowFormatted}.json`
    );
    debug(`Writing application render process log to ${renderLogPath}`);
    await fs.writeFile(
      renderLogPath,
      JSON.stringify(compass.renderLogs, null, 2)
    );

    debug('Stopping Compass application');
    await browser.deleteSession();

    const compassLog = await getCompassLog(logPath);
    const compassLogPath = path.join(
      LOG_PATH,
      `compass-log.${nowFormatted}.log`
    );
    debug(`Writing Compass application log to ${compassLogPath}`);
    await fs.writeFile(compassLogPath, compassLog.raw);
    compass.logs = compassLog.structured;

    debug('Removing user data');
    try {
      await fs.rmdir(userDataDir, { recursive: true });
    } catch (e) {
      debug(
        `Failed to remove temporary user data directory at ${userDataDir}:`
      );
      debug(e);
    }

    return compass;
  };

  return compass;
}

/**
 * @param {string} logPath The compass application log path
 * @returns {Promise<CompassLog>}
 */
async function getCompassLog(logPath) {
  const names = await fs.readdir(logPath);
  const logNames = names.filter((name) => name.endsWith('_log.gz'));

  if (!logNames.length) {
    debug('no log output indicator found!');
    return { raw: Buffer.from(''), structured: [] };
  }

  // find the latest log file
  let latest = 0;
  let lastName;
  for (const name of logNames) {
    const id = name.slice(0, name.indexOf('_'));
    const time = new ObjectId(id).generationTime;
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
          return JSON.parse(line);
        } catch {
          return { unparsabableLine: line };
        }
      }),
  };
}

function formattedDate() {
  // Mimicking webdriver path with this for consistency
  return new Date().toISOString().replace(/:/g, '-').replace(/Z$/, '');
}

async function rebuildNativeModules(compassPath = COMPASS_PATH) {
  const {
    config: {
      hadron: { rebuild: rebuildConfig },
    },
  } = require(path.join(compassPath, 'package.json'));

  await rebuild({
    ...rebuildConfig,
    electronVersion: require('electron/package.json').version,
    buildPath: compassPath,
    // monorepo root, so that the root packages are also inspected
    projectRootPath: path.resolve(compassPath, '..', '..'),
  });
}

async function compileCompassAssets(compassPath = COMPASS_PATH) {
  // @ts-ignore some weirdness from util-callbackify
  await compileAssetsAsync({ dir: compassPath });
}

async function getCompassBuildMetadata() {
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
    fs.stat(metadata.appPath);
    return metadata;
  } catch (e) {
    throw new Error(
      "Compass package metadata doesn't exist. Make sure you built Compass before running e2e tests"
    );
  }
}

async function buildCompass(force = false, compassPath = COMPASS_PATH) {
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

function getCompassBinPath({ appPath, packagerOptions: { name } }) {
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

/*
function addDebugger(compass) {
  const debugClient = debug.extend('webdriver:client');
  const browserProto = Object.getPrototypeOf(compass.browser);

  for (const prop of Object.getOwnPropertyNames(browserProto)) {
    // disable emit logging for now because it is very noisy
    if (prop.includes('.') || prop === 'emit') {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(browserProto, prop);
    if (typeof descriptor.value !== 'function') {
      continue;
    }
    const origFn = descriptor.value;
    descriptor.value = function (...args) {
      debugClient(
        `${prop}(${args
          .map((arg) => inspect(arg, { breakLength: Infinity }))
          .join(', ')})`
      );

      const stack = new Error(prop).stack;

      let result;
      try {
        result = origFn.call(this, ...args);
      } catch (error) {
        // In this case the method threw synchronously
        augmentError(error, stack);
        throw error;
      }

      if (result && result.then) {
        // If the result looks like a promise, resolve it and look for errors
        return result.catch((error) => {
          augmentError(error, stack);
          throw error;
        });
      }

      // return the synchronous result
      return result;
    };
    Object.defineProperty(browserProto, prop, descriptor);
  }
}

function augmentError(error, stack) {
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

  error.stack = `${error.stack}\nvia ${strippedLines.join('\n')}`;
}
*/

async function capturePage(
  compass,
  imgPathName = `screenshot-${formattedDate()}-${++j}.png`
) {
  try {
    const { browser } = compass;
    await browser.saveScreenshot(path.join(LOG_PATH, imgPathName));
    return true;
  } catch (err) {
    console.warn(err.stack);
    return false;
  }
}

async function savePage() {
  //compass,
  //htmlPathName = `page-${formattedDate()}-${++k}.html`
  // TODO
  /*
  try {
    await compass.webContents.savePage(
      path.join(LOG_PATH, htmlPathName),
      'HTMLComplete'
    );
    return true;
  } catch (err) {
    return false;
  }
  */
}

async function beforeTests() {
  const compass = await startCompass();

  const { browser } = compass;

  await browser.waitForConnectionScreen();
  await browser.closeTourModal();
  await browser.closePrivacySettingsModal();

  return compass;
}

async function afterTests(compass) {
  if (!compass) {
    console.log('compas is falsey in afterTests');
    return;
  }

  try {
    await compass.stop();
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
  compass = null;
}

function pathName(text) {
  return text
    .replace(/ /g, '-') // spaces to dashes
    .replace(/[^a-z0-9-_]/gi, ''); // strip everything non-ascii (for now)
}

function screenshotPathName(text) {
  return `screenshot-${pathName(text)}.png`;
}

function pagePathName(text) {
  return `page-${pathName(text)}.html`;
}

/**
 * @param {string} filename
 */
function outputFilename(filename) {
  return path.join(OUTPUT_PATH, filename);
}

async function afterTest(compass, test) {
  if (test.state == 'failed') {
    await capturePage(compass, screenshotPathName(test.fullTitle()));
    await savePage(compass, pagePathName(test.fullTitle()));
  }
}

module.exports = {
  startCompass,
  rebuildNativeModules,
  compileCompassAssets,
  getCompassBuildMetadata,
  getCompassBinPath,
  getAtlasConnectionOptions,
  buildCompass,
  capturePage,
  savePage,
  Selectors,
  COMPASS_PATH,
  LOG_PATH,
  OUTPUT_PATH,
  beforeTests,
  afterTests,
  screenshotPathName,
  pagePathName,
  outputFilename,
  afterTest,
};
