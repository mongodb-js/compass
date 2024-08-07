import { TEST_COMPASS_WEB, TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import delay from '../delay';
import * as Selectors from '../selectors';

async function disconnectAllWeb(browser: CompassBrowser): Promise<void> {
  const url = new URL(await browser.getUrl());
  url.pathname = '/';
  await browser.navigateTo(url.toString());
  const element = await browser.$(Selectors.ConnectionFormStringInput);
  await element.waitForDisplayed();
}

async function disconnectAllSingle(browser: CompassBrowser) {
  const cancelConnectionButtonElement = await browser.$(
    Selectors.CancelConnectionButton
  );
  // If we are still connecting, let's try cancelling the connection first
  if (await cancelConnectionButtonElement.isDisplayed()) {
    try {
      await browser.closeConnectModal();
    } catch (e) {
      // If that failed, the button was probably gone before we managed to
      // click it. Let's go through the whole disconnecting flow now
    }
  }

  await delay(100);

  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.emit('app:disconnect');
  });

  // for single connections we expect the connect screen to re-appear
  await browser.$(Selectors.ConnectSection).waitForDisplayed();

  // clear the form
  await browser.clickVisible(Selectors.Single.SidebarNewConnectionButton);
  await delay(100);
}

export async function disconnectAll(
  browser: CompassBrowser,
  {
    closeToasts = true,
  }: {
    closeToasts?: boolean;
  } = {}
): Promise<void> {
  if (TEST_COMPASS_WEB) {
    return await disconnectAllWeb(browser);
  }

  if (!TEST_MULTIPLE_CONNECTIONS) {
    return await disconnectAllSingle(browser);
  }

  if (await browser.$(Selectors.SidebarFilterInput).isDisplayed()) {
    // Clear the filter to make sure every connection shows
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, '');
  }

  // The potential problem here is that the list is virtual, so it is possible
  // that not every connection is rendered.
  const connectionItems = await browser.$$(
    Selectors.Multiple.ConnectedConnectionItems
  );
  for (const connectionItem of connectionItems) {
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
  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.Multiple.DisconnectConnectionItem
  );

  // Assume that once the connection is collapsed it is disconnected. It is
  // technically possible to collapse a connected connection, so we might want
  // to improve on this in future.
  await browser
    .$(Selectors.Multiple.connectionItemByName(connectionName, false))
    .waitForDisplayed();
}
