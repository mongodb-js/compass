import { expect } from 'chai';
import type { Element } from 'webdriverio';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

async function getCheckedRadioValue(browser: CompassBrowser, selector: string): Promise<string|null> {
  const elements = await browser.$$(selector);
  for (const element of elements) {
    if (await element.isSelected()) {
      return element.getValue();
    }
  }

  return null;
}

async function getCheckboxValue(browser: CompassBrowser, selector: string): Promise<boolean|null> {
  const element = await browser.$(selector);
  if (!await element.isExisting()) {
    return null; // as opposed to true for checked and false for not
  }

  return element.isSelected();
}

async function getValue(browser: CompassBrowser, selector: string): Promise<string|null> {
  const element = await browser.$(selector);
  if (!await element.isExisting()) {
    return null;
  }

  return element.getValue();
}

async function getMultipleValues(browser: CompassBrowser, selector: string): Promise<string[]> {
  const elements = await browser.$$(selector);
  return Promise.all(elements.map((element) => {
    return element.getValue();
  }));
}

async function maybeExpandAdvancedOptions(browser: CompassBrowser): Promise<boolean> {
  const advancedButton = await browser.$('[data-testid="advanced-connection-options"');
  await advancedButton.waitForDisplayed();

  if (await advancedButton.getAttribute('aria-expanded') === 'false') {
    await advancedButton.click();
    return false; // it was collapsed and had to expand
  }

  return true; // it was expanded already
}

interface NamedPromises {
  [key: string]: Promise<any>
}

async function promiseMap(map: NamedPromises) {
  const results = await Promise.all(Object.values(map));
  return Object.fromEntries(Object.keys(map).map((k, i) => [k, results[i]]));
}

async function browseToTab(browser: CompassBrowser, tabName: string): Promise<string> {
  // get the active tab
  // if it is not the target tab, click the target tab and wait for it to become visible
  // return the initially active tab so we can return to it if we want to

  const initialTab = await browser.$('[aria-label="Advanced Options Tabs"] [aria-selected="true"]').getAttribute('name');
  if (initialTab !== tabName) {
    await browser.clickVisible(`[aria-label="Advanced Options Tabs"] button[name="${tabName}"]`);
  }

  await browser.$(`[role="tabpanel"][aria-label="${tabName}"]`).waitForDisplayed();

  return initialTab;
}

async function getFormState(browser: CompassBrowser) {
  const wasExpanded = await maybeExpandAdvancedOptions(browser);

  const connectionString = await browser.$('[data-testid="connectionString"]').getValue();

  // General
  const initialTab = await browseToTab(browser, 'General');

  const defaultState = await promiseMap({
    scheme: getCheckedRadioValue(browser, 'label[for="connection-scheme-mongodb-radiobox"] input[type="radio"]'),
    hosts: getMultipleValues(browser, '[aria-labelledby="connection-host-input-label"]'),
    directConnection: getCheckboxValue(browser, '[data-testid="direct-connection"]')
  });

  // Authentication
  await browseToTab(browser, 'Authentication');
  const authenticationState = await promiseMap({
    authMethod: getCheckedRadioValue(browser, '#authentication-method-radio-box-group input[type="radio"]'),

    // username/password
    defaultUsername: getValue(browser, '[data-testid="connection-username-input"]'),
    defaultPassword: getValue(browser, '[data-testid="connection-password-input"]'),
    defaultAuthSource: getValue(browser, '#authSourceInput'),
    defaultAuthMechanism: getCheckedRadioValue(browser, '#authentication-mechanism-radio-box-group input[type="radio"]'),

    // Kerberos
    kerberosPrincipal: getValue(browser, '[data-testid="gssapi-principal-input"]'),
    kerberosServiceName: getValue(browser, '[data-testid="gssapi-service-name-input"]'),
    kerberosCanonicalizeHostname: getCheckedRadioValue(browser, '#canonicalize-hostname-select'),
    kerberosServiceRealm: getValue(browser, '[data-testid="gssapi-service-realm-input"]'),
    kerberosProvidePassword: getCheckboxValue(browser, '[data-testid="gssapi-password-checkbox"]'),
    kerberosPassword: getValue(browser, '[data-testid="gssapi-password-input"]'),

    // LDAP
    ldapUsername: getValue(browser, '[data-testid="connection-plain-username-input"]'),
    ldapPassword: getValue(browser, '[data-testid="connection-plain-password-input"]'),

    // AWS IAM
    awsAccessKeyId: getValue(browser, '[data-testid="connection-form-aws-access-key-id-input"]'),
    awsSecretAccessKey: getValue(browser, '[data-testid="connection-form-aws-secret-access-key-input"]'),
    awsSessionToken: getValue(browser, '[data-testid="connection-form-aws-secret-token-input"]')
  });

  // TLS/SSL
  await browseToTab(browser, 'TLS/SSL');
  const tlsState = {};

  // Proxy/SSH Tunnel
  await browseToTab(browser, 'Proxy/SSH Tunnel');
  const proxyState = {};

  // Advanced
  await browseToTab(browser, 'Advanced');
  const advancedState = {};

  const result = {
    connectionString,
    ...defaultState,
    ...authenticationState,
    ...tlsState,
    ...proxyState,
    ...advancedState
  }

  // restore the initial state
  if (wasExpanded) {
    // get back to the tab it was on
    await browseToTab(browser, initialTab);
  } else {
    // collapse it again
    await browser.clickVisible('[data-testid="advanced-connection-options"]');
  }

  return result;
}

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
    await browser.clickVisible(Selectors.SidebarNewConnectionButton);
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
      username: null,
      password: null,
      authSource: null,
      authMechanism: null,

    });
  });

  it('prompts when re-enabling Edit Connection String');

  it('builds a URI for mongodb scheme');
  it('builds a URI for mongodb+srv scheme');
  it('builds a URI for username/password authentication');
  it('builds a URI for X.509 authentication');
  it('builds a URI for Kerberos authentication');
  it('builds a URI for LDAP authentication');
  it('builds a URI for AWS IAM authentication');
  it('builds a URI for optional TLS/SSL authentication');
  it('builds a URI for Socks5 authentication');
  it('builds a URI with advanced options')

  it('parses a URI for mongodb scheme');
  it('parses a URI for mongodb+srv scheme');
  it('parses a URI for username/password authentication');
  it('parses a URI for X.509 authentication');
  it('parses a URI for Kerberos authentication');
  it('parses a URI for LDAP authentication');
  it('parses a URI for AWS IAM authentication');
  it('parses a URI for optional TLS/SSL authentication');
  it('parses a URI for Socks5 authentication');
  it('parses a URI with advanced options');

  it('does not update the URI for SSH tunnel with password authentication');
  it('does not update the URI for SSH tunnel with identity file authentication');
});