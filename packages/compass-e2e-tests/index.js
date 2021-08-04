const path = require('path');
const { promisify, inspect } = require('util');
const { Application } = require('spectron');
const { expect } = require('chai');
const { execFile } = require('child_process');
const testEnvs = require('@mongodb-js/devtools-docker-test-envs');

const execFileAsync = promisify(execFile);

// TODO: Need to make sure compass build is created before running any of those

const THREE_MINS = 1000 * 60 * 3;

// TODO: Provide helpful data-test-ids instead of some (most) of those selectors
// instead of unstable class^= ones
const Selector = {
  LoadingStatus: '[class^=LoadingPlugin_loading-loading-status]',

  AppContainer: 'div#application',

  CloseTourButton: 'button.tour-close-button',

  SidebarNewConnectionButton:
    '[class^=ConnectPlugin_sidebar-connect-sidebar-header]',

  PrivacySettingsModal: '[data-test-id="privacy-settings-modal"]',
  ClosePrivacySettingsButton:
    'button[data-test-id=close-privacy-settings-button]',

  ConnectSection: '[class^=ConnectPlugin_connect-page]',
  ConnectionStringInput: 'input[name="connectionString"]',
  ConnectButton: 'button[name="connect"]',
  CancelConnectionButton: '[class^=ConnectPlugin_connecting-modal-cancel-btn]',

  DatabasesAndCollectionsSection: '[class^=DatabasesAndCollectionsPlugin]',

  ShellExpandButton:
    '[class^=CompassShellPlugin_shell-header-compass-shell-header-toggle]',
  ShellExpandedContainer:
    '[class*="CompassShellPlugin_compass-shell-compass-shell-shell-container-visible"]',
  ShellInput: '[class^=CompassShellPlugin] .ace_content',
  ShellLoader:
    '[class^=CompassShellPlugin] [class^=mongosh-shell-loader-shell-loader]',
  ShellOutput: '[class^=CompassShellPlugin] pre'
};

function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const app = new Application({
  // TODO: This needs to be dynamic based on the platform and actual build
  // location
  path:
    process.env.COMPASS_APP_PATH ||
    path.join(
      __dirname,
      '..',
      'compass',
      'dist',
      'MongoDB Compass Dev-darwin-x64',
      'MongoDB Compass Dev.app',
      'Contents',
      'MacOS',
      'MongoDB Compass Dev'
    )
});

async function startCompass() {
  await app.start();
  await app.client.waitUntil(
    async () => {
      // Compass starts with two windows (one is loading, another is main) and
      // then one of them is closed. To make sure we are always checking
      // against existing window, we "focus" the first existing one every time
      // we run the check (spectron doesn't do it for you automatically and
      // will fail when certain methods are called on closed windows)
      await app.client.windowByIndex(0);
      return await app.client.waitForVisible(Selector.ConnectSection);
    },
    THREE_MINS,
    'Expected all plugins to load and main window to be visible',
    100
  );
  // Need to somehow wait for the fade in of the modal to happen consistently,
  // otherwise clicking this button is flaky
  await delay(300);
  // Close privacy settings modal if visible
  if (await app.client.isVisible(Selector.PrivacySettingsModal)) {
    await click(Selector.ClosePrivacySettingsButton);
    await app.client.waitUntil(
      async () => {
        return !(await app.client.isVisible(Selector.PrivacySettingsModal));
      },
      1000,
      'Privacy settings modal is still visible after trying to close it',
      100
    );
    await delay(100);
  }
}

async function click(selector, timeout = 1000) {
  await app.client.waitForVisible(selector, timeout);
  await app.client.click(selector);
}

async function startDockerCompose(dockerComposePath, envConfig) {
  await execFileAsync(
    'docker',
    ['compose', '-f', dockerComposePath, 'up', '-d'],
    { env: { ...process.env, ...envConfig } }
  );

  return async () => {
    await execFileAsync(
      'docker',
      ['compose', '-f', dockerComposePath, 'down', '-v'],
      { env: process.env, ...envConfig }
    );
  };
}

async function inputConnectionString(str, timeout = 1000) {
  await app.client.waitForVisible(Selector.ConnectionStringInput, timeout);
  await app.client.setValue(Selector.ConnectionStringInput, str);
}

async function connect(timeout = 10000) {
  await click(Selector.ConnectButton);
  // Good enough indicator that we are connected
  await app.client.waitForVisible(
    Selector.DatabasesAndCollectionsSection,
    timeout
  );
}

async function connectWithString(str) {
  await click(Selector.SidebarNewConnectionButton);
  await inputConnectionString(str);
  await connect();
}

