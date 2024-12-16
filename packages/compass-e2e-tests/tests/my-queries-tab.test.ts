import { expect } from 'chai';
import clipboard from 'clipboardy';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  DEFAULT_CONNECTION_NAME_1,
  DEFAULT_CONNECTION_STRING_1,
  DEFAULT_CONNECTION_STRING_2,
  DEFAULT_CONNECTION_NAME_2,
} from '../helpers/compass';
import type { QueryOptions } from '../helpers/commands';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { MongoClient } from 'mongodb';
import { context as runnerContext } from '../helpers/test-runner-context';

async function openMenuForQueryItem(
  browser: CompassBrowser,
  favoriteQueryName: string
) {
  const titleSelector = Selectors.myQueriesItem(favoriteQueryName);

  const titleElement = browser.$(titleSelector);
  const parent = titleElement.parentElement();

  await browser.waitUntil(async () => {
    await browser.hover(titleSelector);
    const button = parent.$('button[title="Show actions"]');
    if (await button.isDisplayed()) {
      return true;
    }

    // go hover somewhere else to give the next attempt a fighting chance
    await browser.hover(Selectors.SidebarTitle);
    return false;
  });

  const button = parent.$('button[title="Show actions"]');
  await button.click();
  await browser.$(Selectors.SavedItemMenu).waitForDisplayed();
}

const knownQueryNames: Record<string, true> = {};
const knownQueryFilters: Record<string, true> = {};

async function saveQuery(
  browser: CompassBrowser,
  databaseName: string,
  collectionName: string,
  filter: string,
  queryOptions: QueryOptions,
  savedQueryName: string
) {
  if (knownQueryNames[savedQueryName]) {
    // We don\'t clean up queries between tests and even though we often rename
    // them in tests it is easy to end up with duplicates which can at the very
    // least be confusing to debug.
    throw new Error('Please use unique query names');
  }
  knownQueryNames[savedQueryName] = true;

  if (knownQueryFilters[filter]) {
    throw new Error(
      'Please use unique query filters so they will appear in recents'
    );
  }
  knownQueryFilters[filter] = true;

  // Run a query
  await browser.navigateToCollectionTab(
    DEFAULT_CONNECTION_NAME_1,
    databaseName,
    collectionName,
    'Documents'
  );
  await browser.runFindOperation('Documents', filter, queryOptions);
  await browser.clickVisible(Selectors.QueryBarHistoryButton);

  // Wait for the popover to show
  const history = browser.$(Selectors.QueryBarHistory);
  await history.waitForDisplayed();

  // wait for the recent item to show.
  const recentCard = browser.$(Selectors.QueryHistoryRecentItem);
  await recentCard.waitForDisplayed();

  // Save the ran query
  await browser.hover(Selectors.QueryHistoryRecentItem);
  await browser.clickVisible(Selectors.QueryHistoryFavoriteAnItemButton);
  await browser.setValueVisible(
    Selectors.QueryHistoryFavoriteItemNameField,
    savedQueryName
  );
  await browser.clickVisible(Selectors.QueryHistorySaveFavoriteItemButton);
}

async function saveAggregation(
  browser: CompassBrowser,
  databaseName: string,
  collectionName: string,
  stageName: string,
  stageText: string,
  savedAggregationName: string
) {
  if (knownQueryNames[savedAggregationName]) {
    // same comment as for saveQuery
    throw new Error('Please use unique query names');
  }
  knownQueryNames[savedAggregationName] = true;

  // Navigate to aggregation
  await browser.navigateToCollectionTab(
    DEFAULT_CONNECTION_NAME_1,
    databaseName,
    collectionName,
    'Aggregations'
  );
  // add stage
  await browser.clickVisible(Selectors.AddStageButton);
  await browser.$(Selectors.stageEditor(0)).waitForDisplayed();
  // select $match
  await browser.focusStageOperator(0);
  await browser.selectStageOperator(0, stageName);
  await browser.setCodemirrorEditorValue(Selectors.stageEditor(0), stageText);

  await browser.clickVisible(Selectors.SavePipelineMenuButton);
  const menuElement = browser.$(Selectors.SavePipelineMenuContent);
  await menuElement.waitForDisplayed();
  await browser.clickVisible(Selectors.SavePipelineSaveAsAction);

  // wait for the modal to appear
  const savePipelineModal = browser.$(Selectors.SavePipelineModal);
  await savePipelineModal.waitForDisplayed();

  // set aggregation name
  await browser.waitForAnimations(Selectors.SavePipelineNameInput);
  await browser.setValueVisible(
    Selectors.SavePipelineNameInput,
    savedAggregationName
  );

  // click save button
  const createButton = browser.$(Selectors.SavePipelineModal).$('button=Save');

  await createButton.click();
}

