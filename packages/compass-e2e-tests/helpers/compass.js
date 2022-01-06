// @ts-check
const { ObjectId } = require('bson');
const { promises: fs } = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const {
  gunzip,
  constants: { Z_SYNC_FLUSH },
} = require('zlib');
const { _electron: electron } = require('playwright');
const { rebuild } = require('electron-rebuild');
const debug = require('debug')('compass-e2e-tests');
const debugPage = debug.extend('page');
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
 * @typedef {import('playwright').ElectronApplication & { compassLog: CompassLog['structured'], renderLog: any[] }} ExtendedApplication
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

  await fs.mkdir(userDataDir, { recursive: true });
  // Chromedriver will fail if log path doesn't exist, webdriver doesn't care,
  // for consistency let's mkdir for both of them just in case
  //await fs.mkdir(path.dirname(chromeDriverLogPath), { recursive: true });
  //await fs.mkdir(webdriverLogPath, { recursive: true });
  await fs.mkdir(OUTPUT_PATH, { recursive: true });

  // See https://github.com/microsoft/playwright/issues/9351#issuecomment-945314768
  process.env.APP_ENV = 'playwright';
  process.env.DEBUG =
    process.env.DEBUG ||
    `${process.env.DEBUG || ''},mongodb-compass:main:logging`;
  process.env.MONGODB_COMPASS_TEST_LOG_DIR = path.join(LOG_PATH, 'app');

  const args = [
    `--user-data-dir=${userDataDir}`,
    // Chromecast feature that is enabled by default in some chrome versions
    // and breaks the app on Ubuntu
    '--media-router=0',
    // Evergren RHEL ci runs everything as root, and chrome will not start as
    // root without this flag
    '--no-sandbox',
  ];

  const applicationStartOptions = testPackagedApp
    ? {
        executablePath: getCompassBinPath(await getCompassBuildMetadata()),
        args,
      }
    : {
        executablePath: electronPath,
        args: [COMPASS_PATH, ...args],
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

  const _close = app.close.bind(app);

  app.close = async () => {
    const renderLogPath = path.join(
      LOG_PATH,
      `electron-render.${nowFormatted}.json`
    );
    debug(`Writing application render process log to ${renderLogPath}`);
    await fs.writeFile(renderLogPath, JSON.stringify(app.renderLog, null, 2));

    debug('Stopping Compass application');
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
 * @param {import('playwright').Page} page
 * @param {string} imgPathName
 */
async function capturePage(
  page,
  imgPathName = `screenshot-${formattedDate()}-${++j}.png`
) {
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
async function savePage(
  page,
  htmlPathName = `page-${formattedDate()}-${++k}.html`
) {
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

  app.renderLog = [];

  page.on('console', async (message) => {
    const type = message.type();
    const args = [];
    for (const arg of message.args()) {
      args.push(await arg.jsonValue());
    }
    debugPage({ type, args });
    app.renderLog.push({ type, args });
  });

  return { app, page, commands };
}

// eslint-disable-next-line no-unused-vars
async function afterTests(app, page) {
  if (!app) {
    console.log('no app');
    return;
  }

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
