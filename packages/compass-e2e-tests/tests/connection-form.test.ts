import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

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
    });
  });

  it('prompts when re-enabling Edit Connection String');

  it('parses a URI for multiple hosts', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://localhost:27017,localhost:27018/'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString: 'mongodb://localhost:27017,localhost:27018/',
      scheme: 'MONGODB',
      hosts: ['localhost:27017', 'localhost:27018'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
    });
  });

  it('parses a URI for mongodb+srv scheme', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb+srv://localhost'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString: 'mongodb+srv://localhost',
      scheme: 'MONGODB_SRV',
      hosts: ['localhost'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
    });
  });

  it('parses a URI for username/password authentication', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://foo:bar@localhost:27017/?authSource=source&authMechanism=SCRAM-SHA-1'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://foo:bar@localhost:27017/?authSource=source&authMechanism=SCRAM-SHA-1',
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
    });
  });

  it('parses a URI for X.509 authentication', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://localhost:27017/?authMechanism=MONGODB-X509&tls=true&tlsCAFile=foo.pem&tlsCertificateKeyFile=bar.pem&tlsInsecure=true&tlsAllowInvalidHostnames=true&tlsAllowInvalidCertificates=true&tlsCertificateKeyFilePassword=password'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/?authMechanism=MONGODB-X509&tls=true&tlsCAFile=foo.pem&tlsCertificateKeyFile=bar.pem&tlsInsecure=true&tlsAllowInvalidHostnames=true&tlsAllowInvalidCertificates=true&tlsCertificateKeyFilePassword=password',
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'MONGODB-X509',
      proxyMethod: 'none',
      sslConnection: 'ON',
      tlsCAFile: 'foo.pem',
      tlsCertificateKeyFile: 'bar.pem',
      clientKeyPassword: 'password',
      tlsInsecure: true,
      tlsAllowInvalidHostnames: true,
      tlsAllowInvalidCertificates: true,
    });
  });

  it('parses a URI for Kerberos authentication', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://principal:password@localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_NAME%3Aservice+name%2CCANONICALIZE_HOST_NAME%3Aforward%2CSERVICE_REALM%3Aservice+realm'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://principal:password@localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_NAME%3Aservice+name%2CCANONICALIZE_HOST_NAME%3Aforward%2CSERVICE_REALM%3Aservice+realm',
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
    });
  });

  it('parses a URI for LDAP authentication', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://username:password@localhost:27017/?authMechanism=PLAIN&authSource=%24external'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://username:password@localhost:27017/?authMechanism=PLAIN&authSource=%24external',
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
    });
  });

  it('parses a URI for AWS IAM authentication', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://id:key@localhost:27017/?authMechanism=MONGODB-AWS&authSource=%24external&authMechanismProperties=AWS_SESSION_TOKEN%3Atoken'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://id:key@localhost:27017/?authMechanism=MONGODB-AWS&authSource=%24external&authMechanismProperties=AWS_SESSION_TOKEN%3Atoken',
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
    });
  });

  it('parses a URI for Socks5 authentication', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://localhost:27017/?proxyHost=hostname&proxyPort=1234&proxyUsername=username&proxyPassword=password'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/?proxyHost=hostname&proxyPort=1234&proxyUsername=username&proxyPassword=password',
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
    });
  });

  it('parses a URI with advanced options', async function () {
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      'mongodb://localhost:27017/default-db?readPreference=primary&replicaSet=replica-set&connectTimeoutMS=1234'
    );

    const state = await getFormState(browser);
    expect(state).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/default-db?readPreference=primary&replicaSet=replica-set&connectTimeoutMS=1234',
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
      },
    });
  });

  it('does not update the URI for SSH tunnel with password authentication');
  it(
    'does not update the URI for SSH tunnel with identity file authentication'
  );
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
  const advancedButton = await browser.$(
    '[data-testid="advanced-connection-options"'
  );
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
    .$('[aria-label="Advanced Options Tabs"] [aria-selected="true"]')
    .getAttribute('name');
  if (initialTab !== tabName) {
    await browser.clickVisible(
      `[aria-label="Advanced Options Tabs"] button[name="${tabName}"]`
    );
    await browser
      .$(`[role="tabpanel"][aria-label="${initialTab}"]`)
      .waitForDisplayed({ reverse: true });
  }

  await browser
    .$(`[role="tabpanel"][aria-label="${tabName}"]`)
    .waitForDisplayed();

  return initialTab;
}

