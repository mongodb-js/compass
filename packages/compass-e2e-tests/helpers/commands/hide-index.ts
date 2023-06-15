import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function hideIndex(
  browser: CompassBrowser,
  indexName: string,
  screenshotName?: string
) {
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = await browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  await browser.hover(indexComponentSelector);
  await browser.clickVisible(
    `${indexComponentSelector} ${Selectors.HideIndexButton}`
  );

  const hideModal = await browser.$(Selectors.HideIndexModal);
  await hideModal.waitForDisplayed();

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  const ConfirmButtonSelector = Selectors.ConfirmationModalConfirmButton(
    Selectors.HideIndexModal
  );
  await browser.clickVisible(ConfirmButtonSelector);

  await hideModal.waitForDisplayed({ reverse: true });

  const hiddenBadge = await browser.$(Selectors.HiddenIndexBadge(indexName));
  await hiddenBadge.waitForDisplayed();
}
