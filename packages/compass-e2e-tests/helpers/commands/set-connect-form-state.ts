import _ from 'lodash';
import { expect } from 'chai';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { ConnectFormState } from '../connect-form-state';

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

export async function setConnectFormState(
  browser: CompassBrowser,
  state: ConnectFormState
): Promise<void> {
  await browser.resetConnectForm();

  await browser.expandAccordion(Selectors.ShowConnectionFormButton);

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
        `[data-testid="connection-host-input-${i}"]`,
        state.hosts[i]
      );
    }
  }
  if (state.directConnection) {
    await browser.clickParent(Selectors.ConnectionFormDirectConnectionCheckbox);
  }

  // Authentication
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

  // FLE2
  await browser.navigateToConnectTab('In-Use Encryption');

  if (state.fleKeyVaultNamespace) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputFLEKeyVaultNamespace,
      state.fleKeyVaultNamespace
    );
  }
  if (state.fleKey) {
    await browser.expandAccordion(Selectors.ConnectionFormInputFLELocalKMS);
    await browser.setValueVisible(
      Selectors.ConnectionFormInputFLELocalKey,
      state.fleKey
    );
  }
  if (state.fleEncryptedFieldsMap) {
    // set the text in the editor
    await browser.setCodemirrorEditorValue(
      Selectors.ConnectionFormInputFLEEncryptedFieldsMapEditor,
      state.fleEncryptedFieldsMap
    );
  }

  // TLS/SSL
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
  if (state.useSystemCA) {
    await browser.clickParent(Selectors.ConnectionFormTlsUseSystemCACheckbox);
  }

  // Proxy/SSH
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

  // Advanced
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
      const options = await browser.$$('#select-key-menu [role="option"]');
      const allText = [];
      for (const option of options) {
        const text = (await option.getText()).trim();
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

      // make sure we found and clicked on an option
      expect(
        found,
        `Count not find URL option "${key}". Found "${allText.join(', ')}"`
      ).to.be.true;

      // make sure the menu goes away once we clicked on the option
      const menu = await browser.$('#select-key-menu');
      await menu.waitForExist({ reverse: true });

      // value
      await browser.setValueVisible(
        Selectors.connectionFormUrlOptionValueInput(index),
        value
      );
    }
  }
}
