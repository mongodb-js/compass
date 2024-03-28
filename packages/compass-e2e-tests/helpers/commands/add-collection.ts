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

  await browser.setValueVisible(
    Selectors.CreateDatabaseCollectionName,
    collectionName
  );

  if (collectionOptions) {
    await browser.clickVisible(
      Selectors.CreateCollectionCollectionOptionsAccordion
    );
  }

  if (collectionOptions && collectionOptions.capped) {
    await browser.clickVisible(Selectors.CreateCollectionCappedCheckboxLabel);

    await browser.setValueVisible(
      Selectors.CreateCollectionCappedSizeInput,
      collectionOptions.capped.size.toString()
    );
  }

  if (collectionOptions && collectionOptions.customCollation) {
    await browser.clickVisible(
      Selectors.CreateCollectionCustomCollationCheckboxLabel
    );

    for (const [key, value] of Object.entries(
      collectionOptions.customCollation
    )) {
      const valStr = value.toString();

      await browser.clickVisible(
        Selectors.createCollectionCustomCollationFieldButton(key)
      );
      const menu = browser.$(
        Selectors.createCollectionCustomCollationFieldMenu(key)
      );
      await menu.waitForDisplayed();
      const option = menu.$(`li[value="${valStr}"]`);

      let clickAttempt = 1;

      // Just continue clicking until the value is selected ...
      await browser.waitUntil(
        async () => {
          await browser.clickVisible(option, {
            scroll: true,
          });
          clickAttempt++;
          const button = await browser.$(
            Selectors.createCollectionCustomCollationFieldButton(key)
          );
          const selectedValue = await button.getAttribute('value');

          return selectedValue === valStr;
        },
        {
          timeoutMsg: `Failed to select a value "${valStr}" for "${key}" in Select after ${clickAttempt} attempt(s)`,
        }
      );

      await browser.screenshot(`custom-collation-${key}-${valStr}.png`);

      // make sure the menu disappears before moving on to the next thing
      await menu.waitForDisplayed({ reverse: true });
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

    await browser.setValueVisible(
      Selectors.CreateCollectionTimeseriesTimeField,
      collectionOptions.timeseries.timeField
    );

    if (collectionOptions.timeseries.metaField) {
      await browser.setValueVisible(
        Selectors.CreateCollectionTimeseriesMetaField,
        collectionOptions.timeseries.metaField
      );
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
      await browser.setValueVisible(
        Selectors.CreateCollectionTimeseriesBucketMaxSpanSeconds,
        collectionOptions.timeseries.bucketMaxSpanSeconds.toString()
      );
    }

    if (collectionOptions.timeseries.bucketRoundingSeconds) {
      await browser.setValueVisible(
        Selectors.CreateCollectionTimeseriesBucketRoundingSeconds,
        collectionOptions.timeseries.bucketRoundingSeconds.toString()
      );
    }

    if (collectionOptions.timeseries.expireAfterSeconds) {
      await browser.setValueVisible(
        Selectors.CreateCollectionTimeseriesExpireAfterSeconds,
        collectionOptions.timeseries.expireAfterSeconds.toString()
      );
    }
  }

  if (collectionOptions && collectionOptions.clustered) {
    await browser.clickVisible(
      Selectors.CreateCollectionClusteredCheckboxLabel
    );

    await browser.setValueVisible(
      Selectors.CreateCollectionClusteredNameField,
      collectionOptions.clustered.name
    );

    await browser.setValueVisible(
      Selectors.CreateCollectionClusteredExpireAfterSeconds,
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
