import path from 'path';
import { expect } from 'chai';
import clipboard from 'clipboardy';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import type { ConnectFormState } from '../helpers/connect-form-state';

describe('Connection form', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  beforeEach(async function () {
    await browser.resetConnectForm();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('starts with the expected initial state', async function () {
    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal({
      connectionString: 'mongodb://localhost:27017',
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    });
  });

  it('parses and formats a URI for direct connection', async function () {
    const connectionString = 'mongodb://localhost:27017/?directConnection=true';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: true,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for multiple hosts', async function () {
    const connectionString = 'mongodb://localhost:27017,localhost:27091/';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017', 'localhost:27091'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for mongodb+srv scheme', async function () {
    const connectionString = 'mongodb+srv://localhost/';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB_SRV',
      hosts: ['localhost'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for username/password authentication', async function () {
    const connectionString =
      'mongodb://foo:bar@localhost:27017/?authMechanism=SCRAM-SHA-1&authSource=source';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
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
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
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
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    expectedState.tlsCAFile = tlsCAFile;
    expectedState.tlsCertificateKeyFile = tlsCertificateKeyFile;

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for TLS with system CA', async function () {
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures');
    const tlsCAFile = path.join(fixturesPath, 'ca.pem');

    await browser.setConnectFormState({
      hosts: ['localhost:27017'],
      sslConnection: 'ON',
      tlsCAFile,
      useSystemCA: true,
    });

    const state = await browser.getConnectFormState();
    expect(state.tlsCAFile).to.equal(undefined); // tlsCAFile is unset by useSystemCA
    expect(state.useSystemCA).to.equal(true);

    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal('mongodb://localhost:27017/?tls=true');
  });

  it('parses and formats a URI for Kerberos authentication', async function () {
    const connectionString =
      'mongodb://principal:password@localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_NAME%3Aservice+name%2CCANONICALIZE_HOST_NAME%3Aforward%2CSERVICE_REALM%3Aservice+realm';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'GSSAPI',
      kerberosPassword: 'password',
      kerberosPrincipal: 'principal',
      kerberosProvidePassword: true,
      kerberosServiceName: 'service name',
      kerberosCanonicalizeHostname: 'forward',
      kerberosServiceRealm: 'service realm',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for LDAP authentication', async function () {
    const connectionString =
      'mongodb://username:password@localhost:27017/?authMechanism=PLAIN&authSource=%24external';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
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
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for AWS IAM authentication', async function () {
    const connectionString =
      'mongodb://id:key@localhost:27017/?authMechanism=MONGODB-AWS&authSource=%24external&authMechanismProperties=AWS_SESSION_TOKEN%3Atoken';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
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
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for Socks5 authentication', async function () {
    const connectionString =
      'mongodb://localhost:27017/?proxyHost=hostname&proxyPort=1234&proxyUsername=username&proxyPassword=password';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'socks',
      socksHost: 'hostname',
      socksPort: '1234',
      socksUsername: 'username',
      socksPassword: 'password',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI with advanced options', async function () {
    const connectionString =
      'mongodb://localhost:27017/default-db?readPreference=primary&replicaSet=replica-set&connectTimeoutMS=1234&maxPoolSize=100';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      useSystemCA: false,
      readPreference: 'primary',
      replicaSet: 'replica-set',
      defaultDatabase: 'default-db',
      urlOptions: {
        connectTimeoutMS: '1234',
        maxPoolSize: '100',
      },
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
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
    expect(await browser.getConnectFormState()).to.deep.equal({
      authMethod: 'AUTH_NONE',
      connectionString: 'mongodb://localhost:27017/',
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
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    });
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
    expect(await browser.getConnectFormState()).to.deep.equal({
      authMethod: 'AUTH_NONE',
      connectionString: 'mongodb://localhost:27017/',
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
      useSystemCA: false,
      readPreference: 'defaultReadPreference',
    });
  });

  it('can save a connection as a favorite and manage it', async function () {
    const favoriteName = 'My Favorite';
    const newFavoriteName = 'My Favorite (edited)';

    // save
    await browser.clickVisible(Selectors.ConnectionFormEditFavouriteButton);
    await browser.$(Selectors.FavoriteModal).waitForDisplayed();
    await browser.$(Selectors.FavoriteNameInput).setValue(favoriteName);
    await browser.clickVisible(
      `${Selectors.FavoriteColorSelector} [data-testid="color-pick-color1"]`
    );
    await browser.$(Selectors.FavoriteSaveButton).waitForEnabled();
    expect(await browser.$(Selectors.FavoriteSaveButton).getText()).to.equal(
      'Save'
    );
    await browser.clickVisible(Selectors.FavoriteSaveButton);
    await browser.$(Selectors.FavoriteModal).waitForExist({ reverse: true });

    // copy the connection string
    await selectConnectionMenuItem(
      browser,
      favoriteName,
      Selectors.CopyConnectionStringItem
    );
    expect(await clipboard.read()).to.equal('mongodb://localhost:27017');

    // duplicate
    await selectConnectionMenuItem(
      browser,
      favoriteName,
      Selectors.DuplicateConnectionItem
    );

    // delete the duplicate
    await selectConnectionMenuItem(
      browser,
      `${favoriteName} (copy)`,
      Selectors.RemoveConnectionItem
    );

    // edit
    await browser.clickVisible(Selectors.sidebarFavoriteButton(favoriteName));
    await browser.waitUntil(async () => {
      const text = await browser.$(Selectors.ConnectionTitle).getText();
      return text === favoriteName;
    });
    await browser.clickVisible(Selectors.ConnectionFormEditFavouriteButton);
    await browser.$(Selectors.FavoriteModal).waitForDisplayed();
    await browser.$(Selectors.FavoriteNameInput).setValue(newFavoriteName);
    await browser.clickVisible(
      `${Selectors.FavoriteColorSelector} [data-testid="color-pick-color2"]`
    );
    await browser.$(Selectors.FavoriteSaveButton).waitForEnabled();
    await browser.clickVisible(Selectors.FavoriteSaveButton);
    await browser.$(Selectors.FavoriteModal).waitForExist({ reverse: true });

    // should now be updated in the sidebar
    await browser
      .$(Selectors.sidebarFavorite(newFavoriteName))
      .waitForDisplayed();
  });

  it('can save & connect', async function () {
    const favoriteName = 'My New Favorite';

    // Fill in a valid URI
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://localhost:27091/test'
    );

    // Save & Connect
    await browser.clickVisible(Selectors.ConnectionFormSaveAndConnectButton);
    await browser.$(Selectors.FavoriteModal).waitForDisplayed();
    await browser.$(Selectors.FavoriteNameInput).setValue(favoriteName);
    await browser.clickVisible(
      `${Selectors.FavoriteColorSelector} [data-testid="color-pick-color2"]`
    );

    // The modal's button text should read Save & Connect and not the default Save
    expect(await browser.$(Selectors.FavoriteSaveButton).getText()).to.equal(
      'Save & Connect'
    );

    await browser.$(Selectors.FavoriteSaveButton).waitForEnabled();
    await browser.clickVisible(Selectors.FavoriteSaveButton);
    await browser.$(Selectors.FavoriteModal).waitForExist({ reverse: true });

    // Wait for it to connect
    const element = await browser.$(Selectors.MyQueriesList);
    await element.waitForDisplayed({
      timeout: 30_000,
    });

    // It should use the new favorite name as the connection name in the top-left corner
    expect(await browser.$(Selectors.SidebarTitle).getText()).to.equal(
      favoriteName
    );
  });
});

async function selectConnectionMenuItem(
  browser: CompassBrowser,
  favoriteName: string,
  itemSelector: string
) {
  const selector = Selectors.sidebarFavorite(favoriteName);
  // It takes some time for the favourites to load
  await browser.$(selector).waitForDisplayed({ timeout: 60_000 });
  await browser.hover(selector);

  await browser.clickVisible(Selectors.sidebarFavoriteMenuButton(favoriteName));
  await browser.$(Selectors.ConnectionMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
