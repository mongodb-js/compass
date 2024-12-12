import _ from 'lodash';
import { expect } from 'chai';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { ConnectFormState } from '../connect-form-state';
import Debug from 'debug';
import {
  DEFAULT_CONNECTIONS,
  isTestingAtlasCloudExternal,
  isTestingAtlasCloudSandbox,
} from '../test-runner-context';
import { getConnectionTitle } from '@mongodb-js/connection-info';
const debug = Debug('compass-e2e-tests');

export async function resetConnectForm(browser: CompassBrowser): Promise<void> {
  const Sidebar = Selectors.Multiple;

  if (await browser.$(Selectors.ConnectionModal).isDisplayed()) {
    await browser.clickVisible(Selectors.ConnectionModalCloseButton);
    await browser
      .$(Selectors.ConnectionModal)
      .waitForDisplayed({ reverse: true });
  }

  await browser.clickVisible(Sidebar.SidebarNewConnectionButton);

  const connectionTitleSelector = Selectors.ConnectionModalTitle;

  const connectionTitle = browser.$(connectionTitleSelector);
  await connectionTitle.waitUntil(async () => {
    return (await connectionTitle.getText()) === 'New Connection';
  });

  await browser.waitUntil(async () => {
    return (
      (await browser.getConnectFormConnectionString(true)) ===
      'mongodb://localhost:27017'
    );
  });
}

export async function getConnectFormState(
  browser: CompassBrowser,
  isFocused = false
): Promise<ConnectFormState> {
  const wasExpanded = await browser.expandAccordion(
    Selectors.ConnectionFormAdvancedToggle
  );

  const connectionString = await browser.getConnectFormConnectionString(
    isFocused
  );

  // General
  const initialTab = await browser.navigateToConnectTab('General');

  const defaultState = await promiseMap({
    scheme: getCheckedRadioValue(browser, Selectors.ConnectionFormSchemeRadios),
    hosts: getMultipleValues(browser, Selectors.ConnectionFormHostInputs),
    directConnection: getCheckboxValue(
      browser,
      Selectors.ConnectionFormDirectConnectionCheckbox
    ),
    connectionName: getValue(browser, Selectors.ConnectionFormConnectionName),
    connectionColor: getValue(browser, Selectors.ConnectionFormConnectionColor),
    connectionFavorite: getCheckboxValue(
      browser,
      Selectors.ConnectionFormFavoriteCheckbox
    ),
  });

  // Authentication
  await browser.navigateToConnectTab('Authentication');
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

    // OIDC
    oidcUsername: getValue(browser, Selectors.ConnectionFormInputOIDCUsername),

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
  await browser.navigateToConnectTab('TLS/SSL');
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

  // Proxy/SSH
  await browser.navigateToConnectTab('Proxy/SSH');

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

  // FLE2
  await browser.navigateToConnectTab('In-Use Encryption');
  await browser.expandAccordion(Selectors.ConnectionFormInputFLELocalKMS);

  const inUseEncryptionState = await promiseMap({
    fleKeyVaultNamespace: getValue(
      browser,
      Selectors.ConnectionFormInputFLEKeyVaultNamespace
    ),
    fleStoreCredentials: getCheckboxValue(
      browser,
      Selectors.ConnectionFormInputFLEStoreCredentialsCheckbox
    ),
    fleKey: getValue(browser, Selectors.ConnectionFormInputFLELocalKMS),
    fleEncryptedFieldsMap: browser.getCodemirrorEditorText(
      Selectors.ConnectionFormInputFLEEncryptedFieldsMapEditor
    ),
  });

  // Advanced
  await browser.navigateToConnectTab('Advanced');
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
    ...inUseEncryptionState,
  };

  // restore the initial state
  if (wasExpanded) {
    // get back to the tab it was on
    await browser.navigateToConnectTab(initialTab);
  } else {
    // collapse it again
    await browser.clickVisible(Selectors.ConnectionFormAdvancedToggle);

    await browser.waitUntil(async () => {
      const advancedButton = browser.$(Selectors.ConnectionFormAdvancedToggle);
      return (await advancedButton.getAttribute('aria-expanded')) === 'false';
    });
  }

  return result;
}

