import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeSettingsModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.existsEventually(Selectors.SettingsModal))) {
    console.log('in the first run. modal non-existant');
    return;
  }

  console.log('in the first run. modal found');
  const settingsModalElement = await browser.$(
    Selectors.SettingsModal
  );

  await settingsModalElement.waitForDisplayed();
  await browser.clickVisible(Selectors.CloseSettingsModalButton);
  await settingsModalElement.waitForDisplayed({
    reverse: true,
  });
  console.log('in the first run. modal closed');
}
