import type { CompassBrowser } from '../compass-browser';
import type { ConnectFormState } from '../connect-form-state';

export async function connectWithConnectionForm(
  browser: CompassBrowser,
  options: ConnectFormState,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<void> {
  await browser.disconnect();

  // If a connectionName is specified and a connection already exists with this
  // name, make sure we don't add a duplicate so that tests can always address
  // this new connection.
  if (options.connectionName) {
    await browser.removeConnection(options.connectionName);
  }

  await browser.setConnectFormState(options);

  await browser.doConnect(connectionStatus, timeout);
}
