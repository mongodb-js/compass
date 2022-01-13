// TODO: add back ts-check
const { inspect } = require('util');
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
let k = 0;


function formatLogToErrorWithStack(logEntry) {
  const [file, lineCol, ...rest] = logEntry.message.split(' ');
  const message = rest
    .join(' ')
    .replace(/\\n/g, '\n')
    .replace(/(^"|"$)/g, '');
  return `${message}\n  at ${file}:${lineCol}`;
}


async function startCompass(
  testPackagedApp = ['1', 'true'].includes(process.env.TEST_PACKAGED_APP),
  opts = {}
) {
  const compass = {};

  /** @type {string} */
  // When imported not from electron env, require('electron') actually returns a
  // path to the binary, it's just not typed like that
  // @ts-expect-error

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

  const binary = testPackagedApp ? getCompassBinPath(await getCompassBuildMetadata()) : require('electron');
  const chromeArgs = [];

  if (!testPackagedApp) {
    // https://www.electronjs.org/docs/latest/tutorial/automated-testing#with-webdriverio
    chromeArgs.push(COMPASS_PATH);
    process.chdir(COMPASS_PATH);
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
    '--no-sandbox',
    '--verbose' // TODO: for chrome driver logs
  );

  // https://webdriver.io/docs/options/#webdriver-options
  const webdriverOptions = {
    logLevel: 'info',
    outputDir: webdriverLogPath
  };

  // https://webdriver.io/docs/options/#webdriverio
  const wdioOptions = {
    waitforTimeout: 3000, // default is 3000ms
    waitforInterval: 100, // default is 500ms
  };

  process.env.APP_ENV = 'webdriverio';
  process.env.DEBUG = `${process.env.DEBUG || ''},mongodb-compass:main:logging`;
  process.env.MONGODB_COMPASS_TEST_LOG_DIR = path.join(LOG_PATH, 'app');

  const options = {
    capabilities: [{
      browserName: 'chrome',
      // https://chromedriver.chromium.org/capabilities#h.p_ID_106
      'goog:chromeOptions': {
        binary,
        args: chromeArgs,
        outputDir: path.dirname(chromedriverLogPath), // TODO
        logFileName: path.basename(chromedriverLogPath) // TODO
      }
    }],
    ...webdriverOptions,
    ...wdioOptions,
    ...opts
  };

  debug('Starting compass via webdriverio with the following configuration:');
  debug(JSON.stringify(options, null, 2));

  // It's missing methods that we will add in a moment
  // @ts-expect-error
  const browser = await remote(options);
  compass.browser = browser;

  addCommands(compass);
  // TODO
  //addDebugger(compass);

  compass.stop = async () => {
    // TODO
    const mainLogs = [];
    const renderLogs = [];
    //const mainLogs = await compass.client.getMainProcessLogs();
    //const renderLogs = await compass.client.getRenderProcessLogs();

    const mainLogPath = path.join(
      LOG_PATH,
      `electron-main.${nowFormatted}.log`
    );
    debug(`Writing application main process log to ${mainLogPath}`);
    await fs.writeFile(mainLogPath, mainLogs.join('\n'));

    const renderLogPath = path.join(
      LOG_PATH,
      `electron-render.${nowFormatted}.json`
    );
    debug(`Writing application render process log to ${renderLogPath}`);
    await fs.writeFile(renderLogPath, JSON.stringify(renderLogs, null, 2));

    debug('Stopping Compass application');
    await browser.deleteSession();

    const compassLog  = await getCompassLog(mainLogs);
    const compassLogPath = path.join(
      LOG_PATH,
      `compass-log.${nowFormatted}.log`
    );
    debug(`Writing Compass application log to ${compassLogPath}`);
    await fs.writeFile(compassLogPath, compassLog.raw);
    compass.compassLog = compassLog.structured; // TODO: rename

    debug('Removing user data');
    try {
      await fs.rmdir(userDataDir, { recursive: true });
    } catch (e) {
      debug(
        `Failed to remove temporary user data directory at ${userDataDir}:`
      );
      debug(e);
    }

    // ERROR, CRITICAL and whatever unknown things might end up in the logs
    const errors = renderLogs.filter((log) => {
      if (['DEBUG', 'INFO', 'WARNING'].includes(log.level)) {
        return false;
      }

      // TODO: remove this once we fixed these warnings
      if (
        log.level === 'SEVERE' &&
        log.message.includes('"Warning: Failed prop type: ')
      ) {
        return false;
      }

      return true;
    });

    if (errors.length) {
      /** @type { Error & { errors?: any[] } } */
      const error = new Error(
        `Errors encountered in render process during testing:\n\n${errors
          .map(formatLogToErrorWithStack)
          .map((msg) =>
            msg
              .split('\n')
              .map((line) => `  ${line}`)
              .join('\n')
          )
          .join('\n\n')}`
      );
      error.errors = errors;
      // Fail the tests if we encountered some severe errors while the
      // application was running
      throw error;
    }

    return compass;
  };

  return compass;
}

async function getCompassLog(logs) {
  // TODO
  return { raw: Buffer.from(''), structured: [] };
  /*
  const logOutputIndicatorMatch = logs
    .map((line) => line.match(/Writing log output to (?<filename>.+)$/))
    .find((match) => match);
  if (!logOutputIndicatorMatch) {
    debug('no log output indicator found!');
    return { raw: Buffer.from(''), structured: [] };
  }

  const { filename } = logOutputIndicatorMatch.groups;
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
  */
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
  //compass,
  //imgPathName = `screenshot-${formattedDate()}-${++j}.png`
) {
  // TODO
  /*
  try {
    const buffer = await compass.browserWindow.capturePage();
    await fs.mkdir(LOG_PATH, { recursive: true });
    // @ts-expect-error buffer is Electron.NativeImage not a real buffer, but it
    //                  can be used as a buffer when storing an image
    await fs.writeFile(path.join(LOG_PATH, imgPathName), buffer);
    return true;
  } catch (_) {
    return false;
  }
  */
}

async function savePage(
  //compass,
  //htmlPathName = `page-${formattedDate()}-${++k}.html`
) {
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
    return;
  }

  try {
    await compass.stop();
  } catch (err) {
    debug('An error occurred while stopping compass:');
    debug(err);
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
  if (process.env.CI) {
    if (test.state == 'failed') {
      // TODO
      //await capturePage(compass, screenshotPathName(test.fullTitle()));
      //await savePage(compass, pagePathName(test.fullTitle()));
    }
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
