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
import { expect } from 'chai';
import { isTestingDesktop } from '../helpers/test-runner-context';

const NO_PREVIEW_DOCUMENTS = 'No Preview Documents';
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

    await browser.setValidationWithinValidationTab(validation);
  }

  context('when the schema validation is empty', function () {
    before(async function () {
      if (isTestingDesktop()) {
        await browser.setFeature('enableExportSchema', true);
      }
    });

    it('provides users with a button to generate rules', async function () {
      await browser.clickVisible(Selectors.GenerateValidationRulesButton);
      const editor = browser.$(Selectors.ValidationEditor);
      await editor.waitForDisplayed();

      // rules are generated
      const generatedRules = await browser.getCodemirrorEditorText(
        Selectors.ValidationEditor
      );
      expect(JSON.parse(generatedRules)).to.deep.equal({
        $jsonSchema: {
          bsonType: 'object',
          required: ['_id', 'i', 'j'],
          properties: {
            _id: {
              bsonType: 'objectId',
            },
            i: {
              bsonType: 'int',
            },
            j: {
              bsonType: 'int',
            },
          },
        },
      });

      // generated rules can be edited and saved
      await browser.setValidationWithinValidationTab(PASSING_VALIDATOR);
    });
  });

  context('when the schema validation is set or modified', function () {
    it('provides users with a single button to load sample documents', async function () {
      await addValidation(PASSING_VALIDATOR);

      await browser.clickVisible(Selectors.ValidationLoadSampleDocumentsBtn);

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
          matchText.includes('ObjectId(') &&
          notMatchingText === NO_PREVIEW_DOCUMENTS
        );
      });
    });

    it('supports rules in JSON schema', async function () {
      await addValidation(FAILING_VALIDATOR);
      await browser.clickVisible(Selectors.ValidationLoadSampleDocumentsBtn);

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

      const enableUpdateValidationButtonElement = browser.$(
        Selectors.EnableEditValidationButton
      );
      // Enable the editing mode and wait for it to be enabled.
      await browser.clickVisible(enableUpdateValidationButtonElement);
      await enableUpdateValidationButtonElement.waitForDisplayed({
        reverse: true,
      });

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await browser.setValidationWithinValidationTab(PASSING_VALIDATOR);
      await browser.clickVisible(Selectors.ValidationLoadSampleDocumentsBtn);

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
