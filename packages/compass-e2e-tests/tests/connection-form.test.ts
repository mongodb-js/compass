import path from 'path';
import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe.only('Connection form', function () {
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
    await resetForm(browser);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('starts with the expected initial state', async function () {
    const state = await getFormState(browser);
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
      readPreference: 'defaultReadPreference',
    });
  });

  it('parses and formats a URI for direct connection', async function () {
    const connectionString = 'mongodb://localhost:27017/?directConnection=true';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
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
      readPreference: 'defaultReadPreference',
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for multiple hosts', async function () {
    const connectionString = 'mongodb://localhost:27017,localhost:27018/';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017', 'localhost:27018'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
      connectionString,
      scheme: 'MONGODB_SRV',
      hosts: ['localhost'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
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
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
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
    };

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    expectedState.tlsCAFile = tlsCAFile;
    expectedState.tlsCertificateKeyFile = tlsCertificateKeyFile;

    await setFormState(browser, expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for Kerberos authentication', async function () {
    const connectionString =
      'mongodb://principal:password@localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_NAME%3Aservice+name%2CCANONICALIZE_HOST_NAME%3Aforward%2CSERVICE_REALM%3Aservice+realm';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
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
      readPreference: 'defaultReadPreference',
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
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
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
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
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
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
      readPreference: 'defaultReadPreference',
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
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

    const expectedState = {
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
      readPreference: 'primary',
      replicaSet: 'replica-set',
      defaultDatabase: 'default-db',
      urlOptions: {
        connectTimeoutMS: '1234',
        maxPoolSize: '100',
      },
    };

    const state = await getFormState(browser);
    expect(state).to.deep.equal(expectedState);

    await setFormState(browser, expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('does not update the URI for SSH tunnel with password authentication', async function () {
    const state = {
      proxyMethod: 'password',
      sshPasswordHost: 'host',
      sshPasswordPort: '1234',
      sshPasswordUsername: 'username',
      sshPasswordPassword: 'password',
    };
    await setFormState(browser, state);
    expect(await getFormState(browser)).to.deep.equal({
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
      readPreference: 'defaultReadPreference',
    });
  });

  it('does not update the URI for SSH tunnel with identity file authentication', async function () {
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures');
    // reuse the .pem file from above. contents doesn't matter.
    const sshIdentityKeyFile = path.join(fixturesPath, 'client.pem');

    const state = {
      proxyMethod: 'identity',
      sshIdentityHost: 'host',
      sshIdentityPort: '1234',
      sshIdentityUsername: 'username',
      sshIdentityKeyFile: sshIdentityKeyFile,
      sshIdentityPassword: 'password',
    };
    await setFormState(browser, state);
    expect(await getFormState(browser)).to.deep.equal({
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
      readPreference: 'defaultReadPreference',
    });
  });
});

async function getCheckedRadioValue(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const elements = await browser.$$(selector);
  for (const element of elements) {
    if (await element.isSelected()) {
      return element.getValue();
    }
  }

  return null;
}

async function getCheckboxValue(
  browser: CompassBrowser,
  selector: string
): Promise<boolean | null> {
  const element = await browser.$(selector);
  if (!(await element.isExisting())) {
    return null; // as opposed to true for checked and false for not
  }

  return element.isSelected();
}

async function getText(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const element = await browser.$(selector);
  if (!(await element.isExisting())) {
    return null;
  }

  const text = await element.getText();
  return text || null;
}

async function getFilename(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const text = await getText(browser, selector);
  return text === 'Select a file...' ? null : text;
}

async function getValue(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const element = await browser.$(selector);
  if (!(await element.isExisting())) {
    return null;
  }

  const value = await element.getValue();
  return value || null;
}

async function getMultipleValues(
  browser: CompassBrowser,
  selector: string
): Promise<string[] | null> {
  const elements = await browser.$$(selector);
  const results = (
    await Promise.all(
      elements.map((element) => {
        return element.getValue();
      })
    )
  ).filter((result) => result !== '');

  return results.length ? results : null;
}

async function maybeExpandAdvancedOptions(
  browser: CompassBrowser
): Promise<boolean> {
  const advancedButton = await browser.$(Selectors.AdvancedConnectionOptions);
  await advancedButton.waitForDisplayed();

  if ((await advancedButton.getAttribute('aria-expanded')) === 'false') {
    await advancedButton.click();
    await browser.waitUntil(async () => {
      return (await advancedButton.getAttribute('aria-expanded')) === 'true';
    });
    return false; // it was collapsed and had to expand
  }

  return true; // it was expanded already
}

interface NamedPromises {
  [key: string]: Promise<any>;
}

async function promiseMap(map: NamedPromises) {
  const results = await Promise.all(Object.values(map));
  return Object.fromEntries(
    Object.keys(map)
      .map((k, i) => [k, results[i]])
      .filter(([, v]) => v !== null)
  );
}

async function browseToTab(
  browser: CompassBrowser,
  tabName: string
): Promise<string> {
  // get the active tab
  // if it is not the target tab, click the target tab and wait for it to become visible
  // return the initially active tab so we can return to it if we want to

  const initialTab = await browser
    .$(Selectors.SelectedAdvancedOptionsTab)
    .getAttribute('name');
  if (initialTab !== tabName) {
    await browser.clickVisible(Selectors.advancedOptionsTab(tabName));
    await browser
      .$(Selectors.advancedOptionsTabPanel(initialTab))
      .waitForDisplayed({ reverse: true });
  }

  await browser
    .$(Selectors.advancedOptionsTabPanel(tabName))
    .waitForDisplayed();

  return initialTab;
}

async function getFormState(browser: CompassBrowser) {
  const wasExpanded = await maybeExpandAdvancedOptions(browser);

  const connectionString = await browser
    .$(Selectors.ConnectionStringInput)
    .getValue();

  // General
  const initialTab = await browseToTab(browser, 'General');

  const defaultState = await promiseMap({
    scheme: getCheckedRadioValue(browser, Selectors.ConnectionFormSchemeRadios),
    hosts: getMultipleValues(browser, Selectors.ConnectionFormHostInputs),
    directConnection: getCheckboxValue(
      browser,
      Selectors.ConnectionFormDirectConnectionCheckbox
    ),
  });

  // Authentication
  await browseToTab(browser, 'Authentication');
  const authenticationState = await promiseMap({
    authMethod: getCheckedRadioValue(
      browser,
      Selectors.ConnectionFormAuthenticationMethodRadios
    ),

    // Username/Password
    defaultUsername: getValue(browser, Selectors.ConnectionFormInputUsername),
    defaultPassword: getValue(browser, Selectors.ConnectionFormInputPassword),
    defaultAuthSource: getValue(
      browser,
      Selectors.ConnectionFormInputAuthSource
    ),
    defaultAuthMechanism: getCheckedRadioValue(
      browser,
      Selectors.ConnectionFormAuthMechanismRadios
    ),

    // Kerberos
    kerberosPrincipal: getValue(
      browser,
      Selectors.ConnectionFormInputGssApiPrincipal
    ),
    kerberosServiceName: getValue(
      browser,
      Selectors.ConnectionFormInputGssApiServiceName
    ),
    kerberosCanonicalizeHostname: getCheckedRadioValue(
      browser,
      Selectors.ConnectionFormCanonicalizeHostNameRadios
    ),
    kerberosServiceRealm: getValue(
      browser,
      Selectors.ConnectionFormInputGssApiServiceRealm
    ),
    kerberosProvidePassword: getCheckboxValue(
      browser,
      Selectors.ConnectionFormGssApiPasswordCheckbox
    ),
    kerberosPassword: getValue(
      browser,
      Selectors.ConnectionFormInputGssApiPassword
    ),

    // LDAP
    ldapUsername: getValue(browser, Selectors.ConnectionFormInputPlainUsername),
    ldapPassword: getValue(browser, Selectors.ConnectionFormInputPlainPassword),

    // AWS IAM
    awsAccessKeyId: getValue(
      browser,
      Selectors.ConnectionFormInputAWSAccessKeyId
    ),
    awsSecretAccessKey: getValue(
      browser,
      Selectors.ConnectionFormInputAWSSecretAccessKey
    ),
    awsSessionToken: getValue(
      browser,
      Selectors.ConnectionFormInputAWSSessionToken
    ),
  });

  // TLS/SSL
  await browseToTab(browser, 'TLS/SSL');
  const tlsState = await promiseMap({
    sslConnection: getCheckedRadioValue(
      browser,
      Selectors.ConnectionFormSSLConnectionRadios
    ),

    // these are just the button text, not actually the file path
    tlsCAFile: getFilename(browser, Selectors.ConnectionFormTlsCaButton),
    tlsCertificateKeyFile: getFilename(
      browser,
      Selectors.ConnectionFormTlsCertificateKeyButton
    ),

    clientKeyPassword: getValue(
      browser,
      Selectors.ConnectionFormInputTlsCertificateKeyFilePassword
    ),
    tlsInsecure: getCheckboxValue(
      browser,
      Selectors.ConnectionFormTlsInsecureCheckbox
    ),
    tlsAllowInvalidHostnames: getCheckboxValue(
      browser,
      Selectors.ConnectionFormTlsAllowInvalidHostnamesCheckbox
    ),
    tlsAllowInvalidCertificates: getCheckboxValue(
      browser,
      Selectors.ConnectionFormTlsAllowInvalidCertificatesCheckbox
    ),
  });

  // Proxy/SSH Tunnel
  await browseToTab(browser, 'Proxy/SSH Tunnel');

  const proxyState = await promiseMap({
    proxyMethod: getCheckedRadioValue(
      browser,
      Selectors.ConnectionFormProxyMethodRadios
    ),

    // SSH with Password
    // NOTE: these don't go in the URI so will likely never return values
    sshPasswordHost: getValue(
      browser,
      Selectors.ConnectionFormInputSshPasswordHost
    ),
    sshPasswordPort: getValue(
      browser,
      Selectors.ConnectionFormInputSshPasswordPort
    ),
    sshPasswordUsername: getValue(
      browser,
      Selectors.ConnectionFormInputSshPasswordUsername
    ),
    sshPasswordPassword: getValue(
      browser,
      Selectors.ConnectionFormInputSshPasswordPassword
    ),

    // SSH with Identity File
    // NOTE: same as above these are unlikely ever return values in these tests
    sshIdentityHost: getValue(
      browser,
      Selectors.ConnectionFormInputSshIdentityHost
    ),
    sshIdentityPort: getValue(
      browser,
      Selectors.ConnectionFormInputSshIdentityPort
    ),
    sshIdentityUsername: getValue(
      browser,
      Selectors.ConnectionFormInputSshIdentityUsername
    ),
    // same as above: this is the button text, not the file path
    sshIdentityKeyFile: getFilename(
      browser,
      Selectors.ConnectionFormSshIdentityKeyButton
    ),
    sshIdentityPassword: getValue(
      browser,
      Selectors.ConnectionFormInputSshIdentityPassword
    ),

    socksHost: getValue(browser, Selectors.ConnectionFormInputSocksHost),
    socksPort: getValue(browser, Selectors.ConnectionFormInputSocksPort),
    socksUsername: getValue(
      browser,
      Selectors.ConnectionFormInputSocksUsername
    ),
    socksPassword: getValue(
      browser,
      Selectors.ConnectionFormInputSocksPassword
    ),
  });

  // Advanced
  await browseToTab(browser, 'Advanced');
  const advancedState = await promiseMap({
    readPreference: getCheckedRadioValue(
      browser,
      Selectors.ConnectionFormReadPreferenceRadios
    ),
    replicaSet: getValue(browser, Selectors.ConnectionFormInputReplicaset),
    defaultDatabase: getValue(
      browser,
      Selectors.ConnectionFormInputDefaultDatabase
    ),
    urlOptionKeys: getMultipleValues(
      browser,
      Selectors.ConnectionFormUrlOptionKeys
    ),
    urlOptionValues: getMultipleValues(
      browser,
      Selectors.ConnectionFormUrlOptionValues
    ),
  });

  if (advancedState.urlOptionKeys) {
    advancedState.urlOptions = Object.fromEntries(
      advancedState.urlOptionKeys.map((k: string, i: number) => [
        k,
        advancedState.urlOptionValues[i],
      ])
    );

    delete advancedState.urlOptionKeys;
    delete advancedState.urlOptionValues;
  }

  const result = {
    connectionString,
    ...defaultState,
    ...authenticationState,
    ...tlsState,
    ...proxyState,
    ...advancedState,
  };

  // restore the initial state
  if (wasExpanded) {
    // get back to the tab it was on
    await browseToTab(browser, initialTab);
  } else {
    // collapse it again
    await browser.clickVisible(Selectors.AdvancedConnectionOptions);

    await browser.waitUntil(async () => {
      const advancedButton = await browser.$(
        Selectors.AdvancedConnectionOptions
      );
      return (await advancedButton.getAttribute('aria-expanded')) === 'false';
    });
  }

  return result;
}

async function resetForm(browser: CompassBrowser) {
  await browser.clickVisible(Selectors.SidebarNewConnectionButton);

  await browser.waitUntil(async () => {
    return (
      (await browser.$(Selectors.ConnectionStringInput).getValue()) ===
      'mongodb://localhost:27017'
    );
  });
}

async function setFormState(browser: CompassBrowser, state: any) {
  await resetForm(browser);

  await maybeExpandAdvancedOptions(browser);

  // General
  await browseToTab(browser, 'General');

  if (state.scheme) {
    await browser.clickParent(
      Selectors.connectionFormSchemeRadio(state.scheme)
    );
  }

  if (state.hosts) {
    for (let i = 0; i < state.hosts.length; ++i) {
      if (i > 0) {
        await browser.clickVisible(
          '[data-testid="host-input-container"]:last-child [data-testid="connection-add-host-button"]'
        );
      }
      await browser.setValueVisible(
        `[data-testid="connection-host-input-${i}"]`,
        state.hosts[i]
      );
    }
  }

  if (state.directConnection) {
    await browser.clickParent(Selectors.ConnectionFormDirectConnectionCheckbox);
  }

  // Authentication
  await browseToTab(browser, 'Authentication');

  if (state.authMethod) {
    await browser.clickParent(
      Selectors.connectionFormAuthenticationMethodRadio(state.authMethod)
    );
  }

  // Username/Password
  if (state.defaultUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputUsername,
      state.defaultUsername
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputPassword,
      state.defaultPassword
    );
  }
  if (state.defaultAuthSource) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAuthSource,
      state.defaultAuthSource
    );
  }
  if (state.defaultAuthMechanism) {
    await browser.clickParent(
      Selectors.connectionFormAuthMechanismRadio(state.defaultAuthMechanism)
    );
  }

  // Kerberos
  if (state.kerberosPrincipal) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiPrincipal,
      state.kerberosPrincipal
    );
  }
  if (state.kerberosServiceName) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiServiceName,
      state.kerberosServiceName
    );
  }
  if (state.kerberosCanonicalizeHostname) {
    await browser.clickParent(
      Selectors.connectionFormCanonicalizeHostNameRadio(
        state.kerberosCanonicalizeHostname
      )
    );
  }
  if (state.kerberosServiceRealm) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiServiceRealm,
      state.kerberosServiceRealm
    );
  }
  if (state.kerberosServiceRealm) {
    await browser.clickParent(Selectors.ConnectionFormGssApiPasswordCheckbox);
  }
  if (state.kerberosPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiPassword,
      state.kerberosPassword
    );
  }

  // LDAP
  if (state.ldapUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputPlainUsername,
      state.ldapUsername
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputPlainPassword,
      state.ldapPassword
    );
  }

  // AWS IAM
  if (state.awsAccessKeyId) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAWSAccessKeyId,
      state.awsAccessKeyId
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAWSSecretAccessKey,
      state.awsSecretAccessKey
    );
  }
  if (state.awsSessionToken) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAWSSessionToken,
      state.awsSessionToken
    );
  }

  // TLS/SSL
  await browseToTab(browser, 'TLS/SSL');

  if (state.sslConnection) {
    await browser.clickParent(
      Selectors.connectionFormSSLConnectionRadio(state.sslConnection)
    );
  }

  if (state.tlsCAFile) {
    await browser.selectFile(
      Selectors.ConnectionFormTlsCaFile,
      state.tlsCAFile
    );
  }
  if (state.tlsCertificateKeyFile) {
    await browser.selectFile(
      Selectors.ConnectionFormTlsCertificateKeyFile,
      state.tlsCertificateKeyFile
    );
  }
  if (state.clientKeyPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputTlsCertificateKeyFilePassword,
      state.clientKeyPassword
    );
  }
  if (state.tlsInsecure) {
    await browser.clickParent(Selectors.ConnectionFormTlsInsecureCheckbox);
  }
  if (state.tlsAllowInvalidHostnames) {
    await browser.clickParent(
      Selectors.ConnectionFormTlsAllowInvalidHostnamesCheckbox
    );
  }
  if (state.tlsAllowInvalidCertificates) {
    await browser.clickParent(
      Selectors.ConnectionFormTlsAllowInvalidCertificatesCheckbox
    );
  }

  // Proxy/SSH Tunnel
  await browseToTab(browser, 'Proxy/SSH Tunnel');

  //proxyMethod
  if (state.proxyMethod) {
    await browser.clickParent(
      Selectors.connectionFormProxyMethodRadio(state.proxyMethod)
    );
  }

  // SSH with Password
  // NOTE: these don't affect the URI
  if (state.sshPasswordHost) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordHost,
      state.sshPasswordHost
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordPort,
      state.sshPasswordPort
    );
  }
  if (state.sshPasswordUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordUsername,
      state.sshPasswordUsername
    );
  }
  if (state.sshPasswordPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordPassword,
      state.sshPasswordPassword
    );
  }

  // SSH with Identity File
  // NOTE: these don't affect the URI
  if (state.sshIdentityHost) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityHost,
      state.sshIdentityHost
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityPort,
      state.sshIdentityPort
    );
  }
  if (state.sshIdentityUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityUsername,
      state.sshIdentityUsername
    );
  }
  if (state.sshIdentityKeyFile) {
    await browser.selectFile(
      Selectors.ConnectionFormSshIdentityKeyFile,
      state.sshIdentityKeyFile
    );
  }
  if (state.sshIdentityPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityPassword,
      state.sshIdentityPassword
    );
  }

  // Socks5
  if (state.socksHost) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksHost,
      state.socksHost
    );
  }
  if (state.socksPort) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksPort,
      state.socksPort
    );
  }
  if (state.socksUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksUsername,
      state.socksUsername
    );
  }
  if (state.socksPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksPassword,
      state.socksPassword
    );
  }

  // Advanced
  await browseToTab(browser, 'Advanced');

  if (state.readPreference) {
    await browser.clickParent(
      Selectors.connectionFormReadPreferenceRadio(state.readPreference)
    );
  }
  if (state.replicaSet) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputReplicaset,
      state.replicaSet
    );
  }
  if (state.defaultDatabase) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputDefaultDatabase,
      state.defaultDatabase
    );
  }
  if (state.urlOptions) {
    for (const [index, [key, value]] of Object.entries(
      state.urlOptions
    ).entries()) {
      // key
      await browser.clickVisible(
        Selectors.connectionFormUrlOptionKeyButton(index)
      );
      // this is quite hacky, unfortunately
      const options = await browser.$$('#select-key-menu [role="option"]');
      for (const option of options) {
        const span = await option.$(`span=${key}`);
        if (await span.isExisting()) {
          await span.waitForDisplayed();
          await span.click();
          break;
        }
      }

      // value
      await browser.setValueVisible(
        Selectors.connectionFormUrlOptionValueInput(index),
        value as string
      );
    }
  }
}
