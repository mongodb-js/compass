import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Collection explain plan tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let newExplainPlanFeature = false;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();
    newExplainPlanFeature = (await browser.getFeature(
      'newExplainPlan'
    )) as boolean;
    await browser.setFeature('newExplainPlan', true);
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    try {
      // Optional clean up only for the cases where one of the explain tests
      // failed to prevent modal from potentially being stuck on the screen and
      // breaking more tests ...
      const closeButton = await browser.$(Selectors.ExplainCloseButton);
      await closeButton.click();
    } catch {
      // ... this is why potential errors are ignored
    }
    await browser.setFeature('newExplainPlan', newExplainPlanFeature);
    await afterTest(compass, this.currentTest);
  });

  it('shows explain plan button', async function () {
    await browser.clickVisible(Selectors.ExecuteExplainButton);
    const element = await browser.$(Selectors.ExplainSummary);
    await element.waitForDisplayed();
    const stages = await browser.$$(Selectors.ExplainStage);
    expect(stages).to.have.lengthOf(1);
    const stats = await Promise.all(
      (
        [
          'docsExamined',
          'docsReturned',
          'indexKeysExamined',
          'sortedInMemory',
        ] as const
      ).map(async (stat) => {
        return (
          await (
            await browser.$(Selectors.explainPlanSummaryStat(stat))
          ).getText()
        ).trim();
      })
    );
    expect(stats).to.deep.eq([
      '1000 documents examined',
      '1000 documents returned',
      '0 index keys examined',
      'Is not sorted in memory',
    ]);
    await browser.clickVisible(Selectors.ExplainCloseButton);
  });

  it('shows a loading state while explain is running', async function () {
    await browser.fillQueryBar(
      '{ $where: "function() { sleep(10000); return true; }" }'
    );
    await browser.clickVisible(Selectors.ExecuteExplainButton);
    const spinner = await browser.$(Selectors.ExplainLoader);
    await spinner.waitForDisplayed();
    await browser.clickVisible(Selectors.ExplainCloseButton);
  });
});
