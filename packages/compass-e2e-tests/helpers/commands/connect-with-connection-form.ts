import type { CompassBrowser } from '../compass-browser';
import type { ConnectFormState } from '../connect-form-state';
import * as Selectors from '../selectors';

export async function connectWithConnectionForm(
  browser: CompassBrowser,
  options: ConnectFormState,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<void> {
  const sidebar = await browser.$(Selectors.SidebarTitle);
  if (await sidebar.isDisplayed()) {
    await browser.disconnect();
  }

  await browser.setConnectFormState(options);

  await browser.doConnect(connectionStatus, timeout);
}
