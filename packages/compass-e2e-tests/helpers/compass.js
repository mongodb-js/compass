// @ts-check
const { promises: fs } = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { Application } = require('spectron');
const { rebuild } = require('electron-rebuild');
const {
  run: packageCompass,
  cleanCompileCache,
  createCompileCache,
  createPackagedStyles
} = require('hadron-build/commands/release');
const Selectors = require('./selectors');

/**
 * @typedef {Object} ExtendedClient
 * @property {(selector: string, timeout?: number) => Promise<void>} clickVisible
 * @property {(selector: string, value: any, timeout?: number) => Promise<void>} setValueVisible
 * @property {() => Promise<void>} waitForConnectionScreen
 * @property {() => Promise<void>} closePrivacySettingsModal
 * @property {(timeout?: number) => Promise<void>} doConnect
 * @property {(connectionString: string, timeout?: number) => Promise<void>} connectWithConnectionString
 * @property {(connectionOptions: any, timeout?: number) => Promise<void>} connectWithConnectionForm
 * @property {() => Promise<void>} disconnect
 * @property {(str: string, parse?: boolean, timeout?: number) => Promise<any>} shellEval
 *
 * @typedef {import('spectron').Application & { client: import('spectron').SpectronClient & ExtendedClient }} ExtendedApplication
 */

const packageCompassAsync = promisify(packageCompass);
const cleanCompileCacheAsync = promisify(cleanCompileCache);
const createCompileCacheAsync = promisify(createCompileCache);
const createPackagedStylesAsync = promisify(createPackagedStyles);

const MINUTE = 1000 * 60 * 1;

const COMPASS_PATH = path.dirname(
  require.resolve('mongodb-compass/package.json')
);

function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAtlasConnectionOptions() {
  const missingKeys = [
    'E2E_TESTS_ATLAS_HOST',
    'E2E_TESTS_ATLAS_USERNAME',
    'E2E_TESTS_ATLAS_PASSWORD'
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
    E2E_TESTS_ATLAS_PASSWORD: password
  } = process.env;

  return { host, username, password, srvRecord: true };
}

let i = 0;

/**
 * @param {boolean} testPackagedApp Should compass start from the packaged binary or just from the source (defaults to source)
 * @param {Partial<import('spectron').AppConstructorOptions>} opts
 * @returns {Promise<ExtendedApplication>}
 */
async function startCompass(
  testPackagedApp = ['1', 'true'].includes(process.env.TEST_PACKAGED_APP),
  opts = {}
) {
  /** @type {string} */
  // When imported not from electron env, require('electron') actually returns a
  // path to the binary, it's just not typed like that
  // @ts-expect-error
  const electronPath = require('electron');

  /** @type {import('spectron').AppConstructorOptions} */
  const applicationStartOptions = !testPackagedApp
    ? {
        path: electronPath,
        args: [COMPASS_PATH],
        cwd: COMPASS_PATH
      }
    : { path: getCompassBinPath(await getCompassBuildMetadata()) };

  const userDataDir = path.join(
    os.tmpdir(),
    `user-data-dir-${Date.now().toString(32)}-${++i}`
  );

  const appOptions = {
    ...opts,
    ...applicationStartOptions,
    chromeDriverArgs: [`--user-data-dir=${userDataDir}`],
    env: { APP_ENV: 'spectron' }
  };

  /** @type {ExtendedApplication} */
  // It's missing methods that we will add in a moment
  // @ts-expect-error
  const app = new Application(appOptions);

  await app.start();

  addCommands(app);

  const _stop = app.stop.bind(app);

  app.stop = async () => {
    const app = await _stop();
    await fs.rmdir(userDataDir, { recursive: true });
    return app;
  };

  return app;
}

async function rebuildNativeModules(compassPath = COMPASS_PATH) {
  const {
    config: {
      hadron: { rebuild: rebuildConfig }
    }
  } = require(path.join(compassPath, 'package.json'));

  await rebuild({
    ...rebuildConfig,
    electronVersion: require('electron/package.json').version,
    buildPath: compassPath,
    projectRootPath: compassPath
  });
}

async function compileCompassAssets(compassPath = COMPASS_PATH) {
  const pkgJson = require(path.join(compassPath, 'package.json'));
  const {
    config: {
      hadron: { distributions: distConfig }
    }
  } = pkgJson;

  const buildTarget = {
    dir: compassPath,
    resourcesAppDir: compassPath,
    pkg: pkgJson,
    distribution:
      process.env.HADRON_DISTRIBUTION ||
      (distConfig && distConfig.default) ||
      'compass'
  };

  await cleanCompileCacheAsync(buildTarget);
  await createCompileCacheAsync(buildTarget);
  await createPackagedStylesAsync(buildTarget);
}

