// @ts-check
//const { inspect } = require('util');
const { ObjectId } = require('bson');
const { promises: fs } = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const {
  gunzip,
  constants: { Z_SYNC_FLUSH },
} = require('zlib');
//const { Application } = require('spectron');
const { _electron: electron } = require('playwright');
const { rebuild } = require('electron-rebuild');
const debug = require('debug')('compass-e2e-tests');
const {
  run: packageCompass,
  compileAssets,
} = require('hadron-build/commands/release');
const Selectors = require('./selectors');
const { bindCommands } = require('./commands');

/**
 * @typedef {Object} ExtendedClient
 *
 * @typedef {Object} CompassLog
 * @property {Buffer} raw
 * @property {any[]} structured
 *
 * @typedef {import('playwright').ElectronApplication & { compassLog: CompassLog['structured']}} ExtendedApplication
 */

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

/*
function formatLogToErrorWithStack(logEntry) {
  const [file, lineCol, ...rest] = logEntry.message.split(' ');
  const message = rest
    .join(' ')
    .replace(/\\n/g, '\n')
    .replace(/(^"|"$)/g, '');
  return `${message}\n  at ${file}:${lineCol}`;
}
*/

/**
 * @param {boolean} testPackagedApp Should compass start from the packaged binary or just from the source (defaults to source)
 * @returns {Promise<ExtendedApplication>}
 */
