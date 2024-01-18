import { TEST_COMPASS_WEB } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import delay from '../delay';
import * as Selectors from '../selectors';

export async function disconnect(browser: CompassBrowser): Promise<void> {
  if (TEST_COMPASS_WEB) {
    // TODO: refreshing will probably not be enough to sign out once we run
    // these tests against real atlas, depending on how we implement that.
    await browser.refresh();
    const element = await browser.$(Selectors.ConnectSection);
    await element.waitForConnectionScreen();
    return;
  }

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

  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.emit('app:disconnect');
  });

  const element = await browser.$(Selectors.ConnectSection);
  await element.waitForDisplayed();

  await browser.clickVisible(Selectors.SidebarNewConnectionButton);
  await delay(100);
}
