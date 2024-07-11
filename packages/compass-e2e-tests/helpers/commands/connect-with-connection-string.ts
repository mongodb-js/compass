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
    // if the modal is still animating away when we're connecting again, things
    // are going to get confused
    await browser
      .$(Selectors.ConnectionModal)
      .waitForDisplayed({ reverse: true });

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

  // Ideally this would be part of browser.doConnect() and
  // browser.waitForConnectionResult(), but that requires the context of
  // connectionName there. Which is easy enough for connectWithConnectionString,
  // but not so easy right now for connectWithConnectionForm.
  if (TEST_MULTIPLE_CONNECTIONS) {
    // There's a potential problem here: The list of connections is virtual, so
    // the new connection might not be rendered. By searching for it if possible
    // we can guarantee that it will be on screen. The search box won't exist
    // for the first connection, but that's OK because once connected it will be
    // the only connection so should be rendered.
    if (await browser.$(Selectors.SidebarFilterInput).isExisting()) {
      await browser.clickVisible(Selectors.SidebarFilterInput);
      await browser.setValueVisible(Selectors.SidebarFilterInput, '');
    }

    // some connection should be expanded (ie. connected) by now
    await browser
      .$(`${Selectors.SidebarTreeItems}[aria-expanded=true]`)
      .waitForExist();
  }
}
