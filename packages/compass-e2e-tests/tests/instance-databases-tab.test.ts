import { expect } from 'chai';
import path from 'path';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { LOG_PATH } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Instance databases tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  beforeEach(async function () {
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
        Selectors.DatabaseCard,
        dbSelector
      );
      expect(found, dbSelector).to.be.true;
    }
  });

  it('links database cards to the database collections tab', async function () {
    await browser.scrollToVirtualItem(
      Selectors.DatabaseCard,
      Selectors.databaseCard('test')
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
        Selectors.CollectionCard,
        collectionSelector
      );
      expect(found, collectionSelector).to.be.true;
    }
  });

  it('can create a database from the databases tab and drop it', async function () {
    const dbName = 'my-instance-database';
    const collectionName = 'my-collection';

    // open the create database modal from the button at the top
    await browser.clickVisible(Selectors.InstanceCreateDatabaseButton);

    await browser.addDatabase(dbName, collectionName);

    const selector = Selectors.databaseCard(dbName);
    await browser.scrollToVirtualItem(Selectors.DatabaseCard, selector);
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

    await browser.dropDatabase(dbName);

    // wait for it to be gone
    await databaseCard.waitForExist({ reverse: true });
  });
});
