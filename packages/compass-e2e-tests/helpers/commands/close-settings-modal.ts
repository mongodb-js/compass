import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeSettingsModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.existsEventually(Selectors.SettingsModal))) {
    return;
  }

  const settingsModalElement = browser.$(Selectors.SettingsModal);

  await settingsModalElement.waitForDisplayed();

  await browser.clickVisible(Selectors.CloseSettingsModalButton);
  await settingsModalElement.waitForDisplayed({
    reverse: true,
  });
}
