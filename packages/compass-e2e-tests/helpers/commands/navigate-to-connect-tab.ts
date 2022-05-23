import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function navigateToConnectTab(
  browser: CompassBrowser,
  tabName: string
): Promise<string> {
  // get the active tab
  // if it is not the target tab, click the target tab and wait for it to become visible
  // return the initially active tab so we can return to it if we want to

  const initialTab = await browser
    .$(Selectors.SelectedAdvancedOptionsTab)
    .getAttribute('name');
  if (initialTab !== tabName) {
    await browser.clickVisible(Selectors.advancedOptionsTab(tabName));
    await browser
      .$(Selectors.advancedOptionsTabPanel(initialTab))
      .waitForDisplayed({ reverse: true });
  }

  await browser
    .$(Selectors.advancedOptionsTabPanel(tabName))
    .waitForDisplayed();

  return initialTab;
}