async function getCompassBuildMetadata() {
  try {
    const metadata = require('mongodb-compass/dist/target.json');
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
    skip_installer: true
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
function addCommands(app) {
  // waitForVisible gives better errors than interacting with a non-existing
  // element
  app.client.addCommand(
    'clickVisible',
    async function clickVisible(selector, timeout = 1000) {
      await app.client.waitForVisible(selector, timeout);
      await app.client.click(selector);
    }
  );

  app.client.addCommand(
    'setValueVisible',
    async function setValueVisible(selector, value, timeout = 1000) {
      await app.client.waitForVisible(selector, timeout);
      await app.client.setValue(selector, value);
    }
  );

  app.client.addCommand(
    'waitForConnectionScreen',
    async function waitForConnectionScreen() {
      await app.client.waitUntil(
        async () => {
          // Compass starts with two windows (one is loading, another is main)
          // and then one of them is closed. To make sure we are always checking
          // against existing window, we "focus" the first existing one every
          // time we run the check (spectron doesn't do it for you automatically
          // and will fail when certain methods are called on closed windows)
          await app.client.windowByIndex(0);
          return await app.client.waitForVisible(Selectors.ConnectSection);
        },
        MINUTE,
        'Expected connection screen to be visible',
        50
      );
    }
  );

  app.client.addCommand(
    'closePrivacySettingsModal',
    async function closePrivacySettingsModal() {
      if (await app.client.isExisting(Selectors.PrivacySettingsModal)) {
        await app.client.waitUntil(
          async () => {
            return await app.client.isVisible(Selectors.PrivacySettingsModal);
          },
          1000,
          'Expected privacy settings modal to be visible',
          50
        );
        // Wait a bit before clicking so that transition is through
        await delay(100);
        await app.client.clickVisible(Selectors.ClosePrivacySettingsButton);
        await app.client.waitUntil(
          async () => {
            return !(await app.client.isExisting(
              Selectors.PrivacySettingsModal
            ));
          },
          5000,
          'Expected privacy settings modal to disappear after closing it',
          50
        );
      }
    }
  );

  app.client.addCommand('doConnect', async function doConnect(timeout = 10000) {
    await app.client.clickVisible(Selectors.ConnectButton);
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    await app.client.waitForVisible(Selectors.DatabasesTable, timeout);
  });

  app.client.addCommand(
    'connectWithConnectionString',
    async function connectWithConnectionString(
      connectionString,
      timeout = 10000
    ) {
      await app.client.setValueVisible(
        Selectors.ConnectionStringInput,
        connectionString
      );
      await app.client.doConnect(timeout);
    }
  );

  app.client.addCommand(
    'connectWithConnectionForm',
    async function connectWithConnectionForm(
      {
        host,
        port,
        srvRecord,
        username,
        password,
        authenticationMechanism,
        gssapiServiceName,
        replicaSet,
        tlsAllowInvalidHostnames,
        sslValidate,
        tlsCAFile,
        tlsCertificateKeyFile,
        sshTunnelHostname,
        sshTunnelPort,
        sshTunnelUsername,
        sshTunnelPassword,
        sshTunnelIdentityFile
      },
      timeout = 10000
    ) {
      if (await app.client.isVisible(Selectors.ShowConnectionFormButton)) {
        await app.client.click(Selectors.ShowConnectionFormButton);
      }

      await app.client.clickVisible(Selectors.ConnectionFormHostnameTabButton);

      if (typeof host !== 'undefined') {
        await app.client.setValue(Selectors.ConnectionFormInputHostname, host);
      }

      if (typeof port !== 'undefined') {
        await app.client.setValue(Selectors.ConnectionFormInputPort, port);
      }

      if (srvRecord === true) {
        await app.client.clickVisible(Selectors.ConnectionFormInputSrvRecord);
      }

      const authStrategy =
        authenticationMechanism === 'GSSAPI'
          ? 'KERBEROS'
          : authenticationMechanism === 'PLAIN'
          ? 'LDAP'
          : authenticationMechanism === 'MONGODB-X509'
          ? 'X509'
          : username || password
          ? 'MONGODB'
          : 'NONE';

      await app.client.selectByValue(
        Selectors.ConnectionFormInputAuthStrategy,
        authStrategy
      );

      if (typeof username !== 'undefined') {
        // TODO: No point in having different `name`s in UI, they are not used for
        // anything and all those map to `username` in driver options anyway
        if (
          await app.client.isVisible(
            Selectors.ConnectionFormInputKerberosPrincipal
          )
        ) {
          await app.client.setValue(
            Selectors.ConnectionFormInputKerberosPrincipal,
            username
          );
        } else if (
          await app.client.isVisible(Selectors.ConnectionFormInputLDAPUsername)
        ) {
          await app.client.setValue(
            Selectors.ConnectionFormInputLDAPUsername,
            username
          );
        } else {
          await app.client.setValue(
            Selectors.ConnectionFormInputUsername,
            username
          );
        }
      }

      if (typeof password !== 'undefined') {
        // TODO: See above
        if (
          await app.client.isVisible(Selectors.ConnectionFormInputLDAPPassword)
        ) {
          await app.client.setValue(
            Selectors.ConnectionFormInputLDAPPassword,
            password
          );
        } else {
          await app.client.setValue(
            Selectors.ConnectionFormInputPassword,
            password
          );
        }
      }

      if (typeof gssapiServiceName !== 'undefined') {
        await app.client.setValue(
          '[name="kerberos-service-name"]',
          gssapiServiceName
        );
      }

      await app.client.clickVisible('#More_Options');

      if (typeof replicaSet !== 'undefined') {
        await app.client.setValue(
          Selectors.ConnectionFormInputReplicaSet,
          replicaSet
        );
      }

      const sslMethod =
        tlsAllowInvalidHostnames === true || sslValidate === false
          ? 'UNVALIDATED'
          : typeof tlsCAFile !== 'undefined' &&
            typeof tlsCertificateKeyFile !== 'undefined'
          ? 'ALL'
          : typeof tlsCAFile !== 'undefined'
          ? 'SERVER'
          : /mongodb.net$/.test(host)
          ? 'SYSTEMCA'
          : 'NONE';

      await app.client.selectByValue(
        Selectors.ConnectionFormInputSSLMethod,
        sslMethod
      );

      if (['ALL', 'SERVER'].includes(sslMethod)) {
        // TODO: Can be implemented after https://github.com/mongodb-js/compass/pull/2380
        throw new Error("Can't test connections that use SSL");
      }

      const sshTunnel =
        typeof sshTunnelPassword !== 'undefined'
          ? 'USER_PASSWORD'
          : typeof sshTunnelIdentityFile !== 'undefined'
          ? 'IDENTITY_FILE'
          : 'NONE';

      if (sshTunnel === 'IDENTITY_FILE') {
        // TODO: Can be implemented after https://github.com/mongodb-js/compass/pull/2380
        throw new Error(
          "Can't test connections that use identity file authentication for SSH tunnel"
        );
      }

      await app.client.selectByValue(
        Selectors.ConnectionFormInputSSHTunnel,
        sshTunnel
      );

      if (typeof sshTunnelHostname !== 'undefined') {
        await app.client.setValue(
          '[name="sshTunnelHostname"]',
          sshTunnelHostname
        );
      }

      if (typeof sshTunnelPort !== 'undefined') {
        await app.client.setValue('[name="sshTunnelPort"]', sshTunnelPort);
      }

      if (typeof sshTunnelUsername !== 'undefined') {
        await app.client.setValue(
          '[name="sshTunnelUsername"]',
          sshTunnelUsername
        );
      }

      if (typeof sshTunnelPassword !== 'undefined') {
        await app.client.setValue(
          '[name="sshTunnelPassword"]',
          sshTunnelPassword
        );
      }

      await app.client.doConnect(timeout);
    }
  );

  app.client.addCommand('disconnect', async function () {
    // If we are still connecting, let's try cancelling the connection first
    if (await app.client.isVisible(Selectors.CancelConnectionButton)) {
      try {
        await app.client.clickVisible(Selectors.CancelConnectionButton);
        await app.client.waitUntil(async () => {
          return !(await app.client.isExisting(
            Selectors.ConnectionStatusModalContent
          ),
          1000,
          'Expected connection status modal to disappear after cancelling the connection',
          50);
        });
        return;
      } catch (e) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
      }
    }
    app.webContents.send('app:disconnect');
    await app.client.waitForVisible(Selectors.ConnectSection, 5000);
    // Show "new connection" section as if we just opened this screen
    await app.client.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  });

  app.client.addCommand(
    'shellEval',
    async function (str, parse = false, timeout = 10000) {
      if (!(await app.client.isVisible(Selectors.ShellContent))) {
        await app.client.clickVisible(Selectors.ShellExpandButton);
      }
      await app.client.clickVisible(Selectors.ShellInput);
      // Might be marked with a deprecation warning, but can be used
      // https://github.com/webdriverio/webdriverio/issues/2076
      await app.client.keys(parse === true ? `JSON.stringify(${str})` : str);
      await app.client.keys('\uE007');
      await app.client.waitUntil(
        async () => {
          return !(await app.client.isVisible(Selectors.ShellLoader));
        },
        timeout,
        `Expected shell evaluation to finish in ${timeout}ms`,
        50
      );
      await delay(50);
      const output = await app.client.getText(Selectors.ShellOutput);
      let result = Array.isArray(output) ? output.pop() : output;
      if (parse === true) {
        result = JSON.parse(result.replace(/(^['"]|['"]$)/g, ''));
      }
      return result;
    }
  );
}

module.exports = {
  startCompass,
  rebuildNativeModules,
  compileCompassAssets,
  getCompassBuildMetadata,
  getCompassBinPath,
  getAtlasConnectionOptions,
  buildCompass,
  Selectors
};
