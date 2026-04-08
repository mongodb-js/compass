import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function clickConfirmationAction(
  browser: CompassBrowser,
  actionButtonSelector: string,
  confirmationText?: string,
  screenshot?: string
) {
  await browser.clickVisible(actionButtonSelector);

  await browser.waitForOpenModal(Selectors.ConfirmationModal);

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
  await browser.waitForOpenModal(Selectors.ConfirmationModal, {
    reverse: true,
  });
}
