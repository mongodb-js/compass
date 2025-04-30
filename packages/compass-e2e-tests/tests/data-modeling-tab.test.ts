import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createNestedDocumentsCollection,
  createNumbersCollection,
} from '../helpers/insert-data';

describe('Data Modeling tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'data modeling not yet available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('enableDataModeling', true);
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNestedDocumentsCollection('testCollection1');
    await createNumbersCollection('testCollection2');
    await browser.disconnectAll();
    await browser.connectToDefaults();
  });

  after(async function () {
    if (compass) {
      await cleanup(compass);
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it.only('creates a new data model using an existing connection', async function () {
    await browser.navigateToDataModeling();

    // Click on create new data model button
    await browser.clickVisible(Selectors.CreateNewDataModelButton);

    // Fill in model details
    const dataModelName = 'Test Data Model';
    await browser.setValueVisible(
      Selectors.CreateDataModelNameInput,
      dataModelName
    );
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // Select existing connection
    await browser.selectOption(
      Selectors.CreateDataModelConnectionSelector,
      DEFAULT_CONNECTION_NAME_1
    );
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // Select a database
    await browser.selectOption(
      Selectors.CreateDataModelDatabaseSelector,
      'test'
    );
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // TODO: Confirm all collections are selected by default (COMPASS-XXXX)
    // Note: We'll need to change the UI, right now the labels are disconnected from the checkboxes
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // Wait for the diagram editor to load
    const dataModelEditor = browser.$(Selectors.DataModelEditor);
    await dataModelEditor.waitForDisplayed();

    // Verify that the diagram is displayed and contains both collections
    const text = await browser.getCodemirrorEditorText(
      Selectors.DataModelPreview
    );
    expect(text).to.include('"test.testCollection1": ');
    expect(text).to.include('"test.testCollection2": ');

    // Apply change to the model
    const newModel = {
      type: 'SetModel',
      model: { schema: { coll1: {}, coll2: {} } },
    };
    const newPreview = JSON.stringify(newModel.model, null, 2);
    await browser.setCodemirrorEditorValue(
      Selectors.DataModelApplyEditor,
      JSON.stringify(newModel)
    );
    await browser.clickVisible(Selectors.DataModelEditorApplyButton);

    // Verify that the model is updated
    const updatedText = await browser.getCodemirrorEditorText(
      Selectors.DataModelPreview
    );
    expect(updatedText).to.equal(newPreview);

    // Undo the change
    await browser.clickVisible(Selectors.DataModelUndoButton);
    await browser.waitUntil(async () => {
      const textAfterUndo = await browser.getCodemirrorEditorText(
        Selectors.DataModelPreview
      );
      return (
        textAfterUndo.includes('"test.testCollection1": ') &&
        textAfterUndo.includes('"test.testCollection2": ')
      );
    });

    // Redo the change
    await browser.waitForAriaDisabled(Selectors.DataModelRedoButton, false);
    await browser.clickVisible(Selectors.DataModelRedoButton);
    await browser.waitUntil(async () => {
      const redoneText = await browser.getCodemirrorEditorText(
        Selectors.DataModelPreview
      );
      return redoneText === newPreview;
    });

    // Open a new tab
    await browser.openNewTab();

    // Open the saved diagram
    await browser.clickVisible(Selectors.DataModelsListItem(dataModelName));
    await browser.$(Selectors.DataModelEditor).waitForDisplayed();

    // Verify that the diagram has the latest changes
    const savedText = await browser.getCodemirrorEditorText(
      Selectors.DataModelPreview
    );
    expect(savedText).to.equal(newPreview);

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
});
