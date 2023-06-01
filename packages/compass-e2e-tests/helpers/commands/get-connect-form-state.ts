import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { ConnectFormState } from '../connect-form-state';

export async function getConnectFormState(
  browser: CompassBrowser,
  isFocused = false
): Promise<ConnectFormState> {
  const wasExpanded = await browser.expandAccordion(
    Selectors.ShowConnectionFormButton
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
    useSystemCA: getCheckboxValue(
      browser,
      Selectors.ConnectionFormTlsUseSystemCACheckbox
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
    await browser.clickVisible(Selectors.ShowConnectionFormButton);

    await browser.waitUntil(async () => {
      const advancedButton = await browser.$(
        Selectors.ShowConnectionFormButton
      );
      return (await advancedButton.getAttribute('aria-expanded')) === 'false';
    });
  }

  return result;
}

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
