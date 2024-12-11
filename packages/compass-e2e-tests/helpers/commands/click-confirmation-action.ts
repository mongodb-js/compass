import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function clickConfirmationAction(
  browser: CompassBrowser,
  actionButtonSelector: string,
  confirmationText?: string,
  screenshot?: string
) {
  await browser.clickVisible(actionButtonSelector);

  const confirmationModal = browser.$(Selectors.ConfirmationModal);
  await confirmationModal.waitForDisplayed();

  if (confirmationText) {
    await browser.setValueVisible(
      Selectors.ConfirmationModalInput,
      confirmationText
    );
  }

  if (screenshot) {
    await browser.screenshot(screenshot);
  }

  await browser.clickVisible(Selectors.confirmationModalConfirmButton());
  await confirmationModal.waitForDisplayed({ reverse: true });
}
