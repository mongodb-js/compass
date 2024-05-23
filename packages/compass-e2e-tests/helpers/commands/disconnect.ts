import { TEST_COMPASS_WEB, TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import delay from '../delay';
import * as Selectors from '../selectors';

export async function disconnect(browser: CompassBrowser): Promise<void> {
  if (TEST_COMPASS_WEB) {
    const url = new URL(await browser.getUrl());
    url.pathname = '/';
    await browser.navigateTo(url.toString());
    const element = await browser.$(Selectors.ConnectionStringInput);
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
    await browser.$(Selectors.SidebarTreeItems).waitForExist({ reverse: true });

    // TODO: should we open the New Connection modal to mirror the single connection flow or do that separately?
  } else {
    // for single connections we expect the connect screen to re-appear
    await browser.$(Selectors.ConnectSection).waitForDisplayed();

    // clear the form
    await browser.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  }
}
