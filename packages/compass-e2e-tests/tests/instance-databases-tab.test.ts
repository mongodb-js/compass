import { expect } from 'chai';
import path from 'path';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { LOG_PATH } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createDummyCollections,
  createNumbersCollection,
} from '../helpers/insert-data';

describe('Instance databases tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createDummyCollections();
    await createNumbersCollection();
    await browser.connectWithConnectionString();
    await browser.navigateToInstanceTab('Databases');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('contains a list of databases', async function () {
    const dbTable = await browser.$(Selectors.DatabasesTable);
    await dbTable.waitForDisplayed();

    const dbSelectors = ['admin', 'config', 'local', 'test'].map(
      Selectors.databaseCard
    );

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
      screenshot: path.join(LOG_PATH, 'database-card.png'),
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

    await browser.navigateToInstanceTab('Databases');

    const selector = Selectors.databaseCard(dbName);
    await browser.scrollToVirtualItem(
      Selectors.DatabasesTable,
      selector,
      'grid'
    );
    const databaseCard = await browser.$(selector);
    await databaseCard.waitForDisplayed();

    await databaseCard.scrollIntoView(false);

    await browser.waitUntil(async () => {
      // open the drop database modal from the database card
      await browser.hover(`${selector} [title="${dbName}"]`);
      const el = await browser.$(Selectors.DatabaseCardDrop);
      if (await el.isDisplayed()) {
        return true;
      }

      // go hover somewhere else to give the next attempt a fighting chance
      await browser.hover(Selectors.SidebarTitle);
      return false;
    });

    await browser.clickVisible(Selectors.DatabaseCardDrop);

    await browser.dropNamespace(dbName);

    // wait for it to be gone (which it will be anyway because the app should
    // redirect back to the databases tab)
    await databaseCard.waitForExist({ reverse: true });

    // the app should stay on the instance Databases tab.
    await browser.waitUntilActiveInstanceTab('Databases');
  });

  it('can refresh the list of databases using refresh controls', async function () {
    const db = 'my-instance-database';
    const coll = 'my-collection';
    // Create the database and refresh
    await browser.shellEval(`use ${db};`);
    await browser.shellEval(`db.createCollection('${coll}');`);
    await browser.navigateToInstanceTab('Databases');
    await browser.clickVisible(Selectors.InstanceRefreshDatabaseButton);

    const dbSelector = Selectors.databaseCard(db);
    await browser.scrollToVirtualItem(
      Selectors.DatabasesTable,
      dbSelector,
      'grid'
    );
    const dbCard = await browser.$(dbSelector);
    await dbCard.waitForDisplayed();

    // Drop it and refresh again
    await browser.shellEval(`db.dropDatabase();`);
    await browser.clickVisible(Selectors.InstanceRefreshDatabaseButton);
    await dbCard.waitForExist({ reverse: true });
  });
});
