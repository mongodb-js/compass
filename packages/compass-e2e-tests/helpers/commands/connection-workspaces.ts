import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { WorkspaceTabSelectorOptions } from '../selectors';

export async function navigateToConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  tabName: 'Performance' | 'Databases'
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    if (tabName === 'Databases') {
      await browser.clickVisible(Selectors.sidebarConnection(connectionName));
    } else {
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.ViewPerformanceItem
      );
    }

    await waitUntilActiveConnectionTab(browser, connectionName, tabName);
  } else {
    const itemSelector = Selectors.sidebarInstanceNavigationItem(tabName);
    await browser.clickVisible(itemSelector);
    await waitUntilActiveConnectionTab(browser, connectionName, tabName);
  }
}

export async function waitUntilActiveConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  tabName: 'Performance' | 'Databases'
) {
  const options: WorkspaceTabSelectorOptions = { title: tabName, active: true };

  // Only add the connectionName for multiple connections because for some
  // reason this sometimes flakes in single connections even though the tab is
  // definitely there in the screenshot.
  if (TEST_MULTIPLE_CONNECTIONS) {
    options.connectionName = connectionName;
  }
  await browser.$(Selectors.workspaceTab(options)).waitForDisplayed();
}
