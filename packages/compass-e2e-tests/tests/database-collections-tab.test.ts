import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Database collections tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToDatabaseTab('test', 'Collections');
  });

  after(async function () {
    await afterTests(compass);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('contains a list of collections', async function () {
    const collectionsGrid = await browser.$(Selectors.CollectionsGrid);
    await collectionsGrid.waitForDisplayed();

    const collectionSelectors = ['json-array', 'json-file', 'numbers'].map(
      (collectionName) => Selectors.collectionCard('test', collectionName)
    );

    for (const collectionSelector of collectionSelectors) {
      const collectionElement = await browser.$(collectionSelector);
      await collectionElement.waitForExist();
    }
  });

  it.skip('links collection cards to the collection documents tab', async function () {
    await browser.clickVisible(
      Selectors.collectionCardClickable('test', 'numbers')
    );

    // lands on the collection screen with all its tabs
    const tabSelectors = [
      'Documents',
      'Aggregations',
      'Schema',
      'Explain Plan',
      'Indexes',
      'Validation',
    ].map((selector) => Selectors.collectionTab(selector));

    for (const tabSelector of tabSelectors) {
      const tabElement = await browser.$(tabSelector);
      await tabElement.waitForExist();
    }
  });

  // capped and not capped
  it('can create a collection and drop it');
});
