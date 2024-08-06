import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME,
  TEST_MULTIPLE_CONNECTIONS,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { expect } from 'chai';

describe('Global Tabs', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  const collections = ['a', 'b', 'c'];

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  beforeEach(async function () {
    for (const collName of collections) {
      await createNumbersCollection(collName, 1);
      await createNumbersCollection(collName, 1);
      await createNumbersCollection(collName, 1);
    }
    await browser.disconnectAll();
    await browser.connectWithConnectionString();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  after(async function () {
    await cleanup(compass);
  });

  it('should open tabs over each other when not modified', async function () {
    for (const collName of collections) {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME,
        'test',
        collName,
        'Documents',
        false
      );
    }
    expect(await browser.$$(Selectors.workspaceTab())).to.have.lengthOf(1);
  });

  it('should open new tabs when modified', async function () {
    for (const collName of collections) {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME,
        'test',
        collName,
        'Documents',
        false
      );
      // Click something to make sure we "modified" the tab
      await browser.clickVisible(
        Selectors.queryBarApplyFilterButton('Documents')
      );
    }
    expect(await browser.$$(Selectors.workspaceTab())).to.have.lengthOf(3);
  });

  it('should close tabs without warning even when "modified" by interacting with the tab', async function () {
    for (const collName of collections) {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME,
        'test',
        collName,
        'Documents',
        false
      );
      // Click something to make sure we "modified" the tab
      await browser.clickVisible(
        Selectors.queryBarApplyFilterButton('Documents')
      );
    }
    await browser.closeWorkspaceTabs(false);
    expect(await browser.$$(Selectors.workspaceTab())).to.have.lengthOf(0);
  });

  it('should ask for confirmation when closing modified Aggregations tab', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'a',
      'Aggregations'
    );

    await browser.clickVisible(
      Selectors.aggregationPipelineModeToggle('as-text')
    );

    await browser.setCodemirrorEditorValue(
      Selectors.AggregationAsTextEditor,
      '[{$match: { i: 0 }}]'
    );

    await browser.clickVisible(Selectors.CloseWorkspaceTab);
    await browser.$(Selectors.ConfirmTabCloseModal).waitForDisplayed();

    await browser.clickVisible(
      browser.$(Selectors.ConfirmTabCloseModal).$('button=Cancel')
    );
    await browser
      .$(Selectors.ConfirmTabCloseModal)
      .waitForExist({ reverse: true });

    // Checking first that cancel leaves the tab on the screen
    expect(await browser.$$(Selectors.workspaceTab())).to.have.lengthOf(1);

    await browser.clickVisible(Selectors.CloseWorkspaceTab);
    await browser.$(Selectors.ConfirmTabCloseModal).waitForDisplayed();

    await browser.clickVisible(
      browser.$(Selectors.ConfirmTabCloseModal).$('button=Close tab')
    );
    await browser
      .$(Selectors.ConfirmTabCloseModal)
      .waitForExist({ reverse: true });

    // When confirmed, should remove the tab
    expect(await browser.$$(Selectors.workspaceTab())).to.have.lengthOf(0);
  });

  it("should close a connection's tabs when disconnecting", async function () {
    if (!TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'a',
      'Aggregations'
    );

    const workspaceOptions = {
      connectionName: DEFAULT_CONNECTION_NAME,
      type: 'Collection',
      namespace: 'test.a',
    };

    expect(
      await browser.$(Selectors.workspaceTab(workspaceOptions)).isExisting()
    ).to.be.true;

    await browser.disconnectAll();

    await browser.waitUntil(async () => {
      const exists = await browser
        .$(Selectors.workspaceTab(workspaceOptions))
        .isExisting();
      return exists === false;
    });
  });
});
