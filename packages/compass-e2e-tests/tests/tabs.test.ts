import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
  DEFAULT_CONNECTION_NAME_2,
  TEST_COMPASS_WEB,
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
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    for (const collName of collections) {
      await createNumbersCollection(collName, 1);
      await createNumbersCollection(collName, 1);
      await createNumbersCollection(collName, 1);
    }
    await browser.disconnectAll();
    await browser.connectToDefaults();
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
        DEFAULT_CONNECTION_NAME_1,
        'test',
        collName,
        'Documents',
        false
      );
    }
    expect(await browser.$$(Selectors.workspaceTab()).length).to.equal(1);
  });

  it('should open new tabs when modified', async function () {
    for (const collName of collections) {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
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
    expect(await browser.$$(Selectors.workspaceTab()).length).to.equal(3);
  });

  it('should close tabs without warning even when "modified" by interacting with the tab', async function () {
    for (const collName of collections) {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
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
    expect(await browser.$$(Selectors.workspaceTab()).length).to.equal(0);
  });

  it('should ask for confirmation when closing modified Aggregations tab', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
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

    await browser.hover(
      Selectors.workspaceTab({
        connectionName: DEFAULT_CONNECTION_NAME_1,
        namespace: 'test.a',
      })
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
    expect(await browser.$$(Selectors.workspaceTab()).length).to.equal(1);

    await browser.hover(
      Selectors.workspaceTab({
        connectionName: DEFAULT_CONNECTION_NAME_1,
        namespace: 'test.a',
      })
    );
    await browser.clickVisible(Selectors.CloseWorkspaceTab);
    await browser.$(Selectors.ConfirmTabCloseModal).waitForDisplayed();

    await browser.clickVisible(
      browser.$(Selectors.ConfirmTabCloseModal).$('button=Close tab')
    );
    await browser
      .$(Selectors.ConfirmTabCloseModal)
      .waitForExist({ reverse: true });

    // When confirmed, should remove the tab
    expect(await browser.$$(Selectors.workspaceTab()).length).to.equal(0);
  });

  it("should close a connection's tabs when disconnecting", async function () {
    // workspace 1: connection 1, Documents tab
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'a',
      'Documents',
      false
    );

    // Click something to make sure we "modified" tab 1
    await browser.clickVisible(
      Selectors.queryBarApplyFilterButton('Documents')
    );

    // workspace 2: connection 2, Documents tab
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_2,
      'test',
      'a',
      'Documents',
      false
    );

    // Click something to make sure we "modified" tab 2
    await browser.clickVisible(
      Selectors.queryBarApplyFilterButton('Documents')
    );

    // My Queries tab not supported by compass-web
    if (!TEST_COMPASS_WEB) {
      // workspace 3: My Queries
      await browser.navigateToMyQueries();
    }

    const workspace1Options = {
      connectionName: DEFAULT_CONNECTION_NAME_1,
      type: 'Collection',
      namespace: 'test.a',
    };

    // check that they are all there

    expect(
      await browser.$(Selectors.workspaceTab(workspace1Options)).isExisting()
    ).to.be.true;

    const workspace2Options = {
      connectionName: DEFAULT_CONNECTION_NAME_2,
      type: 'Collection',
      namespace: 'test.a',
    };

    expect(
      await browser.$(Selectors.workspaceTab(workspace2Options)).isExisting()
    ).to.be.true;

    const workspace3Options = {
      type: 'My Queries',
    };

    if (!TEST_COMPASS_WEB) {
      expect(
        await browser.$(Selectors.workspaceTab(workspace3Options)).isExisting()
      ).to.be.true;
    }

    // disconnect one connection

    await browser.disconnectByName(DEFAULT_CONNECTION_NAME_1);

    // the workspace for connection 1 should go away
    await browser.waitUntil(async () => {
      const exists = await browser
        .$(Selectors.workspaceTab(workspace1Options))
        .isExisting();
      return exists === false;
    });

    // give it a moment in case it takes time for workspaces to go away
    await browser.pause(1000);

    // the workspace for connection 2 should still be there
    expect(
      await browser.$(Selectors.workspaceTab(workspace2Options)).isExisting()
    ).to.be.true;

    if (!TEST_COMPASS_WEB) {
      // the My Queries workspace should still be there
      expect(
        await browser.$(Selectors.workspaceTab(workspace3Options)).isExisting()
      ).to.be.true;
    }
  });
});
