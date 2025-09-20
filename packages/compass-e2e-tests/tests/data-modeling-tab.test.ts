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
import toNS from 'mongodb-ns';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import type { ChainablePromiseElement } from 'webdriverio';

type Node = {
  id: string;
  position: { x: number; y: number };
};

interface Edge {
  id: string;
  source: string;
  target: string;
  markerStart: string;
  markerEnd: string;
  selected: boolean;
}

type DiagramInstance = {
  getNodes: () => Array<Node>;
  getEdges: () => Array<Edge>;
};

/**
 * Clicks on a specific element at the given coordinates.
 * element.click({ x: number, y: number }) doesn't work as expected,
 * so we do this manually using the actions API.
 * @param browser The Compass browser instance.
 * @param element The WebdriverIO element to click on.
 * @param coordinates The coordinates to click at.
 */
async function clickElementAtCoordinates(
  browser: CompassBrowser,
  element: ChainablePromiseElement,
  coordinates: {
    x: number;
    y: number;
  }
) {
  await element.waitForClickable();
  const location = await element.getLocation();
  await browser
    .action('pointer')
    .move({
      x: location.x + coordinates.x,
      y: location.y + coordinates.y,
    })
    .down({ button: 0 }) // Left mouse button
    .perform();
}

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
  await browser.selectOption({
    selectSelector: Selectors.CreateDataModelConnectionSelector,
    optionText: options.connectionName,
  });
  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Select a database
  await browser.selectOption({
    selectSelector: Selectors.CreateDataModelDatabaseSelector,
    optionText: options.databaseName,
  });
  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Ensure that all the collections are selected by default
  const text = await browser.$(Selectors.CreateDataModelModal).getText();
  // 2 is based on the collections we create in beforeEach hook
  expect(text).to.contain('2/2 total collections selected.');

  await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

  // Wait for the diagram editor to load
  const dataModelEditor = browser.$(Selectors.DataModelEditor);
  await dataModelEditor.waitForDisplayed();

  // Close the info banner to get it out of the way
  const infoBannerCloseBtn = browser.$(Selectors.DataModelInfoBannerCloseBtn);
  await infoBannerCloseBtn.waitForClickable();
  await browser.clickVisible(Selectors.DataModelInfoBannerCloseBtn);
}

async function selectCollectionOnTheDiagram(
  browser: CompassBrowser,
  ns: string
) {
  // If the drawer is open, close it
  // Otherwise the drawer or the minimap can cover the collection node
  const drawer = browser.$(Selectors.SideDrawer);
  if (
    (await drawer.isDisplayed()) &&
    (await drawer.$(Selectors.SideDrawerCloseButton).isClickable())
  ) {
    await browser.clickVisible(Selectors.SideDrawerCloseButton);
    await drawer.waitForDisplayed({ reverse: true });
  }

  // Click on the collection node to open the drawer
  const collectionNode = browser.$(Selectors.DataModelPreviewCollection(ns));
  await collectionNode.waitForClickable();

  await clickElementAtCoordinates(browser, collectionNode, {
    // we're aiming for the header (top of the node)
    // the default click is in the middle, most likely on a field
    x: 100,
    y: 15,
  });

  await drawer.waitForDisplayed();

  const collectionName = await browser.getInputByLabel(
    browser.$(Selectors.SideDrawer).$(Selectors.DataModelNameInputLabel)
  );
  expect(await collectionName.getValue()).to.equal(toNS(ns).collection);
}

async function getDiagramNodes(
  browser: CompassBrowser,
  expectedCount: number
): Promise<Node[]> {
  let nodes: Node[] = [];
  await browser.waitUntil(async () => {
    nodes = await browser.execute(function (selector) {
      const node = document.querySelector(selector);
      if (!node) {
        throw new Error(`Element with selector ${selector} not found`);
      }

      return (node as Element & { _diagram: DiagramInstance })._diagram
        .getNodes()
        .map(
          (node: Node): Node => ({
            // do not add any non-serializable properties here,
            // the result of browser.execute must be serializable
            id: node.id,
            position: node.position,
          })
        );
    }, Selectors.DataModelEditor);
    return nodes.length === expectedCount;
  });
  return nodes;
}

