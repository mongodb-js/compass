import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWelcomeModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.existsEventually(Selectors.WelcomeModal))) {
    return;
  }

  const welcomeModalElement = await browser.$(Selectors.WelcomeModal);
  await browser.screenshot('welcome-modal.png');

  await welcomeModalElement.waitForDisplayed();
  await browser.clickVisible(Selectors.CloseWelcomeModalButton);
  await welcomeModalElement.waitForDisplayed({
    reverse: true,
  });
}
