import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const NO_PREVIEW_DOCUMENTS = 'No Preview Documents';
const LOAD_SAMPLE_DOCUMENT = 'Load document';
const PASSING_VALIDATOR = '{ $jsonSchema: {} }';
const FAILING_VALIDATOR =
  '{ $jsonSchema: { bsonType: "object", required: [ "phone" ] } }';

describe('Collection validation tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Validation'
    );
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  async function addValidation(validation: string) {
    await browser.clickVisible(Selectors.AddRuleButton);
    const element = browser.$(Selectors.ValidationEditor);
    await element.waitForDisplayed();

    await browser.setValidation(validation);
  }

  context('when the schema validation is set or modified', function () {
    it('provides users with a button to load sample documents', async function () {
      await addValidation(PASSING_VALIDATOR);

      await browser.waitUntil(async () => {
        const matchTextElement = browser.$(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const matchText = await matchTextElement.getText();
        const notMatchingTextElement = browser.$(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        const notMatchingText = await notMatchingTextElement.getText();
        return (
          matchText === LOAD_SAMPLE_DOCUMENT &&
          notMatchingText === LOAD_SAMPLE_DOCUMENT
        );
      });
    });

    it('supports rules in JSON schema', async function () {
      await addValidation(FAILING_VALIDATOR);
      await browser.clickVisible(Selectors.ValidationLoadMatchingDocumentsBtn);
      await browser.clickVisible(
        Selectors.ValidationLoadNotMatchingDocumentsBtn
      );

      // nothing passed, everything failed
      await browser.waitUntil(async () => {
        const matchTextElement = browser.$(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const matchText = await matchTextElement.getText();
        const notMatchingTextElement = browser.$(
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
      await browser.setValidation(PASSING_VALIDATOR);
      await browser.clickVisible(Selectors.ValidationLoadMatchingDocumentsBtn);
      await browser.clickVisible(
        Selectors.ValidationLoadNotMatchingDocumentsBtn
      );

      // nothing failed, everything passed
      await browser.waitUntil(async () => {
        const matchTextElement = browser.$(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const matchText = await matchTextElement.getText();
        const notMatchingTextElement = browser.$(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        const notMatchingText = await notMatchingTextElement.getText();
        const result =
          matchText !== NO_PREVIEW_DOCUMENTS &&
          notMatchingText === NO_PREVIEW_DOCUMENTS;
        if (!result) {
          console.log({ matchText, notMatchingText });
        }
        return result;
      });
    });
  });
});
