import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropNamespace(
  browser: CompassBrowser,
  collectionName: string
): Promise<void> {
  const dropModalElement = browser.$(Selectors.DropNamespaceModal);
  await dropModalElement.waitForDisplayed();
  await browser.setValueVisible(
    Selectors.DropNamespaceConfirmNameInput,
    collectionName
  );
  const confirmButton = browser.$(Selectors.DropNamespaceDropButton);
  await confirmButton.waitForEnabled();

  await confirmButton.click();

  const successToast = browser.$(Selectors.DropNamespaceSuccessToast);
  await successToast.waitForDisplayed();
  await browser.clickVisible(Selectors.DropNamespaceSuccessToastCloseButton);
  await successToast.waitForDisplayed({ reverse: true });
}
