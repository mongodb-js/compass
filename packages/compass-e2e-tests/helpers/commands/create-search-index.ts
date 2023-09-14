import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function createSearchIndex(
  browser: CompassBrowser,
  indexName: string,
  indexDefinition: string,
  screenshotName?: string
): Promise<void> {
  await browser.waitUntil(async () => {
    await browser.clickVisible(Selectors.CreateIndexDropdownButton);
    return await browser
      .$(Selectors.createIndexDropdownAction('search-indexes'))
      .isExisting();
  });
  await browser.clickVisible(
    Selectors.createIndexDropdownAction('search-indexes')
  );

  const createModal = await browser.$(Selectors.CreateSearchIndexModal);
  await createModal.waitForDisplayed();

  await browser.setValueVisible(Selectors.CreateSearchIndexName, indexName);

  await browser.setCodemirrorEditorValue(
    Selectors.CreateSearchIndexDefinition,
    indexDefinition
  );

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  // Create the index
  await browser.clickVisible(Selectors.CreateSearchIndexConfirmButton);

  // Assert that modal goes away
  await createModal.waitForDisplayed({ reverse: true });
}
