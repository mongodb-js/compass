import {
  DEFAULT_CONNECTION_STRING,
  TEST_MULTIPLE_CONNECTIONS,
  connectionNameFromString,
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
    // if a connection with this name already exists, remove it otherwise we'll
    // add a duplicate and things will get complicated fast
    const connectionName = connectionNameFromString(connectionString);

    // make sure there's no filter because if the connection is not displayed then we can't remove it
    if (await browser.$(Selectors.SidebarFilterInput).isExisting()) {
      await browser.clickVisible(Selectors.SidebarFilterInput);
      await browser.setValueVisible(Selectors.SidebarFilterInput, '');

      // wait for a connection to appear. It must because if there are no
      // connections the filter field wouldn't exist in the first place
      await browser.$(Selectors.SidebarTreeItems).waitForDisplayed();
    }

    const selector = Selectors.sidebarConnection(connectionName);
    if (await browser.$(selector).isExisting()) {
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.RemoveConnectionItem
      );
      await browser.$(selector).waitForExist({ reverse: true });
    }

    await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
    await browser.$(Selectors.ConnectionModal).waitForDisplayed();
  }

  await browser.setValueVisible(
    Selectors.ConnectionFormStringInput,
    connectionString
  );
  await browser.doConnect(connectionStatus, timeout);
}
