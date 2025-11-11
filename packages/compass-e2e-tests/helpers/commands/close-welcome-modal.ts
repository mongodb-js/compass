import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWelcomeModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.isModalEventuallyOpen(Selectors.WelcomeModal))) {
    return;
  }

  await browser.waitForOpenModal(Selectors.WelcomeModal);
  await browser.clickVisible(Selectors.CloseWelcomeModalButton);
  await browser.waitForOpenModal(Selectors.WelcomeModal, { reverse: true });

  // By setting a feature after closing the welcome modal we know that
  // preferences will have been saved to disk and therefore showedNetworkOptIn
  // will have been set to true on disk before we continue. So even if a test
  // does something like location.reload() immediately it definitely won't show
  // the welcome modal a second time. It is kinda irrelevant which setting we
  // use, but it must be an uncontrolled one
  await browser.setFeature('zoomLevel', 1);
}
