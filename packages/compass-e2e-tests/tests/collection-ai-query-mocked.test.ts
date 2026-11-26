import { expect } from 'chai';
import { AI_MODEL_SLIM_VERSION } from '@mongodb-js/compass-generative-ai/provider';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
  screenshotPathName,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import { createNumbersCollection } from '../helpers/mongo-clients.ts';
import { startMockAssistantServer } from '../helpers/assistant-service.ts';

// Whether the generate query input was left open is persisted, make sure every
// test starts with it closed.
const AI_INPUT_VISIBLE_STORAGE_KEYS = [
  'compass_query_bar_ai_input_visible',
  'compass_aggregations_ai_input_visible',
];

async function setup(
  browser: CompassBrowser,
  dbName: string,
  collName: string
) {
  await createNumbersCollection(collName);
  await browser.disconnectAll();
  await browser.connectToDefaults();
  await browser.execute((keys: string[]) => {
    for (const key of keys) {
      // eslint-disable-next-line no-restricted-globals
      localStorage.removeItem(key);
    }
  }, AI_INPUT_VISIBLE_STORAGE_KEYS);
  await browser.navigateToCollectionTab(
    getDefaultConnectionNames(0),
    dbName,
    collName,
    'Documents'
  );

  await browser.setFeature('enableGenAIFeatures', true);
  await browser.setFeature('enableGenAISampleDocumentPassing', true);
  await browser.setFeature('enableGenAIFeaturesAtlasOrg', true);
  await browser.setFeature('optInGenAIFeatures', true);
}

describe('Collection ai query (with mocked backend)', function () {
  const dbName = 'test';
  const collName = 'numbers';
  let compass: Compass;
  let browser: CompassBrowser;

  let mockAssistantServer: Awaited<ReturnType<typeof startMockAssistantServer>>;

  before(async function () {
    mockAssistantServer = await startMockAssistantServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();

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
        return queryBarFilterContent === '{i:{$gt:50}}';
      });

      // Check that the request was made with the correct parameters.
      const requests = mockAssistantServer.getRequests();
      expect(requests.length).to.equal(1);

      const queryRequest = requests[0];
      expect(queryRequest.req.headers).to.have.property('x-client-request-id');
      expect(queryRequest.req.headers).to.have.property(
        'x-assistant-entrypoint'
      );
      expect(queryRequest.req.headers['x-client-thread-id']).to.be.a('string')
        .that.is.not.empty;
      expect(queryRequest.content.model).to.equal(AI_MODEL_SLIM_VERSION);
      expect(queryRequest.content.instructions).to.be.a('string');
      expect(queryRequest.content.store).to.equal(false);
      expect(queryRequest.content.metadata).to.have.property('analytics_id');
      expect(queryRequest.content.metadata.sensitive_storage).to.equal('true');
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

  describe('when the query bar hands off to the aggregation builder', function () {
    // Both tabs render the same generative AI input, scope to the aggregations one.
    const AggregationsGenAITextInput = `[data-testid="pipeline-toolbar"] ${Selectors.GenAITextInput}`;
    const AggregationsGenAIGenerateButton = `[data-testid="pipeline-toolbar"] ${Selectors.GenAIGenerateQueryButton}`;

    beforeEach(async function () {
      await setup(browser, dbName, collName);
      // An aggregation without a filter makes the query bar hand the prompt
      // off to the aggregation builder.
      mockAssistantServer.setResponse({
        status: 200,
        body: '<aggregation>[{$match: {i: 99}}]</aggregation>',
      });
    });

    it('continues the same thread in the aggregation builder', async function () {
      await browser.clickVisible(Selectors.GenAIEntryButton);
      await browser.clickVisible(Selectors.GenAITextInput);
      await browser.setValueVisible(
        Selectors.GenAITextInput,
        'count documents grouped by i'
      );
      await browser.clickVisible(Selectors.GenAIGenerateQueryButton);

      await browser
        .$(Selectors.collectionSubTab('Aggregations', true))
        .waitForDisplayed();

      await browser.clickVisible(AggregationsGenAITextInput);
      await browser.setValueVisible(
        AggregationsGenAITextInput,
        'only documents where i is 99'
      );
      await browser.clickVisible(AggregationsGenAIGenerateButton);

      await browser.waitUntil(() => {
        return mockAssistantServer.getRequests().length === 2;
      });

      const [queryBarRequest, aggregationRequest] =
        mockAssistantServer.getRequests();
      const threadId = queryBarRequest.req.headers['x-client-thread-id'];
      expect(threadId).to.be.a('string').that.is.not.empty;
      expect(aggregationRequest.req.headers['x-client-thread-id']).to.equal(
        threadId
      );
      expect(
        aggregationRequest.req.headers['x-client-request-id']
      ).to.not.equal(queryBarRequest.req.headers['x-client-request-id']);
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
