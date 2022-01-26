import type { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

export async function closePrivacySettingsModal(
  browser: Browser<'async'>
): Promise<void> {
  if (
    !(await Commands.existsEventually(browser, Selectors.PrivacySettingsModal))
  ) {
    return;
  }

  const privateSettingsModalElement = await browser.$(
    Selectors.PrivacySettingsModal
  );

  await privateSettingsModalElement.waitForDisplayed();
  await Commands.clickVisible(browser, Selectors.ClosePrivacySettingsButton);
  await privateSettingsModalElement.waitForDisplayed({
    reverse: true,
  });
}
