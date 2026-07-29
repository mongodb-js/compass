import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function selectCollectionMenuItem(
  browser: CompassBrowser,
  connectionName: string,
  databaseName: string,
  collectionName: string,
  actionName: string
) {
  const connectionId = await browser.pages.sidebar.getConnectionIdByName(
    connectionName
  );

  // search for the view in the sidebar
  await browser.clickVisible(browser.pages.sidebar.$filterInput);
  await browser.setValueVisible(
    browser.pages.sidebar.$filterInput,
    `${databaseName}.${collectionName}`
  );

  const collectionSelector = Selectors.sidebarCollection(
    connectionId,
    databaseName,
    collectionName
  );

  // scroll to the collection if necessary
  await browser.pages.sidebar.scrollToCollection(
    connectionId,
    databaseName,
    collectionName
  );

  const collectionElement = browser.$(collectionSelector);
  await collectionElement.waitForDisplayed();

  // hover over the collection
  await browser.hover(collectionSelector);

  // click the show collections button
  // NOTE: This assumes it is currently closed
  await browser.clickVisible(
    `${collectionSelector} ${Selectors.SidebarNavigationItemShowActionsButton}`
  );

  const actionSelector = `[role="menuitem"][data-action="${actionName}"]`;

  const actionButton = browser.$(actionSelector);

  // click the action
  await browser.clickVisible(actionSelector);

  // make sure the menu closed
  await actionButton.waitForDisplayed({ reverse: true });
}
