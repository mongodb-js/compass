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
  await browser.clickConfirmationAction(
    `${indexComponentSelector} ${Selectors.UnhideIndexButton}`,
    undefined,
    screenshotName
  );

  const hiddenBadge = await browser.$(Selectors.HiddenIndexBadge(indexName));
  await hiddenBadge.waitForDisplayed({ reverse: true });
}
