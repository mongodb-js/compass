import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { WorkspaceTabSelectorOptions } from '../selectors';

export async function navigateToConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  tabType: 'Performance' | 'Databases'
): Promise<void> {
  if (tabType === 'Databases') {
    await browser.clickVisible(Selectors.sidebarConnection(connectionName));
  } else {
    await browser.selectConnectionMenuItem(
      connectionName,
      Selectors.Multiple.ViewPerformanceItem
    );
  }

  await waitUntilActiveConnectionTab(browser, connectionName, tabType);
}

export async function waitUntilActiveConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  tabType: 'Performance' | 'Databases'
) {
  const options: WorkspaceTabSelectorOptions = {
    type: tabType,
    connectionName,
    active: true,
  };
  await browser.$(Selectors.workspaceTab(options)).waitForDisplayed();
}
