import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import {
  createNestedDocumentsCollection,
  createDummyCollections,
} from '../helpers/mongo-clients.ts';
import {
  startMockAssistantServer,
  type MockAssistantResponse,
} from '../helpers/assistant-service.ts';
import { tryToInsertDocument } from '../helpers/commands/try-to-insert-document.ts';

const toolResponse: MockAssistantResponse = {
  status: 200,
  toolCall: {
    name: 'mockDataSchema',
    arguments: {
      fields: [
        {
          fieldPath: '_id',
          fakerMethod: 'database.mongodbObjectId',
          fakerArgs: [],
        },
        {
          fieldPath: 'names.firstName',
          fakerMethod: 'person.firstName',
          fakerArgs: [],
        },
        {
          fieldPath: 'names.lastName',
          fakerMethod: 'person.lastName',
          fakerArgs: [],
        },
        {
          fieldPath: 'addresses[]',
          fakerMethod: 'location.streetAddress',
          fakerArgs: [],
        },
        {
          fieldPath: 'phoneNumbers[].label',
          fakerMethod: 'word.noun',
          fakerArgs: [],
        },
        {
          fieldPath: 'phoneNumbers[].number',
          fakerMethod: 'phone.number',
          fakerArgs: [],
        },
      ],
    },
  },
};

