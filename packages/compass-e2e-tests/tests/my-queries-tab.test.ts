import { expect } from 'chai';
import clipboard from 'clipboardy';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  connectionNameFromString,
  DEFAULT_CONNECTION_STRING,
  TEST_MULTIPLE_CONNECTIONS,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

async function openMenuForQueryItem(
  browser: CompassBrowser,
  favoriteQueryName: string
) {
  const titleSelector = Selectors.myQueriesItem(favoriteQueryName);

  const titleElement = await browser.$(titleSelector);
  const parent = await titleElement.parentElement();

  await browser.waitUntil(async () => {
    await browser.hover(titleSelector);
    const button = await parent.$('button[title="Show actions"]');
    if (await button.isDisplayed()) {
      return true;
    }

    // go hover somewhere else to give the next attempt a fighting chance
    await browser.hover(Selectors.SidebarTitle);
    return false;
  });

  const button = await parent.$('button[title="Show actions"]');
  await button.click();
  await browser.$(Selectors.SavedItemMenu).waitForDisplayed();
}

describe('My Queries tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  const connectionName = connectionNameFromString(DEFAULT_CONNECTION_STRING);

  before(async function () {
    skipForWeb(this, 'saved queries not yet available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });
  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();
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

  it('opens a saved query', async function () {
    const favoriteQueryName = 'list of numbers greater than 10 - query';
    const newFavoriteQueryName = 'my renamed query';

    // Run a query
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
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
    await browser.setValueVisible(
      Selectors.QueryHistoryFavoriteItemNameField,
      favoriteQueryName
    );
    await browser.clickVisible(Selectors.QueryHistorySaveFavoriteItemButton);

    await browser.closeWorkspaceTabs();
    await browser.navigateToConnectionTab(
      connectionNameFromString(DEFAULT_CONNECTION_STRING),
      'Databases'
    );
    await browser.navigateToMyQueries();

    // open the menu
    await openMenuForQueryItem(browser, favoriteQueryName);

    // copy to clipboard
    await browser.clickVisible(Selectors.SavedItemMenuItemCopy);

    if (process.env.COMPASS_E2E_DISABLE_CLIPBOARD_USAGE !== 'true') {
      await browser.waitUntil(
        async () => {
          const text = (await clipboard.read())
            .replace(/\s+/g, ' ')
            .replace(/\n/g, '');
          const isValid =
            text ===
            '{ "collation": null, "filter": { "i": { "$gt": 10 } }, "limit": 10, "project": null, "skip": null, "sort": null }';
          if (!isValid) {
            console.log(text);
          }
          return isValid;
        },
        { timeoutMsg: 'Expected copy to clipboard to work' }
      );
    }
    // open the menu
    await openMenuForQueryItem(browser, favoriteQueryName);

    // rename the query
    await browser.clickVisible(Selectors.SavedItemMenuItemRename);
    const renameModal = await browser.$(Selectors.RenameSavedItemModal);
    await renameModal.waitForDisplayed();

    await browser.setValueVisible(
      Selectors.RenameSavedItemModalTextInput,
      newFavoriteQueryName
    );
    const confirmRenameButton = await browser.$(
      Selectors.RenameSavedItemModalSubmit
    );
    await confirmRenameButton.waitForEnabled();

    await browser.screenshot('rename-saved-item-modal.png');

    await confirmRenameButton.click();
    await renameModal.waitForDisplayed({ reverse: true });

    // rename the collection associated with the query to force the open item modal
    await browser.shellEval(connectionName, 'use test');
    await browser.shellEval(
      connectionName,
      'db.numbers.renameCollection("numbers-renamed")'
    );
    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.RefreshDatabasesItem
      );

      // go to My Queries because for multiple connections it is not the default tab
      await browser.navigateToMyQueries();
    } else {
      await browser.clickVisible(Selectors.Single.RefreshDatabasesButton);
    }

    // browse to the query
    await browser.clickVisible(Selectors.myQueriesItem(newFavoriteQueryName));

    // the open item modal - select a new collection
    const openModal = await browser.$(Selectors.OpenSavedItemModal);
    await openModal.waitForDisplayed();
    await browser.selectOption(
      `${Selectors.OpenSavedItemDatabaseField} button`,
      'test'
    );
    await browser.selectOption(
      `${Selectors.OpenSavedItemCollectionField} button`,
      'numbers-renamed'
    );
    const confirmOpenButton = await browser.$(
      Selectors.OpenSavedItemModalConfirmButton
    );
    await confirmOpenButton.waitForEnabled();

    await browser.screenshot('open-saved-item-modal.png');

    await confirmOpenButton.click();
    await openModal.waitForDisplayed({ reverse: true });

    // we should eventually arrive on the collection
    const namespace = await browser.getActiveTabNamespace();
    expect(namespace).to.equal('test.numbers-renamed');

    // back to my queries
    await browser.closeWorkspaceTabs();
    await browser.navigateToConnectionTab(
      connectionNameFromString(DEFAULT_CONNECTION_STRING),
      'Databases'
    );
    await browser.navigateToMyQueries();

    // open the menu
    await openMenuForQueryItem(browser, newFavoriteQueryName);

    // delete it
    await browser.clickVisible(Selectors.SavedItemMenuItemDelete);
    const deleteModal = await browser.$(Selectors.ConfirmationModal);
    await deleteModal.waitForDisplayed();
    const confirmDeleteButton = await browser.$(
      Selectors.ConfirmationModalConfirmButton()
    );
    await confirmDeleteButton.waitForEnabled();

    await browser.screenshot('delete-saved-item-modal.png');

    await confirmDeleteButton.click();
    await renameModal.waitForDisplayed({ reverse: true });
  });

  it('opens a saved aggregation', async function () {
    const savedAggregationName =
      'list of numbers greater than 10 - aggregation';

    // Navigate to aggregation
    await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    // add stage
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(0)).waitForDisplayed();
    // select $match
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: { $gt: 10 } }'
    );

    await browser.clickVisible(Selectors.SavePipelineMenuButton);
    const menuElement = await browser.$(Selectors.SavePipelineMenuContent);
    await menuElement.waitForDisplayed();
    await browser.clickVisible(Selectors.SavePipelineSaveAsAction);

    // wait for the modal to appear
    const savePipelineModal = await browser.$(Selectors.SavePipelineModal);
    await savePipelineModal.waitForDisplayed();

    // set aggregation name
    await browser.waitForAnimations(Selectors.SavePipelineNameInput);
    await browser.setValueVisible(
      Selectors.SavePipelineNameInput,
      savedAggregationName
    );

    await browser.screenshot('save-pipeline-modal.png');

    // click save button
    const createButton = await browser
      .$(Selectors.SavePipelineModal)
      .$('button=Save');

    await createButton.click();

    await browser.closeWorkspaceTabs();
    await browser.navigateToMyQueries();

    await browser.clickVisible(Selectors.myQueriesItem(savedAggregationName));
    const namespace = await browser.getActiveTabNamespace();
    expect(namespace).to.equal('test.numbers');
  });

  context(
    'when a user has a saved query associated with a collection that does not exist',
    function () {
      const favoriteQueryName = 'list of numbers greater than 10 - query';
      const newCollectionName = 'numbers-renamed';

      it('users can permanently associate a new namespace for an aggregation/query', async function () {
        // save a query and rename the collection associated with the query, so that the query must be opened with the "select namespace" modal

        // Run a query
        await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
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
        await browser.setValueVisible(
          Selectors.QueryHistoryFavoriteItemNameField,
          favoriteQueryName
        );
        await browser.clickVisible(
          Selectors.QueryHistorySaveFavoriteItemButton
        );

        await browser.closeWorkspaceTabs();
        await browser.navigateToConnectionTab(
          connectionNameFromString(DEFAULT_CONNECTION_STRING),
          'Databases'
        );
        await browser.navigateToMyQueries();

        // open the menu
        await openMenuForQueryItem(browser, favoriteQueryName);

        // copy to clipboard
        await browser.clickVisible(Selectors.SavedItemMenuItemCopy);

        if (process.env.COMPASS_E2E_DISABLE_CLIPBOARD_USAGE !== 'true') {
          await browser.waitUntil(
            async () => {
              const text = (await clipboard.read())
                .replace(/\s+/g, ' ')
                .replace(/\n/g, '');
              const isValid =
                text ===
                '{ "collation": null, "filter": { "i": { "$gt": 10 } }, "limit": 10, "project": null, "skip": null, "sort": null }';
              if (!isValid) {
                console.log(text);
              }
              return isValid;
            },
            { timeoutMsg: 'Expected copy to clipboard to work' }
          );
        }

        // rename the collection associated with the query to force the open item modal
        await browser.shellEval(connectionName, 'use test');
        await browser.shellEval(
          connectionName,
          `db.numbers.renameCollection('${newCollectionName}')`
        );

        await browser.screenshot('before-refresh.png');

        if (TEST_MULTIPLE_CONNECTIONS) {
          await browser.selectConnectionMenuItem(
            connectionName,
            Selectors.Multiple.RefreshDatabasesItem
          );
        } else {
          await browser.clickVisible(Selectors.Single.RefreshDatabasesButton);
        }

        await browser.screenshot('after-refresh.png');

        await browser.navigateToMyQueries();
        // browse to the query
        await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));

        // the open item modal - select a new collection
        const openModal = await browser.$(Selectors.OpenSavedItemModal);
        await openModal.waitForDisplayed();
        await browser.selectOption(
          `${Selectors.OpenSavedItemDatabaseField} button`,
          'test'
        );
        await browser.selectOption(
          `${Selectors.OpenSavedItemCollectionField} button`,
          newCollectionName
        );

        await browser.clickParent(
          '[data-testid="update-query-aggregation-checkbox"]'
        );

        const confirmOpenButton = await browser.$(
          Selectors.OpenSavedItemModalConfirmButton
        );
        await confirmOpenButton.waitForEnabled();

        await confirmOpenButton.click();
        await openModal.waitForDisplayed({ reverse: true });

        await browser.navigateToMyQueries();

        const [databaseNameElement, collectionNameElement] = [
          await browser.$('span=test'),
          await browser.$(`span=${newCollectionName}`),
        ];

        await databaseNameElement.waitForDisplayed();
        await collectionNameElement.waitForDisplayed();
      });
    }
  );
});