describe('My Queries tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  let client_1: MongoClient;
  let client_2: MongoClient;

  before(async function () {
    skipForWeb(this, 'saved queries not yet available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();

    client_1 = new MongoClient(DEFAULT_CONNECTION_STRING_1);
    await client_1.connect();

    client_2 = new MongoClient(DEFAULT_CONNECTION_STRING_2);
    await client_2.connect();
  });
  beforeEach(async function () {
    await createNumbersCollection();
    await browser.disconnectAll();
  });
  after(async function () {
    if (client_1) {
      await client_1.close();
    }
    if (client_2) {
      await client_2.close();
    }
    if (compass) {
      await cleanup(compass);
    }
  });
  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  context(
    'when a user has a saved query associated with a collection that exists in the single connection',
    function () {
      it('opens a saved query', async function () {
        await browser.connectByName(DEFAULT_CONNECTION_NAME_1);

        const favoriteQueryName = 'list of numbers greater than 10 - query';
        const newFavoriteQueryName = `${favoriteQueryName} (renamed)`;

        await saveQuery(
          browser,
          'test',
          'numbers',
          `{ i: {$gt: 10 } }`,
          { limit: '10' },
          favoriteQueryName
        );

        await browser.closeWorkspaceTabs();
        await browser.navigateToConnectionTab(
          DEFAULT_CONNECTION_NAME_1,
          'Databases'
        );
        await browser.navigateToMyQueries();

        // open the menu
        await openMenuForQueryItem(browser, favoriteQueryName);

        // copy to clipboard
        await browser.clickVisible(Selectors.SavedItemMenuItemCopy);

        if (!runnerContext.disableClipboardUsage) {
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
        const renameModal = browser.$(Selectors.RenameSavedItemModal);
        await renameModal.waitForDisplayed();

        await browser.setValueVisible(
          Selectors.RenameSavedItemModalTextInput,
          newFavoriteQueryName
        );
        await browser.clickVisible(Selectors.RenameSavedItemModalSubmit);
        await renameModal.waitForDisplayed({ reverse: true });

        // rename the collection associated with the query to force the open item modal
        await client_1
          .db('test')
          .renameCollection('numbers', 'numbers-renamed');

        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_1,
          Selectors.Multiple.RefreshDatabasesItem
        );

        // go to My Queries because for multiple connections it is not the default tab
        await browser.navigateToMyQueries();

        // browse to the query
        await browser.clickVisible(
          Selectors.myQueriesItem(newFavoriteQueryName)
        );

        // the open item modal - select a new collection
        const openModal = browser.$(Selectors.OpenSavedItemModal);
        await openModal.waitForDisplayed();
        await browser.selectOption(
          `${Selectors.OpenSavedItemDatabaseField} button`,
          'test'
        );
        await browser.selectOption(
          `${Selectors.OpenSavedItemCollectionField} button`,
          'numbers-renamed'
        );
        await browser.clickVisible(Selectors.OpenSavedItemModalConfirmButton);
        await openModal.waitForDisplayed({ reverse: true });

        // we should eventually arrive on the collection
        const namespace = await browser.getActiveTabNamespace();
        expect(namespace).to.equal('test.numbers-renamed');

        // back to my queries
        await browser.closeWorkspaceTabs();
        await browser.navigateToConnectionTab(
          DEFAULT_CONNECTION_NAME_1,
          'Databases'
        );
        await browser.navigateToMyQueries();

        // open the menu
        await openMenuForQueryItem(browser, newFavoriteQueryName);

        // delete it
        await browser.clickConfirmationAction(
          Selectors.SavedItemMenuItemDelete
        );
      });

      it('opens a saved aggregation', async function () {
        await browser.connectByName(DEFAULT_CONNECTION_NAME_1);

        const savedAggregationName =
          'list of numbers greater than 10 - aggregation';

        await saveAggregation(
          browser,
          'test',
          'numbers',
          '$match',
          '{ i: { $gt: 10 } }',
          savedAggregationName
        );

        await browser.closeWorkspaceTabs();
        await browser.navigateToMyQueries();

        await browser.clickVisible(
          Selectors.myQueriesItem(savedAggregationName)
        );
        const namespace = await browser.getActiveTabNamespace();
        expect(namespace).to.equal('test.numbers');
      });
    }
  );

  context(
    'when a user has a saved query associated with a collection that does not exist in the single connection',
    function () {
      it('opens a modal where users can permanently associate a new namespace for an aggregation/query', async function () {
        const favoriteQueryName =
          'another list of numbers greater than 10 - query';
        const newCollectionName = 'numbers-renamed';

        await browser.connectByName(DEFAULT_CONNECTION_NAME_1);

        // save a query and rename the collection associated with the query, so that the query must be opened with the "select namespace" modal
        await saveQuery(
          browser,
          'test',
          'numbers',
          `{i: { $gt: 11 } }`,
          { limit: '10' },
          favoriteQueryName
        );

        await browser.closeWorkspaceTabs();
        await browser.navigateToConnectionTab(
          DEFAULT_CONNECTION_NAME_1,
          'Databases'
        );
        await browser.navigateToMyQueries();

        // open the menu
        await openMenuForQueryItem(browser, favoriteQueryName);

        // copy to clipboard
        await browser.clickVisible(Selectors.SavedItemMenuItemCopy);

        if (!runnerContext.disableClipboardUsage) {
          await browser.waitUntil(
            async () => {
              const text = (await clipboard.read())
                .replace(/\s+/g, ' ')
                .replace(/\n/g, '');
              const isValid =
                text ===
                '{ "collation": null, "filter": { "i": { "$gt": 11 } }, "limit": 10, "project": null, "skip": null, "sort": null }';
              if (!isValid) {
                console.log(text);
              }
              return isValid;
            },
            { timeoutMsg: 'Expected copy to clipboard to work' }
          );
        }

        // rename the collection associated with the query to force the open item modal
        await client_1
          .db('test')
          .renameCollection('numbers', newCollectionName);

        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_1,
          Selectors.Multiple.RefreshDatabasesItem
        );

        await browser.navigateToMyQueries();
        // browse to the query
        await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));

        // the open item modal - select a new collection
        const openModal = browser.$(Selectors.OpenSavedItemModal);
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

        await browser.clickVisible(Selectors.OpenSavedItemModalConfirmButton);
        await openModal.waitForDisplayed({ reverse: true });

        await browser.navigateToMyQueries();

        const [databaseNameElement, collectionNameElement] = [
          browser.$('span=test'),
          browser.$(`span=${newCollectionName}`),
        ];

        await databaseNameElement.waitForDisplayed();
        await collectionNameElement.waitForDisplayed();
      });
    }
  );

  context(
    'when a user has multiple connections and only one contains the namespace',
    function () {
      it('uses the connection that contains the namespace used by the aggregation/query', async function () {
        await browser.connectToDefaults();

        const favoriteQueryName = 'only one with namespace';

        await saveQuery(
          browser,
          'test',
          'numbers',
          `{ i: { $gt: 12 } }`,
          { limit: '10' },
          favoriteQueryName
        );

        await client_1.db('test').dropCollection('numbers');

        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_1,
          Selectors.Multiple.RefreshDatabasesItem
        );

        await browser.navigateToMyQueries();

        // browse to the query
        await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));

        // we should land on connection-2 because that's the only one that still
        // has the collection
        await browser.waitUntil(async () => {
          const activeConnectionName = await browser
            .$(Selectors.workspaceTab({ active: true }))
            .getAttribute('data-connection-name');
          return activeConnectionName === DEFAULT_CONNECTION_NAME_2;
        });
      });
    }
  );

  context(
    'when a user has multiple connections and none of them contain the namespace',
    function () {
      it('opens a modal where users can select a connection and permanently associate a new namespace for an aggregation/query', async function () {
        const newCollectionName = 'numbers-renamed';

        await browser.connectToDefaults();

        const favoriteQueryName = 'none with namespace';

        await saveQuery(
          browser,
          'test',
          'numbers',
          `{ i: { $gt: 13 } }`,
          { limit: '10' },
          favoriteQueryName
        );

        await client_1.db('test').dropCollection('numbers');
        await client_2
          .db('test')
          .renameCollection('numbers', newCollectionName);

        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_1,
          Selectors.Multiple.RefreshDatabasesItem
        );
        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_2,
          Selectors.Multiple.RefreshDatabasesItem
        );

        await browser.navigateToMyQueries();

        // browse to the query
        await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));

        // the open item modal - select a new connection, database and collection
        const openModal = browser.$(Selectors.OpenSavedItemModal);
        await openModal.waitForDisplayed();
        await browser.selectOption(
          `${Selectors.OpenSavedItemConnectionField} button`,
          DEFAULT_CONNECTION_NAME_2
        );
        await browser.selectOption(
          `${Selectors.OpenSavedItemDatabaseField} button`,
          'test'
        );
        await browser.selectOption(
          `${Selectors.OpenSavedItemCollectionField} button`,
          newCollectionName
        );

        await browser.clickVisible(Selectors.OpenSavedItemModalConfirmButton);

        await openModal.waitForDisplayed({ reverse: true });

        // we should land on connection-2 because that's the one we just selected
        await browser.waitUntil(async () => {
          const activeConnectionName = await browser
            .$(Selectors.workspaceTab({ active: true }))
            .getAttribute('data-connection-name');
          return activeConnectionName === DEFAULT_CONNECTION_NAME_2;
        });
      });
    }
  );

  context(
    'when a user has multiple connections that contain the same namespace',
    function () {
      it('opens a modal where users can select the connection to use for an aggregation/query', async function () {
        await browser.connectToDefaults();

        const favoriteQueryName = 'all with namespace';

        await saveQuery(
          browser,
          'test',
          'numbers',
          `{ i: { $gt: 14 } }`,
          { limit: '10' },
          favoriteQueryName
        );

        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_1,
          Selectors.Multiple.RefreshDatabasesItem
        );
        await browser.selectConnectionMenuItem(
          DEFAULT_CONNECTION_NAME_2,
          Selectors.Multiple.RefreshDatabasesItem
        );

        await browser.navigateToMyQueries();

        // browse to the query
        await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));

        // the open item modal - select a new connection, database and collection
        const selectModal = browser.$(Selectors.SelectConnectionModal);
        await selectModal.waitForDisplayed();

        const connectionId = await browser.getConnectionIdByName(
          DEFAULT_CONNECTION_NAME_2
        );
        if (!connectionId) {
          throw new Error(`Connection ${DEFAULT_CONNECTION_NAME_2} not found`);
        }

        await browser.clickParent(
          Selectors.selectConnectionRadioButton(connectionId)
        );

        await browser.clickVisible(
          Selectors.SelectConnectionModalConfirmButton
        );

        await selectModal.waitForDisplayed({ reverse: true });

        // we should land on connection-2 because that's the one we just selected
        await browser.waitUntil(async () => {
          const activeConnectionName = await browser
            .$(Selectors.workspaceTab({ active: true }))
            .getAttribute('data-connection-name');
          return activeConnectionName === DEFAULT_CONNECTION_NAME_2;
        });
      });
    }
  );
});
