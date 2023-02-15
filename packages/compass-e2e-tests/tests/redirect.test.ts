import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createNumbersCollection,
  createMultipleCollections,
} from '../helpers/insert-data';

const { expect } = chai;

describe('redirects', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createMultipleCollections();
    await browser.connectWithConnectionString();
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  // on a collection tab
  it('redirects to Collections if on the collection being removed and there are other collections in that database', async function () {
    await browser.navigateToCollectionTab(
      'multiple-collections',
      'one',
      'Documents'
    );
    await browser.dropCollectionFromSidebar('multiple-collections', 'one');

    const tabSelectedSelector = Selectors.databaseTab('Collections', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  });

  it('redirects to Databases if on the collection being removed and it was the only collection in that database', async function () {
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
    await browser.dropCollectionFromSidebar('test', 'numbers');

    const tabSelectedSelector = Selectors.instanceTab('Databases', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  });

  it('does nothing if on a different collection to the one being removed', async function () {
    await browser.navigateToCollectionTab(
      'multiple-collections',
      'one',
      'Documents'
    );
    await browser.dropCollectionFromSidebar('multiple-collections', 'two');

    // still on a Collection's Documents tab, so presumably didn't get redirected
    const tabSelectedSelector = Selectors.collectionTab('Documents', true);
    const tabSelectedElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectedElement.isDisplayed()).to.be.true;
  });

  it('redirects to Databases if on a collection for the database being removed', async function () {
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
    await browser.dropDatabaseFromSidebar('test');

    const tabSelectedSelector = Selectors.instanceTab('Databases', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  });

  it('does nothing if on a collection for a different database being removed', async function () {
    await browser.navigateToCollectionTab(
      'multiple-collections',
      'one',
      'Documents'
    );
    await browser.dropDatabaseFromSidebar('test');

    // still on a Collection's Documents tab, so presumably didn't get redirected
    const tabSelectedSelector = Selectors.collectionTab('Documents', true);
    const tabSelectedElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectedElement.isDisplayed()).to.be.true;
  });

  // on the Collections list
  it('does nothing if on Collections list containing the collection being removed and there are other collections in that database', async function () {
    await browser.navigateToDatabaseTab('multiple-collections', 'Collections');
    await browser.dropCollectionFromSidebar('multiple-collections', 'two');

    // still on a Database's Collections tab, so presumably didn't get redirected
    const tabSelectedSelector = Selectors.databaseTab('Collections', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  it('redirects to Databases if on Collections list containing the collection being removed and it was the only collection in the database', async function () {
    await browser.navigateToDatabaseTab('test', 'Collections');
    await browser.dropCollectionFromSidebar('test', 'numbers');

    const tabSelectedSelector = Selectors.instanceTab('Databases', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  });

  it('redirects to Databases if on Collections list for the database being removed.', async function () {
    await browser.navigateToDatabaseTab('test', 'Collections');
    await browser.dropDatabaseFromSidebar('test');

    const tabSelectedSelector = Selectors.instanceTab('Databases', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  });

  it('does nothing if on Collections list for a different database to the one being removed', async function () {
    await browser.navigateToDatabaseTab('multiple-collections', 'Collections');
    await browser.dropDatabaseFromSidebar('test');

    // still on a Database's Collections tab, so presumably didn't get redirected
    const tabSelectedSelector = Selectors.databaseTab('Collections', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  // on any other part of the app
  it('does nothing if on Databases and a collection gets removed', async function () {
    await browser.navigateToInstanceTab('Databases');
    await browser.dropCollectionFromSidebar('test', 'numbers');

    const tabSelectedSelector = Selectors.instanceTab('Databases', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  it('does nothing if on Databases and a database gets removed', async function () {
    await browser.navigateToInstanceTab('Databases');
    await browser.dropDatabaseFromSidebar('test');

    const tabSelectedSelector = Selectors.instanceTab('Databases', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  it('does nothing if on My Queries and a collection gets removed', async function () {
    await browser.navigateToInstanceTab('My Queries');
    await browser.dropCollectionFromSidebar('test', 'numbers');

    const tabSelectedSelector = Selectors.instanceTab('My Queries', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  it('does nothing if on My Queries and a database gets removed', async function () {
    await browser.navigateToInstanceTab('My Queries');
    await browser.dropDatabaseFromSidebar('test');

    const tabSelectedSelector = Selectors.instanceTab('My Queries', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  it('does nothing if on Performance and a database gets removed', async function () {
    await browser.navigateToInstanceTab('Performance');
    await browser.dropCollectionFromSidebar('test', 'numbers');

    const tabSelectedSelector = Selectors.instanceTab('Performance', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });

  it('does nothing if on Performance and a collection gets removed', async function () {
    await browser.navigateToInstanceTab('Performance');
    await browser.dropDatabaseFromSidebar('test');

    const tabSelectedSelector = Selectors.instanceTab('Performance', true);
    const tabSelectorElement = await browser.$(tabSelectedSelector);
    expect(await tabSelectorElement.isDisplayed()).to.be.true;
  });
});
