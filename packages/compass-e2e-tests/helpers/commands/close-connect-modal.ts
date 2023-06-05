import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeConnectModal(
  browser: CompassBrowser
): Promise<void> {
  await browser.clickVisible(Selectors.CancelConnectionButton);
  const connectionModalContentElement = await browser.$(
    Selectors.ConnectionStatusModalContent
  );
  await connectionModalContentElement.waitForExist({
    reverse: true,
  });
}
