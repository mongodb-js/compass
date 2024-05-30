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
  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.clickVisible(Selectors.SidebarNewConnectionButton);
    await browser.$(Selectors.ConnectionModal).waitForDisplayed();
  } else {
    const sidebar = await browser.$(Selectors.Sidebar);
    if (await sidebar.isDisplayed()) {
      await browser.disconnect();
    }
  }

  await browser.setValueVisible(
    Selectors.ConnectionStringInput,
    connectionString
  );
  await browser.doConnect(connectionStatus, timeout);
}