describe('Collection mock data generator (with mocked backend)', function () {
  const dbName = 'test';
  const collName = 'mockDataGenerator';
  let compass: Compass;
  let browser: CompassBrowser;
  let assistant: Awaited<ReturnType<typeof startMockAssistantServer>>;
  let releaseResponse: (() => void) | undefined;

  before(async function () {
    assistant = await startMockAssistantServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
    await browser.setEnv(
      'COMPASS_ASSISTANT_BASE_URL_OVERRIDE',
      assistant.endpoint
    );
  });

  beforeEach(async function () {
    assistant.clearRequests();
    assistant.setResponse(toolResponse);
    await createNestedDocumentsCollection(collName, 2);
    await browser.disconnectAll();
    await browser.setFeature('enableMockDataGenerator', true);
    await browser.setFeature('enableGenAIFeatures', true);
    await browser.setFeature('enableGenAIFeaturesAtlasOrg', true);
    await browser.setFeature('optInGenAIFeatures', true);
    await browser.setFeature('enableGenAISampleDocumentPassing', false);
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      dbName,
      collName,
      'Documents'
    );
  });

  afterEach(async function () {
    releaseResponse?.();
    releaseResponse = undefined;
    await screenshotIfFailed(compass, this.currentTest);
    await browser.hideVisibleModal();
    await browser.setFeature('enableMockDataGenerator', false);
  });

  after(async function () {
    await cleanup(compass);
    await assistant.stop();
  });

  async function openGeneratorModal() {
    await browser.clickVisible(Selectors.AddDataButton);
    await browser.$(Selectors.GenerateMockDataOption).waitForClickable();
    await browser.$(Selectors.GenerateMockDataOption).moveTo();
    await browser.clickVisible(Selectors.GenerateMockDataOption);
    await browser.waitForOpenModal(Selectors.MockDataGeneratorModal);
    await browser.$(Selectors.MockDataGeneratorSchema).waitForDisplayed();
  }

  async function waitForSchemaReady() {
    await browser
      .$(Selectors.MockDataGeneratorLoader)
      .waitForDisplayed({ reverse: true, timeout: 60_000 });
  }

  async function confirmSchema() {
    await browser.clickVisible(Selectors.MockDataGeneratorNext);
    await browser.$(Selectors.MockDataGeneratorPreview).waitForDisplayed();
  }

  function assertRequest(includeSampleValues: boolean) {
    const requests = assistant.getRequests();
    expect(requests).to.have.lengthOf(1);
    const { req, content } = requests[0];
    expect(req.headers['x-assistant-entrypoint']).to.equal(
      'mock-data-generator'
    );
    expect(req.headers['x-client-request-id']).to.be.a('string');
    expect(content.tools).to.have.lengthOf(1);
    expect(content.tools[0]).to.include({
      type: 'function',
      name: 'mockDataSchema',
    });
    expect(content.tool_choice).to.deep.equal({
      type: 'function',
      name: 'mockDataSchema',
    });
    const prompt = content.input[0].content[0].text as string;
    expect(prompt).to.include(`The database name is \`${dbName}\``);
    expect(prompt).to.include(`The collection name is \`${collName}\``);
    expect(prompt).to.include('names.firstName');
    if (includeSampleValues) {
      expect(prompt).to.include('sampleValues');
      expect(prompt).to.include('0-firstName');
    } else {
      expect(prompt).not.to.include('sampleValues');
      expect(prompt).not.to.include('0-firstName');
      expect(prompt).not.to.include('1-firstName');
    }
  }

  it('sends sample values only after enabling the preference', async function () {
    await browser.setFeature('enableGenAISampleDocumentPassing', true);
    await openGeneratorModal();
    await waitForSchemaReady();
    await confirmSchema();
    assertRequest(true);
  });

  it('shows an API failure and allows retrying the schema confirmation', async function () {
    assistant.setResponse({ status: 500, body: 'Generation unavailable' });
    await openGeneratorModal();
    await waitForSchemaReady();
    await browser.clickVisible(Selectors.MockDataGeneratorNext);
    await browser.$(Selectors.MockDataGeneratorError).waitForDisplayed();
    expect(
      await browser.$(Selectors.MockDataGeneratorError).getText()
    ).to.equal('LLM Request failed. Please confirm again.');
    assistant.clearRequests();
    assistant.setResponse(toolResponse);
    await confirmSchema();
    assertRequest(false);
  });

  it('can cancel an in-flight request and generate after reopening', async function () {
    assistant.setResponse({
      ...toolResponse,
      waitFor: new Promise<void>((resolve) => {
        releaseResponse = resolve;
      }),
    });
    await openGeneratorModal();
    await waitForSchemaReady();
    await browser.clickVisible(Selectors.MockDataGeneratorNext);
    await browser.waitUntil(() => assistant.getRequests().length === 1);
    await browser.hideVisibleModal();
    releaseResponse?.();
    assistant.clearRequests();
    assistant.setResponse(toolResponse);
    await openGeneratorModal();
    await confirmSchema();
    assertRequest(false);
  });

  it('handles an empty collection inside the modal and recovers after inserting documents', async function () {
    await createDummyCollections();
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      dbName,
      'json-array',
      'Documents'
    );
    // The menu item depends on cheap eligibility only, so it is visible even
    // for an empty collection; the empty case is handled inside the modal.
    await openGeneratorModal();
    await browser.$(Selectors.MockDataGeneratorSchemaError).waitForDisplayed();
    expect(
      await browser.$(Selectors.MockDataGeneratorSchemaError).getText()
    ).to.include('No documents found');
    await browser.hideVisibleModal();
    await tryToInsertDocument(browser, '{ "name": "First document" }');
    await browser.waitForOpenModal(Selectors.InsertDialog, { reverse: true });
    await openGeneratorModal();
    await waitForSchemaReady();
    await confirmSchema();
    expect(
      await browser.$(Selectors.MockDataGeneratorPreview).getText()
    ).to.include('name');
  });

  it('keeps the generator hidden while the feature flag is off', async function () {
    await browser.disconnectAll();
    await browser.setFeature('enableMockDataGenerator', false);
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      dbName,
      collName,
      'Documents'
    );
    await browser.clickVisible(Selectors.AddDataButton);
    expect(
      await browser.$(Selectors.GenerateMockDataOption).isExisting()
    ).to.equal(false);
    await browser.keys('Escape');
    expect(assistant.getRequests()).to.have.lengthOf(0);
  });
});