async function getCheckedRadioValue(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const elements = browser.$$(selector);
  for await (const element of elements) {
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
  const element = browser.$(selector);
  if (!(await element.isExisting())) {
    return null; // as opposed to true for checked and false for not
  }

  return element.isSelected();
}

async function getText(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const element = browser.$(selector);
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
  return text === 'Select a file…' ? null : text;
}

async function getValue(
  browser: CompassBrowser,
  selector: string
): Promise<string | null> {
  const element = browser.$(selector);
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
  const results = (
    await browser.$$(selector).map((element) => element.getValue())
  ).filter((result) => result !== '');

  return results.length ? results : null;
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

async function waitForElementAnimations(browser: CompassBrowser, element: any) {
  let previousResult = {
    ...(await element.getLocation()),
    ...(await element.getSize()),
  };
  await browser.waitUntil(async function () {
    // small delay to make sure that if it is busy animating it had time to move
    // before the first check and between each two checks
    await browser.pause(50);

    const result = {
      ...(await element.getLocation()),
      ...(await element.getSize()),
    };
    const stopped = _.isEqual(result, previousResult);
    previousResult = result;
    return stopped;
  });
}

const colorMap: Record<string, string> = {
  'no-color': 'No Color',
  color1: 'Green',
  color2: 'Teal',
  color3: 'Blue',
  color4: 'Iris',
  color5: 'Purple',
  color6: 'Red',
  color7: 'Pink',
  color8: 'Orange',
  color9: 'Yellow',
};

function colorValueToName(color: string): string {
  if (colorMap[color]) {
    return colorMap[color];
  }
  return color;
}

async function setKMSProviderName(
  browser: CompassBrowser,
  index: number,
  name: string
) {
  await browser.clickVisible(Selectors.connectionFormEditFLEName(index));
  return await browser.setValueVisible(
    Selectors.connectionFormInputFLELocalName(index),
    name
  );
}

export async function setConnectFormState(
  browser: CompassBrowser,
  state: ConnectFormState
): Promise<void> {
  await browser.resetConnectForm();

  // Something to keep in mind is that if you specify both connectionString AND
  // other options, then the other options are going to override the
  // connectionString. You probably want just one or the other.
  if (state.connectionString) {
    await browser.setValueVisible(
      Selectors.ConnectionFormStringInput,
      state.connectionString
    );
  }

  await browser.expandAccordion(Selectors.ConnectionFormAdvancedToggle);

  // General
  await browser.navigateToConnectTab('General');

  if (state.scheme) {
    await browser.clickParent(
      Selectors.connectionFormSchemeRadio(state.scheme)
    );
  }
  if (state.hosts) {
    for (let i = 0; i < state.hosts.length; ++i) {
      if (i > 0) {
        await browser.clickVisible(
          '[data-testid="connection-add-host-button"]:last-child'
        );
      }
      await browser.setValueVisible(
        `#connection-host-input-${i}`,
        state.hosts[i]
      );
    }
  }
  if (state.directConnection) {
    await browser.clickParent(Selectors.ConnectionFormDirectConnectionCheckbox);
  }

  if (state.connectionName) {
    await browser.setValueVisible(
      Selectors.ConnectionFormConnectionName,
      state.connectionName
    );
  }

  if (state.connectionColor) {
    await browser.selectOption(
      Selectors.ConnectionFormConnectionColor,
      colorValueToName(state.connectionColor)
    );
  }

  if (state.connectionFavorite) {
    await browser.clickParent(Selectors.ConnectionFormFavoriteCheckbox);
  }

  // Authentication
  if (
    state.authMethod ||
    state.defaultUsername ||
    state.defaultAuthSource ||
    state.defaultAuthMechanism ||
    state.kerberosPrincipal ||
    state.kerberosPrincipal ||
    state.kerberosServiceName ||
    state.kerberosCanonicalizeHostname ||
    state.kerberosServiceRealm ||
    state.kerberosProvidePassword ||
    state.kerberosPassword
  ) {
    await browser.navigateToConnectTab('Authentication');

    if (state.authMethod) {
      await browser.clickParent(
        Selectors.connectionFormAuthenticationMethodRadio(state.authMethod)
      );
    }

    // Username/Password
    if (state.defaultUsername && state.defaultPassword) {
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
    if (state.kerberosProvidePassword) {
      await browser.clickParent(Selectors.ConnectionFormGssApiPasswordCheckbox);
    }
    if (state.kerberosPassword) {
      await browser.setValueVisible(
        Selectors.ConnectionFormInputGssApiPassword,
        state.kerberosPassword
      );
    }

    // LDAP
    if (state.ldapUsername && state.ldapPassword) {
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
    if (state.awsAccessKeyId && state.awsSecretAccessKey) {
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
    if (state.awsSessionToken) {
      await browser.setValueVisible(
        Selectors.ConnectionFormInputAWSSessionToken,
        state.awsSessionToken
      );
    }

    // OIDC
    if (state.oidcUsername) {
      await browser.setValueVisible(
        Selectors.ConnectionFormInputOIDCUsername,
        state.oidcUsername
      );
    }
    if (state.oidcUseApplicationProxy === false) {
      await browser.expandAccordion(Selectors.ConnectionFormOIDCAdvancedToggle);
      await browser.clickParent(
        Selectors.ConnectionFormOIDCUseApplicationProxyCheckbox
      );
    }
  }

  // FLE2
  if (
    state.fleKeyVaultNamespace ||
    state.kmsProviders ||
    state.fleEncryptedFieldsMap
  ) {
    await browser.navigateToConnectTab('In-Use Encryption');

    if (state.fleKeyVaultNamespace) {
      await browser.setValueVisible(
        Selectors.ConnectionFormInputFLEKeyVaultNamespace,
        state.fleKeyVaultNamespace
      );
    }
    if ((state.kmsProviders?.local?.length ?? 0) > 0) {
      await browser.expandAccordion(Selectors.ConnectionFormInputFLELocalKMS);
      for (const [index, item] of (state.kmsProviders?.local ?? []).entries()) {
        if (item.name) {
          await setKMSProviderName(browser, index, item.name);
        }
        await browser.setValueVisible(
          Selectors.connectionFormInputFLELocalKey(index),
          item.key
        );
        await browser.clickVisible(
          Selectors.ConnectionFormAddNewKMSProviderButton
        );
      }
    }
    if (state.fleEncryptedFieldsMap) {
      // set the text in the editor
      await browser.setCodemirrorEditorValue(
        Selectors.ConnectionFormInputFLEEncryptedFieldsMapEditor,
        state.fleEncryptedFieldsMap
      );
    }
  }

  // TLS/SSL
  if (
    state.sslConnection ||
    state.tlsCAFile ||
    state.tlsCertificateKeyFile ||
    state.clientKeyPassword ||
    state.tlsInsecure ||
    state.tlsAllowInvalidHostnames ||
    state.tlsAllowInvalidCertificates
  ) {
    await browser.navigateToConnectTab('TLS/SSL');

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
  }

  // Proxy/SSH
  if (
    state.proxyMethod ||
    state.sshPasswordHost ||
    state.sshPasswordUsername ||
    state.sshPasswordPassword ||
    state.sshIdentityHost ||
    state.sshIdentityUsername ||
    state.sshIdentityKeyFile ||
    state.sshIdentityPassword ||
    state.socksHost ||
    state.socksPort ||
    state.socksUsername ||
    state.socksPassword
  ) {
    await browser.navigateToConnectTab('Proxy/SSH');

    //proxyMethod
    if (state.proxyMethod) {
      await browser.clickParent(
        Selectors.connectionFormProxyMethodRadio(state.proxyMethod)
      );
    }

    // SSH with Password
    // NOTE: these don't affect the URI
    if (state.sshPasswordHost && state.sshPasswordPort) {
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
    if (state.sshIdentityHost && state.sshIdentityPort) {
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
  }

  // Advanced
  if (
    state.readPreference ||
    state.replicaSet ||
    state.defaultDatabase ||
    state.urlOptions
  ) {
    await browser.navigateToConnectTab('Advanced');

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

        let found = false;
        let allText: string[] = [];

        // for whatever reasons sometimes the first one or two come through as empty strings
        await browser.waitUntil(async () => {
          allText = [];
          const options = browser.$$('#select-key-menu [role="option"]');
          for await (const option of options) {
            const _text = await option.getText();
            const text = _text.trim();
            allText.push(text);
            if (text === key) {
              found = true;
              await option.scrollIntoView();
              await option.waitForDisplayed();
              await waitForElementAnimations(browser, option);
              await option.click();
              break;
            }
          }
          return found;
        });

        // make sure we found and clicked on an option
        expect(
          found,
          `Could not find URL option "${key}". Found "${allText.join(', ')}"`
        ).to.be.true;

        // make sure the menu goes away once we clicked on the option
        const menu = browser.$('#select-key-menu');
        await menu.waitForExist({ reverse: true });

        // value
        await browser.setValueVisible(
          Selectors.connectionFormUrlOptionValueInput(index),
          value
        );
      }
    }
  }
}

export async function saveConnection(
  browser: CompassBrowser,
  state: ConnectFormState
): Promise<void> {
  await browser.setConnectFormState(state);
  await browser.clickVisible(Selectors.ConnectionModalSaveButton);
  await browser
    .$(Selectors.ConnectionModal)
    .waitForDisplayed({ reverse: true });
}

export async function setupDefaultConnections(browser: CompassBrowser) {
  // When running tests against Atlas Cloud, connections can't be added or
  // removed from the UI manually, so we skip setup for default connections
  if (isTestingAtlasCloudExternal() || isTestingAtlasCloudSandbox()) {
    return;
  }

  /*
  This is intended to be used by most test files (ones that don't care too much
  about the intricacies about connections) in a before() hook after starting
  compass.

  A beforeEach() hook can then use await browser.disconnectAll() to
  disconnect all connections and use browser.connectToDefaults() to connect
  to the existing connections without having to create them again via the
  connection form.

  Then every test in that file starts with two connections that have the same
  databases and collections. This forces tests to always encounter the "worst
  case" where there are multiple connections connected and the database and
  collection names are ambiguous.

  There is no good reason for this command to use the UI to create the
  connections. It could also import them from a file, for example. Alternatively
  we could have used the CLI to import connections from a file, but then that
  affects the way we start compass and ties up the optional CLI parameters
  whereas we do have some tests that try and use those. We can easily change
  this in future if needed, though.
  */
  for (const connectionInfo of DEFAULT_CONNECTIONS) {
    const connectionName = getConnectionTitle(connectionInfo);
    if (await browser.removeConnection(connectionName)) {
      debug('Removing existing connection so we do not create a duplicate', {
        connectionName,
      });
    }
  }

  for (const connectionInfo of DEFAULT_CONNECTIONS) {
    await browser.saveConnection({
      connectionString: connectionInfo.connectionOptions.connectionString,
      connectionName: connectionInfo.favorite?.name,
      connectionColor: connectionInfo.favorite?.color,
    });
  }
}
