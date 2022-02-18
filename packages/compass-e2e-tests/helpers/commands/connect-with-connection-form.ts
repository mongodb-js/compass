import type { CompassBrowser } from '../compass-browser';
import type { AuthMechanism } from 'mongodb';

import * as Selectors from '../selectors';

const defaultTimeoutMS = 30_000;

type ConnectOptions = {
  host: string;
  port?: number;
  srvRecord?: boolean;
  username?: string;
  password?: string;
  authMechanism?: AuthMechanism;
  gssapiServiceName?: string;
  replicaSet?: string;
  tlsAllowInvalidHostnames?: boolean;
  sslValidate?: boolean;
  tlsCAFile?: string;
  tlsCertificateKeyFile?: string;
  sshTunnelHostname?: string;
  sshTunnelPort?: string;
  sshTunnelUsername?: string;
  sshTunnelPassword?: string;
  sshTunnelIdentityFile?: string;
};

export async function connectWithConnectionForm(
  browser: CompassBrowser,
  options: ConnectOptions,
  timeout = defaultTimeoutMS,
  connectionStatus: 'success' | 'failure' | 'either' = 'success'
): Promise<void> {
  const { host, srvRecord, authMechanism, username, password } = options;

  const connectionFormButtonElement = await browser.$(
    Selectors.ShowConnectionFormButton
  );
  if (await connectionFormButtonElement.isDisplayed()) {
    await browser.clickVisible(Selectors.ShowConnectionFormButton);
  }

  await browser.clickVisible(Selectors.ConnectionFormGeneralTabButton);

  if (typeof host !== 'undefined') {
    const element = await browser.$(Selectors.ConnectionFormInputHostname);
    await element.setValue(host);
  }

  if (srvRecord === true) {
    await browser.click(Selectors.ConnectionFormInputSrvRecord);
  }

  if (authMechanism === 'DEFAULT') {
    await fillAuthMechanismDefaultFields(browser, { username, password });
  }

  await browser.doConnect(timeout, connectionStatus);
}

async function fillAuthMechanismDefaultFields(
  browser: CompassBrowser,
  { username, password }: Pick<ConnectOptions, 'username' | 'password'>
): Promise<void> {
  await browser.clickVisible(Selectors.ConnectionFormAuthenticationTabButton);
  await browser.click(Selectors.ConnectionFormDefaultAuthMethodButton);
  const usernameInput = await browser.$(Selectors.ConnectionFormInputUsername);
  await usernameInput.setValue(username);

  const passwordInput = await browser.$(Selectors.ConnectionFormInputPassword);
  await passwordInput.setValue(password);
}
