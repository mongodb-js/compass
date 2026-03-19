import { expect } from 'chai';
import type { Compass } from '../../helpers/compass';
import {
  cleanup,
  init,
  screenshotIfFailed,
  Selectors,
} from '../../helpers/compass';
import type { CompassBrowser } from '../../helpers/compass-browser';
import {
  getDefaultConnectionNames,
  isTestingAtlasCloud,
} from '../../helpers/test-runner-context';

const DATABASE_NAME = 'collections_db';

describe('Atlas Cloud: List collections and documents', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingAtlasCloud()) {
      this.skip();
    }
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
    await browser.connectToDefaults();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('should list collections from collections_db and display documents from the first collection', async function () {
    // Navigate to the database collections tab
    await browser.navigateToDatabaseCollectionsTab(
      getDefaultConnectionNames(0),
      DATABASE_NAME
    );

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
    const collectionName = await collectionNameElement.getText();

    expect(collectionName).to.be.a('string').and.not.be.empty;

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
