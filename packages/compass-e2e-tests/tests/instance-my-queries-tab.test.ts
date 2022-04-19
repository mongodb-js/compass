import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Instance my queries tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });
  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });
  after(async function () {
    await afterTests(compass, this.currentTest);
  });
  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('opens a saved query', async function () {
    const favoriteQueryName = 'list of numbers greater than 10 - query';

    // Run a query
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
    await browser.runFindOperation('Documents', `{i: {$gt: 10}}`, {
      limit: '10',
    });
    await browser.clickVisible(Selectors.QueryBarHistoryButton);

    // Save the ran query
    await browser.hover(Selectors.QueryHistoryRecentItem);
    await browser.clickVisible(Selectors.QueryHistoryFavoriteAnItemButton);
    const favoriteQueryNameField = await browser.$(
      Selectors.QueryHistoryFavoriteItemNameField
    );
    await favoriteQueryNameField.setValue(favoriteQueryName);
    await browser.clickVisible(Selectors.QueryHistorySaveFavoriteItemButton);

    await browser.closeWorkspaceTabs();
    await browser.navigateToInstanceTab('Databases');
    await browser.navigateToInstanceTab('My Queries');

    await browser.clickVisible(Selectors.myQueriesItem(favoriteQueryName));
    const namespace = await browser.getActiveTabNamespace();
    expect(namespace).to.equal('test.numbers');
  });

  it('opens a saved aggregation', async function () {
    const savedAggregationName =
      'list of numbers greater than 10 - aggregation';

    // Navigate to aggregation
    await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    // select $match
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$match');
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: { $gt: 10 } }');

    await browser.clickVisible(Selectors.SavePipelineActions);
    await browser.clickVisible(Selectors.SavePipelineActionsSaveAs);
    // wait for the modal to appear
    const savePipelineModal = await browser.$(Selectors.SavePipelineModal);
    await savePipelineModal.waitForDisplayed();

    // set aggregation name
    await browser.waitForAnimations(Selectors.SavePipelineNameInput);
    const pipelineNameInput = await browser.$(Selectors.SavePipelineNameInput);
    await pipelineNameInput.setValue(savedAggregationName);

    // click save button
    const createButton = await browser
      .$(Selectors.SavePipelineModal)
      .$('button=Save');

    await createButton.click();

    await browser.closeWorkspaceTabs();
    await browser.navigateToInstanceTab('My Queries');

    await browser.clickVisible(Selectors.myQueriesItem(savedAggregationName));
    const namespace = await browser.getActiveTabNamespace();
    expect(namespace).to.equal('test.numbers');
  });
});
