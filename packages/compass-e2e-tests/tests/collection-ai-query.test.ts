import { expect } from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import type { MockAtlasServerResponse } from '../helpers/atlas-service';

describe('Collection ai query', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let setMockAtlasServerResponse: (response: MockAtlasServerResponse) => void;
  let stopMockAtlasServer: () => Promise<void>;
  let getRequests: () => any[];
  let clearRequests: () => void;

  before(async function () {
    skipForWeb(this, 'ai queries not yet available in compass-web');

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
      'Documents'
    );
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await stopMockAtlasServer();

    delete process.env.COMPASS_ATLAS_SERVICE_BASE_URL_OVERRIDE;
    delete process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN;

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    clearRequests();
    await screenshotIfFailed(compass, this.currentTest);
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
        return queryBarFilterContent === '{i: {$gt: 50}}';
      });

      // Check that the request was made with the correct parameters.
      const requests = getRequests();
      expect(requests.length).to.equal(2);
      const lastPathRegex = /[^/]*$/;
      const userId = lastPathRegex.exec(requests[0].req.url)?.[0];
      expect((userId?.match(/-/g) || []).length).to.equal(4); // Is uuid like.

      const queryRequest = requests[1];
      const queryURL = new URL(
        queryRequest.req.url,
        `http://${queryRequest.req.headers.host}`
      );
      expect([...new Set(queryURL.searchParams.keys())].length).to.equal(1);
      const requestId = queryURL.searchParams.get('request_id');
      expect((requestId?.match(/-/g) || []).length).to.equal(4); // Is uuid like.
      expect(queryRequest.content.userInput).to.equal(testUserInput);
      expect(queryRequest.content.collectionName).to.equal('numbers');
      expect(queryRequest.content.databaseName).to.equal('test');
      expect(queryRequest.content.schema).to.exist;

      // Run it and check that the correct documents are shown.
      await browser.runFind('Documents', true);
      const modifiedResult = await browser.getFirstListDocument();
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
      await browser.setValueVisible(
        Selectors.QueryBarAITextInput,
        testUserInput
      );

      // Click generate.
      await browser.clickVisible(Selectors.QueryBarAIGenerateQueryButton);

      // Check that the error is shown.
      const errorBanner = browser.$(Selectors.QueryBarAIErrorMessageBanner);
      await errorBanner.waitForDisplayed();
      expect(await errorBanner.getText()).to.equal(
        'Sorry, we were unable to generate the query, please try again. If the error persists, try changing your prompt.'
      );
    });
  });
});
