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

  const hideModal = await browser.$(Selectors.UnhideIndexModal);
  await hideModal.waitForDisplayed();

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  const ConfirmButtonSelector = Selectors.ConfirmationModalConfirmButton(
    Selectors.UnhideIndexModal
  );
  await browser.clickVisible(ConfirmButtonSelector);

  await hideModal.waitForDisplayed({ reverse: true });

  const hiddenBadge = await browser.$(Selectors.HiddenIndexBadge(indexName));
  await hiddenBadge.waitForDisplayed({ reverse: true });
}
