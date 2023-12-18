import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const { expect } = chai;

describe('Instance sidebar', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('has a connection info modal with connection info', async function () {
    await browser.clickVisible(Selectors.SidebarShowActions);
    await browser.clickVisible(Selectors.SidebarActionClusterInfo);

    const modal = await browser.$(Selectors.ConnectionInfoModal);
    await modal.waitForDisplayed();

    await browser.screenshot('connection-info-modal.png');

    await browser.clickVisible(Selectors.ConnectionInfoModalCloseButton);
    await modal.waitForDisplayed({ reverse: true });
  });

  it('contains a dbs/collections tree view', async function () {
    const dbName = 'test';
    const collectionName = 'numbers';
    const dbElement = await browser.$(Selectors.sidebarDatabase(dbName));
    await dbElement.waitForDisplayed();

    await browser.clickVisible(Selectors.sidebarDatabaseToggle(dbName));

    const collectionSelector = Selectors.sidebarCollection(
      dbName,
      collectionName
    );
    await browser.scrollToVirtualItem(
      Selectors.SidebarDatabaseAndCollectionList,
      collectionSelector,
      'tree'
    );
    const collectionElement = await browser.$(collectionSelector);
    await collectionElement.waitForDisplayed();
  });

  it('can search for a collection', async function () {
    // wait for something to appear so we can be sure that things went away vs just not appearing yet
    await browser.waitUntil(async () => {
      const treeItems = await browser.$$(Selectors.SidebarTreeItems);
      return treeItems.length > 0;
    });

    // search for something that cannot be found to get the results to a known empty state
    await browser.clickVisible(Selectors.SidebarFilterInput);
    const sidebarFilterInputElement = await browser.$(
      Selectors.SidebarFilterInput
    );
    await sidebarFilterInputElement.setValue('this does not exist');

    // make sure there's nothing visible
    await browser.waitUntil(async () => {
      const treeItems = await browser.$$(Selectors.SidebarTreeItems);
      return treeItems.length === 0;
    });

    // now search for something specific
    await sidebarFilterInputElement.setValue('numbers');

    // wait for exactly two items: The database and the collection.
    await browser.waitUntil(async () => {
      const treeItems = await browser.$$(Selectors.SidebarTreeItems);
      return treeItems.length === 2;
    });

    const dbElement = await browser.$(Selectors.sidebarDatabase('test'));
    expect(await dbElement.isDisplayed()).to.be.true;

    const collectionSelector = Selectors.sidebarCollection('test', 'numbers');
    await browser.scrollToVirtualItem(
      Selectors.SidebarDatabaseAndCollectionList,
      collectionSelector,
      'tree'
    );

    const collectionElement = await browser.$(collectionSelector);
    expect(await collectionElement.isDisplayed()).to.be.true;

    await sidebarFilterInputElement.setValue('*'); // clearValue() is unreliable here

    // wait for something that didn't match the previous search to show up to make sure that it reset
    // (otherwise future tests will fail because the new dbs/collections won't match the filter)
    const adminElement = await browser.$(Selectors.sidebarDatabase('admin'));
    await adminElement.waitForDisplayed();
  });

  it('can create a database and drop it', async function () {
    // TODO(COMPASS-7086): flaky test
    this.retries(5);

    const dbName = `my-sidebar-database-${Date.now()}`;
    const collectionName = 'my-collection';

    // open the create database modal from the sidebar
    await browser.clickVisible(Selectors.SidebarCreateDatabaseButton, {
      screenshot: 'before-can-create-a-database-and-drop-it-click.png',
    });

    await browser.addDatabase(dbName, collectionName);

    // the app should land on the collection's documents tab
    const headerSelector = Selectors.collectionHeaderTitle(
      dbName,
      collectionName
    );
    await browser.$(headerSelector).waitForDisplayed();
    await browser
      .$(Selectors.collectionSubTab('Documents', true))
      .waitForDisplayed();

    await browser.clickVisible(Selectors.sidebarDatabase(dbName));

    // wait for it to appear
    const collectionElement = await browser.$(
      Selectors.sidebarCollection(dbName, collectionName)
    );
    await collectionElement.waitForDisplayed();

    await browser.dropDatabaseFromSidebar(dbName);
  });

  it('can create a collection and drop it', async function () {
    const dbName = 'test'; // existing db
    const collectionName = 'my-sidebar-collection';

    await browser.clickVisible(Selectors.SidebarFilterInput);
    const sidebarFilterInputElement = await browser.$(
      Selectors.SidebarFilterInput
    );
    await sidebarFilterInputElement.setValue(dbName);

    const dbElement = await browser.$(Selectors.sidebarDatabase(dbName));
    await dbElement.waitForDisplayed();

    await browser.hover(Selectors.sidebarDatabase(dbName));

    await browser.clickVisible(Selectors.CreateCollectionButton);

    await browser.addCollection(collectionName);

    // the app should land on the collection's documents tab
    const headerSelector = Selectors.collectionHeaderTitle(
      dbName,
      collectionName
    );
    await browser.$(headerSelector).waitForDisplayed();
    const tabSelectedSelector = Selectors.collectionSubTab('Documents', true);
    await browser.$(tabSelectedSelector).waitForDisplayed();

    await browser.dropCollectionFromSidebar(dbName, collectionName);
  });

  it('can refresh the databases', async function () {
    const db = 'test';
    const coll = `coll_${Date.now()}`;
    await browser.shellEval(`use ${db};`);
    await browser.shellEval(`db.createCollection('${coll}');`);
    await browser.clickVisible(Selectors.SidebarRefreshDatabasesButton);
    await browser.clickVisible(Selectors.sidebarDatabase(db));
    const collectionElement = await browser.$(
      Selectors.sidebarCollection(db, coll)
    );
    await collectionElement.waitForDisplayed();
  });
});
