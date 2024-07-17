import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function removeConnection(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  if (!TEST_MULTIPLE_CONNECTIONS) {
    return;
  }

  // make sure there's no filter because if the connection is not displayed then we can't remove it
  if (await browser.$(Selectors.SidebarFilterInput).isExisting()) {
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, '');

    // wait for a connection to appear. It must because if there are no
    // connections the filter field wouldn't exist in the first place
    await browser.$(Selectors.SidebarTreeItems).waitForDisplayed();
  }

  const selector = Selectors.sidebarConnection(connectionName);
  if (await browser.$(selector).isExisting()) {
    await browser.selectConnectionMenuItem(
      connectionName,
      Selectors.Multiple.RemoveConnectionItem
    );
    await browser.$(selector).waitForExist({ reverse: true });
  }
}
