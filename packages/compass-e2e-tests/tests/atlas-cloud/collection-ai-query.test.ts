import { expect } from 'chai';

import type { CompassBrowser } from '../../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
} from '../../helpers/compass';
import type { Compass } from '../../helpers/compass';
import * as Selectors from '../../helpers/selectors';
import { createNumbersCollection } from '../../helpers/insert-data';
import { isTestingAtlasCloudSandbox } from '../../helpers/test-runner-context';
import { switchPipelineMode } from '../../helpers/commands/switch-pipeline-mode';

describe('Collection ai query', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingAtlasCloudSandbox()) {
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
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'numbers',
        'Documents'
      );

      await browser.setFeature('enableGenAIFeaturesAtlasProject', true);
      await browser.setFeature(
        'enableGenAISampleDocumentPassingOnAtlasProject',
        true
      );
      await browser.setFeature('enableGenAIFeaturesAtlasOrg', true);
      await browser.setFeature('optInDataExplorerGenAIFeatures', true);
    });

    describe('on the documents tab', function () {
      beforeEach(async function () {
        await browser.navigateToCollectionTab(
          DEFAULT_CONNECTION_NAME_1,
          'test',
          'numbers',
          'Documents'
        );
      });

      it('should update the query bar with a generated query', async function () {
        // Click the ai entry button.
        await browser.clickVisible(Selectors.GenAIEntryButton);

        // Enter the ai prompt.
        await browser.clickVisible(Selectors.GenAITextInput);

        const testUserInput = 'find all documents where i is greater than 50';
        await browser.setValueVisible(Selectors.GenAITextInput, testUserInput);

        // Click generate.
        await browser.clickVisible(Selectors.GenAIGenerateQueryButton);

        // Wait for the ipc events to succeed.
        await browser.waitUntil(async function () {
          // Make sure the query bar was updated.
          const queryBarFilterContent = await browser.getCodemirrorEditorText(
            Selectors.queryBarOptionInputFilter('Documents')
          );
          return (
            queryBarFilterContent.includes('$gt') &&
            queryBarFilterContent.includes('50')
          );
        });

        // Run it and check that the correct documents are shown.
        await browser.runFind('Documents', true);
        const modifiedResult = await browser.getFirstListDocument();
        expect(modifiedResult.i).to.be.equal('51');
      });
    });

    describe('on the aggregations tab', function () {
      beforeEach(async function () {
        await browser.navigateToCollectionTab(
          DEFAULT_CONNECTION_NAME_1,
          'test',
          'numbers',
          'Aggregations'
        );

        await switchPipelineMode(browser, 'as-text');
      });

      it('should update the aggregation editor with a generated aggregation', async function () {
        // Click the ai entry button.
        await browser.clickVisible(Selectors.GenAIOpenButton);

        // Enter the ai prompt.
        await browser.clickVisible(Selectors.GenAITextInput);

        const testUserInput = 'find all documents where i is 99';
        await browser.setValueVisible(Selectors.GenAITextInput, testUserInput);

        // Click generate.
        await browser.clickVisible(Selectors.GenAIGenerateQueryButton);

        await browser.waitUntil(async function () {
          const textEditor = browser.$(Selectors.AggregationAsTextEditor);
          const textContent = await textEditor.getText();
          return textContent.includes('$match');
        });

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
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'numbers',
        'Documents'
      );

      await browser.setFeature('enableGenAIFeaturesAtlasProject', true);
      await browser.setFeature(
        'enableGenAISampleDocumentPassingOnAtlasProject',
        true
      );
      await browser.setFeature('enableGenAIFeaturesAtlasOrg', false);
      await browser.setFeature('optInDataExplorerGenAIFeatures', true);
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
