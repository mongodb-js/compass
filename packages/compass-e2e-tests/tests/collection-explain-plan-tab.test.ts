import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { expandOptions, setLimit, setSort } from '../helpers/commands';

const { expect } = chai;

describe('Collection explain plan tab', function () {
  const dbName = 'test';
  const collectionName = 'numbers';
  const tabName = 'Explain Plan';
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString(
      `mongodb://localhost:27091/${dbName}`
    );
    await browser.navigateToCollectionTab(dbName, collectionName, tabName);
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('shows an explain plan', async function () {
    await browser.clickVisible(Selectors.ExecuteExplainButton);

    const element = await browser.$(Selectors.ExplainSummary);
    await element.waitForDisplayed();
    const stages = await browser.$$(Selectors.ExplainStage);
    expect(stages).to.have.lengthOf(1);
  });

  it('shows a loading state while explain is running', async function () {
    // Popuplate existing collection with some more data
    await createNumbersCollection(collectionName, 10_00_000);
    await expandOptions(browser, tabName);
    await setSort(browser, tabName, '{ i: -1 }');

    await browser.clickVisible(Selectors.ExecuteExplainButton);
    const spinner = await browser.$(Selectors.ExplainCancellableSpinner);
    await spinner.waitForDisplayed();
  });

  it('cancels an ongoing explain and falls back to welcome page', async function () {
    // Popuplate existing collection with some more data
    await createNumbersCollection(collectionName, 10_00_000);
    await expandOptions(browser, tabName);
    await setSort(browser, tabName, '{ i: -1 }');

    await browser.clickVisible(Selectors.ExecuteExplainButton);
    await browser.clickVisible(Selectors.ExplainCancelButton);

    const welcomePageExecuteExplainBtn = await browser.$$(
      Selectors.ExecuteExplainButton
    );
    expect(welcomePageExecuteExplainBtn).to.have.length(1);
  });

  it('cancels an ongoing explain and falls back to old explain output', async function () {
    // Popuplate existing collection with some more data
    await createNumbersCollection(collectionName, 10_00_000);
    await expandOptions(browser, tabName);
    await setSort(browser, tabName, '{ i: -1 }');
    await setLimit(browser, tabName, '10000');

    // Run explain
    await browser.clickVisible(Selectors.ExecuteExplainButton);

    // Ensure the results are shown
    let summaryElement = await browser.$(Selectors.ExplainSummary);
    await summaryElement.waitForDisplayed();
    const totalStages = (await browser.$$(Selectors.ExplainStage)).length;

    // Run explain again without the limit and cancel
    await setLimit(browser, tabName, '');
    await browser.clickVisible(Selectors.queryBarApplyFilterButton(tabName));
    await browser.clickVisible(Selectors.ExplainCancelButton);

    summaryElement = await browser.$(Selectors.ExplainSummary);
    await summaryElement.waitForDisplayed();

    const stages = await browser.$$(Selectors.ExplainStage);
    expect(stages).to.have.lengthOf(totalStages);
  });
});
