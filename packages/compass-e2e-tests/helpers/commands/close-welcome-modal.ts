import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWelcomeModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.existsEventually(Selectors.WelcomeModal))) {
    return;
  }

  const welcomeModalElement = await browser.$(Selectors.WelcomeModal);
  await welcomeModalElement.waitForDisplayed();

  await browser.screenshot('welcome-modal.png');

  await browser.clickVisible(Selectors.CloseWelcomeModalButton);
  await welcomeModalElement.waitForDisplayed({
    reverse: true,
  });

  // Make sure it was saved to disk before proceeding so we can't close compass
  // or reload the page too quickly.
  await browser.waitUntil(async function () {
    const { showedNetworkOptIn } = await browser.loadPreferences();
    return showedNetworkOptIn === true;
  });
}
