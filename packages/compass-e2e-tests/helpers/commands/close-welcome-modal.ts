import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWelcomeModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.existsEventually(Selectors.WelcomeModal))) {
    return;
  }

  const welcomeModalElement = browser.$(Selectors.WelcomeModal);
  await welcomeModalElement.waitForDisplayed();

  await browser.clickVisible(Selectors.CloseWelcomeModalButton);
  await welcomeModalElement.waitForDisplayed({
    reverse: true,
  });

  // By setting a feature after closing the welcome modal we know that
  // preferences will have been saved to disk and therefore showedNetworkOptIn
  // will have been set to true on disk before we continue. So even if a test
  // does something like location.reload() immediately it definitely won't show
  // the welcome modal a second time. It is kinda irrelevant which setting we use.
  await browser.setFeature('enableShell', true);
}
