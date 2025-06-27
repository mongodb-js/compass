import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createNumbersCollection,
  createNumbersStringCollection,
} from '../helpers/insert-data';
import {
  cleanUpDownloadedFile,
  waitForFileDownload,
} from '../helpers/downloads';
import { readFileSync } from 'fs';
import { recognize } from 'tesseract.js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

type DiagramInstance = {
  getNodes: () => Array<{
    id: string;
  }>;
};

async function setupDiagram(
  browser: CompassBrowser,
  options: {
    diagramName: string;
    connectionName: string;
    databaseName: string;
  }
) {
  await browser.navigateToDataModeling();

  // Click on create new data model button
  await browser.clickVisible(Selectors.CreateNewDataModelButton);

  // Fill in model details
  await browser.setValueVisible(
    Selectors.CreateDataModelNameInput,
    options.diagramName
  );
  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Select existing connection
  await browser.selectOption(
    Selectors.CreateDataModelConnectionSelector,
    options.connectionName
  );
  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Select a database
  await browser.selectOption(
    Selectors.CreateDataModelDatabaseSelector,
    options.databaseName
  );
  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Ensure that all the collections are selected by default
  const text = await browser.$(Selectors.CreateDataModelModal).getText();
  // 2 is based on the collections we create in beforeEach hook
  expect(text).to.contain('2/2 total collections selected.');

  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Wait for the diagram editor to load
  const dataModelEditor = browser.$(Selectors.DataModelEditor);
  await dataModelEditor.waitForDisplayed();
}

async function getDiagramNodes(browser: CompassBrowser): Promise<string[]> {
  const nodes = await browser.execute(function (selector) {
    const node = document.querySelector(selector);
    if (!node) {
      throw new Error(`Element with selector ${selector} not found`);
    }
    return (
      node as Element & { _diagram: DiagramInstance }
    )._diagram.getNodes();
  }, Selectors.DataModelEditor);
  return nodes.map((x) => x.id);
}

