import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  afterTest,
  serverSatisfies,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createDummyCollections,
  createNumbersCollection,
} from '../helpers/insert-data';

describe('Database collections tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  beforeEach(async function () {
    await createDummyCollections();
    await createNumbersCollection();
    await browser.connectWithConnectionString();
    await browser.navigateToDatabaseCollectionsTab('test');
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('contains a list of collections', async function () {
    const collectionsGrid = await browser.$(Selectors.CollectionsGrid);
    await collectionsGrid.waitForDisplayed();

    for (const collectionName of [
      'json-array',
      'zzzz',
      'json-file',
      'numbers',
    ]) {
      const collectionSelector = Selectors.collectionCard(
        'test',
        collectionName
      );
      const found = await browser.scrollToVirtualItem(
        Selectors.CollectionsGrid,
        collectionSelector,
        'grid'
      );
      expect(found, collectionSelector).to.be.true;
    }
  });

  it('links collection cards to the collection documents tab', async function () {
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      Selectors.collectionCard('test', 'json-array'),
      'grid'
    );

    await browser.clickVisible(
      Selectors.collectionCardClickable('test', 'json-array'),
      { scroll: true }
    );

    // lands on the collection screen with all its tabs
    const tabSelectors = [
      'Documents',
      'Aggregations',
      'Schema',
      'Indexes',
      'Validation',
    ].map((selector) => Selectors.collectionSubTab(selector));

    for (const tabSelector of tabSelectors) {
      const tabElement = await browser.$(tabSelector);
      await tabElement.waitForExist();
    }
  });

  it('can create a collection from the collections tab and drop it', async function () {
    const collectionName = 'my-database-collection';

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);

    await browser.addCollection(
      collectionName,
      undefined,
      'add-collection-modal-basic.png'
    );

    await browser.navigateToDatabaseCollectionsTab('test');

    const selector = Selectors.collectionCard('test', collectionName);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      selector,
      'grid'
    );

    const collectionCard = await browser.$(selector);
    await collectionCard.waitForDisplayed();

    await collectionCard.scrollIntoView(false);

    await browser.waitUntil(async () => {
      // open the drop collection modal from the collection card
      await browser.hover(`${selector} [title="${collectionName}"]`);
      const el = await browser.$(Selectors.CollectionCardDrop);
      if (await el.isDisplayed()) {
        return true;
      }

      // go hover somewhere else to give the next attempt a fighting chance
      await browser.hover(Selectors.SidebarTitle);
      return false;
    });

    await browser.clickVisible(Selectors.CollectionCardDrop);

    await browser.dropNamespace(collectionName);

    // wait for it to be gone
    await collectionCard.waitForExist({ reverse: true });

    // the app should still be on the database Collections tab because there are
    // other collections in this database
    await browser.waitUntilActiveDatabaseTab('test');
  });

  it('can create a capped collection', async function () {
    const collectionName = 'my-capped-collection';

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);

    await browser.addCollection(
      collectionName,
      {
        capped: {
          size: 1000,
        },
      },
      'add-collection-modal-capped.png'
    );

    await browser.navigateToDatabaseCollectionsTab('test');

    const selector = Selectors.collectionCard('test', collectionName);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      selector,
      'grid'
    );
    const collectionCard = await browser.$(selector);
    await collectionCard.waitForDisplayed();

    // TODO: how do we make sure this is really a capped collection?
  });

  it('can create a collection with custom collation', async function () {
    const collectionName = 'my-custom-collation-collection';

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);

    await browser.addCollection(
      collectionName,
      {
        customCollation: {
          locale: 'af - Afrikaans',
          strength: 3,
          caseLevel: false,
          caseFirst: 'lower',
          numericOrdering: false,
          alternate: 'non-ignorable',
          maxVariable: 'punct',
          backwards: false,
          normalization: false,
        },
      },
      'add-collection-modal-custom-collation.png'
    );

    await browser.navigateToDatabaseCollectionsTab('test');

    const selector = Selectors.collectionCard('test', collectionName);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      selector,
      'grid'
    );
    const collectionCard = await browser.$(selector);
    await collectionCard.waitForDisplayed();

    await collectionCard
      .$('[data-testid="collection-badge-collation"]')
      .waitForDisplayed();
  });

  it('can create a time series collection', async function () {
    if (serverSatisfies('< 5.0.0')) {
      return this.skip();
    }

    const collectionName = 'my-timeseries-collection';

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);

    await browser.addCollection(
      collectionName,
      {
        timeseries: {
          timeField: 'time',
          metaField: 'meta',
          granularity: 'minutes',
          expireAfterSeconds: 60,
        },
      },
      'add-collection-modal-timeseries.png'
    );

    await browser.navigateToDatabaseCollectionsTab('test');

    const selector = Selectors.collectionCard('test', collectionName);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      selector,
      'grid'
    );
    const collectionCard = await browser.$(selector);
    await collectionCard.waitForDisplayed();

    await collectionCard
      .$('[data-testid="collection-badge-timeseries"]')
      .waitForDisplayed();
  });

  it('can create a time series collection with flexible bucket configuration', async function () {
    if (serverSatisfies('< 6.3.0-alpha0')) {
      return this.skip();
    }

    const collectionName = 'my-timeseries-collection';

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);

    await browser.addCollection(
      collectionName,
      {
        timeseries: {
          timeField: 'time',
          metaField: 'meta',
          bucketMaxSpanSeconds: 60,
          bucketRoundingSeconds: 60,
          expireAfterSeconds: 60,
        },
      },
      'add-collection-modal-timeseries.png'
    );

    await browser.navigateToDatabaseCollectionsTab('test');

    const selector = Selectors.collectionCard('test', collectionName);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      selector,
      'grid'
    );
    const collectionCard = await browser.$(selector);
    await collectionCard.waitForDisplayed();

    await collectionCard
      .$('[data-testid="collection-badge-timeseries"]')
      .waitForDisplayed();
  });

  it('can create a clustered collection', async function () {
    if (serverSatisfies('< 5.3.0')) {
      return this.skip();
    }

    const collectionName = 'my-clustered-collection';
    const indexName = 'my-clustered-index';

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);

    await browser.addCollection(
      collectionName,
      {
        clustered: {
          name: indexName,
          expireAfterSeconds: 60,
        },
      },
      'add-collection-modal-clustered.png'
    );

    await browser.navigateToDatabaseCollectionsTab('test');

    const selector = Selectors.collectionCard('test', collectionName);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      selector,
      'grid'
    );
    const collectionCard = await browser.$(selector);
    await collectionCard.waitForDisplayed();

    await collectionCard
      .$('[data-testid="collection-badge-clustered"]')
      .waitForDisplayed();

    await browser.navigateToCollectionTab('test', collectionName, 'Indexes');

    const typeElementSelector = `${Selectors.indexComponent(indexName)} ${
      Selectors.IndexFieldType
    }`;
    const typeElement = await browser.$(typeElementSelector);
    await typeElement.waitForDisplayed();
    expect(await typeElement.getText()).to.equal('CLUSTERED');
  });

  it('can refresh the list of collections using refresh controls', async function () {
    const db = `test`;
    const coll = `zcoll-${Date.now()}`;
    // Create the collection and refresh
    await browser.shellEval(`use ${db};`);
    await browser.shellEval(`db.createCollection('${coll}');`);
    await browser.navigateToDatabaseCollectionsTab(db);
    await browser.clickVisible(Selectors.DatabaseRefreshCollectionButton);

    const collSelector = Selectors.collectionCard(db, coll);
    await browser.scrollToVirtualItem(
      Selectors.CollectionsGrid,
      collSelector,
      'grid'
    );
    const coll2Card = await browser.$(collSelector);
    await coll2Card.waitForDisplayed();
  });
});
