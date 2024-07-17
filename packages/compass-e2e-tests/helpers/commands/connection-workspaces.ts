import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function navigateToConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  workspace: 'Performance' | 'Databases'
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    if (workspace === 'Databases') {
      await browser.clickVisible(Selectors.sidebarConnection(connectionName));
    } else {
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.ViewPerformanceItem
      );
    }

    await waitUntilActiveConnectionTab(browser, connectionName, workspace);
  } else {
    const itemSelector = Selectors.sidebarInstanceNavigationItem(workspace);
    await browser.clickVisible(itemSelector);
    await waitUntilActiveConnectionTab(browser, connectionName, workspace);
  }
}

export async function waitUntilActiveConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  workspace: 'Performance' | 'Databases'
) {
  // TODO(COMPASS-8002): we should differentiate by connectionName somehow
  await browser
    .$(Selectors.connectionWorkspaceTab(connectionName, workspace, true))
    .waitForDisplayed();
}