async function getFormState(browser: CompassBrowser) {
  const wasExpanded = await maybeExpandAdvancedOptions(browser);

  const connectionString = await browser
    .$('[data-testid="connectionString"]')
    .getValue();

  // General
  const initialTab = await browseToTab(browser, 'General');

  const defaultState = await promiseMap({
    scheme: getCheckedRadioValue(
      browser,
      '#connection-schema-radio-box-group input[type="radio"]'
    ),
    hosts: getMultipleValues(
      browser,
      '[aria-labelledby="connection-host-input-label"]'
    ),
    directConnection: getCheckboxValue(
      browser,
      '[data-testid="direct-connection"]'
    ),
  });

  // Authentication
  await browseToTab(browser, 'Authentication');
  const authenticationState = await promiseMap({
    authMethod: getCheckedRadioValue(
      browser,
      '#authentication-method-radio-box-group input[type="radio"]'
    ),

    // Username/Password
    defaultUsername: getValue(
      browser,
      '[data-testid="connection-username-input"]'
    ),
    defaultPassword: getValue(
      browser,
      '[data-testid="connection-password-input"]'
    ),
    defaultAuthSource: getValue(browser, '#authSourceInput'),
    defaultAuthMechanism: getCheckedRadioValue(
      browser,
      '#authentication-mechanism-radio-box-group input[type="radio"]'
    ),

    // Kerberos
    kerberosPrincipal: getValue(
      browser,
      '[data-testid="gssapi-principal-input"]'
    ),
    kerberosServiceName: getValue(
      browser,
      '[data-testid="gssapi-service-name-input"]'
    ),
    kerberosCanonicalizeHostname: getCheckedRadioValue(
      browser,
      '#canonicalize-hostname-select input[type="radio"]'
    ),
    kerberosServiceRealm: getValue(
      browser,
      '[data-testid="gssapi-service-realm-input"]'
    ),
    kerberosProvidePassword: getCheckboxValue(
      browser,
      '[data-testid="gssapi-password-checkbox"]'
    ),
    kerberosPassword: getValue(
      browser,
      '[data-testid="gssapi-password-input"]'
    ),

    // LDAP
    ldapUsername: getValue(
      browser,
      '[data-testid="connection-plain-username-input"]'
    ),
    ldapPassword: getValue(
      browser,
      '[data-testid="connection-plain-password-input"]'
    ),

    // AWS IAM
    awsAccessKeyId: getValue(
      browser,
      '[data-testid="connection-form-aws-access-key-id-input"]'
    ),
    awsSecretAccessKey: getValue(
      browser,
      '[data-testid="connection-form-aws-secret-access-key-input"]'
    ),
    awsSessionToken: getValue(
      browser,
      '[data-testid="connection-form-aws-secret-token-input"]'
    ),
  });

  // TLS/SSL
  await browseToTab(browser, 'TLS/SSL');
  const tlsState = await promiseMap({
    sslConnection: getCheckedRadioValue(
      browser,
      '#connection-schema-radio-box-group input[type="radio"]'
    ),

    // these are just the button text, not actually the file path
    tlsCAFile: getFilename(browser, '#tlsCAFile'),
    tlsCertificateKeyFile: getFilename(browser, '#tlsCertificateKeyFile'),

    clientKeyPassword: getValue(
      browser,
      '[data-testid="tlsCertificateKeyFilePassword-input"]'
    ),
    tlsInsecure: getCheckboxValue(browser, '[data-testid="tlsInsecure-input"]'),
    tlsAllowInvalidHostnames: getCheckboxValue(
      browser,
      '[data-testid="tlsAllowInvalidHostnames-input"]'
    ),
    tlsAllowInvalidCertificates: getCheckboxValue(
      browser,
      '[data-testid="tlsAllowInvalidCertificates-input"]'
    ),
  });

  // Proxy/SSH Tunnel
  await browseToTab(browser, 'Proxy/SSH Tunnel');

  const proxyState = await promiseMap({
    proxyMethod: getCheckedRadioValue(
      browser,
      '#ssh-options-radio-box-group input[type="radio"]'
    ),

    sshPasswordHost: getValue(
      browser,
      '[data-testid="ssh-password-tab-content"] [data-testid="host"]'
    ),
    sshPasswordPort: getValue(
      browser,
      '[data-testid="ssh-password-tab-content"] [data-testid="port"'
    ),
    sshPasswordUsername: getValue(
      browser,
      '[data-testid="ssh-password-tab-content"] [data-testid="username"'
    ),
    sshPasswordPassword: getValue(
      browser,
      '[data-testid="ssh-password-tab-content"] [data-testid="password"'
    ),

    sshIdentityHost: getValue(
      browser,
      '[data-testid="ssh-identity-tab-content"] [data-testid="host"]'
    ),
    sshIdentityPort: getValue(
      browser,
      '[data-testid="ssh-identity-tab-content"] [data-testid="port"]'
    ),
    sshIdentityUsername: getValue(
      browser,
      '[data-testid="ssh-identity-tab-content"] [data-testid="username"]'
    ),
    // same as above: this is the button text, not the file path
    sshIdentityKeyFile: getFilename(
      browser,
      '[data-testid="ssh-identity-tab-content"]  #identityKeyFile'
    ),
    sshIdentityPassword: getValue(
      browser,
      '[data-testid="ssh-identity-tab-content"] [data-testid="password"]'
    ),

    socksHost: getValue(
      browser,
      '[data-testid="socks-tab-content"] [data-testid="proxyHost"]'
    ),
    socksPort: getValue(
      browser,
      '[data-testid="socks-tab-content"] [data-testid="proxyPort"]'
    ),
    socksUsername: getValue(
      browser,
      '[data-testid="socks-tab-content"] [data-testid="proxyUsername"]'
    ),
    socksPassword: getValue(
      browser,
      '[data-testid="socks-tab-content"] [data-testid="proxyPassword"]'
    ),
  });

  // Advanced
  await browseToTab(browser, 'Advanced');
  const advancedState = await promiseMap({
    readPreference: getCheckedRadioValue(
      browser,
      '#read-preferences input[type="radio"]'
    ),
    replicaSet: getValue(
      browser,
      '[data-testid="connection-advanced-tab"] [data-testid="replica-set"]'
    ),
    defaultDatabase: getValue(
      browser,
      '[data-testid="connection-advanced-tab"] [data-testid="default-database"]'
    ),
    urlOptionKeys: getMultipleValues(
      browser,
      '[data-testid="connection-advanced-tab"] button[name="name"]'
    ),
    urlOptionValues: getMultipleValues(
      browser,
      '[data-testid="connection-advanced-tab"] input[aria-labelledby="Enter value"'
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
    await browser.clickVisible('[data-testid="advanced-connection-options"]');

    await browser.waitUntil(async () => {
      const advancedButton = await browser.$(
        '[data-testid="advanced-connection-options"'
      );
      return (await advancedButton.getAttribute('aria-expanded')) === 'false';
    });
  }

  return result;
}

async function resetForm(browser: CompassBrowser) {
  await browser.clickVisible(Selectors.SidebarNewConnectionButton);
}
