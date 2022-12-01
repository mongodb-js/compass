import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const NO_PREVIEW_DOCUMENTS = 'No Preview Documents';

describe('Collection validation tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
    await browser.navigateToCollectionTab('test', 'numbers', 'Validation');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('supports rules in JSON schema', async function () {
    await browser.clickVisible(Selectors.AddRuleButton);
    const element = await browser.$(Selectors.ValidationEditor);
    await element.waitForDisplayed();

    // Add validation that makes everything invalid

    // the automatic indentation and brackets makes multi-line values very fiddly here
    await browser.setValidation(
      '{ $jsonSchema: { bsonType: "object", required: [ "phone" ] } }'
    );

    // nothing passed, everything failed
    await browser.waitUntil(async () => {
      const matchTextElement = await browser.$(
        Selectors.ValidationMatchingDocumentsPreview
      );
      const matchText = await matchTextElement.getText();
      const notMatchingTextElement = await browser.$(
        Selectors.ValidationNotMatchingDocumentsPreview
      );
      const notMatchingText = await notMatchingTextElement.getText();
      return (
        matchText === NO_PREVIEW_DOCUMENTS &&
        notMatchingText !== NO_PREVIEW_DOCUMENTS
      );
    });

    // Reset the validation again to make everything valid for future tests

    // the automatic indentation and brackets makes multi-line values very fiddly here
    await browser.setValidation('{}');

    // nothing failed, everything passed
    await browser.waitUntil(async () => {
      const matchTextElement = await browser.$(
        Selectors.ValidationMatchingDocumentsPreview
      );
      const matchText = await matchTextElement.getText();
      const notMatchingTextElement = await browser.$(
        Selectors.ValidationNotMatchingDocumentsPreview
      );
      const notMatchingText = await notMatchingTextElement.getText();
      return (
        matchText !== NO_PREVIEW_DOCUMENTS &&
        notMatchingText === NO_PREVIEW_DOCUMENTS
      );
    });
  });
});
