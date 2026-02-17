import { expect } from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
  screenshotPathName,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { startMockAssistantServer } from '../helpers/assistant-service';

async function setup(
  browser: CompassBrowser,
  dbName: string,
  collName: string
) {
  await createNumbersCollection();
  await browser.setupDefaultConnections();
  await browser.connectToDefaults();
  await browser.navigateToCollectionTab(
    getDefaultConnectionNames(0),
    dbName,
    collName,
    'Documents'
  );

  await browser.setFeature('enableGenAIFeatures', true);
  await browser.setFeature('enableGenAISampleDocumentPassing', true);
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
      expect(queryRequest.req.headers).to.have.property('entrypoint');
      expect(queryRequest.content.model).to.equal('mongodb-slim-latest');
      expect(queryRequest.content.instructions).to.be.a('string');
      expect(queryRequest.content.store).to.equal(true);
      expect(queryRequest.content.metadata).to.have.property('userId');
      expect(queryRequest.content.metadata.sensitiveStorage).to.have.equal(
        'sensitive'
      );
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
