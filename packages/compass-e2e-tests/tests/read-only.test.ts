import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import type { Compass } from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';

describe('readOnly: true / Read-Only Edition', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    skipForWeb(this, 'settings modal not available on compass-web');
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('readOnly', false);
    await browser.setupDefaultConnections();
  });

  afterEach(async function () {
    if (compass) {
      await screenshotIfFailed(compass, this.currentTest);
      await browser.setFeature('readOnly', false);
      await cleanup(compass);
    }
  });

  it('hides and shows the plus icon on the sidebar to create a database', async function () {
    const Sidebar = Selectors.Multiple;
    await browser.setFeature('readOnly', true);
    await browser.connectToDefaults();

    // navigate to the databases tab so that the connection is
    // active/highlighted and then the add button and three dot menu will
    // display without needing to hover
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );

    expect(
      await browser.hasConnectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        Sidebar.CreateDatabaseButton,
        false
      )
    ).to.be.equal(false);
    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );

    expect(
      await browser.hasConnectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        Sidebar.CreateDatabaseButton,
        false
      )
    ).to.be.equal(true);
  });

  it('shows and hides the plus icon on the siderbar to create a collection', async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();

    const connectionId = await browser.getConnectionIdByName(
      DEFAULT_CONNECTION_NAME_1
    );

    const dbName = 'test'; // existing db
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, dbName);
    const dbElement = browser.$(
      Selectors.sidebarDatabase(connectionId, dbName)
    );
    await dbElement.waitForDisplayed();
    await browser.hover(Selectors.sidebarDatabase(connectionId, dbName));

    let sidebarCreateCollectionButton = browser.$(
      Selectors.CreateCollectionButton
    );
    let isSidebarCreateCollectionButtonExisting =
      await sidebarCreateCollectionButton.isExisting();
    expect(isSidebarCreateCollectionButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    sidebarCreateCollectionButton = browser.$(Selectors.CreateCollectionButton);
    isSidebarCreateCollectionButtonExisting =
      await sidebarCreateCollectionButton.isExisting();
    expect(isSidebarCreateCollectionButtonExisting).to.be.equal(false);
  });

  it('shows and hides the create database button on the instance tab', async function () {
    await browser.connectToDefaults();

    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );

    let instanceCreateDatabaseButton = browser.$(
      Selectors.InstanceCreateDatabaseButton
    );
    let isInstanceCreateDatabaseButtonExisting =
      await instanceCreateDatabaseButton.isExisting();
    expect(isInstanceCreateDatabaseButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    instanceCreateDatabaseButton = browser.$(
      Selectors.InstanceCreateDatabaseButton
    );
    isInstanceCreateDatabaseButtonExisting =
      await instanceCreateDatabaseButton.isExisting();
    expect(isInstanceCreateDatabaseButtonExisting).to.be.equal(false);
  });

  it('shows and hides the create collection button on the instance tab', async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();

    await browser.navigateToDatabaseCollectionsTab(
      DEFAULT_CONNECTION_NAME_1,
      'test'
    );

    let databaseCreateCollectionButton = browser.$(
      Selectors.DatabaseCreateCollectionButton
    );
    let isDatabaseCreateCollectionButtonExisting =
      await databaseCreateCollectionButton.isExisting();
    expect(isDatabaseCreateCollectionButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    databaseCreateCollectionButton = browser.$(
      Selectors.DatabaseCreateCollectionButton
    );
    isDatabaseCreateCollectionButtonExisting =
      await databaseCreateCollectionButton.isExisting();
    expect(isDatabaseCreateCollectionButtonExisting).to.be.equal(false);
  });

  it('shows and hides the add data button on the documents tab', async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Documents'
    );

    let addDataButton = browser.$(Selectors.AddDataButton);
    let isAddDataButtonExisting = await addDataButton.isExisting();
    expect(isAddDataButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    addDataButton = browser.$(Selectors.AddDataButton);
    isAddDataButtonExisting = await addDataButton.isExisting();
    expect(isAddDataButtonExisting).to.be.equal(false);
  });

  it('shows and hides the $out aggregation stage', async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();

    // Some tests navigate away from the numbers collection aggregations tab
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Aggregations'
    );

    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(0)).waitForDisplayed();

    // sanity check to make sure there's only one
    const numStageContainers = await browser.$$(Selectors.StageCard).length;
    expect(numStageContainers).to.equal(1);

    let options = await browser.getStageOperators(0);

    expect(options).to.include('$match');
    expect(options).to.include('$out');

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();

    await browser.waitUntil(async () => {
      await browser.clickVisible(Selectors.GeneralSettingsButton);

      const featuresSettingsContent = browser.$(
        Selectors.GeneralSettingsContent
      );
      const isFeaturesSettingsContentExisting =
        await featuresSettingsContent.isExisting();

      return isFeaturesSettingsContentExisting;
    });

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    await browser.focusStageOperator(0);

    options = await browser.getStageOperators(0);

    expect(options).to.include('$match');
    expect(options).to.not.include('$out');
  });

  it('shows and hides the create index button', async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Indexes'
    );

    let createIndexButton = browser.$(Selectors.CreateIndexButton);
    let isCreateIndexButtonExisting = await createIndexButton.isExisting();
    expect(isCreateIndexButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    createIndexButton = browser.$(Selectors.CreateIndexButton);
    isCreateIndexButtonExisting = await createIndexButton.isExisting();
    expect(isCreateIndexButtonExisting).to.be.equal(false);

    const indexList = browser.$(Selectors.IndexList);
    const isIndexListExisting = await indexList.isExisting();
    expect(isIndexListExisting).to.be.equal(true);
  });

  it('enables and disables validation actions', async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Validation'
    );
    await browser.clickVisible(Selectors.AddRuleButton);
    const element = browser.$(Selectors.ValidationEditor);
    await element.waitForDisplayed();

    await browser.setCodemirrorEditorValue(
      Selectors.ValidationEditor,
      '{ $jsonSchema: {} }'
    );

    expect(
      await browser.$(Selectors.UpdateValidationButton).isExisting()
    ).to.be.equal(true);
    expect(
      await browser
        .$(Selectors.ValidationActionSelector)
        .getAttribute('aria-disabled')
    ).to.equal('false');
    expect(
      await browser
        .$(Selectors.ValidationLevelSelector)
        .getAttribute('aria-disabled')
    ).to.equal('false');

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    expect(
      await browser
        .$(Selectors.ValidationActionSelector)
        .getAttribute('aria-disabled')
    ).to.equal('true');
    expect(
      await browser
        .$(Selectors.ValidationLevelSelector)
        .getAttribute('aria-disabled')
    ).to.equal('true');
    expect(
      await browser.$(Selectors.UpdateValidationButton).isExisting()
    ).to.be.equal(false);
  });
});
