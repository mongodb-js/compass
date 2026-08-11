import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
  serverSatisfies,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import {
  createNumbersCollection,
  createConstraintValidationCollection,
} from '../helpers/mongo-clients.ts';
import { expect } from 'chai';

const NO_PREVIEW_DOCUMENTS = 'No Preview Documents';
const PASSING_VALIDATOR = '{ $jsonSchema: {} }';
const FAILING_VALIDATOR =
  '{ $jsonSchema: { bsonType: "object", required: [ "phone" ] } }';
const CONSTRAINT_COLLECTION = 'constraint-validation';
const PREPARED_COLLECTION = 'prepared-validation';

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
    // Has to happen before connecting, otherwise the collections are missing
    // from the sidebar. The "constraint" validation level is MongoDB 9.0+ and
    // requires FCV 9.0.
    if (serverSatisfies('>= 9.0.0-alpha0')) {
      await createConstraintValidationCollection(CONSTRAINT_COLLECTION);
      await createConstraintValidationCollection(PREPARED_COLLECTION, {
        stopAfterPrepare: true,
      });
    }
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
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

  context(
    'when the collection uses the constraint validation level',
    function () {
      beforeEach(async function () {
        if (!serverSatisfies('>= 9.0.0-alpha0')) {
          return this.skip();
        }
        await browser.navigateToCollectionTab(
          getDefaultConnectionNames(0),
          'test',
          CONSTRAINT_COLLECTION,
          'Validation'
        );
      });

      it('shows the level and prevents the rules from being edited', async function () {
        const banner = browser.$(Selectors.ValidationWarningBanner);
        await banner.waitForDisplayed();
        expect(await banner.getText()).to.include(
          'cannot be changed while it is in effect'
        );

        // The server rejects validator changes outright, so editing is never
        // offered rather than failing on apply.
        expect(
          await browser.$(Selectors.EnableEditValidationButton).isExisting()
        ).to.equal(false);
        expect(
          await browser
            .$(Selectors.ValidationLevelSelector)
            .getAttribute('aria-disabled')
        ).to.equal('true');

        // The level still has to be readable, not blank.
        expect(
          await browser.$(Selectors.ValidationLevelSelector).getText()
        ).to.include('Constraint');
      });
    }
  );

  context('when a constraint validation upgrade is prepared', function () {
    beforeEach(async function () {
      if (!serverSatisfies('>= 9.0.0-alpha0')) {
        return this.skip();
      }
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        PREPARED_COLLECTION,
        'Validation'
      );
    });

    it('prevents the rules from being edited while the level still reads strict', async function () {
      const banner = browser.$(Selectors.ValidationWarningBanner);
      await banner.waitForDisplayed();
      expect(await banner.getText()).to.include(
        'prepareConstraintValidationLevel: false'
      );

      expect(
        await browser.$(Selectors.EnableEditValidationButton).isExisting()
      ).to.equal(false);
      expect(
        await browser.$(Selectors.ValidationLevelSelector).getText()
      ).to.include('Strict');
    });
  });
});
