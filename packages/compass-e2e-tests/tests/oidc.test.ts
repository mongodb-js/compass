import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  afterTest,
  runCompassOnce,
  serverSatisfies,
} from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import type { Compass } from '../helpers/compass';
import type { OIDCMockProviderConfig } from '@mongodb-js/oidc-mock-provider';
import { OIDCMockProvider } from '@mongodb-js/oidc-mock-provider';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { once, EventEmitter } from 'events';
import { expect } from 'chai';
import type { MongoCluster } from '@mongodb-js/compass-test-server';
import { startTestServer } from '@mongodb-js/compass-test-server';
import ConnectionString from 'mongodb-connection-string-url';

const DEFAULT_TOKEN_PAYLOAD = {
  expires_in: 3600,
  payload: {
    // Define the user information stored inside the access tokens
    groups: ['testgroup'],
    sub: 'testuser',
    aud: 'resource-server-audience-value',
  },
};

const DEFAULT_AUTH_INFO = {
  authenticatedUsers: [{ user: 'dev/testuser', db: '$external' }],
  authenticatedUserRoles: [{ role: 'dev/testgroup', db: 'admin' }],
};

function getTestBrowserShellCommand() {
  return `${process.execPath} ${path.resolve(
    __dirname,
    '..',
    'fixtures',
    'curl.js'
  )}`;
}

