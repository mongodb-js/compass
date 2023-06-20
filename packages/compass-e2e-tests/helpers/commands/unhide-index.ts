import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function unhideIndex(
  browser: CompassBrowser,
  indexName: string,
  screenshotName?: string
) {
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = await browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  await browser.hover(indexComponentSelector);
  await browser.clickVisible(
    `${indexComponentSelector} ${Selectors.UnhideIndexButton}`
  );

  const unhideModal = await browser.$(Selectors.ConfirmationModal);
  await unhideModal.waitForDisplayed();

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  await browser.clickVisible(Selectors.ConfirmationModalConfirmButton());

  await unhideModal.waitForDisplayed({ reverse: true });

  const hiddenBadge = await browser.$(Selectors.HiddenIndexBadge(indexName));
  await hiddenBadge.waitForDisplayed({ reverse: true });
}
