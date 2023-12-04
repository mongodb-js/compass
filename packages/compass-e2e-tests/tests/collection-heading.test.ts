import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const { expect } = chai;

describe('Collection heading', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('contains the collection tabs', async function () {
    const tabSelectors = [
      'Documents',
      'Aggregations',
      'Schema',
      'Indexes',
      'Validation',
    ].map((selector) => Selectors.collectionSubTab(selector));

    for (const tabSelector of tabSelectors) {
      const tabElement = await browser.$(tabSelector);
      expect(await tabElement.isExisting()).to.be.true;
    }
  });

  it('contains the collection stats', async function () {
    const documentCountValueElement = await browser.$(
      Selectors.DocumentCountValue
    );
    expect(await documentCountValueElement.getText()).to.match(/1(\.0)?k/);
    const indexCountValueElement = await browser.$(Selectors.IndexCountValue);
    expect(await indexCountValueElement.getText()).to.equal('1');
  });

  it('shows tooltip with storage sizes on hover stats', async function () {
    const documentCountValue = await browser.$(Selectors.DocumentCountValue);
    await documentCountValue.waitForDisplayed();

    await browser.hover(Selectors.DocumentCountValue);

    const collectionStatsTooltip = await browser.$(
      Selectors.CollectionStatsTooltip
    );
    await collectionStatsTooltip.waitForDisplayed();

    const tooltipDocumentsCountValue = await browser.$(
      Selectors.TooltipDocumentsCountValue
    );
    expect(await tooltipDocumentsCountValue.getText()).to.include('Documents');

    const tooltipDocumentsStorageSize = await browser.$(
      Selectors.TooltipDocumentsStorageSize
    );
    expect(await tooltipDocumentsStorageSize.getText()).to.include(
      'Storage Size'
    );

    const tooltipDocumentsAvgSize = await browser.$(
      Selectors.TooltipDocumentsAvgSize
    );
    expect(await tooltipDocumentsAvgSize.getText()).to.include('Avg. Size');

    const tooltipIndexesCount = await browser.$(Selectors.TooltipIndexesCount);
    expect(await tooltipIndexesCount.getText()).to.include('Indexes');

    const tooltipIndexesTotalSize = await browser.$(
      Selectors.TooltipIndexesTotalSize
    );
    expect(await tooltipIndexesTotalSize.getText()).to.include('Total Size');

    const tooltipIndexesAvgSize = await browser.$(
      Selectors.TooltipIndexesAvgSize
    );
    expect(await tooltipIndexesAvgSize.getText()).to.include('Avg. Size');
  });
});
