import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function navigateToInstanceTab(
  browser: CompassBrowser,
  tabName: string
): Promise<void> {
  const tabSelector = Selectors.instanceTab(tabName);
  const tabSelectedSelector = Selectors.instanceTab(tabName, true);

  await browser.clickVisible(Selectors.SidebarTitle);
  const instanceTabElement = await browser.$(Selectors.InstanceTabs);
  await instanceTabElement.waitForDisplayed();

  const tabSelectorElement = await browser.$(tabSelectedSelector);

  // if the correct tab is already visible, do nothing
  if (await tabSelectorElement.isExisting()) {
    return;
  }

  // otherwise select the tab and wait for it to become selected
  await browser.clickVisible(tabSelector);
  await tabSelectorElement.waitForDisplayed();
}
