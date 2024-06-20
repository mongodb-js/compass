import {
  DEFAULT_CONNECTION_STRING,
  TEST_MULTIPLE_CONNECTIONS,
} from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionString = DEFAULT_CONNECTION_STRING,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<void> {
  await browser.disconnect();

  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
    await browser.$(Selectors.ConnectionModal).waitForDisplayed();
  }

  await browser.setValueVisible(
    Selectors.ConnectionFormStringInput,
    connectionString
  );
  await browser.doConnect(connectionStatus, timeout);
}
