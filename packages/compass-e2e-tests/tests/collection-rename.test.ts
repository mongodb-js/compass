import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  init,
  cleanup,
  screenshotIfFailed,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';
import { createDummyCollections } from '../helpers/insert-data';
import * as Selectors from '../helpers/selectors';

const databaseName = 'test';
const initialCollectionName = 'numbers';
const newCollectionName = 'renamed';

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
    const modal = this.browser.$(Selectors.RenameCollectionModal);
    await modal.waitForDisplayed();
  }

  async isNotVisible() {
    const modal = this.browser.$(Selectors.RenameCollectionModal);
    return modal.waitForDisplayed({
      reverse: true,
    });
  }

  async enterNewCollectionName(newCollectionName: string) {
    const input = this.browser.$(Selectors.RenameCollectionModalInput);
    await input.clearValue();
    await input.addValue(newCollectionName);
  }
}

async function renameCollectionSuccessFlow(
  browser: CompassBrowser,
  newCollectionName: string
) {
  const page = new RenameCollectionModal(browser);
  // wait for the collection modal to appear
  await page.isVisible();

  // enter the new name
  await page.enterNewCollectionName(newCollectionName);

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
  let connectionId: string | undefined;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createDummyCollections();

    await browser.disconnectAll();
    await browser.connectToDefaults();
    connectionId = await browser.getConnectionIdByName(
      DEFAULT_CONNECTION_NAME_1
    );
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  describe('from the sidebar', () => {
    it('collection rename shows up on collection view', async () => {
      // open a collection tab
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        databaseName,
        initialCollectionName
      );

      const headerSelector = Selectors.CollectionHeader;
      // wait until the collection tab has loaded
      await browser.$(headerSelector).waitForDisplayed();

      await browser.selectCollectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        databaseName,
        initialCollectionName,
        'rename-collection'
      );

      await renameCollectionSuccessFlow(browser, newCollectionName);

      // confirm that the new collection name is shown in the sidebar
      await browser.clickVisible(Selectors.SidebarFilterInput);
      await browser.setValueVisible(
        Selectors.SidebarFilterInput,
        `^(${databaseName}|${newCollectionName})$`
      );
      await browser
        .$(
          Selectors.sidebarCollection(
            connectionId,
            databaseName,
            newCollectionName
          )
        )
        .waitForDisplayed();

      // confirm that the header in the workspace changes
      await browser.$(headerSelector).waitForDisplayed();
      await browser.waitUntil(async () => {
        const collectionHeaderContent = await browser
          .$(headerSelector)
          .getText();
        return (
          collectionHeaderContent.includes(newCollectionName) &&
          !collectionHeaderContent.includes(initialCollectionName)
        );
      });
    });

    it('collection rename can be retried after an error renaming the collection', async () => {
      await browser.selectCollectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        databaseName,
        initialCollectionName,
        'rename-collection'
      );

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
      await modal.enterNewCollectionName(newCollectionName);
      await modal.submitButton.click();
      await modal.confirmationScreen.waitForDisplayed();
      await modal.submitButton.click();

      // wait for success
      await modal.successToast.waitForDisplayed();
    });
  });

  describe('modal dismiss', () => {
    it('clears modal state when dismissed', async () => {
      await browser.selectCollectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        databaseName,
        initialCollectionName,
        'rename-collection'
      );

      // wait for the collection modal to appear
      const modal = new RenameCollectionModal(browser);
      await modal.isVisible();

      await modal.enterNewCollectionName('new-name');

      await browser.clickVisible(modal.dismissButton);
      await modal.isNotVisible();

      // re-open the modal
      await browser.selectCollectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        databaseName,
        initialCollectionName,
        'rename-collection'
      );

      // assert that the form state has reset
      expect(await modal.collectionNameInput.getValue()).to.equal(
        initialCollectionName
      );
    });
  });
});