describe('OIDC integration', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let originalDisableKeychainUsage: string | undefined;

  let getTokenPayload: typeof oidcMockProviderConfig.getTokenPayload;
  let overrideRequestHandler: typeof oidcMockProviderConfig.overrideRequestHandler;
  let oidcMockProviderConfig: OIDCMockProviderConfig;
  let oidcMockProvider: OIDCMockProvider;
  let oidcMockProviderEndpointAccesses: Record<string, number>;

  let i = 0;
  let tmpdir: string;
  let cluster: MongoCluster;
  let connectionString: string;
  let getFavoriteConnectionInfo: (
    favoriteName: string
  ) => Promise<Record<string, any> | undefined>;

  before(async function () {
    {
      originalDisableKeychainUsage =
        process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
      if (process.platform === 'linux' && process.env.CI) {
        // keytar is not working on Linux in CI, see
        // https://jira.mongodb.org/browse/COMPASS-6119 for more details.
        process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
      }
    }

    if (process.platform !== 'linux') {
      // OIDC is only supported on Linux in the 7.0+ enterprise server.
      return this.skip();
    }

    if (!serverSatisfies('> 7.0.0-alpha0', true)) {
      return this.skip();
    }

    {
      oidcMockProviderEndpointAccesses = {};
      oidcMockProviderConfig = {
        getTokenPayload(metadata: Parameters<typeof getTokenPayload>[0]) {
          return getTokenPayload(metadata);
        },
        overrideRequestHandler(url, req, res) {
          const { pathname } = new URL(url);
          oidcMockProviderEndpointAccesses[pathname] ??= 0;
          oidcMockProviderEndpointAccesses[pathname]++;
          return overrideRequestHandler?.(url, req, res);
        },
      };
      oidcMockProvider = await OIDCMockProvider.create(oidcMockProviderConfig);
    }

    {
      tmpdir = path.join(
        os.tmpdir(),
        `compass-oidc-${Date.now().toString(32)}-${++i}`
      );
      await fs.mkdir(path.join(tmpdir, 'db'), { recursive: true });
    }

    {
      const serverOidcConfig = {
        issuer: oidcMockProvider.issuer,
        clientId: 'testServer',
        requestScopes: ['mongodbGroups'],
        authorizationClaim: 'groups',
        audience: 'resource-server-audience-value',
        authNamePrefix: 'dev',
      };

      cluster = await startTestServer({
        args: [
          '--setParameter',
          'authenticationMechanisms=SCRAM-SHA-256,MONGODB-OIDC',
          // enableTestCommands allows using http:// issuers such as http://localhost
          '--setParameter',
          'enableTestCommands=true',
          '--setParameter',
          `oidcIdentityProviders=${JSON.stringify([serverOidcConfig])}`,
        ],
      });

      const cs = new ConnectionString(cluster.connectionString);
      cs.searchParams.set('authMechanism', 'MONGODB-OIDC');

      connectionString = cs.toString();
    }

    {
      getFavoriteConnectionInfo = async (favoriteName) => {
        const file = path.join(tmpdir, 'file');
        await runCompassOnce([`--export-connections=${file}`]);
        const contents = JSON.parse(await fs.readFile(file, 'utf8'));
        return contents.connections.find(
          (c: any) => c.favorite?.name === favoriteName
        );
      };
    }
  });

  beforeEach(async function () {
    oidcMockProviderEndpointAccesses = {};
    getTokenPayload = () => DEFAULT_TOKEN_PAYLOAD;
    overrideRequestHandler = () => {};
    compass = await beforeTests();
    browser = compass.browser;
    await browser.setFeature(
      'browserCommandForOIDCAuth',
      getTestBrowserShellCommand()
    );
  });

  afterEach(async function () {
    await browser.setFeature('browserCommandForOIDCAuth', undefined);
    await browser.setFeature('persistOIDCTokens', undefined);
    await browser.setFeature('enableShell', true);
    await afterTest(compass, this.currentTest);
    await afterTests(compass, this.currentTest);
  });

  after(async function () {
    await cluster?.close();
    await oidcMockProvider?.close();
    if (tmpdir) await fs.rmdir(tmpdir, { recursive: true });

    if (originalDisableKeychainUsage)
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE =
        originalDisableKeychainUsage;
    else delete process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
  });

  it('can successfully connect with a connection string', async function () {
    let tokenFetchCalls = 0;
    getTokenPayload = () => {
      tokenFetchCalls++;
      return DEFAULT_TOKEN_PAYLOAD;
    };
    await browser.connectWithConnectionString(connectionString);
    const result: any = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 }).authInfo',
      true
    );

    expect(tokenFetchCalls).to.equal(1); // No separate request from the shell
    expect(result).to.deep.equal(DEFAULT_AUTH_INFO);
  });

  it('can cancel a connection attempt and then successfully connect', async function () {
    const emitter = new EventEmitter();
    const secondConnectionEstablished = once(
      emitter,
      'secondConnectionEstablished'
    );
    overrideRequestHandler = async (url) => {
      if (new URL(url).pathname === '/authorize') {
        emitter.emit('authorizeEndpointCalled');
        // This does effectively mean that our 'fake browser'
        // will never get a response from the authorization endpoint
        // during the first connection attempt, and that therefore
        // the local HTTP server will never have its redirect endpoint
        // accessed.
        await secondConnectionEstablished;
      }
    };

    {
      await browser.setValueVisible(
        Selectors.ConnectionStringInput,
        connectionString
      );
      await browser.clickVisible(Selectors.ConnectButton);
      await once(emitter, 'authorizeEndpointCalled');
      await browser.closeConnectModal();
    }

    overrideRequestHandler = () => {};
    await browser.connectWithConnectionString(connectionString);
    emitter.emit('secondConnectionEstablished');
    const result: any = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 }).authInfo',
      true
    );

    expect(result).to.deep.equal(DEFAULT_AUTH_INFO);
  });

  it('can successfully connect with the connection form', async function () {
    let tokenFetchCalls = 0;
    getTokenPayload = () => {
      tokenFetchCalls++;
      return DEFAULT_TOKEN_PAYLOAD;
    };

    await browser.connectWithConnectionForm({
      hosts: [cluster.hostport],
      authMethod: 'MONGODB-OIDC',
    });

    const result: any = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 }).authInfo',
      true
    );

    expect(tokenFetchCalls).to.equal(1); // No separate request from the shell.
    expect(result).to.deep.equal(DEFAULT_AUTH_INFO);
  });

  it('can successfully re-authenticate', async function () {
    let afterReauth = false;
    getTokenPayload = () => {
      return {
        ...DEFAULT_TOKEN_PAYLOAD,
        ...(afterReauth ? {} : { expires_in: 10 }),
      };
    };

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await browser.clickVisible(Selectors.ConnectButton);

    const modal = '[role=dialog]';
    const confirmButton = 'button:nth-of-type(1)';
    await browser.waitUntil(async () => {
      const modalHeader = await browser.$(`${modal} h1`);
      return (await modalHeader.getText()).includes('Authentication expired');
    });

    afterReauth = true;
    await browser.clickVisible(`${modal} ${confirmButton}`);
    const result: any = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 }).authInfo',
      true
    );
    expect(result).to.deep.equal(DEFAULT_AUTH_INFO);
  });

  it('can decline re-authentication if wanted', async function () {
    let afterReauth = false;
    getTokenPayload = () => {
      return {
        ...DEFAULT_TOKEN_PAYLOAD,
        ...(afterReauth ? {} : { expires_in: 10 }),
      };
    };

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await browser.clickVisible(Selectors.ConnectButton);

    const modal = '[role=dialog]';
    const cancelButton = 'button:nth-of-type(2)';
    await browser.waitUntil(async () => {
      const modalHeader = await browser.$(`${modal} h1`);
      return (await modalHeader.getText()).includes('Authentication expired');
    });

    afterReauth = true;
    await browser.clickVisible(`${modal} ${cancelButton}`);
    const errorBanner = await browser.$(
      '[data-testid="toast-instance-refresh-failed"]'
    );
    await errorBanner.waitForDisplayed();
    expect(await errorBanner.getText()).to.include(
      'Reauthentication declined by user'
    );
  });

  it('saves tokens across connections for favorites if asked to do so', async function () {
    await browser.setFeature('persistOIDCTokens', true);
    await browser.setFeature('enableShell', false); // TODO(COMPASS-6897)

    const favoriteName = await browser.saveConnectionStringAsFavorite(
      connectionString
    );

    await browser.selectFavorite(favoriteName);
    await browser.doConnect();
    await browser.disconnect();

    await browser.selectFavorite(favoriteName);
    await browser.doConnect();
    await browser.disconnect();

    const connectionInfo = await getFavoriteConnectionInfo(favoriteName);
    expect(connectionInfo?.connectionOptions?.oidc?.serializedState).to.be.a(
      'string'
    );
    expect(oidcMockProviderEndpointAccesses['/authorize']).to.equal(1);
  });

  it('does not save tokens across connections for favorites if asked to do so', async function () {
    await browser.setFeature('persistOIDCTokens', false);
    await browser.setFeature('enableShell', false); // TODO(COMPASS-6897)

    const favoriteName = await browser.saveConnectionStringAsFavorite(
      connectionString
    );

    await browser.selectFavorite(favoriteName);
    await browser.doConnect();
    await browser.disconnect();

    await browser.selectFavorite(favoriteName);
    await browser.doConnect();
    await browser.disconnect();

    const connectionInfo = await getFavoriteConnectionInfo(favoriteName);
    expect(connectionInfo?.connectionOptions?.oidc?.serializedState).to.equal(
      undefined
    );
    expect(oidcMockProviderEndpointAccesses['/authorize']).to.equal(2);
  });

  it('saves tokens across Compass sessions for favorites if asked to do so', async function () {
    await browser.setFeature('persistOIDCTokens', true);
    await browser.setFeature('enableShell', false); // TODO(COMPASS-6897)

    const favoriteName = await browser.saveConnectionStringAsFavorite(
      connectionString
    );

    await browser.selectFavorite(favoriteName);
    await browser.doConnect();
    await browser.disconnect();

    const connectionInfo = await getFavoriteConnectionInfo(favoriteName);
    expect(connectionInfo?.connectionOptions?.oidc?.serializedState).to.be.a(
      'string'
    );

    {
      // Restart Compass
      await afterTest(compass);
      await afterTests(compass);
      compass = await beforeTests();
      browser = compass.browser;
    }

    await browser.selectFavorite(favoriteName);
    await browser.doConnect();
    await browser.disconnect();

    expect(oidcMockProviderEndpointAccesses['/authorize']).to.equal(1);
  });
});
