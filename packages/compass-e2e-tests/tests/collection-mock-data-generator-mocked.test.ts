import { expect } from 'chai';
import clipboard from 'clipboardy';
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
import { startTelemetryServer, type Telemetry } from '../helpers/telemetry.ts';
import { isTestingWeb } from '../helpers/test-runner-context.ts';
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
          fieldPath: 'addresses',
          fakerMethod: 'location.streetAddress',
          fakerArgs: [],
        },
        {
          fieldPath: 'phoneNumbers.label',
          fakerMethod: 'word.noun',
          fakerArgs: [],
        },
        {
          fieldPath: 'phoneNumbers.number',
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
  let telemetry: Telemetry;
  let assistant: Awaited<ReturnType<typeof startMockAssistantServer>>;
  let releaseResponse: (() => void) | undefined;

  before(async function () {
    assistant = await startMockAssistantServer();
    telemetry = await startTelemetryServer();
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
    if (await browser.$(Selectors.SettingsModal).isDisplayed()) {
      await browser.$(Selectors.CloseSettingsModalButton).moveTo();
      await browser.clickVisible(Selectors.CloseSettingsModalButton);
      await browser.waitForOpenModal(Selectors.SettingsModal, {
        reverse: true,
      });
    }
    if (
      await browser.$(`${Selectors.MockDataGeneratorModal}[open]`).isExisting()
    ) {
      await closeGenerator();
    }
  });

  after(async function () {
    await cleanup(compass);
    await assistant.stop();
    await telemetry.stop();
  });

  async function openGenerator() {
    await browser.clickVisible(Selectors.AddDataButton);
    await browser.$(Selectors.GenerateMockDataOption).waitForClickable();
    await browser.$(Selectors.GenerateMockDataOption).moveTo();
    await browser.clickVisible(Selectors.GenerateMockDataOption);
    await browser.waitForOpenModal(Selectors.MockDataGeneratorModal);
    await browser.$(Selectors.MockDataGeneratorSchema).waitForDisplayed();
  }

  async function confirmSchema() {
    await browser.clickVisible(Selectors.MockDataGeneratorNext);
    await browser.$(Selectors.MockDataGeneratorPreview).waitForDisplayed();
  }

  async function closeGenerator() {
    const cancel = browser
      .$(Selectors.MockDataGeneratorModal)
      .$('button=Cancel');
    await cancel.moveTo();
    await cancel.waitForClickable();
    await cancel.click();
    await browser.waitForOpenModal(Selectors.MockDataGeneratorModal, {
      reverse: true,
    });
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

  async function copyCode(section: string) {
    await clipboard.write('');
    const code = browser.$(`${section} [data-testid="lg-code"]`);
    await code.scrollIntoView();
    await code.moveTo();
    await browser.clickVisible(
      `${section} [data-testid="lg-code-copy_button"]`
    );
    await browser.waitUntil(async () => (await clipboard.read()).length > 0);
    return await clipboard.read();
  }

  it('generates and copies a script and command through the normal collection menu', async function () {
    const event = await browser.listenForTelemetryEvents(telemetry);
    await openGenerator();
    expect(
      await browser.$(Selectors.MockDataGeneratorSchema).getText()
    ).to.include('names');
    await confirmSchema();
    assertRequest(false);
    const preview = await browser
      .$(Selectors.MockDataGeneratorPreview)
      .getText();
    expect(preview).to.include('firstName');
    expect(preview).not.to.include('0-firstName');
    await browser.setValueVisible(Selectors.MockDataGeneratorCount, '25');
    await browser.clickVisible(Selectors.MockDataGeneratorNext);
    await browser.$(Selectors.MockDataGeneratorScript).waitForDisplayed();
    const script = await copyCode(Selectors.MockDataGeneratorScript);
    expect(script).to.match(/const DB_NAME = ['"]test['"]/);
    expect(script).to.match(/const COLL_NAME = ['"]mockDataGenerator['"]/);
    expect(script).to.include('const TOTAL_DOCUMENTS = 25');
    expect(script).to.include('faker.person.firstName(');
    const command = await copyCode(Selectors.MockDataGeneratorRunCommand);
    expect(command).to.include('mongosh "mongodb://');
    expect(command).to.include('--file mockdatascript.js');
    expect(command).not.to.include('--password');
    await event('Mock Data Generator Screen Viewed');
    await event('Mock Data Generator Screen Proceeded');
    await event('Mock Data Document Count Changed');
    await event('Mock Data Script Generated');
    await event('Mock Data Script Copied');
  });

  it('sends sample values only after enabling the preference', async function () {
    await browser.setFeature('enableGenAISampleDocumentPassing', true);
    await openGenerator();
    await confirmSchema();
    assertRequest(true);
  });

  it('opens desktop AI settings, saves the sample-values preference, and reopens the generator', async function () {
    if (isTestingWeb()) this.skip();
    await openGenerator();
    await browser.clickVisible(Selectors.MockDataGeneratorSettings);
    await browser.waitForOpenModal(Selectors.MockDataGeneratorModal, {
      reverse: true,
    });
    await browser.waitForOpenModal(Selectors.SettingsModal);
    await browser
      .$(Selectors.ArtificialIntelligenceSettingsContent)
      .waitForDisplayed();
    await browser.clickParent(
      Selectors.SettingsInputElement('enableGenAISampleDocumentPassing')
    );
    await browser.clickVisible(Selectors.SaveSettingsButton);
    await browser.waitForOpenModal(Selectors.SettingsModal, { reverse: true });
    await openGenerator();
    expect(
      await browser
        .$(Selectors.MockDataGeneratorSampleValuesBanner)
        .isExisting()
    ).to.equal(false);
    await confirmSchema();
    assertRequest(true);
  });

  it('shows an API failure and allows retrying the schema confirmation', async function () {
    assistant.setResponse({ status: 500, body: 'Generation unavailable' });
    await openGenerator();
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
    await openGenerator();
    await browser.clickVisible(Selectors.MockDataGeneratorNext);
    await browser.waitUntil(() => assistant.getRequests().length === 1);
    await closeGenerator();
    releaseResponse?.();
    assistant.clearRequests();
    assistant.setResponse(toolResponse);
    await openGenerator();
    await confirmSchema();
    assertRequest(false);
  });

  it('makes an empty collection eligible after inserting its first document', async function () {
    await createDummyCollections();
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      dbName,
      'json-array',
      'Documents'
    );
    await browser.clickVisible(Selectors.AddDataButton);
    expect(
      await browser.$(Selectors.GenerateMockDataOption).isExisting()
    ).to.equal(false);
    await browser.keys('Escape');
    await tryToInsertDocument(browser, '{ "name": "First document" }');
    await browser.waitForOpenModal(Selectors.InsertDialog, { reverse: true });
    await openGenerator();
    await confirmSchema();
    expect(
      await browser.$(Selectors.MockDataGeneratorPreview).getText()
    ).to.include('name');
  });
});
