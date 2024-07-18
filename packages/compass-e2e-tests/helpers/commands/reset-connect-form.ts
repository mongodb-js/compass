import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function resetConnectForm(browser: CompassBrowser): Promise<void> {
  const Sidebar = TEST_MULTIPLE_CONNECTIONS
    ? Selectors.Multiple
    : Selectors.Single;

  if (TEST_MULTIPLE_CONNECTIONS) {
    if (await browser.$(Selectors.ConnectionModal).isDisplayed()) {
      await browser.clickVisible(Selectors.ConnectionModalCloseButton);
      await browser
        .$(Selectors.ConnectionModal)
        .waitForDisplayed({ reverse: true });
    }
  }

  await browser.clickVisible(Sidebar.SidebarNewConnectionButton);

  const connectionTitleSelector = TEST_MULTIPLE_CONNECTIONS
    ? Selectors.ConnectionModalTitle
    : Selectors.ConnectionTitle;

  const connectionTitle = await browser.$(connectionTitleSelector);
  await connectionTitle.waitUntil(async () => {
    return (await connectionTitle.getText()) === 'New Connection';
  });

  await browser.waitUntil(async () => {
    return (
      (await browser.getConnectFormConnectionString(true)) ===
      'mongodb://localhost:27017'
    );
  });
}