async function connectWithConnectionForm({
  host,
  port,
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
}) {
  if (await app.client.isVisible('[data-test-id="form-view-link"]')) {
    await app.client.click('[data-test-id="form-view-link"]');
  }

  await app.client.click('#Hostname');

  if (typeof host !== 'undefined') {
    await app.client.setValue('[name="hostname"]', host);
  }

  if (typeof port !== 'undefined') {
    await app.client.setValue('[name="port"]', port);
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

  await app.client.selectByValue('[name="authStrategy"]', authStrategy);

  if (typeof username !== 'undefined') {
    // TODO: No point in having different `name`s in UI, they are not used for
    // anything and all those map to `username` in driver options anyway
    if (await app.client.isVisible('[name="kerberos-principal"]')) {
      await app.client.setValue('[name="kerberos-principal"]', username);
    } else if (await app.client.isVisible('[name="ldap-username"]')) {
      await app.client.setValue('[name="ldap-username"]', username);
    } else {
      await app.client.setValue('[name="username"]', username);
    }
  }

  if (typeof password !== 'undefined') {
    // TODO: See above
    if (await app.client.isVisible('[name="ldap-password"]')) {
      await app.client.setValue('[name="ldap-password"]', password);
    } else {
      await app.client.setValue('[name="password"]', password);
    }
  }

  if (typeof gssapiServiceName !== 'undefined') {
    await app.client.setValue(
      '[name="kerberos-service-name"]',
      gssapiServiceName
    );
  }

  await app.client.click('#More_Options');

  if (typeof replicaSet !== 'undefined') {
    await app.client.setValue('[name="replicaSet"]', replicaSet);
  }

  const sslMethod =
    tlsAllowInvalidHostnames === true || sslValidate === false
      ? 'UNVALIDATED'
      : typeof tlsCAFile !== 'undefined' &&
        typeof tlsCertificateKeyFile !== 'undefined'
      ? 'ALL'
      : typeof tlsCAFile !== 'undefined'
      ? 'SERVER'
      : 'NONE';

  await app.client.selectByValue('[name="sslMethod"]', sslMethod);

  if (!['NONE'].includes(sslMethod)) {
    // TODO: Well, heck me, this form does not use a file input, so we can't
    // really programmatically do anything
    throw new Error("Can't test connections that use SSL");
  }

  const sshTunnel =
    typeof sshTunnelPassword !== 'undefined'
      ? 'USER_PASSWORD'
      : typeof sshTunnelIdentityFile !== 'undefined'
      ? 'IDENTITY_FILE'
      : 'NONE';

  if (sshTunnel === 'IDENTITY_FILE') {
    // TODO: See above
    throw new Error(
      "Can't test connections that use identity file authentication for SSH tunnel"
    );
  }

  await app.client.selectByValue('[name="sshTunnel"]', sshTunnel);

  if (typeof sshTunnelHostname !== 'undefined') {
    await app.client.setValue('[name="sshTunnelHostname"]', sshTunnelHostname);
  }

  if (typeof sshTunnelPort !== 'undefined') {
    await app.client.setValue('[name="sshTunnelPort"]', sshTunnelPort);
  }

  if (typeof sshTunnelUsername !== 'undefined') {
    await app.client.setValue('[name="sshTunnelUsername"]', sshTunnelUsername);
  }

  if (typeof sshTunnelPassword !== 'undefined') {
    await app.client.setValue('[name="sshTunnelPassword"]', sshTunnelPassword);
  }

  await connect();
}

async function disconnect() {
  if (await app.client.isVisible(Selector.CancelConnectionButton)) {
    try {
      await click(Selector.CancelConnectionButton);
    } catch (e) {
      // Maybe it disappeared already
    }
  } else {
    app.webContents.send('app:disconnect');
  }
  await app.client.waitForVisible(Selector.ConnectSection, 5000);
  await click(Selector.SidebarNewConnectionButton);
}

async function openShell() {
  if (await app.client.isExisting(Selector.ShellExpandedContainer)) {
    return;
  }
  await click(Selector.ShellExpandButton);
}

async function evalShell(str, timeout = 3000) {
  await openShell();
  await click(Selector.ShellInput);
  // Might print a warning but is still okay to use
  // https://github.com/webdriverio/webdriverio/issues/2076
  await app.client.keys(str);
  await app.client.keys('\uE007');
  await app.client.waitUntil(
    async () => {
      return !(await app.client.isVisible(Selector.ShellLoader));
    },
    timeout,
    `Expected shell evaluation to finish in ${timeout}ms`,
    50
  );
  await delay(50);
  return (await app.client.getText(Selector.ShellOutput)).pop();
}

const connectionTests = [
  'community',
  'enterprise',
  // TODO: god only knows if this is possible in CI with all the manual steps
  // required
  // 'kerberos',
  'ldap',
  // TODO: this requires adding stuff to /etc/hosts so skipping for now
  // 'replica_set',
  'scram',
  'sharded',
  'ssh',
  'tls'
];

describe('Compass', function () {
  let stop;

  this.timeout(THREE_MINS);

  before(async () => {
    // Start compass and all servers in parallel so we don't waste time starting
    // them during test runs
    [, ...stop] = await Promise.all([
      startCompass()
      // TODO: Trying to start them all at the same time fails due do some
      // containers using the same resources?
      // ...connectionTests.map((name) => {
      //   if (testEnvs[name] && testEnvs[name].config) {
      //     return startDockerCompose(testEnvs[name].config);
      //   }
      //   return () => {
      //     /* noop */
      //   };
      // })
    ]);
  });

  after(async () => {
    if (Array.isArray(stop)) {
      await Promise.all(stop.map((fn) => fn()));
    }
    await app.stop();
  });

  describe('connection', () => {
    afterEach(async () => {
      await disconnect();
    });

    const allConnectionOptions = connectionTests
      .map((name) => {
        if (testEnvs[name] && testEnvs[name].connectionOptions) {
          return testEnvs[name].connectionOptions.map((opts) => ({
            dockerComposePath: testEnvs[name].config,
            ...opts
          }));
        }
        return null;
      })
      .filter(Boolean)
      .flat();

    allConnectionOptions.forEach(({ dockerComposePath, ...options }) => {
      const prettyOneLineOptions = inspect(options, {
        breakLength: Infinity,
        maxStringLength: 15
      });

      describe(`with options ${prettyOneLineOptions}`, () => {
        let stop;

        before(async () => {
          if (dockerComposePath) {
            stop = await startDockerCompose(dockerComposePath);
          }
        });

        after(async () => {
          if (stop) {
            await stop();
            stop = null;
          }
        });

        it('can successfully connect', async () => {
          await connectWithConnectionForm(options);
          // TODO: This can be something a bit more thorough
          const result = await evalShell(
            'db.runCommand({ connectionStatus: 1 })'
          );
          expect(result).to.match(/ok: 1/);
        });
      });
    });
  });
});
