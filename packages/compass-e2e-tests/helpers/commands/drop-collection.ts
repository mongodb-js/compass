import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropCollection(
  browser: CompassBrowser,
  collectionName: string
): Promise<void> {
  const dropModalElement = await browser.$(Selectors.DropCollectionModal);
  await dropModalElement.waitForDisplayed();
  const confirmInput = await browser.$(Selectors.DropCollectionConfirmName);
  await confirmInput.setValue(collectionName);
  const confirmButton = await browser.$(Selectors.DropCollectionDropButton);
  await confirmButton.waitForEnabled();

  await browser.screenshot('drop-collection-modal.png');

  await confirmButton.click();
  await dropModalElement.waitForDisplayed({ reverse: true });
}
