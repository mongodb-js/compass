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
    expect(await documentCountValueElement.getText()).to.equal('1k');
    const indexCountValueElement = await browser.$(Selectors.IndexCountValue);
    expect(await indexCountValueElement.getText()).to.equal('1');

    // all of these unfortunately differ slightly between different versions of mongodb
    const totalDocumentSizeValueElement = await browser.$(
      Selectors.StorageSizeValue
    );
    expect(await totalDocumentSizeValueElement.getText()).to.include('KB');
    const avgDocumentSizeValueElement = await browser.$(
      Selectors.AvgDocumentSizeValue
    );
    expect(await avgDocumentSizeValueElement.getText()).to.include('B');
    const totalIndexSizeValueElement = await browser.$(
      Selectors.TotalIndexSizeValue
    );
    expect(await totalIndexSizeValueElement.getText()).to.include('KB');
    const avgIndexSizeValueElement = await browser.$(
      Selectors.AvgIndexSizeValue
    );
    expect(await avgIndexSizeValueElement.getText()).to.include('KB');
  });
});
