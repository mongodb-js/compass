import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function dropIndex(
  browser: CompassBrowser,
  indexName: string,
  screenshotName?: string
) {
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  await browser.waitUntil(async () => {
    await browser.hover(indexComponentSelector);
    await browser.clickVisible(
      `${indexComponentSelector} ${Selectors.IndexesTableDropIndexButton}`
    );
    // Check if modal opened successfully
    return await browser.isModalOpen(Selectors.DropIndexModal);
  });

  await browser.waitForOpenModal(Selectors.DropIndexModal);

  await browser.setValueVisible(
    Selectors.DropIndexModalConfirmNameInput,
    indexName
  );

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  await browser.clickVisible(Selectors.DropIndexModalConfirmButton);

  await browser.waitForOpenModal(Selectors.DropIndexModal, { reverse: true });

  await indexComponent.waitForDisplayed({ reverse: true });
}
