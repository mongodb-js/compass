import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  cleanup,
  init,
  screenshotIfFailed,
  Selectors,
  connectionNameFromString,
} from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';

const DATABASE_NAME = 'collections_db';

/**
 * Check if basic Atlas environment variables are available.
 * Only checks the minimum required variables for this test.
 */
function hasBasicAtlasEnvVars(): boolean {
  const requiredVars = [
    'E2E_TESTS_ATLAS_HOST',
    'E2E_TESTS_ATLAS_USERNAME',
    'E2E_TESTS_ATLAS_PASSWORD',
  ];

  const missingKeys = requiredVars.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    const keysStr = missingKeys.join(', ');
    if (process.env.ci || process.env.CI) {
      throw new Error(`Missing required environmental variable(s): ${keysStr}`);
    }
    return false;
  }

  return true;
}

function buildAtlasConnectionString(): string {
  const username = encodeURIComponent(
    process.env.E2E_TESTS_ATLAS_USERNAME ?? ''
  );
  const password = encodeURIComponent(
    process.env.E2E_TESTS_ATLAS_PASSWORD ?? ''
  );
  const host = process.env.E2E_TESTS_ATLAS_HOST ?? '';

  return `mongodb+srv://${username}:${password}@${host}`;
}

describe('Atlas: List collections and documents', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let connectionString: string;
  let connectionName: string;

  before(function () {
    if (!hasBasicAtlasEnvVars()) {
      this.skip();
    }
    connectionString = buildAtlasConnectionString();
    connectionName = connectionNameFromString(connectionString);
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.connectWithConnectionString(connectionString);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('should list the collections_db database', async function () {
    // Navigate to the Databases tab
    await browser.navigateToConnectionTab(connectionName, 'Databases');

    // Wait for the database row to be displayed
    const databaseRow = browser.$(Selectors.databaseRow(DATABASE_NAME));
    await databaseRow.waitForDisplayed();

    // Verify the database name is visible
    const databaseNameCell = databaseRow.$('td:first-child');
    const databaseNameText = await databaseNameCell.getText();

    expect(databaseNameText).to.include(DATABASE_NAME);
  });

  it('should list collections from compass_e2e database', async function () {
    const testDbName = 'compass_e2e';

    // Navigate to the Databases tab
    await browser.navigateToConnectionTab(connectionName, 'Databases');

    // Click on the database row to open it
    await browser.clickVisible(
      `${Selectors.databaseRow(testDbName)} td:first-child`
    );

    // Wait for the database tab to become active
    const workspaceTab = browser.$(
      Selectors.workspaceTab({
        connectionName,
        namespace: testDbName,
        active: true,
      })
    );
    await workspaceTab.waitForDisplayed();

    // Wait for the collections list to be displayed
    const collectionsGrid = browser.$(Selectors.CollectionsTable);
    await collectionsGrid.waitForDisplayed();

    // Get the first collection row
    const firstCollectionRow = browser.$(
      `${Selectors.CollectionsTable} [data-testid^="collections-list-row-"]`
    );
    await firstCollectionRow.waitForDisplayed();

    // Get the collection name from the first row
    const collectionNameElement = firstCollectionRow.$('td:first-child');
    const collectionNameText = await collectionNameElement.getText();

    // Verify we got a collection name
    expect(collectionNameText).to.be.a('string').and.not.be.empty;
  });

  // NOTE: We intentionally don't test listing collections from collections_db
  // because it has ~5K collections which causes WebDriver timeouts due to
  // browser rendering limitations. The database listing test above verifies
  // it exists, and this test verifies collections listing works with a
  // reasonably-sized database.
});
