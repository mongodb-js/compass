import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectConnectionMenuItem(
  browser: CompassBrowser,
  connectionName: string,
  itemSelector: string
) {
  const Sidebar = TEST_MULTIPLE_CONNECTIONS
    ? Selectors.Multiple
    : Selectors.Single;

  const selector = Selectors.sidebarConnection(connectionName);

  await browser.waitUntil(async () => {
    if (
      await browser
        .$(Selectors.sidebarConnectionMenuButton(connectionName))
        .isDisplayed()
    ) {
      return true;
    }

    // It takes some time for the favourites to load
    await browser.$(selector).waitForDisplayed();

    // workaround for weirdness in the ItemActionControls menu opener icon
    await browser.clickVisible(Sidebar.ConnectionsTitle);

    // Hover over an arbitrary other element to ensure that the second hover will
    // actually be a fresh one. This otherwise breaks if this function is called
    // twice in a row.
    await browser.hover(`*:not(${selector}, ${selector} *)`);

    await browser.hover(selector);
    return false;
  });

  await browser.clickVisible(
    Selectors.sidebarConnectionMenuButton(connectionName)
  );
  await browser.$(Sidebar.ConnectionMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
