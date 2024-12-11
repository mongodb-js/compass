import path from 'path';
import { expect } from 'chai';
import clipboard from 'clipboardy';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import type { ConnectFormState } from '../helpers/connect-form-state';
import { context } from '../helpers/test-runner-context';

const DEFAULT_FLE_ENCRYPTED_FIELDS_MAP =
  "{\n/**\n * // Client-side encrypted fields map configuration:\n * 'database.collection': {\n *   fields: [\n *     {\n *       keyId: UUID(\"...\"),\n *       path: '...',\n *       bsonType: '...',\n *       queries: [{ queryType: 'equality' }]\n *     }\n *   ]\n * }\n */\n}\n";

describe('Connection form', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(
      this,
      'connection form is not used meaningfully outside of the local dev sandbox environment'
    );

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
  });

  beforeEach(async function () {
    await browser.resetConnectForm();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('starts with the expected initial state', async function () {
    const state = await browser.getConnectFormState(true);
    const expectedState: ConnectFormState = {
      connectionString: 'mongodb://localhost:27017',
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    expect(state).to.deep.equal(expectedState);
  });

  it('parses and formats a URI for direct connection', async function () {
    const connectionString = 'mongodb://localhost:27017/?directConnection=true';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: true,
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for multiple hosts', async function () {
    const connectionString = 'mongodb://localhost:27017,127.0.0.1:27091/';
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017', '127.0.0.1:27091'],
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017,127.0.0.1:27091',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for mongodb+srv scheme', async function () {
    const connectionString = 'mongodb+srv://localhost/';
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB_SRV',
      hosts: ['localhost'],
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for username/password authentication', async function () {
    const connectionString =
      'mongodb://foo:bar@localhost:27017/?authSource=source&authMechanism=SCRAM-SHA-1';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'DEFAULT',
      defaultUsername: 'foo',
      defaultPassword: 'bar',
      defaultAuthSource: 'source',
      defaultAuthMechanism: 'SCRAM-SHA-1',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState(true);
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      connectionString
    );
  });

  it('parses and formats a URI for X.509 authentication', async function () {
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures');
    const tlsCAFile = path.join(fixturesPath, 'ca.pem');
    const tlsCertificateKeyFile = path.join(fixturesPath, 'client.pem');
    const connectionString = `mongodb://localhost:27017/?authMechanism=MONGODB-X509&authSource=%24external&tls=true&tlsCAFile=${encodeURIComponent(
      tlsCAFile
    )}&tlsCertificateKeyFile=${encodeURIComponent(
      tlsCertificateKeyFile
    )}&tlsCertificateKeyFilePassword=password&tlsInsecure=true&tlsAllowInvalidHostnames=true&tlsAllowInvalidCertificates=true`;

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'MONGODB-X509',
      proxyMethod: 'none',
      sslConnection: 'ON',
      tlsCAFile: 'ca.pem',
      tlsCertificateKeyFile: 'client.pem',
      clientKeyPassword: 'password',
      tlsInsecure: true,
      tlsAllowInvalidHostnames: true,
      tlsAllowInvalidCertificates: true,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const state = await browser.getConnectFormState(true);
    expect(state).to.deep.equal(expectedState);

    expectedState.tlsCAFile = tlsCAFile;
    expectedState.tlsCertificateKeyFile = tlsCertificateKeyFile;

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      connectionString
    );
  });

  it('parses and formats a URI for Kerberos authentication', async function () {
    const connectionString =
      'mongodb://principal@localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_NAME%3Aservice+name%2CCANONICALIZE_HOST_NAME%3Aforward%2CSERVICE_REALM%3Aservice+realm';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'GSSAPI',
      kerberosPrincipal: 'principal',
      kerberosServiceName: 'service name',
      kerberosCanonicalizeHostname: 'forward',
      kerberosServiceRealm: 'service realm',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for LDAP authentication', async function () {
    const connectionString =
      'mongodb://username:password@localhost:27017/?authMechanism=PLAIN&authSource=%24external';
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'PLAIN',
      ldapUsername: 'username',
      ldapPassword: 'password',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState(true);
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      connectionString
    );
  });

  it('parses and formats a URI for AWS IAM authentication', async function () {
    const connectionString =
      'mongodb://id:key@localhost:27017/?authMechanism=MONGODB-AWS&authSource=%24external&authMechanismProperties=AWS_SESSION_TOKEN%3Atoken';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'MONGODB-AWS',
      awsAccessKeyId: 'id',
      awsSecretAccessKey: 'key',
      awsSessionToken: 'token',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState(true);
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      connectionString
    );
  });

  it('parses and formats a URI for Socks5 authentication', async function () {
    const connectionString =
      'mongodb://localhost:27017/?proxyHost=hostname&proxyPort=1234&proxyUsername=username&proxyPassword=password';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'socks',
      socksHost: 'hostname',
      socksPort: '1234',
      socksUsername: 'username',
      socksPassword: 'password',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState(true);
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      connectionString
    );
  });

  it('parses and formats a URI with advanced options', async function () {
    const connectionString =
      'mongodb://localhost:27017/default-db?readPreference=primary&replicaSet=replica-set&connectTimeoutMS=1234&maxPoolSize=100';
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'primary',
      replicaSet: 'replica-set',
      defaultDatabase: 'default-db',
      urlOptions: {
        connectTimeoutMS: '1234',
        maxPoolSize: '100',
      },
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('does not update the URI for SSH tunnel with password authentication', async function () {
    const state: ConnectFormState = {
      proxyMethod: 'password',
      sshPasswordHost: 'host',
      sshPasswordPort: '1234',
      sshPasswordUsername: 'username',
      sshPasswordPassword: 'password',
    };
    await browser.setConnectFormState(state);

    const expectedState: ConnectFormState = {
      authMethod: 'DEFAULT',
      connectionString: 'mongodb://localhost:27017/',
      defaultAuthMechanism: 'DEFAULT',
      directConnection: false,
      hosts: ['localhost:27017'],
      proxyMethod: 'password',
      scheme: 'MONGODB',
      sshPasswordHost: 'host',
      sshPasswordPassword: 'password',
      sshPasswordPort: '1234',
      sshPasswordUsername: 'username',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    expect(await browser.getConnectFormState()).to.deep.equal(expectedState);
  });

  it('does not update the URI for SSH tunnel with identity file authentication', async function () {
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures');
    // reuse the .pem file from above. contents doesn't matter.
    const sshIdentityKeyFile = path.join(fixturesPath, 'client.pem');

    const state: ConnectFormState = {
      proxyMethod: 'identity',
      sshIdentityHost: 'host',
      sshIdentityPort: '1234',
      sshIdentityUsername: 'username',
      sshIdentityKeyFile: sshIdentityKeyFile,
      sshIdentityPassword: 'password',
    };

    await browser.setConnectFormState(state);

    const expectedState: ConnectFormState = {
      authMethod: 'DEFAULT',
      connectionString: 'mongodb://localhost:27017/',
      defaultAuthMechanism: 'DEFAULT',
      directConnection: false,
      hosts: ['localhost:27017'],
      proxyMethod: 'identity',
      sshIdentityHost: 'host',
      sshIdentityKeyFile: 'client.pem',
      sshIdentityPassword: 'password',
      sshIdentityPort: '1234',
      sshIdentityUsername: 'username',
      scheme: 'MONGODB',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    expect(await browser.getConnectFormState()).to.deep.equal(expectedState);
  });

  it('redacts passwords when input is not focused', async function () {
    const connectionString =
      'mongodb://foo:user_password@localhost:27017/?proxyHost=hostname&proxyPort=1234&proxyUsername=username&proxyPassword=proxy_password';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const redactedConnectionString = connectionString
      .replace('user_password', '*****')
      .replace('proxy_password', '*****');

    const expectedState: ConnectFormState = {
      connectionString: redactedConnectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      defaultUsername: 'foo',
      defaultPassword: 'user_password',
      authMethod: 'DEFAULT',
      defaultAuthMechanism: 'DEFAULT',
      proxyMethod: 'socks',
      socksHost: 'hostname',
      socksPort: '1234',
      socksUsername: 'username',
      socksPassword: 'proxy_password',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState(false);
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(false)).to.equal(
      redactedConnectionString
    );
  });

  it('can save a connection as a favorite and manage it', async function () {
    const favoriteName = 'My Favorite';
    const newFavoriteName = 'My Favorite (edited)';

    const Sidebar = Selectors.Multiple;

    // save
    await browser.saveFavorite(favoriteName, 'Green');

    if (!context.disableClipboardUsage) {
      // copy the connection string
      await browser.selectConnectionMenuItem(
        favoriteName,
        Sidebar.CopyConnectionStringItem
      );
      await browser.waitUntil(
        async () => {
          return /^mongodb:\/\/localhost:27017\/?$/.test(
            await clipboard.read()
          );
        },
        { timeoutMsg: 'Expected copy to clipboard to work' }
      );
    }

    // duplicate
    await browser.selectConnectionMenuItem(
      favoriteName,
      Sidebar.DuplicateConnectionItem
    );

    // duplicating opens the modal, in multiple connections you have to save
    await browser.clickVisible(Selectors.ConnectionModalSaveButton);

    // delete the duplicate
    await browser.selectConnectionMenuItem(
      `${favoriteName} (1)`,
      Sidebar.RemoveConnectionItem
    );

    // edit the original
    await browser.selectConnection(favoriteName);

    await browser.saveFavorite(newFavoriteName, 'Pink');

    // it should now be updated in the sidebar
    await browser
      .$(Selectors.sidebarConnection(newFavoriteName))
      .waitForDisplayed();

    // open the modal so we can perform some actions in there
    await browser.selectConnection(newFavoriteName);

    // the edit the connection string toggle should be on (because this is a new connection we just saved)
    const toggle = browser.$(Selectors.EditConnectionStringToggle);
    expect(await toggle.getAttribute('aria-checked')).to.equal('true');

    // toggle the edit connection string toggle twice
    await browser.clickVisible(Selectors.EditConnectionStringToggle);
    expect(await toggle.getAttribute('aria-checked')).to.equal('false');
    await browser.clickConfirmationAction(Selectors.EditConnectionStringToggle);

    // the toggle should now be on
    expect(await toggle.getAttribute('aria-checked')).to.equal('true');
  });

  it('parses a URI for OIDC authentication', async function () {
    const connectionString =
      'mongodb://testUser@localhost:27017/?authMechanism=MONGODB-OIDC';

    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'MONGODB-OIDC',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      oidcUsername: 'testUser',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
      fleStoreCredentials: false,
      fleEncryptedFieldsMap: DEFAULT_FLE_ENCRYPTED_FIELDS_MAP,
      connectionName: 'localhost:27017',
      connectionColor: 'no-color',
      connectionFavorite: false,
    };

    const state = await browser.getConnectFormState(true);
    expect(state).to.deep.equal(expectedState);

    delete expectedState.connectionString;

    delete expectedState.connectionString;
    await browser.setConnectFormState(expectedState);
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      `${connectionString}&authSource=%24external`
    );
  });

  it('supports saving a favorite', async function () {
    const state: ConnectFormState = {
      connectionName: 'my-connection',
      connectionColor: 'Red',
      connectionFavorite: true,
    };
    await browser.setConnectFormState(state);
    expect(await browser.getConnectFormState()).to.deep.equal({
      authMethod: 'DEFAULT',
      connectionColor: 'color6',
      connectionFavorite: true,
      connectionName: 'my-connection',
      connectionString: 'mongodb://localhost:27017/',
      defaultAuthMechanism: 'DEFAULT',
      directConnection: false,
      fleEncryptedFieldsMap:
        "{\n/**\n * // Client-side encrypted fields map configuration:\n * 'database.collection': {\n *   fields: [\n *     {\n *       keyId: UUID(\"...\"),\n *       path: '...',\n *       bsonType: '...',\n *       queries: [{ queryType: 'equality' }]\n *     }\n *   ]\n * }\n */\n}\n",
      fleStoreCredentials: false,
      hosts: ['localhost:27017'],
      proxyMethod: 'none',
      readPreference: 'defaultReadPreference',
      scheme: 'MONGODB',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
    });
  });
});
