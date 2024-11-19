import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  Selectors,
  serverSatisfies,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_STRING_1,
  connectionNameFromString,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { expect } from 'chai';
import { type Db, MongoClient } from 'mongodb';

type Connection = {
  name: string;
  connectionString?: string;
};

const connectionsWithNoSearchSupport: Connection[] = [
  {
    name: 'Local Connection',
    connectionString: DEFAULT_CONNECTION_STRING_1,
  },
  {
    name: 'Atlas Free Cluster',
    connectionString: process.env.E2E_TESTS_ATLAS_CS_WITHOUT_SEARCH,
  },
];
const connectionsWithSearchSupport: Connection[] = [
  {
    name: 'Atlas Local Dev',
    connectionString: process.env.ATLAS_LOCAL_URL,
  },
];

const INDEX_DEFINITION = JSON.stringify({
  mappings: {
    dynamic: true,
  },
});

// The current timeout (2mins) is not enough for the search indexes to be created
// and be queryable on Atlas. So we are increasing the timeout to 4mins.
// This can not be more than mocha timeout.
const WAIT_TIMEOUT = 240_000;
const MOCHA_TIMEOUT = 360_000;

function getRandomNumber() {
  return Math.floor(Math.random() * 2 ** 20);
}

async function createSearchIndex(
  browser: CompassBrowser,
  indexName: string,
  indexDefinition: string
): Promise<void> {
  await browser.clickVisible(Selectors.CreateIndexDropdownButton);
  await browser
    .$(Selectors.createIndexDropdownAction('search-indexes'))
    .waitForDisplayed();
  await browser.clickVisible(
    Selectors.createIndexDropdownAction('search-indexes')
  );

  const modal = await browser.$(Selectors.SearchIndexModal);
  await modal.waitForDisplayed();

  await browser.setValueVisible(Selectors.SearchIndexName, indexName);
  await browser.setCodemirrorEditorValue(
    Selectors.SearchIndexDefinition,
    indexDefinition
  );

  await browser.clickVisible(Selectors.SearchIndexConfirmButton);
  await modal.waitForDisplayed({ reverse: true });
}

async function updateSearchIndex(
  browser: CompassBrowser,
  indexName: string,
  indexDefinition: string
) {
  const indexRowSelector = Selectors.searchIndexRow(indexName);
  const indexRow = await browser.$(indexRowSelector);
  await indexRow.waitForDisplayed();

  await browser.hover(indexRowSelector);
  await browser.clickVisible(Selectors.searchIndexEditButton(indexName));

  const modal = await browser.$(Selectors.SearchIndexModal);
  await modal.waitForDisplayed();

  await browser.setCodemirrorEditorValue(
    Selectors.SearchIndexDefinition,
    indexDefinition
  );

  await browser.clickVisible(Selectors.SearchIndexConfirmButton);
  await modal.waitForDisplayed({ reverse: true });
}

async function dropSearchIndex(browser: CompassBrowser, indexName: string) {
  const indexRowSelector = Selectors.searchIndexRow(indexName);
  const indexRow = await browser.$(indexRowSelector);
  await indexRow.waitForDisplayed();

  await browser.hover(indexRowSelector);

  await browser.clickConfirmationAction(
    Selectors.searchIndexDropButton(indexName),
    indexName
  );

  await indexRow.waitForExist({
    reverse: true,
    timeout: WAIT_TIMEOUT,
  });
}

async function verifyIndexDetails(
  browser: CompassBrowser,
  indexName: string,
  details: string
) {
  const indexRowSelector = Selectors.searchIndexRow(indexName);
  const indexRow = await browser.$(indexRowSelector);
  await indexRow.waitForDisplayed({ timeout: WAIT_TIMEOUT });
  await browser.hover(indexRowSelector);
  await browser.clickVisible(Selectors.searchIndexExpandButton(indexName));

  await browser.waitUntil(async () => {
    const text = await browser
      .$(Selectors.searchIndexDetails(indexName))
      .getText();
    return text.toLowerCase() === details.toLowerCase();
  });
}

