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
  const createModalElement = browser.$(Selectors.CreateCollectionModal);
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

      let clickAttempt = 1;

      // Just continue clicking until the value is selected ...
      await browser.waitUntil(
        async () => {
          // open the menu if it isn't open yet
          console.log(`customCollation ${key} attempt ${clickAttempt}`);
          if (
            (await browser
              .$(Selectors.createCollectionCustomCollationFieldMenu(key))
              .isDisplayed()) === false
          ) {
            console.log(
              'customCollation clickVisible',
              Selectors.createCollectionCustomCollationFieldButton(key)
            );
            await browser.clickVisible(
              Selectors.createCollectionCustomCollationFieldButton(key)
            );
          }

          const menu = browser.$(
            Selectors.createCollectionCustomCollationFieldMenu(key)
          );
          console.log(
            `customCollation ${key} attempt ${clickAttempt} waitForDisplayed`,
            Selectors.createCollectionCustomCollationFieldMenu(key)
          );
          await menu.waitForDisplayed();

          const option = menu.$(`li[value="${valStr}"]`);
          console.log(
            `customCollation ${key} attempt ${clickAttempt} clickVisible`,
            `li[value="${valStr}"]`
          );
          await browser.clickVisible(option, {
            scroll: true,
          });
          clickAttempt++;
          const button = browser.$(
            Selectors.createCollectionCustomCollationFieldButton(key)
          );
          console.log(
            `customCollation ${key} attempt ${clickAttempt} getAttribute`,
            Selectors.createCollectionCustomCollationFieldButton(key)
          );
          const selectedValue = await button.getAttribute('value');

          if (selectedValue !== valStr) {
            console.log(
              `${key}: ${selectedValue} !== ${valStr} (${clickAttempt})`
            );
          }

          // make sure the menu disappears before moving on to the next thing
          console.log(
            `customCollation ${key} attempt ${clickAttempt} waitForDisplayed (reverse)`,
            Selectors.createCollectionCustomCollationFieldMenu(key)
          );
          await menu.waitForDisplayed({ reverse: true, timeout: 1000 }); // short timeout in case the click did nothing

          return selectedValue === valStr;
        },
        {
          timeoutMsg: `Failed to select a value "${valStr}" for "${key}" in Select after ${clickAttempt} attempt(s)`,
        }
      );
    }

    // scroll to the locale one so the screenshot will include it.
    // (for debugging)
    const localeButton = browser.$(
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
      const menu = browser.$(
        Selectors.CreateCollectionTimeseriesGranularityMenu
      );
      await menu.waitForDisplayed();
      const span = menu.$(`span=${collectionOptions.timeseries.granularity}`);
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
