import { DEFAULT_CONNECTION_STRING } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionString = DEFAULT_CONNECTION_STRING,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<void> {
  const sidebar = await browser.$(Selectors.Sidebar);
  if (await sidebar.isDisplayed()) {
    await browser.disconnect();
  }

  await browser.setValueVisible(
    Selectors.ConnectionStringInput,
    connectionString
  );
  await browser.doConnect(connectionStatus, timeout);
}
