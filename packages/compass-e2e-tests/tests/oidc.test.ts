import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  runCompassOnce,
  serverSatisfies,
  skipForWeb,
  TEST_COMPASS_WEB,
  connectionNameFromString,
  TEST_MULTIPLE_CONNECTIONS,
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

/**
 * @securityTest OIDC Authentication End-to-End Tests
 *
 * In addition to our regular tests for the different authentication mechanisms supported
 * by MongoDB, we give special consideration to our OpenID Connect database authentication
 * feature, as it involves client applications performing actions based on directions
 * received from the database server.
 *
 * Additionally, we verify that Compass stores credentials in a way that is consistent with
 * what the user has previously specified.
 */
describe.only('OIDC integration', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let getTokenPayload: typeof oidcMockProviderConfig.getTokenPayload;
  let overrideRequestHandler: typeof oidcMockProviderConfig.overrideRequestHandler;
  let oidcMockProviderConfig: OIDCMockProviderConfig;
  let oidcMockProvider: OIDCMockProvider;
  let oidcMockProviderEndpointAccesses: Record<string, number>;
  let hostport: string;

  let i = 0;
  let tmpdir: string;
  let cluster: MongoCluster;
  let connectionString: string;
  let connectionName: string;
  let getFavoriteConnectionInfo: (
    favoriteName: string
  ) => Promise<Record<string, any> | undefined>;

  let isFirstRun = true;

  before(async function () {
    skipForWeb(this, 'feature flags not yet available in compass-web');

    // OIDC is only supported on Linux in the 7.0+ enterprise server.
    // Test locally by setting OIDC_MOCK_HOSTNAME, OIDC_MOCK_PORT and OIDC_CONNECTION_STRING
    if (
      (process.platform !== 'linux' ||
        !serverSatisfies('> 7.0.0-alpha0', true)) &&
      !process.env.OIDC_CONNECTION_STRING
    ) {
      return this.skip();
    }

    // TODO(COMPASS-7966): Enable OIDC tests on 8.0.x when server fix is backported.
    if (serverSatisfies('>= 8.0.0-alpha0 <8.1.0-rc0')) {
      return this.skip();
    }

    {
      oidcMockProviderEndpointAccesses = {};
      oidcMockProviderConfig = {
        hostname: process.env.OIDC_MOCK_HOSTNAME ?? undefined,
        port: process.env.OIDC_MOCK_PORT
          ? parseInt(process.env.OIDC_MOCK_PORT, 10)
          : undefined,
        bindIpAll: process.env.OIDC_BIND_IP_ALL === 'true',
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

      // so we can be sure we're passing the correct one if starting mongodb manually
      console.log('OIDC Mock Provider Issuer', oidcMockProvider.issuer);
    }

    {
      tmpdir = path.join(
        os.tmpdir(),
        `compass-oidc-${Date.now().toString(32)}-${++i}`
      );
      await fs.mkdir(path.join(tmpdir, 'db'), { recursive: true });
    }

    let clusterConnectionString: string;

    {
      if (process.env.OIDC_CONNECTION_STRING) {
        clusterConnectionString = process.env.OIDC_CONNECTION_STRING;

        const cs = new ConnectionString(clusterConnectionString);
        hostport = cs.hosts[0];
      } else {
        const serverOidcConfig = {
          issuer: oidcMockProvider.issuer,
          clientId: 'testServer',
          requestScopes: ['mongodbGroups'],
          authorizationClaim: 'groups',
          audience: 'resource-server-audience-value',
          authNamePrefix: 'dev',
        };

        const args = [
          '--setParameter',
          'authenticationMechanisms=SCRAM-SHA-256,MONGODB-OIDC',
          // enableTestCommands allows using http:// issuers such as http://localhost
          '--setParameter',
          'enableTestCommands=true',
          '--setParameter',
          `oidcIdentityProviders=${JSON.stringify([serverOidcConfig])}`,
        ];

        if (serverSatisfies('>= 8.1.0-rc0', true)) {
          // Disable quiescing of JWKSet fetches to match the pre-8.0 behavior.
          args.push('--setParameter', 'JWKSMinimumQuiescePeriodSecs=0');
        }

        cluster = await startTestServer({ args });
        clusterConnectionString = cluster.connectionString;
        hostport = cluster.hostport;
      }

      const cs = new ConnectionString(clusterConnectionString);
      cs.searchParams.set('authMechanism', 'MONGODB-OIDC');

      connectionString = cs.toString();

      connectionName = connectionNameFromString(connectionString);
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
    getTokenPayload = () => {
      return DEFAULT_TOKEN_PAYLOAD;
    };
    overrideRequestHandler = () => {};
    compass = await init(this.test?.fullTitle(), { firstRun: isFirstRun });
    isFirstRun = false;
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
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cluster?.close();
    await oidcMockProvider?.close();
    if (tmpdir) await fs.rmdir(tmpdir, { recursive: true });
  });

  it('can successfully connect with a connection string', async function () {
    let tokenFetchCalls = 0;
    getTokenPayload = () => {
      tokenFetchCalls++;
      return DEFAULT_TOKEN_PAYLOAD;
    };
    await browser.connectWithConnectionString(connectionString);
    const result: any = await browser.shellEval(
      connectionName,
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

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.removeConnection(connectionName);
      await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
      await browser.$(Selectors.ConnectionModal).waitForDisplayed();
    }
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    await browser.clickVisible(Selectors.ConnectButton);
    await once(emitter, 'authorizeEndpointCalled');

    await browser.closeConnectModal();

    overrideRequestHandler = () => {};
    await browser.connectWithConnectionString(connectionString);
    emitter.emit('secondConnectionEstablished');
    const result: any = await browser.shellEval(
      connectionName,
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
      hosts: [hostport],
      authMethod: 'MONGODB-OIDC',
      connectionName,
    });

    const result: any = await browser.shellEval(
      connectionName,
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
        // make the token expire in less than a minute so it have time to be refreshed
        ...(afterReauth ? {} : { expires_in: 10 }),
      };
    };

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.removeConnection(connectionName);
      await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
      await browser.$(Selectors.ConnectionModal).waitForDisplayed();
    }
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );
    await browser.clickVisible(Selectors.ConnectButton);

    // wait for the token to expire (see expires_in above)
    await browser.pause(10_000);

    if (TEST_MULTIPLE_CONNECTIONS) {
      // we have to browse somewhere that will fire off commands that require
      // authentication so that those commands get rejected due to the expired
      // auth and then that will trigger the confirmation modal we expect.
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.OpenShellItem,
        false
      );
    }

    await browser.$(Selectors.ConfirmationModal).waitForDisplayed();
    const modalHeader = await browser.$(Selectors.ConfirmationModalHeading);
    expect(await modalHeader.getText()).to.include('Authentication expired');

    afterReauth = true;
    await browser.clickVisible(Selectors.confirmationModalConfirmButton());
    const result: any = await browser.shellEval(
      connectionName,
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
        // make the token expire in less than a minute so it have time to be refreshed
        ...(afterReauth ? {} : { expires_in: 10 }),
      };
    };

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.removeConnection(connectionName);
      await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
      await browser.$(Selectors.ConnectionModal).waitForDisplayed();
    }
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );
    await browser.clickVisible(Selectors.ConnectButton);

    // wait for the token to expire (see expires_in above)
    await browser.pause(10_000);

    if (TEST_MULTIPLE_CONNECTIONS) {
      // we have to browse somewhere that will fire off commands that require
      // authentication so that those commands get rejected due to the expired
      // auth and then that will trigger the confirmation modal we expect
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.OpenShellItem,
        false
      );
    }

    await browser.$(Selectors.ConfirmationModal).waitForDisplayed();
    const modalHeader = await browser.$(Selectors.ConfirmationModalHeading);
    expect(await modalHeader.getText()).to.include('Authentication expired');

    afterReauth = true;
    await browser.clickVisible(Selectors.confirmationModalCancelButton());
    const errorBanner = await browser.$(
      '[data-testid="toast-oidc-auth-failed"]'
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

    await browser.selectConnection(favoriteName);
    await browser.doConnect(favoriteName);
    await browser.disconnectAll();

    await browser.selectConnection(favoriteName);
    await browser.doConnect(favoriteName);
    await browser.disconnectAll();

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

    await browser.screenshot(`after-creating-favourite-${favoriteName}.png`);

    await browser.selectConnection(favoriteName);
    await browser.doConnect(favoriteName);
    await browser.disconnectAll();

    await browser.screenshot(
      `after-disconnecting-favourite-${favoriteName}.png`
    );

    // TODO(COMPASS-7810): when clicking on the favourite the element is somehow stale and then webdriverio throws
    await browser.selectConnection(favoriteName);
    await browser.doConnect(favoriteName);
    await browser.disconnectAll();

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

    await browser.selectConnection(favoriteName);
    await browser.doConnect(favoriteName);
    await browser.disconnectAll();

    const connectionInfo = await getFavoriteConnectionInfo(favoriteName);
    expect(connectionInfo?.connectionOptions?.oidc?.serializedState).to.be.a(
      'string'
    );

    {
      // Restart Compass
      await cleanup(compass);
      compass = await init(this.test?.fullTitle(), { firstRun: false });
      browser = compass.browser;
    }

    await browser.selectConnection(favoriteName);
    await browser.doConnect(favoriteName);
    await browser.disconnectAll();

    expect(oidcMockProviderEndpointAccesses['/authorize']).to.equal(1);
  });
});