//* @param {Partial<import('spectron').AppConstructorOptions>} opts
async function startCompass(
  testPackagedApp = ['1', 'true'].includes(process.env.TEST_PACKAGED_APP),
  opts = {}
) {
  /** @type {string} */
  // When imported not from electron env, require('electron') actually returns a
  // path to the binary, it's just not typed like that
  // @ts-expect-error
  const electronPath = require('electron');


  const nowFormatted = formattedDate();

  const userDataDir = path.join(
    os.tmpdir(),
    `user-data-dir-${Date.now().toString(32)}-${++i}`
  );
  //const chromeDriverLogPath = path.join(
  //  LOG_PATH,
  //  `chromedriver.${nowFormatted}.log`
  //);
  //const webdriverLogPath = path.join(LOG_PATH, 'webdriver');

  await fs.mkdir(userDataDir, { recursive: true });
  // Chromedriver will fail if log path doesn't exist, webdriver doesn't care,
  // for consistency let's mkdir for both of them just in case
  //await fs.mkdir(path.dirname(chromeDriverLogPath), { recursive: true });
  //await fs.mkdir(webdriverLogPath, { recursive: true });
  await fs.mkdir(OUTPUT_PATH, { recursive: true });

  // See https://github.com/microsoft/playwright/issues/9351#issuecomment-945314768
  process.env.APP_ENV = 'playwright';
  process.env.DEBUG = process.env.DEBUG || `${process.env.DEBUG || ''},mongodb-compass:main:logging`;
  process.env.MONGODB_COMPASS_TEST_LOG_DIR = path.join(LOG_PATH, 'app');

  const args = [
    COMPASS_PATH,
    `--user-data-dir=${userDataDir}`,
    // Chromecast feature that is enabled by default in some chrome versions
    // and breaks the app on Ubuntu
    '--media-router=0',
    // Evergren RHEL ci runs everything as root, and chrome will not start as
    // root without this flag
    '--no-sandbox',
  ];

  const applicationStartOptions = testPackagedApp
    ? { executablePath: getCompassBinPath(await getCompassBuildMetadata()) }
    : {
        executablePath: electronPath,
        args,
        cwd: COMPASS_PATH,
      };

  const appOptions = {
    ...opts,
    ...applicationStartOptions,
    // It's usually not required when running tests in Evergreen or locally, but
    // GitHub CI machines are pretty slow sometimes, especially the macOS one
    timeout: 20_000,
  };

  debug('Starting Playwright Electron with the following configuration:');
  debug(JSON.stringify(appOptions, null, 2));

  /** @type {ExtendedApplication} */
  // It's missing methods that we will add in a moment
  // @ts-expect-error
  const app = await electron.launch(appOptions);

  // get the app logPath out of electron early in case the app crashes before we
  // close it and load the logs
  const logPath = await app.evaluate(async ({ app: _app }) => {
    return _app.getPath('logs');
  });

  // TODO
  //addDebugger(app);

  //const _stop = app.stop.bind(app);
  const _close = app.close.bind(app);

  //app.stop = async () => {
  app.close = async () => {

    // TODO
    //const mainLogs = await app.client.getMainProcessLogs();
    //const renderLogs = await app.client.getRenderProcessLogs();
    const renderLogs = [];

    //const mainLogPath = path.join(
    //  LOG_PATH,
    //  `electron-main.${nowFormatted}.log`
    //);
    //debug(`Writing application main process log to ${mainLogPath}`);
    //await fs.writeFile(mainLogPath, mainLogs.join('\n'));

    const renderLogPath = path.join(
      LOG_PATH,
      `electron-render.${nowFormatted}.json`
    );
    debug(`Writing application render process log to ${renderLogPath}`);
    await fs.writeFile(renderLogPath, JSON.stringify(renderLogs, null, 2));

    debug('Stopping Compass application');
    //await _stop();
    await _close();

    const compassLog = await getCompassLog(logPath);
    const compassLogPath = path.join(
      LOG_PATH,
      `compass-log.${nowFormatted}.log`
    );
    debug(`Writing Compass application log to ${compassLogPath}`);
    await fs.writeFile(compassLogPath, compassLog.raw);
    app.compassLog = compassLog.structured;

    debug('Removing user data');
    try {
      await fs.rmdir(userDataDir, { recursive: true });
    } catch (e) {
      debug(
        `Failed to remove temporary user data directory at ${userDataDir}:`
      );
      debug(e);
    }

    // TODO
    /*
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
      // @type { Error & { errors?: any[] } }
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
    */

    //return app;
  };

  return app;
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
  /*
  const logOutputIndicatorMatch = logs
    .map((line) => line.match(/Writing log output to (?<filename>.+)$/))
    .find((match) => match);
  if (!logOutputIndicatorMatch) {
    debug('no log output indicator found!');
    return { raw: Buffer.from(''), structured: [] };
  }

  const { filename } = logOutputIndicatorMatch.groups;
  */
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

/**
 * @param {ExtendedApplication} app
 */
//function addDebugger(app) {
//  const debugClient = debug.extend('webdriver:client');
//  const clientProto = Object.getPrototypeOf(app.client);
//
//  for (const prop of Object.getOwnPropertyNames(clientProto)) {
//    // disable emit logging for now because it is very noisy
//    if (prop.includes('.') || prop === 'emit') {
//      continue;
//    }
//    const descriptor = Object.getOwnPropertyDescriptor(clientProto, prop);
//    if (typeof descriptor.value !== 'function') {
//      continue;
//    }
//    const origFn = descriptor.value;
//    /**
//     * @param  {any[]} args
//     */
//    descriptor.value = function (...args) {
//      debugClient(
//        `${prop}(${args
//          .map((arg) => inspect(arg, { breakLength: Infinity }))
//          .join(', ')})`
//      );
//
//      const stack = new Error(prop).stack;
//
//      let result;
//      try {
//        result = origFn.call(this, ...args);
//      } catch (error) {
//        // In this case the method threw synchronously
//        augmentError(error, stack);
//        throw error;
//      }
//
//      if (result && result.then) {
//        // If the result looks like a promise, resolve it and look for errors
//        return result.catch((error) => {
//          augmentError(error, stack);
//          throw error;
//        });
//      }
//
//      // return the synchronous result
//      return result;
//    };
//    Object.defineProperty(clientProto, prop, descriptor);
//  }
//}
//
//function augmentError(error, stack) {
//  const lines = stack.split('\n');
//  const strippedLines = lines.filter((line, index) => {
//    // try to only contain lines that originated in this workspace
//    if (index === 0) {
//      return true;
//    }
//    if (line.startsWith('    at augmentError')) {
//      return false;
//    }
//    if (line.startsWith('    at Object.descriptor.value [as')) {
//      return false;
//    }
//    if (line.includes('node_modules')) {
//      return false;
//    }
//    if (line.includes('helpers/')) {
//      return true;
//    }
//    if (line.includes('tests/')) {
//      return true;
//    }
//    return false;
//  });
//
//  if (strippedLines.length === 1) {
//    return;
//  }
//
//  error.stack = `${error.stack}\nvia ${strippedLines.join('\n')}`;
//}

/**
 * @param {import('playwright').Page} page
 * @param {string} imgPathName
 */
async function capturePage(page, imgPathName=`screenshot-${formattedDate()}-${++j}.png`) {
  try {
    await page.screenshot({ path: path.join(LOG_PATH, imgPathName) });
    return true;
  } catch (err) {
    console.warn(err.stack);
    return false;
  }
}

/**
 * @param {import('playwright').Page} page
 * @param {string} htmlPathName
 */
async function savePage(page, htmlPathName = `page-${formattedDate()}-${++k}.html`) {
  try {
    const contents = await page.content();
    await fs.writeFile(path.join(LOG_PATH, htmlPathName), contents);
    return true;
  } catch (err) {
    console.warn(err.stack);
    return false;
  }
}

async function beforeTests() {
  const app = await startCompass();
  const page = await app.firstWindow();
  const commands = bindCommands(app, page);

  await commands.closeTourModal();
  await commands.closePrivacySettingsModal();

  return { app, page, commands };
}

async function afterTests(app, page) {
  if (!app) {
    console.log('no app');
    return;
  }

  // TODO: do we really need this given that we have afterTest()?
  //await capturePage(page);
  //await savePage(page);

  try {
    console.log('stopping compass');
    await app.close();
  } catch (err) {
    debug('An error occurred while stopping compass:');
    debug(err);
  }
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

async function afterTest(app, page, test) {
  if (!page) {
    return;
  }

  if (test.state == 'failed') {
    await capturePage(page, screenshotPathName(test.fullTitle()));
    await savePage(page, pagePathName(test.fullTitle()));
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
  bindCommands,
};
