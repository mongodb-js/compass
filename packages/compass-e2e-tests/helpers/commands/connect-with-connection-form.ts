import type { CompassBrowser } from '../compass-browser';
import type { ConnectFormState } from '../connect-form-state';
import * as Selectors from '../selectors';

const defaultTimeoutMS = 30_000;

export async function connectWithConnectionForm(
  browser: CompassBrowser,
  options: ConnectFormState,
  timeout = defaultTimeoutMS,
  connectionStatus: 'success' | 'failure' | 'either' = 'success'
): Promise<void> {
  const sidebar = await browser.$(Selectors.SidebarTitle);
  if (await sidebar.isDisplayed()) {
    await browser.disconnect();
  }

  await browser.setConnectFormState(options);

  await browser.doConnect(timeout, connectionStatus);
}
