import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

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
  await browser
    .$(Selectors.workspaceTab({ connectionName, title: tabName, active: true }))
    .waitForDisplayed();
}
