import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closePrivacySettingsModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.existsEventually(Selectors.PrivacySettingsModal))) {
    return;
  }

  const privateSettingsModalElement = await browser.$(
    Selectors.PrivacySettingsModal
  );

  await privateSettingsModalElement.waitForDisplayed();
  await browser.clickVisible(Selectors.ClosePrivacySettingsButton);
  await privateSettingsModalElement.waitForDisplayed({
    reverse: true,
  });
}
