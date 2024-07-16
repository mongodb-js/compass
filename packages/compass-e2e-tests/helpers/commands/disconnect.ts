import { TEST_COMPASS_WEB, TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import delay from '../delay';
import * as Selectors from '../selectors';

import Debug from 'debug';

const debug = Debug('compass-e2e-tests');

export async function disconnectAll(browser: CompassBrowser): Promise<void> {
  if (TEST_COMPASS_WEB) {
    const url = new URL(await browser.getUrl());
    url.pathname = '/';
    await browser.navigateTo(url.toString());
    const element = await browser.$(Selectors.ConnectionFormStringInput);
    await element.waitForDisplayed();
    return;
  }

  if (!TEST_MULTIPLE_CONNECTIONS) {
    const cancelConnectionButtonElement = await browser.$(
      Selectors.CancelConnectionButton
    );
    // If we are still connecting, let's try cancelling the connection first
    if (await cancelConnectionButtonElement.isDisplayed()) {
      try {
        await browser.closeConnectModal();
      } catch (e) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
      }
    }

    await delay(100);
  }

  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.emit('app:disconnect');
  });

  if (TEST_MULTIPLE_CONNECTIONS) {
    // For multiple connections we're making the assumption that there should be
    // no active connections left. Use a different command if you expect to
    // disconnect just one connection and still keep others around.
    await browser
      .$(`${Selectors.SidebarTreeItems}[aria-expanded=true]`)
      .waitForExist({ reverse: true });

    // The potential problem here is that the list is virtual, so it is possible
    // that not every connection is rendered and then this won't wait long
    // enough. For now just wait an extra second just in case.
    await browser.pause(1000);

    // If we disconnected "too soon" and we get an error like "Failed to
    // retrieve server info" or similar, there might be an error or warning
    // toast by now. If so, just close it otherwise the next test or connection
    // attempt will be confused by it.
    if (await browser.$(Selectors.LGToastCloseButton).isExisting()) {
      const toastText = await browser.$('#lg-toast-region').getText();
      debug('Closing toast', toastText);
      await browser.clickVisible(Selectors.LGToastCloseButton);
    }

    // NOTE: unlike the single connection flow this doesn't make sure the New
    // Connection modal is open after disconnecting.
    // This also doesn't remove all connections from the sidebar so the
    // connection will still be there, just disconnected.
  } else {
    // for single connections we expect the connect screen to re-appear
    await browser.$(Selectors.ConnectSection).waitForDisplayed();

    // clear the form
    await browser.clickVisible(Selectors.Single.SidebarNewConnectionButton);
    await delay(100);
  }
}
