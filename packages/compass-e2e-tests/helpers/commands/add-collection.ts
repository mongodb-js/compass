import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export type AddCollectionOptions = {
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
    metaField?: string;
    granularity?: string;
    bucketMaxSpanSeconds?: number;
    bucketRoundingSeconds?: number;
    expireAfterSeconds?: number;
  };
  clustered?: {
    name: string;
    expireAfterSeconds: number;
  };
  encryptedFields?: string;
};

export async function addCollection(
  browser: CompassBrowser,
  collectionName: string,
  collectionOptions?: AddCollectionOptions,
  screenshotPath?: string
): Promise<void> {
  const createModalElement = await browser.$(Selectors.CreateCollectionModal);
  await createModalElement.waitForDisplayed();

  const collectionInput = await browser.$(
    Selectors.CreateDatabaseCollectionName
  );
  await collectionInput.setValue(collectionName);

  if (collectionOptions) {
    await browser.clickVisible(
      Selectors.CreateCollectionCollectionOptionsAccordion
    );
  }

  if (collectionOptions && collectionOptions.capped) {
    await browser.clickVisible(Selectors.CreateCollectionCappedCheckboxLabel);

    const sizeElement = await browser.$(
      Selectors.CreateCollectionCappedSizeInput
    );
    await sizeElement.waitForDisplayed();
    await sizeElement.setValue(collectionOptions.capped.size.toString());
  }

  if (collectionOptions && collectionOptions.customCollation) {
    await browser.clickVisible(
      Selectors.CreateCollectionCustomCollationCheckboxLabel
    );

    for (const [key, value] of Object.entries(
      collectionOptions.customCollation
    )) {
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

  if (collectionOptions && collectionOptions.timeseries) {
    await browser.clickVisible(
      Selectors.CreateCollectionTimeseriesCheckboxLabel
    );

    const timeField = await browser.$(
      Selectors.CreateCollectionTimeseriesTimeField
    );
    await timeField.waitForDisplayed();
    await timeField.setValue(collectionOptions.timeseries.timeField);

    if (collectionOptions.timeseries.metaField) {
      const metaField = await browser.$(
        Selectors.CreateCollectionTimeseriesMetaField
      );
      await metaField.waitForDisplayed();
      await metaField.setValue(collectionOptions.timeseries.metaField);
    }

    if (collectionOptions.timeseries.granularity) {
      await browser.clickVisible(
        Selectors.CreateCollectionTimeseriesGranularityButton
      );
      const menu = await browser.$(
        Selectors.CreateCollectionTimeseriesGranularityMenu
      );
      await menu.waitForDisplayed();
      const span = await menu.$(
        `span=${collectionOptions.timeseries.granularity}`
      );
      await span.waitForDisplayed();
      await span.click();
    }

    if (collectionOptions.timeseries.bucketMaxSpanSeconds) {
      const bucketMaxSpanSecondsField = await browser.$(
        Selectors.CreateCollectionTimeseriesBucketMaxSpanSeconds
      );
      await bucketMaxSpanSecondsField.waitForDisplayed();
      await bucketMaxSpanSecondsField.setValue(
        collectionOptions.timeseries.bucketMaxSpanSeconds.toString()
      );
    }

    if (collectionOptions.timeseries.bucketRoundingSeconds) {
      const bucketMaxRoundingSecondsField = await browser.$(
        Selectors.CreateCollectionTimeseriesBucketRoundingSeconds
      );
      await bucketMaxRoundingSecondsField.waitForDisplayed();
      await bucketMaxRoundingSecondsField.setValue(
        collectionOptions.timeseries.bucketRoundingSeconds.toString()
      );
    }

    if (collectionOptions.timeseries.expireAfterSeconds) {
      const expireField = await browser.$(
        Selectors.CreateCollectionTimeseriesExpireAfterSeconds
      );
      await expireField.waitForDisplayed();
      await expireField.setValue(
        collectionOptions.timeseries.expireAfterSeconds.toString()
      );
    }
  }

  if (collectionOptions && collectionOptions.clustered) {
    await browser.clickVisible(
      Selectors.CreateCollectionClusteredCheckboxLabel
    );

    const nameField = await browser.$(
      Selectors.CreateCollectionClusteredNameField
    );
    await nameField.waitForDisplayed();
    await nameField.setValue(collectionOptions.clustered.name);

    const expireField = await browser.$(
      Selectors.CreateCollectionClusteredExpireAfterSeconds
    );
    await expireField.waitForDisplayed();
    await expireField.setValue(
      collectionOptions.clustered.expireAfterSeconds.toString()
    );
  }

  if (collectionOptions && collectionOptions.encryptedFields) {
    await browser.clickVisible(Selectors.CreateCollectionFLE2CheckboxLabel);
    await browser.setCodemirrorEditorValue(
      Selectors.CreateCollectionFLE2EncryptedFields,
      collectionOptions.encryptedFields
    );
  }

  if (screenshotPath) {
    await browser.screenshot(screenshotPath);
  }

  await browser.clickVisible(Selectors.CreateCollectionCreateButton);
  await createModalElement.waitForDisplayed({ reverse: true });
}
