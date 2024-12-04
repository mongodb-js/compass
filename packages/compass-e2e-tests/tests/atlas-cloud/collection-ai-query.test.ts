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

  beforeEach(async function () {
    // Skip the feature opt in modal flow as it would make the tests dependent on the user.
    process.env.COMPASS_E2E_SKIP_ATLAS_OPT_IN = 'true';

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
  });

  afterEach(async function () {
    delete process.env.COMPASS_E2E_SKIP_ATLAS_OPT_IN;

    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  describe('when the the feature is enabled', function () {
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
});
