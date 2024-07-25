import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_MULTIPLE_CONNECTIONS,
  DEFAULT_CONNECTION_NAME,
} from '../helpers/compass';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { getStageOperators } from '../helpers/read-stage-operators';
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
  });

  afterEach(async function () {
    if (compass) {
      await screenshotIfFailed(compass, this.currentTest);
      await browser.setFeature('readOnly', false);
      await cleanup(compass);
    }
  });

  it('hides and shows the plus icon on the sidebar to create a database', async function () {
    const Sidebar = TEST_MULTIPLE_CONNECTIONS
      ? Selectors.Multiple
      : Selectors.Single;
    await browser.setFeature('readOnly', true);
    await browser.connectWithConnectionString();

    if (TEST_MULTIPLE_CONNECTIONS) {
      // navigate to the databases tab so that the connection is
      // active/highlighted and then the add button and three dot menu will
      // display without needing to hover
      await browser.navigateToConnectionTab(
        DEFAULT_CONNECTION_NAME,
        'Databases'
      );
    }

    if (TEST_MULTIPLE_CONNECTIONS) {
      expect(
        await browser.hasConnectionMenuItem(
          DEFAULT_CONNECTION_NAME,
          Sidebar.CreateDatabaseButton,
          false
        )
      ).to.be.equal(false);
    } else {
      expect(
        await browser.$(Sidebar.CreateDatabaseButton).isExisting()
      ).to.be.equal(false);
    }

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.navigateToConnectionTab(
        DEFAULT_CONNECTION_NAME,
        'Databases'
      );
    }

    if (TEST_MULTIPLE_CONNECTIONS) {
      expect(
        await browser.hasConnectionMenuItem(
          DEFAULT_CONNECTION_NAME,
          Sidebar.CreateDatabaseButton,
          false
        )
      ).to.be.equal(true);
    } else {
      expect(
        await browser.$(Sidebar.CreateDatabaseButton).isExisting()
      ).to.be.equal(true);
    }
  });

  it('shows and hides the plus icon on the siderbar to create a collection', async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();

    const connectionId = await browser.getConnectionIdByName(
      DEFAULT_CONNECTION_NAME
    );

    const dbName = 'test'; // existing db
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, dbName);
    const dbElement = await browser.$(
      Selectors.sidebarDatabase(connectionId, dbName)
    );
    await dbElement.waitForDisplayed();
    await browser.hover(Selectors.sidebarDatabase(connectionId, dbName));

    let sidebarCreateCollectionButton = await browser.$(
      Selectors.CreateCollectionButton
    );
    let isSidebarCreateCollectionButtonExisting =
      await sidebarCreateCollectionButton.isExisting();
    expect(isSidebarCreateCollectionButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    sidebarCreateCollectionButton = await browser.$(
      Selectors.CreateCollectionButton
    );
    isSidebarCreateCollectionButtonExisting =
      await sidebarCreateCollectionButton.isExisting();
    expect(isSidebarCreateCollectionButtonExisting).to.be.equal(false);
  });

  it('shows and hides the create database button on the instance tab', async function () {
    await browser.connectWithConnectionString();

    await browser.navigateToConnectionTab(DEFAULT_CONNECTION_NAME, 'Databases');

    let instanceCreateDatabaseButton = await browser.$(
      Selectors.InstanceCreateDatabaseButton
    );
    let isInstanceCreateDatabaseButtonExisting =
      await instanceCreateDatabaseButton.isExisting();
    expect(isInstanceCreateDatabaseButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    instanceCreateDatabaseButton = await browser.$(
      Selectors.InstanceCreateDatabaseButton
    );
    isInstanceCreateDatabaseButtonExisting =
      await instanceCreateDatabaseButton.isExisting();
    expect(isInstanceCreateDatabaseButtonExisting).to.be.equal(false);
  });

  it('shows and hides the create collection button on the instance tab', async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();

    await browser.navigateToDatabaseCollectionsTab(
      DEFAULT_CONNECTION_NAME,
      'test'
    );

    let databaseCreateCollectionButton = await browser.$(
      Selectors.DatabaseCreateCollectionButton
    );
    let isDatabaseCreateCollectionButtonExisting =
      await databaseCreateCollectionButton.isExisting();
    expect(isDatabaseCreateCollectionButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    databaseCreateCollectionButton = await browser.$(
      Selectors.DatabaseCreateCollectionButton
    );
    isDatabaseCreateCollectionButtonExisting =
      await databaseCreateCollectionButton.isExisting();
    expect(isDatabaseCreateCollectionButtonExisting).to.be.equal(false);
  });

  it('shows and hides the add data button on the documents tab', async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'numbers',
      'Documents'
    );

    let addDataButton = await browser.$(Selectors.AddDataButton);
    let isAddDataButtonExisting = await addDataButton.isExisting();
    expect(isAddDataButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    addDataButton = await browser.$(Selectors.AddDataButton);
    isAddDataButtonExisting = await addDataButton.isExisting();
    expect(isAddDataButtonExisting).to.be.equal(false);
  });

  it('shows and hides the $out aggregation stage', async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();

    // Some tests navigate away from the numbers collection aggregations tab
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'numbers',
      'Aggregations'
    );

    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(0)).waitForDisplayed();

    // sanity check to make sure there's only one
    const stageContainers = await browser.$$(Selectors.StageCard);
    expect(stageContainers).to.have.lengthOf(1);

    let options = await getStageOperators(browser, 0);

    expect(options).to.include('$match');
    expect(options).to.include('$out');

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();

    await browser.waitUntil(async () => {
      await browser.clickVisible(Selectors.GeneralSettingsButton);

      const featuresSettingsContent = await browser.$(
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

    options = await getStageOperators(browser, 0);

    expect(options).to.include('$match');
    expect(options).to.not.include('$out');
  });

  it('shows and hides the create index button', async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'numbers',
      'Indexes'
    );

    let createIndexButton = await browser.$(Selectors.CreateIndexButton);
    let isCreateIndexButtonExisting = await createIndexButton.isExisting();
    expect(isCreateIndexButtonExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    createIndexButton = await browser.$(Selectors.CreateIndexButton);
    isCreateIndexButtonExisting = await createIndexButton.isExisting();
    expect(isCreateIndexButtonExisting).to.be.equal(false);

    const indexList = await browser.$(Selectors.IndexList);
    const isIndexListExisting = await indexList.isExisting();
    expect(isIndexListExisting).to.be.equal(true);
  });

  it('enables and disables validation actions', async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'numbers',
      'Validation'
    );
    await browser.clickVisible(Selectors.AddRuleButton);
    const element = await browser.$(Selectors.ValidationEditor);
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
    const settingsModal = await browser.$(Selectors.SettingsModal);
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