describe('Search Indexes', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let mongoClient: MongoClient;
  let dbInstance: Db;
  let currentConnectionString: string;

  // DB name is always same.
  const DB_NAME = 'e2e_indexes_test';
  // Collection name is random per every test.
  let collectionName: string;

  before(async function () {
    skipForWeb(this, 'search indexes disabled on compass-web');

    // $search works with server 4.2 or more
    if (!serverSatisfies('>= 4.1.11')) {
      this.skip();
    }
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }
    await cleanup(compass);
  });

  beforeEach(async function () {
    collectionName = `e2e_coll_numbers_${getRandomNumber()}`;
    // Ensure namespace exists
    {
      mongoClient = new MongoClient(currentConnectionString);
      await mongoClient.connect();
      dbInstance = mongoClient.db(DB_NAME);

      // Try to delete a namespace if it exists
      try {
        await dbInstance.dropCollection(collectionName);
      } catch (e) {
        // noop
      }

      // Create a namespace
      await dbInstance.createCollection(collectionName);
    }

    await browser.disconnectAll();
    await browser.connectWithConnectionString(currentConnectionString);
    await browser.navigateToCollectionTab(
      connectionNameFromString(currentConnectionString),
      DB_NAME,
      collectionName,
      'Indexes'
    );
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);

    // Drop the collection
    {
      try {
        await dbInstance.dropCollection(collectionName);
      } catch (e) {
        console.log(`Failed to drop collection: ${DB_NAME}.${collectionName}`);
      }
    }
    void mongoClient.close();
    await browser.disconnectAll();
  });

  for (const { name, connectionString } of connectionsWithNoSearchSupport) {
    context(`does not support search indexes in ${name}`, function () {
      before(function () {
        if (!connectionString) {
          return this.skip();
        }
        currentConnectionString = connectionString;
      });

      it('allows users to create a regular index', async function () {
        const indexName = await browser.createIndex({
          fieldName: 'e2e_tests_index',
          indexType: 'text',
        });
        await browser.dropIndex(indexName);
      });

      // TODO(COMPASS-8220): Un-skip this test
      (name === 'Atlas Free Cluster'
        ? it.skip
        : it)('renders search indexes tab disabled', async function () {
        const searchTab = await browser.$(
          Selectors.indexesSegmentedTab('search-indexes')
        );
        const isTabClickable = await searchTab.isClickable();
        expect(isTabClickable).to.be.false;
      });
    });
  }

  for (const { name, connectionString } of connectionsWithSearchSupport) {
    context(`supports search indexes in ${name}`, function () {
      // Set the mocha timeout to 6mins to accomodate the 4mins wait timeout
      this.timeout(MOCHA_TIMEOUT);
      before(function () {
        if (!connectionString) {
          return this.skip();
        }
        currentConnectionString = connectionString;
      });

      it('allows users to create a regular indexes', async function () {
        await browser.clickVisible(
          Selectors.indexesSegmentedTab('regular-indexes')
        );
        const indexName = await browser.createIndex({
          fieldName: 'e2e_tests_index',
          indexType: 'text',
        });
        await browser.dropIndex(indexName);
      });

      it('allows users to create, view and drop search indexes', async function () {
        const indexName = `e2e_search_index_${getRandomNumber()}`;
        await browser.clickVisible(
          Selectors.indexesSegmentedTab('search-indexes')
        );
        await createSearchIndex(browser, indexName, INDEX_DEFINITION);

        // Verify it was added.
        // As we added index definition with no fields and only
        // dynamic mapping, the details should display 'Dynamic Mappings'
        await verifyIndexDetails(browser, indexName, 'Dynamic Mappings');

        // Drop it
        await dropSearchIndex(browser, indexName);
      });

      it('allows users to update and view search indexes', async function () {
        const indexName = `e2e_search_index_${getRandomNumber()}`;
        await browser.clickVisible(
          Selectors.indexesSegmentedTab('search-indexes')
        );
        await createSearchIndex(browser, indexName, INDEX_DEFINITION);

        // Verify it was added.
        // As we added index definition with no fields and only
        // dynamic mapping, the details should display 'Dynamic Mappings'
        await verifyIndexDetails(browser, indexName, 'Dynamic Mappings');

        // Edit it
        await updateSearchIndex(
          browser,
          indexName,
          JSON.stringify({
            mappings: {
              dynamic: false,
            },
          })
        );

        // Verify its updating/updated.
        // As we set the new definition to have no dynamic mappings
        // with no fields, the index details should have '[empty]' value.
        await verifyIndexDetails(
          browser,
          indexName,
          'No mappings in the index definition.'
        );
      });

      it('runs a search aggregation with index name', async function () {
        const indexName = `e2e_search_index_${getRandomNumber()}`;
        await browser.clickVisible(
          Selectors.indexesSegmentedTab('search-indexes')
        );
        await createSearchIndex(browser, indexName, INDEX_DEFINITION);

        const indexRowSelector = Selectors.searchIndexRow(indexName);
        const indexRow = await browser.$(indexRowSelector);
        await indexRow.waitForDisplayed({ timeout: WAIT_TIMEOUT });

        await browser.hover(indexRowSelector);

        // We show the aggregate button only when the index is queryable. So we wait.
        const aggregateButtonSelector =
          Selectors.searchIndexAggregateButton(indexName);
        await browser.$(aggregateButtonSelector).waitForDisplayed();
        await browser.clickVisible(aggregateButtonSelector);

        const namespace = await browser.getActiveTabNamespace();
        expect(namespace).to.equal(`${DB_NAME}.${collectionName}`);

        await browser.waitUntilActiveCollectionSubTab('Aggregations');
      });
    });
  }
});
