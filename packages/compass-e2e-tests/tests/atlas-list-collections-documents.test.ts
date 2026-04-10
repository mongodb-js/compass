import type { Compass } from '../helpers/compass.ts';
import {
  cleanup,
  init,
  screenshotIfFailed,
  Selectors,
  connectionNameFromString,
} from '../helpers/compass.ts';
import type { CompassBrowser } from '../helpers/compass-browser.ts';

const DATABASE_NAME = 'collections_db';
const TEST_COLLECTION_NAME = 'test_collection_1';

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

describe('Atlas: Database with large number of collections', function () {
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

  it('can navigate to a collection and run a find query', async function () {
    // Navigate directly to a collection in the database with many collections
    await browser.navigateToCollectionTab(
      connectionName,
      DATABASE_NAME,
      TEST_COLLECTION_NAME,
      'Documents'
    );

    // Run a simple find operation
    await browser.runFindOperation('Documents', '{}');

    // Verify the documents tab is active and showing results
    const documentList = browser.$(Selectors.DocumentList);
    await documentList.waitForDisplayed();
  });

  it('can insert a document into a collection', async function () {
    // Navigate to a collection
    await browser.navigateToCollectionTab(
      connectionName,
      DATABASE_NAME,
      TEST_COLLECTION_NAME,
      'Documents'
    );

    // Generate a unique value for this test run
    const uniqueValue = `test_${Date.now()}`;

    // Open the insert document modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.InsertDocumentOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // Wait for the modal to appear
    await browser.waitForOpenModal(Selectors.InsertDialog);

    // Set the document content
    await browser.setCodemirrorEditorValue(
      Selectors.InsertJSONEditor,
      `{ "testField": "${uniqueValue}" }`
    );

    // Confirm the insert
    const insertConfirm = browser.$(Selectors.InsertConfirm);
    await insertConfirm.waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);
    await browser.waitForOpenModal(Selectors.InsertDialog, { reverse: true });

    // Find the inserted document
    await browser.runFindOperation(
      'Documents',
      `{ "testField": "${uniqueValue}" }`
    );

    // Verify the document was inserted
    const documentEntry = browser.$(Selectors.DocumentListEntry);
    await documentEntry.waitForDisplayed();
  });
});