async function getDiagramEdges(
  browser: CompassBrowser,
  expectedCount: number
): Promise<Edge[]> {
  let edges: Edge[] = [];
  await browser.waitUntil(async () => {
    edges = await browser.execute(function (selector) {
      const node = document.querySelector(selector);
      if (!node) {
        throw new Error(`Element with selector ${selector} not found`);
      }
      return (node as Element & { _diagram: DiagramInstance })._diagram
        .getEdges()
        .map(
          (edge: Edge): Edge => ({
            // do not add any non-serializable properties here,
            // the result of browser.execute must be serializable
            id: edge.id,
            source: edge.source,
            target: edge.target,
            markerStart: edge.markerStart,
            markerEnd: edge.markerEnd,
            selected: edge.selected,
          })
        );
    }, Selectors.DataModelEditor);
    return edges.length === expectedCount;
  });
  return edges;
}

/**
 * Moves a node to the specified coordinates and returns its original position.
 */
async function dragNode(
  browser: CompassBrowser,
  selector: string,
  pointerActionMoveParams: {
    x: number;
    y: number;
    origin?: 'pointer' | 'viewport';
  }
) {
  const node = browser.$(selector);

  const startPosition = await node.getLocation();
  const nodeSize = await node.getSize();

  await browser
    .action('pointer')
    .move({
      x: Math.round(startPosition.x + nodeSize.width / 2),
      y: Math.round(startPosition.y + 15), // we're aiming for the header area (top of the node)
    })
    .down({ button: 0 }) // Left mouse button
    .move({ duration: 1000, origin: 'pointer', ...pointerActionMoveParams })
    .pause(1000)
    .move({ duration: 1000, origin: 'pointer', ...pointerActionMoveParams })
    .up({ button: 0 }) // Release the left mouse button
    .perform();
  await browser.waitForAnimations(node);
  return startPosition;
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

    const nodes = await getDiagramNodes(browser, 2);
    expect(nodes).to.have.lengthOf(2);
    expect(nodes[0].id).to.equal('test.testCollection-one');
    expect(nodes[1].id).to.equal('test.testCollection-two');

    // Apply change to the model

    // react flow uses its own coordinate system,
    // so we get the node element location for the pointer action
    const testCollection1 = browser.$(
      Selectors.DataModelPreviewCollection('test.testCollection-one')
    );
    const startPosition = await dragNode(
      browser,
      Selectors.DataModelPreviewCollection('test.testCollection-one'),
      { x: 100, y: 0 }
    );
    await browser.waitForAnimations(dataModelEditor);

    // Check that the first node has moved and mark the new position
    const newPosition = await testCollection1.getLocation();
    expect(newPosition).not.to.deep.equal(startPosition);

    // Undo the change
    await browser.clickVisible(Selectors.DataModelUndoButton);
    await browser.waitForAnimations(dataModelEditor);
    const positionAfterUndone = await testCollection1.getLocation();
    expect(positionAfterUndone).to.deep.equal(startPosition);

    // Redo the change
    await browser.waitForAriaDisabled(Selectors.DataModelRedoButton, false);
    await browser.clickVisible(Selectors.DataModelRedoButton);
    await browser.waitForAnimations(dataModelEditor);
    const positionAfterRedo = await testCollection1.getLocation();
    expect(positionAfterRedo).to.deep.equal(newPosition);
    // Open a new tab
    await browser.openNewTab();

    // Open the saved diagram
    await browser.clickVisible(Selectors.DataModelsListItem(dataModelName));
    await browser.$(Selectors.DataModelEditor).waitForDisplayed();

    // TODO: Verify that the diagram has the latest changes COMPASS-9479
    const savedNodes = await getDiagramNodes(browser, 2);
    expect(savedNodes).to.have.lengthOf(2);

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

  it('allows undo after opening a diagram', async function () {
    const dataModelName = 'Test Data Model - Undo After Open';
    await setupDiagram(browser, {
      diagramName: dataModelName,
      connectionName: DEFAULT_CONNECTION_NAME_1,
      databaseName: 'test',
    });

    const dataModelEditor = browser.$(Selectors.DataModelEditor);
    await dataModelEditor.waitForDisplayed();

    await dragNode(
      browser,
      Selectors.DataModelPreviewCollection('test.testCollection-one'),
      { x: 100, y: 0 }
    );
    await browser.waitForAnimations(dataModelEditor);

    // Open the saved diagram in new tab
    await browser.openNewTab();
    await browser.clickVisible(Selectors.DataModelsListItem(dataModelName));
    await browser.$(Selectors.DataModelEditor).waitForDisplayed();

    // Ensure that undo button is enabled
    await browser.waitForAriaDisabled(Selectors.DataModelUndoButton, false);

    // Undo the change
    await browser.clickVisible(Selectors.DataModelUndoButton);
    await browser.waitForAnimations(dataModelEditor);

    // Ensure that undo button is now disabled and redo is enabled
    await browser.waitForAriaDisabled(Selectors.DataModelUndoButton, true);
    await browser.waitForAriaDisabled(Selectors.DataModelRedoButton, false);
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
    if (process.platform === 'win32') {
      console.warn('Skipping PNG export test on Windows');
      this.skip();
    }
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

    const text = data.text.toLowerCase();

    expect(text).to.include('testCollection-one'.toLowerCase());
    expect(text).to.include('testCollection-two'.toLowerCase());

    expect(text).to.include('id objectId'.toLowerCase());
    expect(text).to.include('i int');
    // Disabled as it's not recognized correctly by tesseract.js at the moment.
    // expect(text).to.include('j int');
    // it does not correctly recognize `iString` and only returns `String`.
    // its already good enough to verify this for now and if it flakes
    // more, we may need to revisit this test.
    expect(text).to.include('String string'.toLowerCase());
  });

  it('exports the data model to compass format and imports it back', async function () {
    const dataModelName = 'Test Export Model - Save-Open';
    exportFileName = `${dataModelName}.mdm`;
    await setupDiagram(browser, {
      diagramName: dataModelName,
      connectionName: DEFAULT_CONNECTION_NAME_1,
      databaseName: 'test',
    });

    const dataModelEditor = browser.$(Selectors.DataModelEditor);
    await dataModelEditor.waitForDisplayed();

    await dragNode(
      browser,
      Selectors.DataModelPreviewCollection('test.testCollection-one'),
      { x: 100, y: 0 }
    );

    await browser.waitForAnimations(dataModelEditor);

    await browser.clickVisible(Selectors.DataModelExportButton);
    const exportModal = browser.$(Selectors.DataModelExportModal);
    await exportModal.waitForDisplayed();

    await browser.clickParent(Selectors.DataModelExportDiagramOption);
    await browser.clickVisible(Selectors.DataModelExportModalConfirmButton);

    const { fileExists, filePath } = await waitForFileDownload(
      exportFileName,
      browser
    );
    expect(fileExists).to.be.true;

    const content = readFileSync(filePath, 'utf-8');
    const model = JSON.parse(content);

    expect(model.name).to.equal(dataModelName);

    const edits = JSON.parse(
      Buffer.from(model.edits, 'base64').toString('utf-8')
    );
    expect(edits).to.be.an('array').of.length(2);
    expect(edits[0].type).to.equal('SetModel');
    expect(edits[1].type).to.equal('MoveCollection');

    // Open the saved diagram
    await browser.closeWorkspaceTabs();
    await browser.navigateToDataModeling();

    await browser.selectFile(Selectors.ImportDataModelInput, filePath);
    await browser.$(Selectors.DataModelEditor).waitForDisplayed();
    const savedNodes = await getDiagramNodes(browser, 2);

    expect(savedNodes).to.have.lengthOf(2);
    expect(savedNodes[0].id).to.equal('test.testCollection-one');
    expect(savedNodes[1].id).to.equal('test.testCollection-two');

    // Ensure that two diagrams exist (with correct incremental name)
    await browser.closeWorkspaceTabs();
    await browser.navigateToDataModeling();

    const cardsSelector = Selectors.DataModelsListItem();
    await browser.waitForAnimations(cardsSelector);
    const titles = await browser
      .$$(cardsSelector)
      .map((element) => element.getAttribute('data-diagram-name'));
    expect(titles).to.include(dataModelName);
    // The second one is the one we just opened
    expect(titles).to.include(`${dataModelName} (1)`);
  });

  context('Drawer and Diagram interactions', function () {
    it('allows relationship management via the sidebar', async function () {
      const dataModelName = 'Test Add Relationship Manually';
      await setupDiagram(browser, {
        diagramName: dataModelName,
        connectionName: DEFAULT_CONNECTION_NAME_1,
        databaseName: 'test',
      });

      const dataModelEditor = browser.$(Selectors.DataModelEditor);
      await dataModelEditor.waitForDisplayed();

      // There are no edges initially
      await getDiagramEdges(browser, 0);

      // Click on the collection to open the drawer
      await selectCollectionOnTheDiagram(browser, 'test.testCollection-one');

      // Click the add relationship button
      const drawer = browser.$(Selectors.SideDrawer);

      const addRelationshipBtn = drawer.$(
        Selectors.DataModelAddRelationshipBtn
      );
      await addRelationshipBtn.waitForClickable();
      await addRelationshipBtn.click();

      // Verify that the local collection is pre-selected
      const localCollectionSelect = await browser.getInputByLabel(
        drawer.$(Selectors.DataModelRelationshipLocalCollectionSelect)
      );
      expect(await localCollectionSelect.getValue()).to.equal(
        'testCollection-one'
      );

      // Select the foreign collection
      await browser.selectOption({
        selectSelector: await browser.getInputByLabel(
          drawer.$(Selectors.DataModelRelationshipForeignCollectionSelect)
        ),
        optionText: 'testCollection-two',
      });

      // See the relationship on the diagram
      const edges = await getDiagramEdges(browser, 1);
      expect(edges).to.have.lengthOf(1);
      expect(edges[0]).to.deep.include({
        source: 'test.testCollection-one',
        target: 'test.testCollection-two',
        markerStart: 'one',
        markerEnd: 'one',
      });
      const relationshipId = edges[0].id;

      // Select the other collection and see that the new relationship is listed
      await selectCollectionOnTheDiagram(browser, 'test.testCollection-two');
      const relationshipItem = drawer.$(
        Selectors.DataModelCollectionRelationshipItem(relationshipId)
      );
      await relationshipItem.waitForDisplayed();
      expect(await relationshipItem.getText()).to.include('testCollection-one');

      // Edit the relationship
      await relationshipItem
        .$(Selectors.DataModelCollectionRelationshipItemEdit)
        .waitForDisplayed();
      await relationshipItem
        .$(Selectors.DataModelCollectionRelationshipItemEdit)
        .waitForClickable();
      await relationshipItem
        .$(Selectors.DataModelCollectionRelationshipItemEdit)
        .click();

      const foreignCardinalitySelect = await browser.getInputByLabel(
        drawer.$(Selectors.DataModelRelationshipForeignCardinalitySelect)
      );
      await foreignCardinalitySelect.waitForDisplayed();
      await browser.selectOption({
        selectSelector: foreignCardinalitySelect,
        optionSelector: Selectors.DataModelRelationshipCardinalityOption('100'),
      });

      // See the updated relationship on the diagram
      const updatedEdges = await getDiagramEdges(browser, 1);
      expect(updatedEdges).to.have.lengthOf(1);
      expect(updatedEdges[0]).to.deep.include({
        source: 'test.testCollection-one',
        target: 'test.testCollection-two',
        markerStart: 'one',
        markerEnd: 'many',
      });

      // Select the first collection again and delete the relationship
      await selectCollectionOnTheDiagram(browser, 'test.testCollection-one');
      await relationshipItem.waitForDisplayed();
      await relationshipItem
        .$(Selectors.DataModelCollectionRelationshipItemDelete)
        .waitForClickable();
      await relationshipItem
        .$(Selectors.DataModelCollectionRelationshipItemDelete)
        .click();

      // Verify that the relationship is removed from the list and the diagram
      await relationshipItem.waitForDisplayed({ reverse: true });
      await getDiagramEdges(browser, 0);
    });

    it('adding relationship by drawing opens it in the sidebar', async function () {
      const dataModelName = 'Test Relationship By Drawing';
      await setupDiagram(browser, {
        diagramName: dataModelName,
        connectionName: DEFAULT_CONNECTION_NAME_1,
        databaseName: 'test',
      });

      await browser.clickVisible(
        Selectors.DataModelRelationshipDrawingButton()
      );

      const targetNode = browser.$(
        Selectors.DataModelPreviewCollection('test.testCollection-two')
      );

      const targetPosition = await targetNode.getLocation();
      const targetSize = await targetNode.getSize();

      await dragNode(
        browser,
        Selectors.DataModelPreviewCollection('test.testCollection-one'),
        {
          x: Math.round(targetPosition.x + targetSize.width / 2),
          y: Math.round(targetPosition.y + targetSize.height / 2),
          origin: 'viewport',
        }
      );

      const edges = await getDiagramEdges(browser, 1);
      expect(edges).to.have.lengthOf(1);
      expect(edges[0]).to.deep.include({
        source: 'test.testCollection-one',
        target: 'test.testCollection-two',
        markerStart: 'one',
        markerEnd: 'one',
      });

      // Verify that the relationship is opened in the sidebar
      const drawer = browser.$(Selectors.SideDrawer);
      const localCollectionSelect = await browser.getInputByLabel(
        drawer.$(Selectors.DataModelRelationshipLocalCollectionSelect)
      );
      expect(await localCollectionSelect.getValue()).to.equal(
        'testCollection-one'
      );
      const foreignCollectionSelect = await browser.getInputByLabel(
        drawer.$(Selectors.DataModelRelationshipForeignCollectionSelect)
      );
      expect(await foreignCollectionSelect.getValue()).to.equal(
        'testCollection-two'
      );
    });

    it('allows collection management via the sidebar', async function () {
      const dataModelName = 'Test Edit Collection';
      await setupDiagram(browser, {
        diagramName: dataModelName,
        connectionName: DEFAULT_CONNECTION_NAME_1,
        databaseName: 'test',
      });

      const dataModelEditor = browser.$(Selectors.DataModelEditor);
      await dataModelEditor.waitForDisplayed();

      // Click on the collection to open the drawer.
      await selectCollectionOnTheDiagram(browser, 'test.testCollection-one');

      const drawer = browser.$(Selectors.SideDrawer);

      // Rename the collection (it submits on unfocus).
      await browser.setValueVisible(
        browser.$(Selectors.DataModelNameInput),
        'renamedOne'
      );
      await drawer.click(); // Unfocus the input.

      // Verify that the renamed collection is still selected.
      await browser.waitUntil(async () => {
        const collectionName = await browser.getInputByLabel(
          browser.$(Selectors.SideDrawer).$(Selectors.DataModelNameInputLabel)
        );
        return (await collectionName.getValue()) === 'renamedOne';
      });

      // Select the second collection and verify that the new name is in the diagram.
      await selectCollectionOnTheDiagram(browser, 'test.testCollection-two');
      const nodes = await getDiagramNodes(browser, 2);
      expect(nodes).to.have.lengthOf(2);
      expect(nodes[0].id).to.equal('test.renamedOne');
      expect(nodes[1].id).to.equal('test.testCollection-two');

      // Remove the collection.
      await drawer
        .$(Selectors.DataModelCollectionSidebarItemDeleteButton)
        .click();
      // Ensure the drawer closed.
      if (await drawer.$(Selectors.DataModelNameInputLabel).isDisplayed()) {
        await drawer
          .$(Selectors.DataModelNameInputLabel)
          .waitForDisplayed({ reverse: true });
      }

      // Verify that the collection is removed from the list and the diagram.
      const nodesPostDelete = await getDiagramNodes(browser, 1);
      expect(nodesPostDelete).to.have.lengthOf(1);
      expect(nodesPostDelete[0].id).to.equal('test.renamedOne');
    });

    it('adding a new collection from the toolbar', async function () {
      const dataModelName = 'Test Edit Collection';
      await setupDiagram(browser, {
        diagramName: dataModelName,
        connectionName: DEFAULT_CONNECTION_NAME_1,
        databaseName: 'test',
      });

      const dataModelEditor = browser.$(Selectors.DataModelEditor);
      await dataModelEditor.waitForDisplayed();

      // Click on the add collection button.
      await browser.clickVisible(Selectors.DataModelAddCollectionBtn);

      // Verify that the new collection is added to the diagram.
      const nodes = await getDiagramNodes(browser, 3);
      expect(nodes[2].id).to.equal('test.new-collection');

      // Verify that the drawer is opened.
      const drawer = browser.$(Selectors.SideDrawer);
      await drawer.waitForDisplayed();

      // Name the collection (it submits on unfocus).
      const collectionName = 'testCollection-newOne';
      await browser.setValueVisible(
        browser.$(Selectors.DataModelNameInput),
        collectionName
      );
      await drawer.click(); // Unfocus the input.

      // Verify that the new collection is named in the diagram.
      const nodesAfterNaming = await getDiagramNodes(browser, 3);
      expect(nodesAfterNaming[2].id).to.equal(`test.${collectionName}`);

      // Undo once - verify that the collection is removed
      // This is to ensure that the initial edit of the collection name wasn't a separate edit
      await browser.clickVisible(Selectors.DataModelUndoButton);
      await getDiagramNodes(browser, 2);
    });
  });
});
