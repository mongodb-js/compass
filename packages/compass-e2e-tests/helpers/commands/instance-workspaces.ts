import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function navigateToInstanceTab(
  browser: CompassBrowser,
  tabName: 'My Queries' | 'Performance' | 'Databases' = 'My Queries'
): Promise<void> {
  const itemSelector = Selectors.sidebarInstanceNavigationItem(tabName);
  await browser.clickVisible(itemSelector);
  await waitUntilActiveInstanceTab(browser, tabName);
}

export async function waitUntilActiveInstanceTab(
  browser: CompassBrowser,
  tabName: 'My Queries' | 'Performance' | 'Databases' = 'My Queries'
) {
  await browser
    .$(Selectors.instanceWorkspaceTab(tabName, true))
    .waitForDisplayed();
}
