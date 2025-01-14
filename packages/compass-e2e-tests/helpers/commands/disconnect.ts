import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

async function resetForDisconnect(
  browser: CompassBrowser,
  {
    closeToasts = true,
  }: {
    closeToasts?: boolean;
  } = {}
) {
  await browser.hideVisibleModal();

  // Collapse all the connections so that they will all hopefully fit on screen
  // and therefore be rendered.
  await browser.clickVisible(Selectors.CollapseConnectionsButton);

  if (await browser.$(Selectors.SidebarFilterInput).isDisplayed()) {
    // Clear the filter to make sure every connection shows
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, '');
  }

  if (closeToasts) {
    await browser.hideAllVisibleToasts();
  }
}

export async function disconnectAll(
  browser: CompassBrowser,
  {
    closeToasts = true,
  }: {
    closeToasts?: boolean;
  } = {}
): Promise<void> {
  // This command is mostly intended for use inside a beforeEach() hook,
  // probably in conjunction with browser.connectToDefaults() so that each test
  // will start off with multiple connections already connected.

  // The previous test could have ended with modals and/or toasts left open and
  // a search filter in the sidebar. Reset those so we can get to a known state.
  await resetForDisconnect(browser, { closeToasts });

  // The potential problem here is that the list is virtual, so it is possible
  // that not every connection is rendered. Collapsing them all helps a little
  // bit, though.
  const connectionItems = browser.$$(
    Selectors.Multiple.ConnectedConnectionItems
  );
  for await (const connectionItem of connectionItems) {
    const connectionName = await connectionItem.getAttribute(
      'data-connection-name'
    );
    await browser.disconnectByName(connectionName);
  }

  if (closeToasts) {
    // If we disconnected "too soon" and we get an error like "Failed to
    // retrieve server info" or similar, there might be an error or warning
    // toast by now. If so, just close it otherwise the next test or connection
    // attempt will be confused by it.
    await browser.hideAllVisibleToasts();
  }

  // NOTE: unlike the single connection flow this doesn't make sure the New
  // Connection modal is open after disconnecting.
  // This also doesn't remove all connections from the sidebar so the
  // connection will still be there, just disconnected.
}

export async function disconnectByName(
  browser: CompassBrowser,
  connectionName: string
) {
  await resetForDisconnect(browser, { closeToasts: false });

  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.Multiple.DisconnectConnectionItem
  );

  await browser
    .$(
      Selectors.Multiple.connectionItemByName(connectionName, {
        connected: false,
      })
    )
    .waitForDisplayed();
}
