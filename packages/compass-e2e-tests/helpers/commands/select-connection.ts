import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectConnection(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.selectConnectionMenuItem(
      connectionName,
      Selectors.Multiple.EditConnectionItem
    );
  } else {
    await browser.pause(1000);

    await browser.clickVisible(
      Selectors.sidebarConnectionButton(connectionName),
      {
        screenshot: `selecting-connection-${connectionName}.png`,
      }
    );
  }

  await browser.waitUntil(async () => {
    const connectionTitleSelector = TEST_MULTIPLE_CONNECTIONS
      ? Selectors.ConnectionModalTitle
      : Selectors.ConnectionTitle;

    const text = await browser.$(connectionTitleSelector).getText();
    return text === connectionName;
  });
}
