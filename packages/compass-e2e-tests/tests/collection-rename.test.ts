import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';
import { createBlankCollection, dropDatabase } from '../helpers/insert-data';
import * as Selectors from '../helpers/selectors';

import { setFeature } from '../helpers/commands';
const initialName = 'numbers';
const newName = 'renamed';

const databaseName = 'rename-collection';

class RenameCollectionModal {
  constructor(private browser: CompassBrowser) {}
  get confirmationScreen() {
    return this.browser.$(Selectors.RenameCollectionModalConfirmationScreen);
  }
  get successToast() {
    return this.browser.$(Selectors.RenameCollectionModalSuccessToast);
  }
  get submitButton() {
    return this.browser.$(Selectors.RenameCollectionModalSubmitButton);
  }
  get errorBanner() {
    return this.browser.$(Selectors.RenameCollectionModalErrorBanner);
  }
  get collectionNameInput() {
    return this.browser.$(Selectors.RenameCollectionModalInput);
  }
  get dismissButton() {
    return this.browser.$(Selectors.RenameCollectionModalCloseButton);
  }

  async isVisible() {
    const modal = await this.browser.$(Selectors.RenameCollectionModal);
    await modal.waitForDisplayed();
  }

  async isNotVisible() {
    const modal = await this.browser.$(Selectors.RenameCollectionModal);
    return modal.waitForDisplayed({
      reverse: true,
    });
  }

  async enterNewCollectionName(newName: string) {
    const input = await this.browser.$(Selectors.RenameCollectionModalInput);
    await input.clearValue();
    await input.addValue(newName);
  }
}

async function navigateToCollectionInSidebar(browser: CompassBrowser) {
  const sidebar = await browser.$(Selectors.SidebarDatabaseAndCollectionList);
  await sidebar.waitForDisplayed();

  // open the database in the sidebar
  const dbElement = await browser.$(Selectors.sidebarDatabase(databaseName));
  await dbElement.waitForDisplayed();
  const button = await browser.$(Selectors.sidebarDatabaseToggle(databaseName));

  await button.waitForDisplayed();
  await button.click();

  // wait for the collection to become displayed
  const collectionSelector = Selectors.sidebarCollection(
    databaseName,
    initialName
  );
  await browser.scrollToVirtualItem(
    Selectors.SidebarDatabaseAndCollectionList,
    collectionSelector,
    'tree'
  );
  const collectionElement = await browser.$(collectionSelector);
  await collectionElement.waitForDisplayed();
}

async function renameCollectionSuccessFlow(
  browser: CompassBrowser,
  newName: string
) {
  const page = new RenameCollectionModal(browser);
  // wait for the collection modal to appear
  await page.isVisible();

  // enter the new name
  await page.enterNewCollectionName(newName);

  // submit the form and confirm submission
  await page.submitButton.click();

  await page.confirmationScreen.waitForDisplayed();
  await page.submitButton.click();

  // wait for success
  await page.successToast.waitForDisplayed();
}

describe('Collection Rename Modal', () => {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'feature flags not yet available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await setFeature(browser, 'enableRenameCollectionModal', true);
  });

  beforeEach(async function () {
    await dropDatabase(databaseName);

    await createBlankCollection(databaseName, initialName);
    await createBlankCollection(databaseName, 'bar');

    await browser.connectWithConnectionString();
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
  });

  afterEach(async function () {
    await dropDatabase(databaseName);
    await screenshotIfFailed(compass, this.currentTest);
  });

  describe('from the sidebar', () => {
    it('a collection can be renamed', async () => {
      await navigateToCollectionInSidebar(browser);

      // open the rename collection modal
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);

      // go through
      await renameCollectionSuccessFlow(browser, newName);

      // confirm that the new collection name is shown in the sidebar
      await browser
        .$(Selectors.sidebarCollection(databaseName, newName))
        .waitForDisplayed();
    });

    it('collection rename shows up on collection view', async () => {
      await navigateToCollectionInSidebar(browser);
      // open a collection tab
      const collectionSelector = Selectors.sidebarCollection(
        databaseName,
        initialName
      );
      const collectionElement = await browser.$(collectionSelector);
      await collectionElement.waitForDisplayed();
      await collectionElement.click();

      const headerSelector = Selectors.CollectionHeader;
      // wait until the collection tab has loaded
      await browser.$(headerSelector).waitForDisplayed();

      // open the rename collection flow from the sidebar
      await browser.hover(collectionSelector);
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);
      await renameCollectionSuccessFlow(browser, newName);

      await browser.$(headerSelector).waitForDisplayed();
      await browser.waitUntil(async () => {
        const collectionHeaderContent = await browser
          .$(headerSelector)
          .getText();
        return (
          collectionHeaderContent.includes(newName) &&
          !collectionHeaderContent.includes(initialName)
        );
      });
    });

    it('collection rename can be retried after an error renaming the collection', async () => {
      await navigateToCollectionInSidebar(browser);

      // open the rename collection modal
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);

      // wait for the collection modal to appear
      const modal = new RenameCollectionModal(browser);
      await modal.isVisible();

      // enter the new name - collections cannot have `$` in the name
      await modal.enterNewCollectionName('bar$');

      // submit the form and confirm submission
      await modal.submitButton.click();
      await modal.confirmationScreen.waitForDisplayed();
      await modal.submitButton.click();

      // wait for error banner to appear
      await modal.errorBanner.waitForDisplayed();

      // try again, expecting success
      await modal.enterNewCollectionName(newName);
      await modal.submitButton.click();
      await modal.confirmationScreen.waitForDisplayed();
      await modal.submitButton.click();

      // wait for success
      await modal.successToast.waitForDisplayed();
    });
  });

  describe('modal dismiss', () => {
    it('the modal can be dismissed', async () => {
      await navigateToCollectionInSidebar(browser);
      // open the rename collection modal
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);
      // wait for the collection modal to appear
      const modal = new RenameCollectionModal(browser);
      await modal.isVisible();

      await browser.clickVisible(modal.dismissButton);
      await modal.isNotVisible();
    });

    it('clears modal state when dismissed', async () => {
      await navigateToCollectionInSidebar(browser);
      // open the rename collection modal
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);

      // wait for the collection modal to appear
      const modal = new RenameCollectionModal(browser);
      await modal.isVisible();

      await modal.enterNewCollectionName('new-name');

      await browser.clickVisible(modal.dismissButton);
      await modal.isNotVisible();

      // re-open the modal
      // open the drop collection modal from the sidebar
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);

      // assert that the form state has reset
      expect(await modal.collectionNameInput.getValue()).to.equal(initialName);
    });
  });
});
