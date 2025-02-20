import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_STRING_1,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createDummyCollections,
  createNumbersCollection,
} from '../helpers/insert-data';

const INITIAL_DATABASE_NAMES = ['admin', 'config', 'local', 'test'];

describe('Instance databases tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createDummyCollections();
    await createNumbersCollection();
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('contains a list of databases', async function () {
    const dbTable = browser.$(Selectors.DatabasesTable);
    await dbTable.waitForDisplayed();

    const dbSelectors = INITIAL_DATABASE_NAMES.map(Selectors.databaseCard);

    for (const dbSelector of dbSelectors) {
      const found = await browser.scrollToVirtualItem(
        Selectors.DatabasesTable,
        dbSelector,
        'grid'
      );
      expect(found, dbSelector).to.be.true;
    }
  });

  it('links database cards to the database collections tab', async function () {
    await browser.scrollToVirtualItem(
      Selectors.DatabasesTable,
      Selectors.databaseCard('test'),
      'grid'
    );
    // Click on the db name text inside the card specifically to try and have
    // tighter control over where it clicks, because clicking in the center of
    // the last card if all cards don't fit on screen can silently do nothing
    // even after scrolling it into view.
    await browser.clickVisible(Selectors.databaseCardClickable('test'), {
      scroll: true,
      screenshot: 'database-card.png',
    });

    const collectionSelectors = ['json-array', 'json-file', 'numbers'].map(
      (collectionName) => Selectors.collectionCard('test', collectionName)
    );

    for (const collectionSelector of collectionSelectors) {
      const found = await browser.scrollToVirtualItem(
        Selectors.CollectionsGrid,
        collectionSelector,
        'grid'
      );
      expect(found, collectionSelector).to.be.true;
    }
  });

  it('can create a database from the databases tab and drop it', async function () {
    const dbName = 'my-instance-database';
    const collectionName = 'my-collection';

    // open the create database modal from the button at the top
    await browser.clickVisible(Selectors.InstanceCreateDatabaseButton);

    await browser.addDatabase(
      dbName,
      collectionName,
      undefined,
      'add-database-modal-basic.png'
    );

    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );

    const selector = Selectors.databaseCard(dbName);
    await browser.scrollToVirtualItem(
      Selectors.DatabasesTable,
      selector,
      'grid'
    );
    const databaseCard = browser.$(selector);
    await databaseCard.waitForDisplayed();

    await databaseCard.scrollIntoView(false);

    await browser.waitUntil(async () => {
      // open the drop database modal from the database card
      await browser.hover(`${selector} [title="${dbName}"]`);
      const el = browser.$(Selectors.DatabaseCardDrop);
      if (await el.isDisplayed()) {
        return true;
      }

      // go hover somewhere else to give the next attempt a fighting chance
      await browser.hover(Selectors.Sidebar);
      return false;
    });

    await browser.clickVisible(Selectors.DatabaseCardDrop);

    await browser.dropNamespace(dbName);

    // wait for it to be gone (which it will be anyway because the app should
    // redirect back to the databases tab)
    await databaseCard.waitForExist({ reverse: true });

    // the app should stay on the instance Databases tab.
    await browser.waitUntilActiveConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );
  });

  it('can refresh the list of databases using refresh controls', async function () {
    const db = 'test'; // added by beforeEach
    const dbSelector = Selectors.databaseCard(db);

    // Browse to the databases tab
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );

    // Make sure the db card we're going to drop is in there.
    await browser.scrollToVirtualItem(
      Selectors.DatabasesTable,
      dbSelector,
      'grid'
    );
    await browser.$(dbSelector).waitForDisplayed();

    // Wait for the page to finish loading as best as we can
    await browser.waitUntil(async () => {
      const numPlaceholders = await browser.$$(Selectors.DatabaseStatLoader)
        .length;
      return numPlaceholders === 0;
    });

    // Drop the database using the driver
    const mongoClient = new MongoClient(DEFAULT_CONNECTION_STRING_1);
    await mongoClient.connect();
    try {
      const database = mongoClient.db(db);

      // Drop the database
      console.log({
        'database.dropDatabase()': await database.dropDatabase(),
      });
      // Prove that it is really gone
      console.log({
        'database.admin().listDatabases()': (
          await database.admin().listDatabases()
        ).databases,
      });
    } finally {
      await mongoClient.close();
    }

    // Refresh again and the database card should disappear.
    await browser.clickVisible(Selectors.InstanceRefreshDatabaseButton, {
      scroll: true,
      screenshot: 'instance-refresh-database-button.png',
    });
    await browser.$(dbSelector).waitForExist({ reverse: true });
  });
});
