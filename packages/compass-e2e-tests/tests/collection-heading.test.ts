import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Collection heading', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Documents'
    );
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
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
      const tabElement = browser.$(tabSelector);
      expect(await tabElement.isExisting()).to.be.true;
    }
  });

  it('contains the collection documents stats', async function () {
    const documentStatsSelector = Selectors.CollectionTabStats('documents');
    const documentCountValueElement = browser.$(documentStatsSelector);
    expect(await documentCountValueElement.getText()).to.match(/1(\.0)?K/);

    await browser.hover(documentStatsSelector);
    const statsTooltip = browser.$(Selectors.CollectionStatsTooltip);
    await statsTooltip.waitForDisplayed();

    const tooltipContents = await statsTooltip.getText();

    expect(tooltipContents).to.include('Documents');
    expect(tooltipContents).to.include('Storage Size');
    expect(tooltipContents).to.include('Avg. Size');
  });

  it('contains the collection indexes stats', async function () {
    const indexStatsSelector = Selectors.CollectionTabStats('indexes');
    const indexCountValueElement = browser.$(indexStatsSelector);
    expect(await indexCountValueElement.getText()).to.equal('1');

    await browser.hover(indexStatsSelector);
    const statsTooltip = browser.$(Selectors.CollectionStatsTooltip);
    await statsTooltip.waitForDisplayed();

    const tooltipContents = await statsTooltip.getText();

    expect(tooltipContents).to.include('Indexes');
    expect(tooltipContents).to.include('Total Size');
    expect(tooltipContents).to.include('Avg. Size');
  });
});
