import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  DEFAULT_CONNECTION_NAME,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createGeospatialCollection,
  createNumbersCollection,
} from '../helpers/insert-data';

const { expect } = chai;

describe('Collection schema tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createGeospatialCollection();
    await browser.connectWithConnectionString();
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('analyzes a schema', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME,
      'test',
      'numbers',
      'Schema'
    );
    await browser.clickVisible(Selectors.AnalyzeSchemaButton);

    const element = await browser.$(Selectors.SchemaFieldList);
    await element.waitForDisplayed();
    const analysisMessageElement = await browser.$(Selectors.AnalysisMessage);
    const message = await analysisMessageElement.getText();
    // message contains non-breaking spaces
    expect(message.replace(/\s/g, ' ')).to.equal(
      'This report is based on a sample of 1000 documents.'
    );

    const fields = await browser.$$(Selectors.SchemaField);
    expect(fields).to.have.lengthOf(3);

    const fieldNames = await browser
      .$$(Selectors.SchemaFieldName)
      .map((el) => el.getText());
    expect(fieldNames).to.deep.equal(['_id', 'i', 'j']);

    const fieldTypes = await browser
      .$$(Selectors.SchemaFieldTypeList)
      .map((el) => el.getText());
    expect(fieldTypes).to.deep.equal(['objectid', 'int32', 'int32']);
  });

  for (const enableMaps of [true, false]) {
    it(`can analyze coordinates for a schema (enableMaps = ${enableMaps})`, async function () {
      skipForWeb(this, "can't toggle features in compass-web");

      await browser.setFeature('enableMaps', enableMaps);
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME,
        'test',
        'geospatial',
        'Schema'
      );
      await browser.clickVisible(Selectors.AnalyzeSchemaButton);

      const element = await browser.$(Selectors.SchemaFieldList);
      await element.waitForDisplayed();

      const fieldNames = (
        await browser.$$(Selectors.SchemaFieldName).map((el) => el.getText())
      ).map((text: string) => text.trim());
      expect(fieldNames).to.deep.equal(['_id', 'location']);

      const fieldTypes = (
        await browser
          .$$(Selectors.SchemaFieldTypeList)
          .map((el) => el.getText())
      ).map((text: string) => text.trim());
      expect(fieldTypes).to.deep.equal([
        'objectid',
        enableMaps ? 'coordinates' : 'document',
      ]);
      await browser
        .$('.leaflet-container')
        .waitForDisplayed({ reverse: !enableMaps });
    });
  }

  it('analyzes the schema with a query');
  it('can reset the query');
  it('can create a geoquery from a map');
  it('can create a geoquery from the charts');
  it('supports maxTimeMS');
});