describe('Data Modeling tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let exportFileName: string;
  let tmpdir: string;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    tmpdir = path.join(
      os.tmpdir(),
      `compass-data-modeling-${Date.now().toString(32)}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  beforeEach(async function () {
    await browser.setupDefaultConnections();
    await browser.setFeature('enableDataModeling', true);
    if (exportFileName) {
      cleanUpDownloadedFile(exportFileName);
    }
    await createNumbersStringCollection('testCollection-one');
    await createNumbersCollection('testCollection-two');
    await browser.disconnectAll();
    await browser.connectToDefaults();
  });

  after(async function () {
    await fs.rmdir(tmpdir, { recursive: true });
    if (compass) {
      await cleanup(compass);
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    if (exportFileName) {
      cleanUpDownloadedFile(exportFileName);
    }
  });

  it('creates a new data model using an existing connection', async function () {
    const dataModelName = 'Test Data Model';
    await setupDiagram(browser, {
      diagramName: dataModelName,
      connectionName: DEFAULT_CONNECTION_NAME_1,
      databaseName: 'test',
    });

    const dataModelEditor = browser.$(Selectors.DataModelEditor);
    await dataModelEditor.waitForDisplayed();

    let nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(2);
    expect(nodes).to.deep.equal([
      'test.testCollection-one',
      'test.testCollection-two',
    ]);

    // Apply change to the model
    const newModel = {
      type: 'SetModel',
      model: {
        collections: [],
        relationships: [],
      },
    };
    await browser.setCodemirrorEditorValue(
      Selectors.DataModelApplyEditor,
      JSON.stringify(newModel)
    );
    await browser.clickVisible(Selectors.DataModelEditorApplyButton);
    await browser.waitForAnimations(dataModelEditor);

    // Verify that the model is updated
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(0);

    // Undo the change
    await browser.clickVisible(Selectors.DataModelUndoButton);
    await browser.waitForAnimations(dataModelEditor);
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(2);
    expect(nodes).to.deep.equal([
      'test.testCollection-one',
      'test.testCollection-two',
    ]);

    // Redo the change
    await browser.waitForAriaDisabled(Selectors.DataModelRedoButton, false);
    await browser.clickVisible(Selectors.DataModelRedoButton);
    await browser.waitForAnimations(dataModelEditor);
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(0);

    // Open a new tab
    await browser.openNewTab();

    // Open the saved diagram
    await browser.clickVisible(Selectors.DataModelsListItem(dataModelName));
    await browser.$(Selectors.DataModelEditor).waitForDisplayed();

    // Verify that the diagram has the latest changes
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(0);

    // Open a new tab
    await browser.openNewTab();

    // Delete the saved diagram
    await browser.clickVisible(
      Selectors.DataModelsListItemActions(dataModelName)
    );
    await browser.clickVisible(Selectors.DataModelsListItemDeleteButton);
    await browser.clickVisible(Selectors.confirmationModalConfirmButton());
    await browser
      .$(Selectors.DataModelsListItem(dataModelName))
      .waitForDisplayed({ reverse: true });
  });

  it('exports the data model to JSON', async function () {
    const dataModelName = 'Test Export Model - JSON';
    exportFileName = `${dataModelName}.json`;
    await setupDiagram(browser, {
      diagramName: dataModelName,
      connectionName: DEFAULT_CONNECTION_NAME_1,
      databaseName: 'test',
    });

    await browser.clickVisible(Selectors.DataModelExportButton);
    const exportModal = browser.$(Selectors.DataModelExportModal);
    await exportModal.waitForDisplayed();

    await browser.clickParent(Selectors.DataModelExportJsonOption);
    await browser.clickVisible(Selectors.DataModelExportModalConfirmButton);

    const { fileExists, filePath } = await waitForFileDownload(
      exportFileName,
      browser
    );
    expect(fileExists).to.be.true;

    const content = readFileSync(filePath, 'utf-8');
    const model = JSON.parse(content);

    // Within beforeEach hook, we create these two collections
    expect(model).to.deep.equal({
      collections: {
        'test.testCollection-one': {
          ns: 'test.testCollection-one',
          jsonSchema: {
            bsonType: 'object',
            required: ['_id', 'i', 'iString', 'j'],
            properties: {
              _id: {
                bsonType: 'objectId',
              },
              i: {
                bsonType: 'int',
              },
              iString: {
                bsonType: 'string',
              },
              j: {
                bsonType: 'int',
              },
            },
          },
        },
        'test.testCollection-two': {
          ns: 'test.testCollection-two',
          jsonSchema: {
            bsonType: 'object',
            required: ['_id', 'i', 'j'],
            properties: {
              _id: {
                bsonType: 'objectId',
              },
              i: {
                bsonType: 'int',
              },
              j: {
                bsonType: 'int',
              },
            },
          },
        },
      },
      relationships: [],
    });
  });

  it('exports the data model to PNG', async function () {
    const dataModelName = 'Test Export Model - PNG';
    exportFileName = `${dataModelName}.png`;
    await setupDiagram(browser, {
      diagramName: dataModelName,
      connectionName: DEFAULT_CONNECTION_NAME_1,
      databaseName: 'test',
    });

    await browser.clickVisible(Selectors.DataModelExportButton);
    const exportModal = browser.$(Selectors.DataModelExportModal);
    await exportModal.waitForDisplayed();

    await browser.clickParent(Selectors.DataModelExportPngOption);
    await browser.clickVisible(Selectors.DataModelExportModalConfirmButton);

    const { fileExists, filePath } = await waitForFileDownload(
      exportFileName,
      browser
    );
    expect(fileExists).to.be.true;

    const { data } = await recognize(filePath, 'eng', {
      cachePath: tmpdir,
    });

    expect(data.text).to.include('test.testCollection-one');
    expect(data.text).to.include('test.testCollection-two');

    expect(data.text).to.include('_id objectId');
    expect(data.text).to.include('i int');
    expect(data.text).to.include('j int');
    expect(data.text).to.include('iString string');
  });
});
