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

// The collections_db database has ~5K collections, so we need longer timeouts
const LONG_TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes for WebDriver operations
const MOCHA_TIMEOUT_MS = LONG_TIMEOUT_MS * 1.2; // 6 minutes for Mocha

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
  // The collections_db database has ~5K collections, so we need a longer timeout
  this.timeout(MOCHA_TIMEOUT_MS);

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

  it('should list collections from collections_db and display documents from the first collection', async function () {
    // Navigate to the Databases tab first
    await browser.navigateToConnectionTab(connectionName, 'Databases');

    // Click on the database row to open it (with extended timeout for large list)
    await browser.clickVisible(
      `${Selectors.databaseRow(DATABASE_NAME)} td:first-child`,
      { timeout: LONG_TIMEOUT_MS }
    );

    // Wait for the database tab to become active (with extended timeout)
    const workspaceTab = browser.$(
      Selectors.workspaceTab({
        connectionName,
        namespace: DATABASE_NAME,
        active: true,
      })
    );
    await workspaceTab.waitForDisplayed({ timeout: LONG_TIMEOUT_MS });

    // Wait for the collections list to be displayed (with extended timeout for 5K collections)
    const collectionsGrid = browser.$(Selectors.CollectionsTable);
    await collectionsGrid.waitForDisplayed({ timeout: LONG_TIMEOUT_MS });

    // Get the first collection row
    const firstCollectionRow = browser.$(
      `${Selectors.CollectionsTable} [data-testid^="collections-list-row-"]`
    );
    await firstCollectionRow.waitForDisplayed({ timeout: LONG_TIMEOUT_MS });

    // Get the collection name from the first row
    const collectionNameElement = firstCollectionRow.$('td:first-child');
    const collectionNameText = await collectionNameElement.getText();

    expect(collectionNameText).to.be.a('string').and.not.be.empty;

    // Click on the first collection to navigate to documents
    await collectionNameElement.click();

    // Wait for the Documents tab to be active
    await browser
      .$(Selectors.collectionSubTab('Documents', true))
      .waitForDisplayed();

    // Wait for documents to load (either documents are displayed or the list shows a count)
    const documentListMessage = browser.$(
      Selectors.DocumentListActionBarMessage
    );
    await documentListMessage.waitForDisplayed();

    const messageText = await documentListMessage.getText();
    // The message should show something like "1 – 20 of X" or "No documents"
    expect(messageText).to.be.a('string');

    // If there are documents, verify the first document is displayed
    const documentListEntry = browser.$(Selectors.DocumentListEntry);
    const hasDocuments = await documentListEntry.isExisting();

    if (hasDocuments) {
      await documentListEntry.waitForDisplayed();

      // Get the first document content
      const firstDocument = await browser.getFirstListDocument();

      // Verify we got some document data (should have at least _id)
      expect(firstDocument).to.be.an('object');
      expect(Object.keys(firstDocument).length).to.be.greaterThan(0);
    }
  });
});
