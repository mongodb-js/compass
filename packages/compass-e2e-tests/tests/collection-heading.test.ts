import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

describe('Collection heading', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

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
      'Explain Plan',
      'Indexes',
      'Validation',
    ].map((selector) => Selectors.collectionTab(selector));

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
    await browser.hover(Selectors.DocumentCountValue);

    const collectionStatsTooltip = await browser.$(
      Selectors.CollectionStatsTooltip
    );
    await collectionStatsTooltip.waitForDisplayed();

    const tooltipDocumentsCountValue = await browser.$(
      Selectors.TooltipDocumentsCountValue
    );
    expect(await tooltipDocumentsCountValue.getText()).to.equal(
      'Documents: 1k'
    );

    const tooltipDocumentsStorageSize = await browser.$(
      Selectors.TooltipDocumentsStorageSize
    );
    expect(await tooltipDocumentsStorageSize.getText()).to.equal(
      'Storage Size: 4.1KB'
    );

    const tooltipDocumentsAvgSize = await browser.$(
      Selectors.TooltipDocumentsAvgSize
    );
    expect(await tooltipDocumentsAvgSize.getText()).to.equal('Avg. Size: 36B');

    const tooltipIndexesCount = await browser.$(Selectors.TooltipIndexesCount);
    expect(await tooltipIndexesCount.getText()).to.equal('Indexes: 1');

    const tooltipIndexesTotalSize = await browser.$(
      Selectors.TooltipIndexesTotalSize
    );
    expect(await tooltipIndexesTotalSize.getText()).to.equal(
      'Total Size: 4.1KB'
    );

    const tooltipIndexesAvgSize = await browser.$(
      Selectors.TooltipIndexesAvgSize
    );
    expect(await tooltipIndexesAvgSize.getText()).to.equal('Avg. Size: 4.1KB');
  });
});
