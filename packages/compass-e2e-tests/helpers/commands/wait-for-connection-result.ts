import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionResult(
  browser: CompassBrowser,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<undefined | string> {
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
  await element.waitForDisplayed(
    typeof timeout !== 'undefined' ? { timeout } : undefined
  );
  if (connectionStatus === 'failure') {
    return await element.getText();
  }
}
