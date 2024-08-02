import {
  DEFAULT_CONNECTION_STRING,
  TEST_MULTIPLE_CONNECTIONS,
  connectionNameFromString,
} from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import Debug from 'debug';
const debug = Debug('compass-e2e-tests');

export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionString = DEFAULT_CONNECTION_STRING,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    // if the modal is still animating away when we're connecting again, things
    // are going to get confused
    await browser
      .$(Selectors.ConnectionModal)
      .waitForDisplayed({ reverse: true });

    // if a connection with this name already exists, remove it otherwise we'll
    // add a duplicate and things will get complicated fast
    const connectionName = connectionNameFromString(connectionString);
    if (await browser.removeConnection(connectionName)) {
      debug('Removing existing connection so we do not create a duplicate', {
        connectionName,
      });
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
