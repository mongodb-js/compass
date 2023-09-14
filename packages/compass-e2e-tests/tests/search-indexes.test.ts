import type { CompassBrowser } from '../helpers/compass-browser';
import { setTimeout as wait } from 'timers/promises';
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
import type { Test as CurrentTest } from 'mocha';

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

describe('Search Indexes', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let mongoClient: MongoClient;
  let dbInstance: Db;

  const DB_NAME = 'e2e_indexes_test';
  const COLL_NAME = `e2e_coll_numbers_${Math.floor(Math.random() * 2 ** 20)}`;

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

  async function beforeEachTestRun(connectionString: string) {
    // Ensure namespace exists
    {
      mongoClient = new MongoClient(connectionString);
      await mongoClient.connect();
      dbInstance = mongoClient.db(DB_NAME);

      // Try to delete a namespace if it exists
      try {
        await dbInstance.dropCollection(COLL_NAME);
      } catch (e) {
        // noop
      }

      // Create a namespace
      await dbInstance.createCollection(COLL_NAME);
    }

    await browser.connectWithConnectionString(connectionString);
    await browser.navigateToCollectionTab(DB_NAME, COLL_NAME, 'Indexes');
  }

  async function afterEachTestRun(currentTest?: CurrentTest) {
    // Drop the collection
    {
      try {
        await dbInstance.dropCollection(COLL_NAME);
      } catch (e) {
        console.log(`Failed to drop collection: ${DB_NAME}.${COLL_NAME}`);
      }
    }
    void mongoClient.close();
    await disconnect(browser);
    await afterTest(compass, currentTest);
  }

  for (const { name, connectionString } of connectionsWithNoSearchSupport) {
    context(`does not support search indexes in ${name}`, function () {
      before(function () {
        if (!connectionString) {
          return this.skip();
        }
      });
      beforeEach(async function () {
        await beforeEachTestRun(connectionString!);
      });
      afterEach(async function () {
        await afterEachTestRun(this.currentTest);
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
      const INDEX_NAME = 'e2e_search_index';
      const INDEX_DEFINITION = JSON.stringify({
        mappings: {
          dynamic: true,
        },
      });

      before(function () {
        if (!connectionString) {
          return this.skip();
        }
      });
      beforeEach(async function () {
        await beforeEachTestRun(connectionString!);

        // Try to drop the existing search indexes. As we started afresh,
        // the collection should not have any search index. However this
        // is to just avoid any race condition.
        {
          const searchIndexes = await dbInstance
            .collection(COLL_NAME)
            .listSearchIndexes()
            .toArray();

          if (searchIndexes.length > 0) {
            await Promise.all(
              searchIndexes.map(({ name }) =>
                dbInstance.collection(COLL_NAME).dropSearchIndex(name)
              )
            );
            // Wait for a minute to ensure the indexes have been deleted.
            await wait(60000);
          }
        }
      });
      afterEach(async function () {
        await afterEachTestRun(this.currentTest);
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
        await browser.clickVisible(
          Selectors.indexesSegmentedTab('search-indexes')
        );
        await browser.createSearchIndex(INDEX_NAME, INDEX_DEFINITION);
        await browser.waitForAnimations(Selectors.SearchIndexList);

        // View it
        await browser
          .$(Selectors.searchIndexRow(INDEX_NAME))
          .waitForDisplayed();

        // Drop it
        await browser.dropSearchIndex(INDEX_NAME);
      });

      it('allows users to update and view search indexes');
      it('runs a search aggregation with index name');
    });
  }
});
