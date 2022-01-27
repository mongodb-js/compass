import type { CompassBrowser } from '../compass-browser';
import delay from '../delay';
import * as Selectors from '../selectors';

async function closeConnectionModal(browser: CompassBrowser): Promise<void> {
  await browser.clickVisible(Selectors.CancelConnectionButton);
  const connectionModalContentElement = await browser.$(
    Selectors.ConnectionStatusModalContent
  );
  await connectionModalContentElement.waitForExist({
    reverse: true,
  });
}

export async function disconnect(browser: CompassBrowser): Promise<void> {
  const cancelConnectionButtonElement = await browser.$(
    Selectors.CancelConnectionButton
  );
  // If we are still connecting, let's try cancelling the connection first
  if (await cancelConnectionButtonElement.isDisplayed()) {
    try {
      await closeConnectionModal(browser);
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
