import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type AddCollectionOptions = {
  capped?: {
    size: number;
  };
  customCollation?: {
    locale: string;
    strength: number;
    caseLevel: boolean;
    caseFirst: string;
    numericOrdering: boolean;
    alternate: string;
    maxVariable: string;
    backwards: boolean;
    normalization: boolean;
  };
  timeseries?: {
    timeField: string;
    metaField: string;
    granularity: string;
    expireAfterSeconds: number;
  };
  clustered?: {
    name: string;
    expireAfterSeconds: number;
  };
};

export async function addCollection(
  browser: CompassBrowser,
  collectionName: string,
  options?: AddCollectionOptions
): Promise<void> {
  const createModalElement = await browser.$(Selectors.CreateCollectionModal);
  await createModalElement.waitForDisplayed();

  const collectionInput = await browser.$(
    Selectors.CreateDatabaseCollectionName
  );
  await collectionInput.setValue(collectionName);

  if (options) {
    await browser.clickVisible(
      Selectors.CreateCollectionCollectionOptionsAccordion
    );
  }

  if (options && options.capped) {
    await browser.clickVisible(Selectors.CreateCollectionCappedCheckboxLabel);

    const sizeElement = await browser.$(
      Selectors.CreateCollectionCappedSizeInput
    );
    await sizeElement.waitForDisplayed();
    await sizeElement.setValue(options.capped.size.toString());
  }

  if (options && options.customCollation) {
    await browser.clickVisible(
      Selectors.CreateCollectionCustomCollationCheckboxLabel
    );

    for (const [key, value] of Object.entries(options.customCollation)) {
      await browser.clickVisible(
        Selectors.createCollectionCustomCollationFieldButton(key)
      );
      const menu = await browser.$(
        Selectors.createCollectionCustomCollationFieldMenu(key)
      );
      await menu.waitForDisplayed();
      const span = await menu.$(`span=${value.toString()}`);
      await span.waitForDisplayed();
      await span.click();
    }

    // scroll to the locale one so the screenshot will include it.
    // (for debugging)
    const localeButton = await browser.$(
      Selectors.createCollectionCustomCollationFieldButton('locale')
    );
    await localeButton.scrollIntoView();
  }

  if (options && options.timeseries) {
    await browser.clickVisible(
      Selectors.CreateCollectionTimeseriesCheckboxLabel
    );

    const timeField = await browser.$(
      Selectors.CreateCollectionTimeseriesTimeField
    );
    await timeField.waitForDisplayed();
    await timeField.setValue(options.timeseries.timeField);

    const metaField = await browser.$(
      Selectors.CreateCollectionTimeseriesMetaField
    );
    await metaField.waitForDisplayed();
    await metaField.setValue(options.timeseries.metaField);

    await browser.clickVisible(
      Selectors.CreateCollectionTimeseriesGranularityButton
    );
    const menu = await browser.$(
      Selectors.CreateCollectionTimeseriesGranularityMenu
    );
    await menu.waitForDisplayed();
    const span = await menu.$(`span=${options.timeseries.granularity}`);
    await span.waitForDisplayed();
    await span.click();

    const expireField = await browser.$(
      Selectors.CreateCollectionTimeseriesExpireAfterSeconds
    );
    await expireField.waitForDisplayed();
    await expireField.setValue(
      options.timeseries.expireAfterSeconds.toString()
    );
  }

  if (options && options.clustered) {
    await browser.clickVisible(
      Selectors.CreateCollectionClusteredCheckboxLabel
    );

    const nameField = await browser.$(
      Selectors.CreateCollectionClusteredNameField
    );
    await nameField.waitForDisplayed();
    await nameField.setValue(options.clustered.name);

    const expireField = await browser.$(
      Selectors.CreateCollectionClusteredExpireAfterSeconds
    );
    await expireField.waitForDisplayed();
    await expireField.setValue(options.clustered.expireAfterSeconds.toString());
  }

  await browser.clickVisible(Selectors.CreateCollectionCreateButton);
  await createModalElement.waitForDisplayed({ reverse: true });
}
