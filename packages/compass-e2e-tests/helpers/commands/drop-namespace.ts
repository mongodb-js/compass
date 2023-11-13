import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropNamespace(
  browser: CompassBrowser,
  collectionName: string
): Promise<void> {
  const dropModalElement = await browser.$(Selectors.DropNamespaceModal);
  await dropModalElement.waitForDisplayed();
  const confirmInput = await browser.$(Selectors.DropNamespaceConfirmNameInput);
  await confirmInput.setValue(collectionName);
  const confirmButton = await browser.$(Selectors.DropNamespaceDropButton);
  await confirmButton.waitForEnabled();

  await browser.screenshot('drop-namespace-modal.png');

  await confirmButton.click();

  const successToast = browser.$(Selectors.DropNamespaceSuccessToast);
  await successToast.waitForDisplayed();
  await browser.clickVisible(Selectors.DropNamespaceSuccessToastCloseButton);
  await successToast.waitForDisplayed({ reverse: true });
}
