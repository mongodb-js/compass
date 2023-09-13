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

const DB_NAME = 'e2e_indexes_test';
const COLL_NAME = 'e2e_coll_numbers';

async function isNamespaceExisting(browser: CompassBrowser): Promise<boolean> {
  // Wait for sidebar
  await browser.waitForAnimations(Selectors.SidebarDatabaseAndCollectionList);

  // Search for the db
  const dbInput = await browser.$(Selectors.SidebarFilterInput);
  await dbInput.setValue(DB_NAME);

  // Get the db element
  const sidebarDb = await browser.$(Selectors.sidebarDatabase(DB_NAME));

  // Check if db exists
  const dbExists = await sidebarDb.isExisting();
  if (!dbExists) {
    return false;
  }

  // Db exists and select it (to open collections)
  await browser.clickVisible(Selectors.sidebarDatabase(DB_NAME));
  await browser.waitForAnimations(Selectors.sidebarDatabase(DB_NAME));

  const sidebarColl = await browser.$(
    Selectors.sidebarCollection(DB_NAME, COLL_NAME)
  );
  return await sidebarColl.isExisting();
}

async function ensureNamespaceExists(
  browser: CompassBrowser,
  screenshotName: string
) {
  const namespaceExists = await isNamespaceExisting(browser);
  if (namespaceExists) {
    return;
  }
  await browser.clickVisible(Selectors.SidebarCreateDatabaseButton);
  await browser.addDatabase(DB_NAME, COLL_NAME, undefined, screenshotName);
}

async function dropNamespace(browser: CompassBrowser) {
  await browser.hover(Selectors.sidebarDatabase(DB_NAME));
  await browser.clickVisible(Selectors.DropDatabaseButton);
  await browser.dropDatabase(DB_NAME);
}

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

  async function beforeTestRun(
    connectionString: string,
    currentTest?: CurrentTest
  ) {
    await browser.connectWithConnectionString(connectionString);
    await ensureNamespaceExists(browser, `${currentTest?.title}.png`);
    await browser.navigateToCollectionTab(DB_NAME, COLL_NAME, 'Indexes');
  }

  async function afterTestRun(currentTest?: CurrentTest) {
    await dropNamespace(browser);
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
        await beforeTestRun(connectionString!, this.currentTest);
      });
      afterEach(async function () {
        await afterTestRun(this.currentTest);
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
        await afterTestRun(this.currentTest);
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
