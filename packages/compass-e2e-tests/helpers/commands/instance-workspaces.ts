import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

// TODO(COMPASS-8002): remove this in favor of navigateToConnectionTab once we're in a multi-connection only world
export async function navigateToInstanceTab(
  browser: CompassBrowser,
  // TODO(COMPASS-8006): we need to move My Queries somewhere else
  tabName: 'My Queries' | 'Performance' | 'Databases' = 'My Queries'
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS && tabName !== 'My Queries') {
    throw new Error(
      'Use a different custom command that takes into account the connection name'
    );
  }

  const itemSelector = Selectors.sidebarInstanceNavigationItem(tabName);
  await browser.clickVisible(itemSelector);
  await waitUntilActiveInstanceTab(browser, tabName);
}

// TODO(COMPASS-8002): remove this in favor of waitUntilActiveConnectionTab once we're in a multi-connection only world
export async function waitUntilActiveInstanceTab(
  browser: CompassBrowser,
  // TODO(COMPASS-8006): we need to move My Queries somewhere else
  tabName: 'My Queries' | 'Performance' | 'Databases' = 'My Queries'
) {
  if (TEST_MULTIPLE_CONNECTIONS && tabName !== 'My Queries') {
    throw new Error(
      'Use a different custom command that takes into account the connection name'
    );
  }

  await browser
    .$(Selectors.instanceWorkspaceTab(tabName, true))
    .waitForDisplayed();
}

export async function navigateToConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  tabName: 'Performance' | 'Databases' = 'Databases'
): Promise<void> {
  if (!TEST_MULTIPLE_CONNECTIONS) {
    return navigateToInstanceTab(browser, tabName);
  }

  if (tabName === 'Databases') {
    await browser.clickVisible(
      Selectors.sidebarActiveConnection(connectionName)
    );
  } else {
    // TODO(COMPASS-8002): click the three dots menu then the relevant option. (View performance metrics)
    // (This will be easier to do if we merge the active and saved connectins
    // because selectConnectionMenuItem() acts on the saved connection, not the active connection)
    throw new Error('unimplemented');
  }

  await waitUntilActiveConnectionTab(browser, tabName);
}

export async function waitUntilActiveConnectionTab(
  browser: CompassBrowser,
  connectionName: string,
  tabName: 'Performance' | 'Databases' = 'Databases'
) {
  // TODO(COMPASS-8002): we should differentiate by connectionName somehow
  await browser
    .$(Selectors.instanceWorkspaceTab(tabName, true))
    .waitForDisplayed();
}
