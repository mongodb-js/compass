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
    await browser.setValueVisible(
      Selectors.CreateDataModelNameInput,
      'Test Data Model'
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

    const text = await browser.getCodemirrorEditorText(
      Selectors.DataModelEditor
    );
    expect(text).to.include('"test.testCollection1": ');
    expect(text).to.include('"test.testCollection2": ');
  });
});
