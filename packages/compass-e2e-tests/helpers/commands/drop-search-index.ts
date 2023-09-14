import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropSearchIndex(
  browser: CompassBrowser,
  indexName: string,
  screenshotName?: string
) {
  const indexRowSelector = Selectors.searchIndexRow(indexName);
  const indexRow = await browser.$(indexRowSelector);
  await indexRow.waitForDisplayed();

  await browser.hover(indexRowSelector);
  await browser.clickVisible(Selectors.searchIndexDropButton(indexName));

  const dropModal = await browser.$(Selectors.ConfirmationModal);
  await dropModal.waitForDisplayed();

  const confirmInput = await browser.$(Selectors.ConfirmationModalInput);
  await confirmInput.waitForDisplayed();
  await confirmInput.setValue(indexName);

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  await browser.clickVisible(Selectors.ConfirmationModalConfirmButton());
  await dropModal.waitForDisplayed({ reverse: true });
}
