import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function unhideIndex(browser: CompassBrowser, indexName: string) {
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = await browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  await browser.hover(indexComponentSelector);
  await browser.clickVisible(
    `${indexComponentSelector} ${Selectors.UnhideIndexButton}`
  );

  const hideModal = await browser.$(Selectors.UnhideIndexModal);
  await hideModal.waitForDisplayed();

  await browser.screenshot(`unhide-index-modal.png`);

  await browser.clickVisible(Selectors.UnhideIndexModalConfirmButton);

  await hideModal.waitForDisplayed({ reverse: true });

  const hiddenBadge = await browser.$(Selectors.HiddenIndexBadge(indexName));
  await hiddenBadge.waitForDisplayed({ reverse: true });
}
