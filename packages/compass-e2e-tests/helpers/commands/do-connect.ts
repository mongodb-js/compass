import { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

export async function doConnect(
  browser: Browser<'async'>,
  timeout: number,
  connectionStatus = 'success'
): Promise<void> {
  await Commands.clickVisible(browser, Selectors.ConnectButton);
  let selector: string;
  if (connectionStatus === 'either') {
    // For the rare cases where we don't care whether it fails or succeeds
    selector = `${Selectors.DatabasesTable},${Selectors.ConnectionFormMessage}`;
  } else if (connectionStatus === 'success') {
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    selector = Selectors.DatabasesTable;
  } else {
    selector = Selectors.ConnectionFormMessage;
  }
  const element = await browser.$(selector);
  await element.waitForDisplayed({
    timeout,
  });
}
