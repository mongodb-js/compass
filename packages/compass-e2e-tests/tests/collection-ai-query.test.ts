import chai from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import { getFirstListDocument } from '../helpers/read-first-document-content';

const { expect } = chai;

async function getQueryBarFilter(browser: CompassBrowser) {
  await browser.getCodemirrorEditorText(
    Selectors.queryBarOptionInputFilter('Documents')
  );
}

describe('Collection ai query', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let stopMockAtlasServer: () => Promise<void>;
  let getRequests: () => any[];

  before(async function () {
    process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN = 'true';

    telemetry = await startTelemetryServer();
    compass = await beforeTests({
      extraSpawnArgs: ['--enableAIExperience'],
    });
    browser = compass.browser;
  });

  const apiBaseUrl = process.env.COMPASS_ATLAS_SERVICE_BASE_URL;

  beforeEach(async function () {
    // Start a mock server to pass an ai response.
    // Set the server endpoint in the env.
    const {
      endpoint,
      getRequests: _getRequests,
      stop,
    } = await startMockAtlasServiceServer();

    stopMockAtlasServer = stop;
    getRequests = _getRequests;

    process.env.COMPASS_ATLAS_SERVICE_BASE_URL = endpoint;

    await createNumbersCollection();
    await browser.connectWithConnectionString();
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
    delete process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN;
  });

  afterEach(async function () {
    await stopMockAtlasServer();

    process.env.COMPASS_ATLAS_SERVICE_BASE_URL = apiBaseUrl;

    await afterTest(compass, this.currentTest);
  });

  it.only('shows errors from the backend when the request errors', async function () {
    // Click the ask ai button.
    await browser.clickVisible(Selectors.QueryBarAskAIButton);

    // Click the sign in button (sign in is skipped with environment flag).
    await browser.clickVisible(Selectors.AtlasSignInModalButton);

    // Enter the ai prompt.
    await browser.clickVisible(Selectors.QueryBarAITextInput);
    const testUserInput = 'find all documents where i is greater than 50';
    await browser.setOrClearValue(Selectors.QueryBarAITextInput, testUserInput);

    // Click generate.
    await browser.clickVisible(Selectors.QueryBarAIGenerateQueryButton);

    // Check that the request was made with the correct parameters.
    const requests = getRequests();
    expect(requests.length).to.equal(1);
    expect(requests[0].userInput).to.equal(testUserInput);
    expect(requests[0].collectionName).to.equal('numbers');
    expect(requests[0].databaseName).to.equal('numbers');
    expect(requests[0].schema).to.deep.equal({
      i: {
        types: ['number'],
      },
      j: {
        types: ['number'],
      },
    });

    // Make sure the query bar was updated.
    const queryBarFilterContent = await getQueryBarFilter(browser);
    expect(queryBarFilterContent).to.equal('{i: {$gt: 50}}');

    // Run it and check documents where shown.
    const modifiedResult = await getFirstListDocument(browser);
    expect(modifiedResult.phoneNumber).to.be.equal('"10101010"');
  });

  // it('makes request to the server and updates the query bar with the response', async function () {
  //   const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

  //   const queryExecutedEvent = await telemetryEntry('Query Executed');

  // });

  // TODO: Query feedback w/ telemetry.
});
