import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { getStageOperators } from '../helpers/read-stage-operators';

describe('readOnly: true / Read-Only Edition', function () {
  let tmpdir: string;
  let i = 0;

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      `compass-read-only-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    await fs.rmdir(tmpdir, { recursive: true });
  });

  it('hides and shows the plus icon on the siderbar to create a database', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', true);
      await browser.connectWithConnectionString();

      let sidebarCreateDatabaseButton = await browser.$(
        Selectors.SidebarCreateDatabaseButton
      );
      let isSidebarCreateDatabaseButtonExisting =
        await sidebarCreateDatabaseButton.isExisting();
      expect(isSidebarCreateDatabaseButtonExisting).to.be.equal(false);

      await browser.openSettingsModal();
      const settingsModal = await browser.$(Selectors.SettingsModal);
      await settingsModal.waitForDisplayed();
      await browser.clickVisible(Selectors.GeneralSettingsButton);

      await browser.clickParent(Selectors.SettingsInputElement('readOnly'));
      await browser.clickVisible(Selectors.SaveSettingsButton);

      // wait for the modal to go away
      await settingsModal.waitForDisplayed({ reverse: true });

      sidebarCreateDatabaseButton = await browser.$(
        Selectors.SidebarCreateDatabaseButton
      );
      isSidebarCreateDatabaseButtonExisting =
        await sidebarCreateDatabaseButton.isExisting();
      expect(isSidebarCreateDatabaseButtonExisting).to.be.equal(true);
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('shows and hides the plus icon on the siderbar to create a collection', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', false);
      await createNumbersCollection();
      await browser.connectWithConnectionString();

      const dbName = 'test'; // existing db
      await browser.clickVisible(Selectors.SidebarFilterInput);
      const sidebarFilterInputElement = await browser.$(
        Selectors.SidebarFilterInput
      );
      await sidebarFilterInputElement.setValue(dbName);
      const dbElement = await browser.$(Selectors.sidebarDatabase(dbName));
      await dbElement.waitForDisplayed();
      await browser.hover(Selectors.sidebarDatabase(dbName));

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
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('shows and hides the create database button on the instance tab', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', false);
      await browser.connectWithConnectionString();

      await browser.navigateToInstanceTab('Databases');

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
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('shows and hides the create collection button on the instance tab', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', false);
      await createNumbersCollection();
      await browser.connectWithConnectionString();

      await browser.navigateToDatabaseCollectionsTab('test');

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
        Selectors.SidebarCreateDatabaseButton
      );
      isDatabaseCreateCollectionButtonExisting =
        await databaseCreateCollectionButton.isExisting();
      expect(isDatabaseCreateCollectionButtonExisting).to.be.equal(false);
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('shows and hides the add data button on the documents tab', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', false);
      await createNumbersCollection();
      await browser.connectWithConnectionString();

      await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

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

      addDataButton = await browser.$(Selectors.SidebarCreateDatabaseButton);
      isAddDataButtonExisting = await addDataButton.isExisting();
      expect(isAddDataButtonExisting).to.be.equal(false);
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('shows and hides the $out aggregation stage', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', false);
      await createNumbersCollection();
      await browser.connectWithConnectionString();

      // Some tests navigate away from the numbers collection aggregations tab
      await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');

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
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('shows and hides the create index button', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await createNumbersCollection();
      await browser.connectWithConnectionString();

      await browser.navigateToCollectionTab('test', 'numbers', 'Indexes');

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
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('enables and disables validation actions', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;
    try {
      await browser.setFeature('readOnly', false);
      await createNumbersCollection();
      await browser.connectWithConnectionString();

      await browser.navigateToCollectionTab('test', 'numbers', 'Validation');
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
    } finally {
      await browser.setFeature('readOnly', false);
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });
});
