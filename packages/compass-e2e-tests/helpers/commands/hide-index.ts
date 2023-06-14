import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function hideIndex(browser: CompassBrowser, indexName: string) {
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = await browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  await browser.hover(indexComponentSelector);
  await browser.clickVisible(
    `${indexComponentSelector} ${Selectors.HideIndexButton}`
  );

  const hideModal = await browser.$(Selectors.HideIndexModal);
  await hideModal.waitForDisplayed();

  await browser.screenshot(`hide-index-modal.png`);

  await browser.clickVisible(Selectors.HideIndexModalConfirmButton);

  await hideModal.waitForDisplayed({ reverse: true });

  const hiddenBadge = await browser.$(Selectors.HiddenIndexBadge(indexName));
  await hiddenBadge.waitForDisplayed();
}
