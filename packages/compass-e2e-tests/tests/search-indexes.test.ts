import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  MONGODB_TEST_SERVER_PORT,
  Selectors,
  serverSatisfies,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { disconnect } from '../helpers/commands';
import { expect } from 'chai';

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

const DB_NAME = 'e2e_indexes_test';
const COLL_NAME = 'numbers';

describe.only('Search Indexes', function () {
  let compass: Compass;
  let browser: CompassBrowser;

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

  async function beforeTestRun(connectionString: string) {
    await browser.connectWithConnectionString(connectionString);
    {
      await browser.clickVisible(Selectors.SidebarCreateDatabaseButton);
      await browser.addDatabase(DB_NAME, COLL_NAME);
    }
    await browser.navigateToCollectionTab(DB_NAME, COLL_NAME, 'Indexes');
  }

  async function afterTestRun() {
    {
      await browser.hover(Selectors.sidebarDatabase(DB_NAME));
      await browser.clickVisible(Selectors.DropDatabaseButton);
      await browser.dropDatabase(DB_NAME);
    }
    await disconnect(browser);
  }

  for (const { name, connectionString } of connectionsWithNoSearchSupport) {
    context(`does not support search indexes in ${name}`, function () {
      before(function () {
        if (!connectionString) {
          return this.skip();
        }
      });
      beforeEach(async function () {
        await beforeTestRun(connectionString!);
      });
      afterEach(async function () {
        await afterTestRun();
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
      });
      beforeEach(async function () {
        await beforeTestRun(connectionString!);
      });
      afterEach(async function () {
        await afterTestRun();
      });
      it('allows users to create a regular indexes', async function () {
        const indexName = await browser.createIndex({
          fieldName: 'e2e_tests_index',
          indexType: 'text',
        });
        await browser.dropIndex(indexName);
      });
      it('allows users to create a search indexes');
      it('renders search indexes list');
      it('edits a search index');
      it('drops a search index');
      it('runs a search aggregation with index name');
    });
  }
});
