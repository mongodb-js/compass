import chai from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import type { MockAtlasServerResponse } from '../helpers/atlas-service';
import { getFirstListDocument } from '../helpers/read-first-document-content';

const { expect } = chai;

describe('Collection ai query', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let setMockAtlasServerResponse: (response: MockAtlasServerResponse) => void;
  let stopMockAtlasServer: () => Promise<void>;
  let getRequests: () => any[];
  let clearRequests: () => void;

  before(async function () {
    process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN = 'true';

    // Start a mock server to pass an ai response.
    const {
      endpoint,
      getRequests: _getRequests,
      clearRequests: _clearRequests,
      setMockAtlasServerResponse: _setMockAtlasServerResponse,
      stop,
    } = await startMockAtlasServiceServer();

    stopMockAtlasServer = stop;
    getRequests = _getRequests;
    clearRequests = _clearRequests;
    setMockAtlasServerResponse = _setMockAtlasServerResponse;

    process.env.COMPASS_ATLAS_SERVICE_BASE_URL_OVERRIDE = endpoint;
    process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE = endpoint;

    telemetry = await startTelemetryServer();
    compass = await beforeTests({
      extraSpawnArgs: ['--enableGenAIExperience'],
    });
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  after(async function () {
    await stopMockAtlasServer();

    delete process.env.COMPASS_ATLAS_SERVICE_BASE_URL_OVERRIDE;
    delete process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN;

    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  afterEach(async function () {
    clearRequests();
    await afterTest(compass, this.currentTest);
  });

  describe('when the ai model response is valid', function () {
    beforeEach(function () {
      setMockAtlasServerResponse({
        status: 200,
        body: {
          content: {
            query: {
              filter: '{i: {$gt: 50}}',
            },
          },
        },
      });
    });

    it('makes request to the server and updates the query bar with the response', async function () {
      // Click the ai entry button.
      await browser.clickVisible(Selectors.QueryBarAIEntryButton);

      // Enter the ai prompt.
      await browser.clickVisible(Selectors.QueryBarAITextInput);

      const testUserInput = 'find all documents where i is greater than 50';
      await browser.setOrClearValue(
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
        return queryBarFilterContent === '{i: {$gt: 50}}';
      });

      // Check that the request was made with the correct parameters.
      const requests = getRequests();
      expect(requests.length).to.equal(2);
      const lastPathRegex = /[^/]*$/;
      const userId = lastPathRegex.exec(requests[0].req.url)?.[0];
      expect((userId?.match(/-/g) || []).length).to.equal(4); // Is uuid like.
      expect(requests[1].content.userInput).to.equal(testUserInput);
      expect(requests[1].content.collectionName).to.equal('numbers');
      expect(requests[1].content.databaseName).to.equal('test');
      expect(requests[1].content.schema).to.exist;

      // Run it and check that the correct documents are shown.
      await browser.runFind('Documents', true);
      const modifiedResult = await getFirstListDocument(browser);
      expect(modifiedResult.i).to.be.equal('51');
    });
  });

  describe('when the Atlas service request errors', function () {
    beforeEach(function () {
      setMockAtlasServerResponse({
        status: 500,
        body: {
          content: 'error',
        },
      });
    });

    it('the error is shown to the user', async function () {
      // Click the ai entry button.
      await browser.clickVisible(Selectors.QueryBarAIEntryButton);

      // Enter the ai prompt.
      await browser.clickVisible(Selectors.QueryBarAITextInput);

      const testUserInput = 'find all documents where i is greater than 50';
      await browser.setOrClearValue(
        Selectors.QueryBarAITextInput,
        testUserInput
      );

      // Click generate.
      await browser.clickVisible(Selectors.QueryBarAIGenerateQueryButton);

      // Check that the error is shown.
      const errorBanner = await browser.$(
        Selectors.QueryBarAIErrorMessageBanner
      );
      await errorBanner.waitForDisplayed();
      expect(await errorBanner.getText()).to.equal(
        'Sorry, we were unable to generate the query, please try again. If the error persists, try changing your prompt.'
      );
    });
  });
});
