import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  afterTest,
  MONGODB_TEST_SERVER_PORT,
  Selectors,
  serverSatisfies,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { disconnect } from '../helpers/commands';
import { expect } from 'chai';
import { type Db, MongoClient } from 'mongodb';

type Connection = {
  name: string;
  connectionString?: string;
};

const connectionsWithNoSearchSupport: Connection[] = [
  {
    name: 'Local Connection',
    connectionString: `mongodb://localhost:${MONGODB_TEST_SERVER_PORT}/test`,
  },
  {
    name: 'Atlas Free Cluster',
    connectionString: process.env.E2E_TESTS_ATLAS_CS_WITHOUT_SEARCH,
  },
];
const connectionsWithSearchSupport: Connection[] = [
  {
    name: 'Atlas Dedicated Cluster',
    connectionString: process.env.E2E_TESTS_ATLAS_CS_WITH_SEARCH,
  },
  // todo: atlas local dev
];

const INDEX_DEFINITION = JSON.stringify({
  mappings: {
    dynamic: true,
  },
});

function getRandomNumber() {
  return Math.floor(Math.random() * 2 ** 20);
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
    // $search works with server 4.2 or more
    if (!serverSatisfies('>= 4.1.11')) {
      this.skip();
    }
    compass = await beforeTests({
      extraSpawnArgs: ['--enableAtlasSearchIndexManagement'],
    });
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
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

    await browser.connectWithConnectionString(currentConnectionString);
    await browser.navigateToCollectionTab(DB_NAME, collectionName, 'Indexes');
  });

  afterEach(async function () {
    // Drop the collection
    {
      try {
        await dbInstance.dropCollection(collectionName);
      } catch (e) {
        console.log(`Failed to drop collection: ${DB_NAME}.${collectionName}`);
      }
    }
    void mongoClient.close();
    await disconnect(browser);
    await afterTest(compass, this.currentTest);
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

      it('renders search indexes tab disabled', async function () {
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
        await browser.createSearchIndex(indexName, INDEX_DEFINITION);
        await browser.waitForAnimations(Selectors.SearchIndexList);

        const rowSelector = Selectors.searchIndexRow(indexName);

        // View it
        await browser.$(rowSelector).waitForDisplayed();
        await browser.waitUntil(async function () {
          const text = await browser.$(rowSelector).getText();
          return text.indexOf('PENDING') > -1;
        });

        // Drop it
        await browser.dropSearchIndex(indexName);
        await browser.waitUntil(async function () {
          const text = await browser.$(rowSelector).getText();
          return text.indexOf('DELETING') > -1;
        });
      });

      it('allows users to update and view search indexes');
      it('runs a search aggregation with index name');
    });
  }
});
