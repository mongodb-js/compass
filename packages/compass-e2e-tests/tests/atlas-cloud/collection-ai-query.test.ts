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

      await browser.setFeatureCompassWeb(
        'enableGenAIFeaturesAtlasProject',
        true
      );
      await browser.setFeatureCompassWeb(
        'enableGenAISampleDocumentPassingOnAtlasProject',
        true
      );
      await browser.setFeatureCompassWeb('enableGenAIFeaturesAtlasOrg', true);
      await browser.setFeatureCompassWeb(
        'optInDataExplorerGenAIFeatures',
        true
      );
    });

    it('should update the query bar with a generated query', async function () {
      // Click the ai entry button.
      await browser.clickVisible(Selectors.QueryBarAIEntryButton);

      // Enter the ai prompt.
      await browser.clickVisible(Selectors.QueryBarAITextInput);

      const testUserInput = 'find all documents where i is greater than 50';
      await browser.setValueVisible(
        Selectors.QueryBarAITextInput,
        testUserInput
      );

      // Click generate.
      await browser.clickVisible(Selectors.QueryBarAIGenerateQueryButton);

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

      await browser.setFeatureCompassWeb(
        'enableGenAIFeaturesAtlasProject',
        true
      );
      await browser.setFeatureCompassWeb(
        'enableGenAISampleDocumentPassingOnAtlasProject',
        true
      );
      await browser.setFeatureCompassWeb('enableGenAIFeaturesAtlasOrg', true);
      await browser.setFeatureCompassWeb(
        'optInDataExplorerGenAIFeatures',
        false
      );
    });

    it('should not show the gen ai intro button', async function () {
      // Ensure the query bar is shown.
      await browser
        .$(Selectors.queryBarOptionInputFilter('Documents'))
        .waitForDisplayed();

      const aiIntroButton = browser.$(Selectors.QueryBarAIEntryButton);
      const isSidebarCreateCollectionButtonExisting =
        await aiIntroButton.isExisting();
      expect(isSidebarCreateCollectionButtonExisting).to.be.equal(false);
    });
  });
});
