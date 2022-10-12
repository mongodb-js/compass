import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function doConnect(
  browser: CompassBrowser,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<void> {
  await browser.clickVisible(Selectors.ConnectButton);
  await browser.waitForConnectionResult(connectionStatus, timeout);
}
