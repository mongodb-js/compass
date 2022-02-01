import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  afterTest,
  Compass,
} from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Instance databases tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToInstanceTab('Databases');
  });

  after(async function () {
    await afterTests(compass);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('contains a list of databases', async function () {
    const dbSelectors = ['admin', 'config', 'local', 'test'].map(
      Selectors.databaseCard
    );

    for (const dbSelector of dbSelectors) {
      const dbElement = await browser.$(dbSelector);
      await dbElement.waitForExist();
      // TODO: Storage Size, Collections, Indexes, Drop button
    }
  });

  it('can create a database from the databases tab', async function () {
    const dbName = 'my-database';
    const collectionName = 'my-collection';

    // open the create database modal from the button at the top
    await browser.clickVisible(Selectors.InstanceCreateDatabaseButton);

    await browser.addDatabase(dbName, collectionName);

    const databaseCard = await browser.$(Selectors.databaseCard(dbName));
    await databaseCard.waitForDisplayed();

    await databaseCard.scrollIntoView(false);

    await browser.waitUntil(async () => {
      // open the drop database modal from the database card
      await browser.hover(Selectors.databaseCard(dbName));
      const el = await browser.$(Selectors.DatabaseCardDrop);
      return await el.isDisplayed();
    });

    await browser.clickVisible(Selectors.DatabaseCardDrop, false);

    await browser.dropDatabase(dbName);

    // wait for it to be gone
    await databaseCard.waitForExist({ reverse: true });
  });
});
