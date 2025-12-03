import { expect } from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
  screenshotPathName,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { startMockAtlasServiceServer } from '../helpers/mock-atlas-service';
import type { MockAtlasServerResponse } from '../helpers/mock-atlas-service';
import { startMockAssistantServer } from '../helpers/assistant-service';

describe('Collection ai query (with mocked backend)', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let setMockAtlasServerResponse: (response: MockAtlasServerResponse) => void;
  let stopMockAtlasServer: () => Promise<void>;
  let getRequests: () => any[];
  let clearRequests: () => void;

  before(async function () {
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

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await browser.setEnv(
      'COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE',
      endpoint
    );

    await browser.setFeature('enableGenAIFeatures', true);
    await browser.setFeature('enableGenAISampleDocumentPassing', true);
    await browser.setFeature('optInGenAIFeatures', true);

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
    await stopMockAtlasServer();

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
        return queryBarFilterContent === '{i: {$gt: 50}}';
      });

      // Check that the request was made with the correct parameters.
      const requests = getRequests();
      expect(requests.length).to.equal(1);

      const queryRequest = requests[0];
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
      await browser.clickVisible(Selectors.GenAIEntryButton);

      // Enter the ai prompt.
      await browser.clickVisible(Selectors.GenAITextInput);

      const testUserInput = 'find all documents where i is greater than 50';
      await browser.setValueVisible(Selectors.GenAITextInput, testUserInput);

      // Click generate.
      await browser.clickVisible(Selectors.GenAIGenerateQueryButton);

      // Check that the error is shown.
      const errorBanner = browser.$(Selectors.GenAIErrorMessageBanner);
      await errorBanner.waitForDisplayed();
      expect(await errorBanner.getText()).to.equal(
        'Sorry, we were unable to generate the query, please try again. If the error persists, try changing your prompt.'
      );
    });
  });
});

async function setup(
  browser: CompassBrowser,
  dbName: string,
  collName: string
) {
  await createNumbersCollection();
  await browser.setupDefaultConnections();
  await browser.connectToDefaults();
  await browser.navigateToCollectionTab(
    DEFAULT_CONNECTION_NAME_1,
    dbName,
    collName,
    'Documents'
  );

  await browser.setFeature('enableChatbotEndpointForGenAI', true);
  await browser.setFeature('enableGenAIFeatures', true);
  await browser.setFeature('enableGenAISampleDocumentPassing', true);
  await browser.setFeature('optInGenAIFeatures', true);
}

describe.only('Collection ai query with chatbot (with mocked backend)', function () {
  const dbName = 'test';
  const collName = 'numbers';
  let compass: Compass;
  let browser: CompassBrowser;

  let mockAssistantServer: Awaited<ReturnType<typeof startMockAssistantServer>>;

  before(async function () {
    mockAssistantServer = await startMockAssistantServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await browser.setEnv(
      'COMPASS_ASSISTANT_BASE_URL_OVERRIDE',
      mockAssistantServer.endpoint
    );
  });

  after(async function () {
    await mockAssistantServer.stop();
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    try {
      mockAssistantServer.clearRequests();
    } catch (err) {
      await browser.screenshot(screenshotPathName('afterEach-GenAi-Query'));
      throw err;
    }
  });

  describe('when the ai model response is valid', function () {
    beforeEach(async function () {
      await setup(browser, dbName, collName);
      mockAssistantServer.setResponse({
        status: 200,
        body: '<filter>{i: {$gt: 50}}</filter>',
      });
    });

    it('makes request to the server and updates the query bar with the response', async function () {
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
        return queryBarFilterContent === '{"i":{"$gt":50}}';
      });

      // Check that the request was made with the correct parameters.
      const requests = mockAssistantServer.getRequests();
      expect(requests.length).to.equal(1);

      const queryRequest = requests[0];
      // TODO(COMPASS-10125): Switch the model to `mongodb-slim-latest` when
      // enabling this feature.
      expect(queryRequest.content.model).to.equal('mongodb-chat-latest');
      expect(queryRequest.content.instructions).to.be.string;
      expect(queryRequest.content.input).to.be.an('array').of.length(1);

      const message = queryRequest.content.input[0];
      expect(message.role).to.equal('user');
      expect(message.content).to.be.an('array').of.length(1);
      expect(message.content[0]).to.have.property('type');
      expect(message.content[0]).to.have.property('text');

      // Run it and check that the correct documents are shown.
      await browser.runFind('Documents', true);
      const modifiedResult = await browser.getFirstListDocument();
      expect(modifiedResult.i).to.be.equal('51');
    });
  });

  describe('when the chatbot api request errors', function () {
    beforeEach(async function () {
      await setup(browser, dbName, collName);
      mockAssistantServer.setResponse({
        status: 500,
        body: '',
      });
    });

    it('the error is shown to the user', async function () {
      // Click the ai entry button.
      await browser.clickVisible(Selectors.GenAIEntryButton);

      // Enter the ai prompt.
      await browser.clickVisible(Selectors.GenAITextInput);

      const testUserInput = 'find all documents where i is greater than 50';
      await browser.setValueVisible(Selectors.GenAITextInput, testUserInput);

      // Click generate.
      await browser.clickVisible(Selectors.GenAIGenerateQueryButton);

      // Check that the error is shown.
      const errorBanner = browser.$(Selectors.GenAIErrorMessageBanner);
      await errorBanner.waitForDisplayed();
      expect(await errorBanner.getText()).to.equal(
        'Sorry, we were unable to generate the query, please try again. If the error persists, try changing your prompt.'
      );
    });
  });
});
