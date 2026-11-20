import { expect } from 'chai';

import type { CompassBrowser } from '../../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  screenshotPathName,
  getDefaultConnectionNames,
} from '../../helpers/compass.ts';
import type { Compass } from '../../helpers/compass.ts';
import * as Selectors from '../../helpers/selectors.ts';
import { createNumbersCollection } from '../../helpers/mongo-clients.ts';
import {
  isTestingWeb,
  isTestingWebAtlasCloud,
} from '../../helpers/test-runner-context.ts';
import { switchPipelineMode } from '../../helpers/commands/switch-pipeline-mode.ts';

// Whether the generate query / generate aggregation input was left open is
// persisted, make sure every test starts with it closed.
const AI_INPUT_VISIBLE_STORAGE_KEYS = [
  'compass_query_bar_ai_input_visible',
  'compass_aggregations_ai_input_visible',
];

async function resetAIInputVisibleState(browser: CompassBrowser) {
  await browser.execute((keys: string[]) => {
    for (const key of keys) {
      // eslint-disable-next-line no-restricted-globals
      localStorage.removeItem(key);
    }
  }, AI_INPUT_VISIBLE_STORAGE_KEYS);
}

const GENERATE_ATTEMPTS = 3;

/**
 * The real AI backend is non-deterministic and can transiently fail (network
 * errors, slow responses), so the generate step is retried a few times before
 * giving up.
 */
async function generateWithRetry(
  browser: CompassBrowser,
  userInput: string,
  waitForResult: () => Promise<boolean>
) {
  for (let attempt = 1; attempt <= GENERATE_ATTEMPTS; attempt++) {
    await browser.clickVisible(Selectors.GenAITextInput);
    await browser.setValueVisible(Selectors.GenAITextInput, userInput);

    // Click generate.
    await browser.clickVisible(Selectors.GenAIGenerateQueryButton);

    try {
      // The backend normally responds within seconds: a short per-attempt
      // timeout leaves room to retry instead of stalling for the full
      // waitforTimeout on a hopeless attempt.
      await browser.waitUntil(waitForResult, { timeout: 20_000 });
      return;
    } catch (err) {
      await browser.screenshot(
        screenshotPathName(`ai-generate-attempt-${attempt}-${Date.now()}`)
      );
      if (attempt === GENERATE_ATTEMPTS) {
        const errorBanner = await browser
          .$(Selectors.GenAIErrorMessageBanner)
          .isExisting();
        throw new Error(
          `AI generation did not produce a result after ${attempt} attempts${
            errorBanner ? ' (error banner shown)' : ''
          }: ${(err as Error).message}`
        );
      }
    }
  }
}

describe('Collection ai query (with real Cloud backend)', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    // Skipping tests for environments where real backend is not available
    if (
      // Knowledge API doesn't allow requests from localhost
      isTestingWeb() ||
      // Knowledge API doesn't allow requests from Evergreen in non-prod
      // envioronments that we're using for WebAtlasCloud tests
      isTestingWebAtlasCloud()
    ) {
      this.skip();
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  describe('when the feature is enabled', function () {
    beforeEach(async function () {
      compass = await init(this.test?.fullTitle());
      browser = compass.browser;
      await browser.setupDefaultConnections();

      await createNumbersCollection();
      await browser.connectToDefaults();
      await resetAIInputVisibleState(browser);
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Documents'
      );

      await browser.setFeature('enableGenAIFeaturesAtlasProject', true);
      await browser.setFeature('enableGenAISampleDocumentPassing', true);
      await browser.setFeature('enableGenAIFeaturesAtlasOrg', true);
      await browser.setFeature('optInGenAIFeatures', true);
    });

    describe('on the documents tab', function () {
      beforeEach(async function () {
        await browser.navigateToCollectionTab(
          getDefaultConnectionNames(0),
          'test',
          'numbers',
          'Documents'
        );
      });

      it('should update the query bar with a generated query', async function () {
        // Click the ai entry button.
        await browser.clickVisible(Selectors.GenAIEntryButton);

        // Wait for the ipc events to succeed.
        await generateWithRetry(
          browser,
          'find all documents where i is greater than 50',
          async function () {
            // Make sure the query bar was updated.
            const queryBarFilterContent = await browser.getCodemirrorEditorText(
              Selectors.queryBarOptionInputFilter('Documents')
            );
            return (
              queryBarFilterContent.includes('$gt') &&
              queryBarFilterContent.includes('50')
            );
          }
        );

        // Run it and check that the correct documents are shown.
        await browser.runFind('Documents', true);
        const modifiedResult = await browser.getFirstListDocument();
        expect(modifiedResult.i).to.be.equal('51');
      });
    });

    describe('on the aggregations tab', function () {
      beforeEach(async function () {
        await browser.navigateToCollectionTab(
          getDefaultConnectionNames(0),
          'test',
          'numbers',
          'Aggregations'
        );

        await switchPipelineMode(browser, 'as-text');
      });

      it('should update the aggregation editor with a generated aggregation', async function () {
        // Click the ai entry button.
        await browser.clickVisible(Selectors.GenAIOpenButton);

        await generateWithRetry(
          browser,
          'find all documents where i is 99',
          async function () {
            const textEditor = browser.$(Selectors.AggregationAsTextEditor);
            const textContent = await textEditor.getText();
            return textContent.includes('$match');
          }
        );

        // Run it and check that the correct documents are shown.
        await browser.clickVisible(Selectors.RunPipelineButton);
        const resultsWorkspace = browser.$(
          Selectors.AggregationResultsWorkspace
        );
        await resultsWorkspace.waitForDisplayed();

        await browser.clickVisible(
          Selectors.AggregationResultsJSONListSwitchButton
        );
        const rawDocuments = await browser.getCodemirrorEditorTextAll(
          Selectors.DocumentJSONEntry
        );
        const documents = rawDocuments.map((text) => {
          return JSON.parse(text);
        });

        expect(documents).to.have.lengthOf(1);
        expect(documents[0]).to.have.property('_id');
        expect(documents[0]).to.have.property('i', 99);
      });
    });
  });

  describe('when the org feature is disabled', function () {
    beforeEach(async function () {
      compass = await init(this.test?.fullTitle());
      browser = compass.browser;
      await browser.setupDefaultConnections();

      await createNumbersCollection();
      await browser.connectToDefaults();
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Documents'
      );

      await browser.setFeature('enableGenAIFeaturesAtlasProject', true);
      await browser.setFeature('enableGenAISampleDocumentPassing', true);
      await browser.setFeature('enableGenAIFeaturesAtlasOrg', false);
      await browser.setFeature('optInGenAIFeatures', true);
    });

    it('should not show the gen ai intro button', async function () {
      // Ensure the query bar is shown.
      await browser
        .$(Selectors.queryBarOptionInputFilter('Documents'))
        .waitForDisplayed();

      const aiIntroButton = browser.$(Selectors.GenAIEntryButton);
      const isSidebarCreateCollectionButtonExisting =
        await aiIntroButton.isExisting();
      expect(isSidebarCreateCollectionButtonExisting).to.be.equal(false);
    });
  });
});
