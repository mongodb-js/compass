import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

async function resetForRemove(browser: CompassBrowser) {
  await browser.hideVisibleModal();

  // Collapse all the connections so that they will all hopefully fit on screen
  // and therefore be rendered.
  await browser.clickVisible(Selectors.CollapseConnectionsButton);

  if (await browser.$(Selectors.SidebarFilterInput).isDisplayed()) {
    // Clear the filter to make sure every connection shows
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, '');
  }
}

export async function removeAllConnections(
  browser: CompassBrowser
): Promise<void> {
  // This command is mostly intended for use inside a beforeEach() hook in test
  // files that might create a lot of connections that will start running into
  // virtual scrolling issues

  // The previous test could have ended with modals and/or toasts left open and
  // a search filter in the sidebar. Reset those so we can get to a known state.
  await resetForRemove(browser);

  // The potential problem here is that the list is virtual, so it is possible
  // that not every connection is rendered. Collapsing them all helps a little
  // bit, though.
  const connectionItems = browser.$$(Selectors.Multiple.ConnectionItems);
  for await (const connectionItem of connectionItems) {
    console.log(connectionItem);
    const connectionName = await connectionItem.getAttribute(
      'data-connection-name'
    );
    await browser.removeConnectionByName(connectionName);
  }
}

export async function removeConnectionByName(
  browser: CompassBrowser,
  connectionName: string
) {
  await resetForRemove(browser);

  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.Multiple.RemoveConnectionItem
  );

  await browser
    .$(Selectors.Multiple.connectionItemByName(connectionName))
    .waitForDisplayed({ reverse: true });
}
