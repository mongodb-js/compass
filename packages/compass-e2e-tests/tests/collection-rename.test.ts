import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';
import { createBlankCollection, dropDatabase } from '../helpers/insert-data';
import * as Selectors from '../helpers/selectors';

import { setTimeout } from 'timers/promises';
import { saveAggregationPipeline } from '../helpers/commands/save-aggregation-pipeline';
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
    compass = await beforeTests();
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
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await dropDatabase(databaseName);
    await afterTest(compass, this.currentTest);
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

      // wait until the collection tab has loaded
      await browser.$(Selectors.CollectionHeaderNamespace).waitForDisplayed();

      // open the rename collection flow from the sidebar
      await browser.hover(collectionSelector);
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);
      await renameCollectionSuccessFlow(browser, newName);

      await browser.$(Selectors.CollectionHeaderNamespace).waitForDisplayed();
      await browser.waitUntil(async () => {
        const collectionHeaderContent = await browser
          .$(Selectors.CollectionHeaderNamespace)
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

      // enter the new name - 'bar' already exists
      await modal.enterNewCollectionName('bar');

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

  describe('saved aggregations', () => {
    beforeEach(
      'navigate to aggregations tab and save pipeline on test collection',
      async () => {
        // Some tests navigate away from the numbers collection aggregations tab
        await browser.navigateToCollectionTab(
          'rename-collection',
          'numbers',
          'Aggregations'
        );
        // Get us back to the empty stage every time. Also test the Create New
        // Pipeline flow while at it.
        await browser.clickVisible(Selectors.CreateNewPipelineButton);

        await browser.clickVisible(Selectors.AddStageButton);
        await browser.$(Selectors.stageEditor(0)).waitForDisplayed();
        // sanity check to make sure there's only one stage
        const stageContainers = await browser.$$(Selectors.StageCard);
        expect(stageContainers).to.have.lengthOf(1);

        await saveAggregationPipeline(browser, 'my-aggregation', [
          { $match: `{ name: 'john' }` },
        ]);
      }
    );

    // functionality not implemented and tests failing
    it.skip('preserves a saved aggregation for a namespace when a collection is renamed', async () => {
      // open the rename collection modal
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);
      await renameCollectionSuccessFlow(browser, newName);

      // confirm the saved aggregation is still present for the newly renamed namespace
      await browser.navigateToCollectionTab(
        'rename-collection',
        newName,
        'Aggregations'
      );

      await browser.waitForAnimations(
        Selectors.AggregationOpenSavedPipelinesButton
      );
      await browser.clickVisible(Selectors.AggregationOpenSavedPipelinesButton);
      await browser.waitForAnimations(
        Selectors.AggregationSavedPipelinesPopover
      );
      await browser
        .$(Selectors.AggregationSavedPipelineCard('my-aggregation'))
        .waitForDisplayed();
    });
  });

  describe('saved queries', () => {
    beforeEach('navigate to documents tab and save a query', async () => {
      // set guide cue to not show up
      await browser.execute((key) => {
        localStorage.setItem(key, 'true');
      }, 'has_seen_stage_wizard_guide_cue');

      const favoriteQueryName = 'list of numbers greater than 10 - query';

      // Run a query
      await browser.navigateToCollectionTab(
        'rename-collection',
        'numbers',
        'Documents'
      );

      await browser.runFindOperation('Documents', `{i: {$gt: 10}}`, {
        limit: '10',
      });
      await browser.clickVisible(Selectors.QueryBarHistoryButton);

      // Wait for the popover to show
      const history = await browser.$(Selectors.QueryBarHistory);
      await history.waitForDisplayed();

      // wait for the recent item to show.
      const recentCard = await browser.$(Selectors.QueryHistoryRecentItem);
      await recentCard.waitForDisplayed();

      // Save the ran query
      await browser.hover(Selectors.QueryHistoryRecentItem);
      await browser.clickVisible(Selectors.QueryHistoryFavoriteAnItemButton);
      const favoriteQueryNameField = await browser.$(
        Selectors.QueryHistoryFavoriteItemNameField
      );
      await favoriteQueryNameField.setValue(favoriteQueryName);
      await browser.clickVisible(Selectors.QueryHistorySaveFavoriteItemButton);
    });

    // functionality not implemented and tests failing
    it.skip('preserves a saved query for a namespace when a collection is renamed', async () => {
      // open the rename collection modal
      await browser.hover(
        Selectors.sidebarCollection(databaseName, initialName)
      );
      await browser.clickVisible(Selectors.CollectionShowActionsButton);
      await browser.clickVisible(Selectors.RenameCollectionButton);
      await renameCollectionSuccessFlow(browser, newName);
      await browser.navigateToCollectionTab(
        'rename-collection',
        newName,
        'Documents'
      );

      await browser.clickVisible(Selectors.QueryBarHistoryButton);

      // Wait for the popover to show
      const history = await browser.$(Selectors.QueryBarHistory);
      await history.waitForDisplayed();

      const button = await browser.$(Selectors.QueryHistoryFavoritesButton);
      await browser.debug();
      await button.clickVisible();

      await browser.$(Selectors.QueryHistoryFavoriteItem).waitForDisplayed();

      await setTimeout(3000);
    });
  });
});
