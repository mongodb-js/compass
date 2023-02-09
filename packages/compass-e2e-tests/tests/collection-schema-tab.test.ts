import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
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
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createGeospatialCollection();
    await browser.connectWithConnectionString();
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('analyzes a schema', async function () {
    await browser.navigateToCollectionTab('test', 'numbers', 'Schema');
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

    const schemaFieldNameElement = await browser.$$(Selectors.SchemaFieldName);
    const fieldNames = await Promise.all(
      schemaFieldNameElement.map((el) => el.getText())
    );
    expect(fieldNames).to.deep.equal(['_id', 'i', 'j']);

    const schemaFieldTypeListElement = await browser.$$(
      Selectors.SchemaFieldTypeList
    );
    const fieldTypes = await Promise.all(
      schemaFieldTypeListElement.map((el) => el.getText())
    );
    expect(fieldTypes).to.deep.equal(['objectid', 'int32', 'int32']);
  });

  for (const enableMaps of [true, false]) {
    it(`can analyze coordinates for a schema (enableMaps = ${enableMaps})`, async function () {
      await browser.setFeature('enableMaps', enableMaps);
      await browser.navigateToCollectionTab('test', 'geospatial', 'Schema');
      await browser.clickVisible(Selectors.AnalyzeSchemaButton);

      const element = await browser.$(Selectors.SchemaFieldList);
      await element.waitForDisplayed();

      const schemaFieldNameElement = await browser.$$(
        Selectors.SchemaFieldName
      );
      const fieldNames = (
        await Promise.all(schemaFieldNameElement.map((el) => el.getText()))
      ).map((text) => text.trim());
      expect(fieldNames).to.deep.equal(['_id', 'location']);

      const schemaFieldTypeListElement = await browser.$$(
        Selectors.SchemaFieldTypeList
      );
      const fieldTypes = (
        await Promise.all(schemaFieldTypeListElement.map((el) => el.getText()))
      ).map((text) => text.trim());
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
