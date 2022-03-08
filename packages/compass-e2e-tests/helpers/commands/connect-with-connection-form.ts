import type { CompassBrowser } from '../compass-browser';
import type { ConnectFormState } from '../connect-form-state';

const defaultTimeoutMS = 30_000;

export async function connectWithConnectionForm(
  browser: CompassBrowser,
  options: ConnectFormState,
  timeout = defaultTimeoutMS,
  connectionStatus: 'success' | 'failure' | 'either' = 'success'
): Promise<void> {
  await browser.setConnectFormState(options);

  await browser.doConnect(timeout, connectionStatus);
}
