import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

describe('Collection indexes tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let screenshot: string | undefined;

  before(async function () {
    screenshot = 'collection-indexes-tab-before';
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Indexes');
    screenshot = undefined;
  });

  after(async function () {
    await afterTests(compass, screenshot);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('lists indexes', async function () {
    const element = await browser.$(Selectors.IndexList);
    await element.waitForDisplayed();

    const indexes = await browser.$$(Selectors.IndexComponent);
    expect(indexes).to.have.lengthOf(1);

    const nameColumnNameElement = await browser.$(Selectors.NameColumnName);
    expect(await nameColumnNameElement.getText()).to.equal('_id_');
  });

  it('supports creating and dropping indexes');
});
