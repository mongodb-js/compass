import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function doConnect(
  browser: CompassBrowser,
  timeout: number,
  connectionStatus: 'success' | 'failure' | 'either' = 'success'
): Promise<void> {
  await browser.clickVisible(Selectors.ConnectButton);
  let selector: string;
  if (connectionStatus === 'either') {
    // For the rare cases where we don't care whether it fails or succeeds
    selector = `${Selectors.DatabasesTable},${Selectors.ConnectionFormErrorMessage}`;
  } else if (connectionStatus === 'success') {
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    selector = Selectors.MyQueriesList;
  } else {
    selector = Selectors.ConnectionFormErrorMessage;
  }
  const element = await browser.$(selector);
  await element.waitForDisplayed({
    timeout,
  });
}
