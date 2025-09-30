import { expect } from 'chai';
import type { CompassBrowser } from '../../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
} from '../../helpers/compass';
import type { Compass } from '../../helpers/compass';
import * as Selectors from '../../helpers/selectors';
import { createNumbersCollection } from '../../helpers/insert-data';
import { isTestingAtlasCloudSandbox } from '../../helpers/test-runner-context';

describe('Saved queries and aggregations in Atlas Cloud', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingAtlasCloudSandbox()) {
      this.skip();
    }
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
    await createNumbersCollection();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('can save and retrieve a query in Atlas Cloud', async function () {
    await browser.connectByName(DEFAULT_CONNECTION_NAME_1);

    const favoriteQueryName = 'atlas-cloud-test-query';

    // Navigate to collection and run a query
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Documents'
    );
    await browser.runFindOperation('Documents', '{ i: { $gt: 5 } }', {
      limit: '10',
    });

    // Save the query
    await browser.clickVisible(Selectors.QueryBarHistoryButton);
    const history = browser.$(Selectors.QueryBarHistory);
    await history.waitForDisplayed();

    const recentCard = browser.$(Selectors.QueryHistoryRecentItem);
    await recentCard.waitForDisplayed();

    await browser.hover(Selectors.QueryHistoryRecentItem);
    await browser.clickVisible(Selectors.QueryHistoryFavoriteAnItemButton);
    await browser.setValueVisible(
      Selectors.QueryHistoryFavoriteItemNameField,
      favoriteQueryName
    );
    await browser.clickVisible(Selectors.QueryHistorySaveFavoriteItemButton);

    // Navigate to My Queries and verify it's there
    await browser.closeWorkspaceTabs();
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );
    await browser.navigateToMyQueries();

    // Verify the saved query appears
    const savedQuery = browser.$(Selectors.myQueriesItem(favoriteQueryName));
    await savedQuery.waitForDisplayed();

    // Open the saved query
    await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));
    const namespace = await browser.getActiveTabNamespace();
    expect(namespace).to.equal('test.numbers');

    // Clean up - delete the saved query
    await browser.closeWorkspaceTabs();
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );
    await browser.navigateToMyQueries();

    // Open menu and delete
    const titleSelector = Selectors.myQueriesItem(favoriteQueryName);
    const titleElement = browser.$(titleSelector);
    const parent = titleElement.parentElement();

    await browser.waitUntil(async () => {
      await browser.hover(titleSelector);
      const button = parent.$('button[title="Show actions"]');
      if (await button.isDisplayed()) {
        return true;
      }
      await browser.hover(Selectors.SidebarTitle);
      return false;
    });

    const button = parent.$('button[title="Show actions"]');
    await button.click();
    await browser.$(Selectors.SavedItemMenu).waitForDisplayed();
    await browser.clickConfirmationAction(Selectors.SavedItemMenuItemDelete);
  });

  it('can save and retrieve an aggregation in Atlas Cloud', async function () {
    await browser.connectByName(DEFAULT_CONNECTION_NAME_1);

    const savedAggregationName = 'atlas-cloud-test-aggregation';

    // Navigate to aggregation
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Aggregations'
    );

    // Add a stage
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(0)).waitForDisplayed();

    // Select $match and add filter
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: { $gt: 5 } }'
    );

    // Save the pipeline
    await browser.clickVisible(Selectors.SavePipelineMenuButton);
    const menuElement = browser.$(Selectors.SavePipelineMenuContent);
    await menuElement.waitForDisplayed();
    await browser.clickVisible(Selectors.SavePipelineSaveAsAction);

    // Wait for the modal and set name
    const savePipelineModal = browser.$(Selectors.SavePipelineModal);
    await savePipelineModal.waitForDisplayed();
    await browser.waitForAnimations(Selectors.SavePipelineNameInput);
    await browser.setValueVisible(
      Selectors.SavePipelineNameInput,
      savedAggregationName
    );

    // Save
    const createButton = browser
      .$(Selectors.SavePipelineModal)
      .$('button=Save');
    await createButton.click();

    // Navigate to My Queries and verify it's there
    await browser.closeWorkspaceTabs();
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );
    await browser.navigateToMyQueries();

    // Verify the saved aggregation appears
    const savedAggregation = browser.$(
      Selectors.myQueriesItem(savedAggregationName)
    );
    await savedAggregation.waitForDisplayed();

    // Open the saved aggregation
    await browser.clickVisible(Selectors.myQueriesItem(savedAggregationName));
    const namespace = await browser.getActiveTabNamespace();
    expect(namespace).to.equal('test.numbers');

    // Clean up - delete the saved aggregation
    await browser.closeWorkspaceTabs();
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Databases'
    );
    await browser.navigateToMyQueries();

    // Open menu and delete
    const titleSelector = Selectors.myQueriesItem(savedAggregationName);
    const titleElement = browser.$(titleSelector);
    const parent = titleElement.parentElement();

    await browser.waitUntil(async () => {
      await browser.hover(titleSelector);
      const button = parent.$('button[title="Show actions"]');
      if (await button.isDisplayed()) {
        return true;
      }
      await browser.hover(Selectors.SidebarTitle);
      return false;
    });

    const button = parent.$('button[title="Show actions"]');
    await button.click();
    await browser.$(Selectors.SavedItemMenu).waitForDisplayed();
    await browser.clickConfirmationAction(Selectors.SavedItemMenuItemDelete);
  });
});
