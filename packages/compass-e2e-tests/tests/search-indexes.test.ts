import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  MONGODB_TEST_SERVER_PORT,
  Selectors,
  serverSatisfies,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import type { ConnectFormState } from '../helpers/connect-form-state';
import { disconnect } from '../helpers/commands';
import { expect } from 'chai';

type Connection = {
  name: string;
  formState: ConnectFormState;
  shouldSkip: boolean;
};

function shouldSkipAtlasTest() {
  /**
   * This Atlas user has been created with access to
   * DB_NAME.COLL_NAME namespace and a custom role to drop
   * this database.
   */
  return (
    !process.env.E2E_TESTS_ATLAS_WITHOUT_SEARCH_HOST &&
    !process.env.E2E_TESTS_ATLAS_WITH_SEARCH_HOST &&
    !process.env.E2E_TESTS_ATLAS_SEARCH_USERNAME &&
    !process.env.E2E_TESTS_ATLAS_SEARCH_PASSWORD
  );
}

const connectionsWithNoSearchSupport: Connection[] = [
  {
    name: 'Local Connection',
    formState: {
      connectionString: `mongodb://localhost:${MONGODB_TEST_SERVER_PORT}/test`,
    },
    shouldSkip: false,
  },
  {
    name: 'Atlas Free Cluster',
    formState: {
      scheme: 'MONGODB_SRV',
      authMethod: 'DEFAULT',
      hosts: [process.env.E2E_TESTS_ATLAS_WITHOUT_SEARCH_HOST ?? ''],
      defaultUsername: process.env.E2E_TESTS_ATLAS_SEARCH_USERNAME,
      defaultPassword: process.env.E2E_TESTS_ATLAS_SEARCH_PASSWORD,
    },
    shouldSkip: shouldSkipAtlasTest(),
  },
];
const connectionsWithSearchSupport: Connection[] = [
  {
    name: 'Atlas Dedicated Cluster',
    formState: {
      scheme: 'MONGODB_SRV',
      authMethod: 'DEFAULT',
      hosts: [process.env.E2E_TESTS_ATLAS_WITH_SEARCH_HOST ?? ''],
      defaultUsername: process.env.E2E_TESTS_ATLAS_SEARCH_USERNAME,
      defaultPassword: process.env.E2E_TESTS_ATLAS_SEARCH_PASSWORD,
    },
    shouldSkip: shouldSkipAtlasTest(),
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

  async function beforeTestRun(formState: ConnectFormState) {
    await browser.connectWithConnectionForm(formState);
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

  for (const {
    name,
    formState,
    shouldSkip,
  } of connectionsWithNoSearchSupport) {
    context(`does not support search indexes in ${name}`, function () {
      before(function () {
        if (shouldSkip) {
          return this.skip();
        }
      });
      beforeEach(async function () {
        await beforeTestRun(formState);
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

  for (const { name, formState, shouldSkip } of connectionsWithSearchSupport) {
    context(`supports search indexes in ${name}`, function () {
      before(function () {
        if (shouldSkip) {
          return this.skip();
        }
      });
      beforeEach(async function () {
        await beforeTestRun(formState);
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
