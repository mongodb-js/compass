import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function getConnectionIdByName(
  browser: CompassBrowser,
  connectionName: string
): Promise<string | undefined> {
  const connections = browser.$$(Selectors.sidebarConnection(connectionName));

  const numConnections = await connections.length;

  if (numConnections !== 1) {
    throw new Error(
      `Found ${numConnections} connections named ${connectionName}.`
    );
  }

  return await browser
    .$(Selectors.sidebarConnection(connectionName))
    .getAttribute('data-connection-id');
}

export async function selectConnection(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.Multiple.EditConnectionItem
  );

  await browser.waitUntil(async () => {
    const connectionTitleSelector = Selectors.ConnectionModalTitle;

    const text = await browser.$(connectionTitleSelector).getText();
    return text === connectionName;
  });
}

export async function selectConnectionMenuItem(
  browser: CompassBrowser,
  connectionName: string,
  itemSelector: string,
  openMenu = true
) {
  const Sidebar = Selectors.Multiple;

  const selector = Selectors.sidebarConnection(connectionName);

  await browser.waitUntil(async () => {
    if (
      await browser
        .$(Selectors.sidebarConnectionMenuButton(connectionName))
        .isDisplayed()
    ) {
      return true;
    }

    // It takes some time for the connections to load
    await browser.$(selector).waitForDisplayed();

    // workaround for weirdness in the ItemActionControls menu opener icon
    await browser.clickVisible(Sidebar.ConnectionsTitle);

    // Hover over an arbitrary other element to ensure that the second hover will
    // actually be a fresh one. This otherwise breaks if this function is called
    // twice in a row.
    await browser.hover(`*:not(${selector}, ${selector} *)`);

    await browser.hover(selector);
    return false;
  });

  // if the action lives outside of the three-dot menu, then there's no need to open the menu
  if (openMenu) {
    await browser.clickVisible(
      Selectors.sidebarConnectionMenuButton(connectionName)
    );
    await browser.$(Sidebar.ConnectionMenu).waitForDisplayed();
  }

  await browser.clickVisible(itemSelector);
}

export async function removeConnection(
  browser: CompassBrowser,
  connectionName: string
): Promise<boolean> {
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
    return true;
  }
  return false;
}

export async function hasConnectionMenuItem(
  browser: CompassBrowser,
  connectionName: string,
  itemSelector: string,
  openMenu = true
) {
  const selector = Selectors.sidebarConnection(connectionName);

  await browser.waitUntil(async () => {
    if (
      await browser
        .$(Selectors.sidebarConnectionMenuButton(connectionName))
        .isDisplayed()
    ) {
      return true;
    }

    // It takes some time for the connections to load
    await browser.$(selector).waitForDisplayed();

    // workaround for weirdness in the ItemActionControls menu opener icon
    await browser.clickVisible(Selectors.Multiple.ConnectionsTitle);

    // Hover over an arbitrary other element to ensure that the second hover will
    // actually be a fresh one. This otherwise breaks if this function is called
    // twice in a row.
    await browser.hover(Selectors.Multiple.ConnectionsTitle);

    await browser.hover(selector);
    return false;
  });

  // if the action lives outside of the three-dot menu, then there's no need to open the menu
  if (openMenu) {
    await browser.clickVisible(
      Selectors.sidebarConnectionMenuButton(connectionName)
    );
    await browser.$(Selectors.Multiple.ConnectionMenu).waitForDisplayed();
  }

  return await browser.$(itemSelector).isExisting();
}
