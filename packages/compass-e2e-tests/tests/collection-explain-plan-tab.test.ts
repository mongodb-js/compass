import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const { expect } = chai;

describe('Collection explain plan tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.navigateToCollectionTab('test', 'numbers', 'Explain Plan');
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
});
