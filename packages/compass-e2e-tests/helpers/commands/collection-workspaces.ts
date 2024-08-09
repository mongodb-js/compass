import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { WorkspaceTabSelectorOptions } from '../selectors';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function navigateToCollection(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string,
  collectionName: string,

  // Close all the workspace tabs to get rid of all the state we
  // might have accumulated. This is the only way to get back to the zero
  // state of Schema, and Validation tabs without re-connecting.
  closeExistingTabs = true
): Promise<void> {
  const connectionId = await browser.getConnectionIdByName(connectionName);

  const collectionSelector = Selectors.sidebarCollection(
    connectionId,
    dbName,
    collectionName
  );

  if (closeExistingTabs) {
    await browser.closeWorkspaceTabs();
  }

  // search for the collection and wait for the collection to be there and visible
  await browser.clickVisible(Selectors.SidebarFilterInput);
  await browser.setValueVisible(
    Selectors.SidebarFilterInput,
    `^(${dbName}|${collectionName})$`
  );
  const collectionElement = await browser.$(collectionSelector);

  await collectionElement.waitForDisplayed();

  // click it and wait for the collection header to become visible
  await browser.clickVisible(collectionSelector);
  await waitUntilActiveCollectionTab(
    browser,
    connectionName,
    dbName,
    collectionName
  );
}

export async function navigateToCollectionTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string,
  collectionName: string,
  tabName:
    | 'Documents'
    | 'Aggregations'
    | 'Schema'
    | 'Indexes'
    | 'Validation' = 'Documents',
  closeExistingTabs = true
): Promise<void> {
  await navigateToCollection(
    browser,
    connectionName,
    dbName,
    collectionName,
    closeExistingTabs
  );

  // wait for the tooltip to be gone
  await browser.clickVisible(Selectors.SidebarFilterInput);
  await browser
    .$(Selectors.WorkspaceTabTooltip)
    .waitForDisplayed({ reverse: true });

  await navigateWithinCurrentCollectionTabs(browser, tabName);

  // I don't know why, but sometimes the tooltip is shown at this point again
  await browser.clickVisible(Selectors.SidebarFilterInput);
  await browser
    .$(Selectors.WorkspaceTabTooltip)
    .waitForDisplayed({ reverse: true });
}

export async function navigateWithinCurrentCollectionTabs(
  browser: CompassBrowser,
  tabName:
    | 'Documents'
    | 'Aggregations'
    | 'Schema'
    | 'Indexes'
    | 'Validation' = 'Documents'
): Promise<void> {
  const tab = browser.$(Selectors.collectionSubTab(tabName));
  const selectedTab = browser.$(Selectors.collectionSubTab(tabName, true));

  if (await selectedTab.isExisting()) {
    return;
  }

  // otherwise select the tab and wait for it to become selected
  await browser.clickVisible(tab);

  await waitUntilActiveCollectionSubTab(browser, tabName);
}

async function waitUntilActiveCollectionTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string,
  collectionName: string,
  tabName:
    | 'Documents'
    | 'Aggregations'
    | 'Schema'
    | 'Indexes'
    | 'Validation'
    | null = null
) {
  const options: WorkspaceTabSelectorOptions = {
    type: 'Collection',
    namespace: `${dbName}.${collectionName}`,
    active: true,
  };
  // Only add the connectionName for multiple connections because for some
  // reason this sometimes flakes in single connections even though the tab is
  // definitely there in the screenshot.
  if (TEST_MULTIPLE_CONNECTIONS) {
    options.connectionName = connectionName;
  }
  await browser.$(Selectors.workspaceTab(options)).waitForDisplayed();
  if (tabName) {
    await waitUntilActiveCollectionSubTab(browser, tabName);
  }
}

export async function waitUntilActiveCollectionSubTab(
  browser: CompassBrowser,
  tabName:
    | 'Documents'
    | 'Aggregations'
    | 'Schema'
    | 'Indexes'
    | 'Validation' = 'Documents'
) {
  await browser.$(Selectors.collectionSubTab(tabName, true)).waitForDisplayed();
}

export async function getActiveTabNamespace(browser: CompassBrowser) {
  const activeWorkspaceNamespace = await browser
    .$(Selectors.workspaceTab({ active: true }))
    .getAttribute('data-namespace');
  return activeWorkspaceNamespace || null;
}
