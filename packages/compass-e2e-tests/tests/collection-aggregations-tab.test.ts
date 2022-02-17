import _ from 'lodash';
import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

describe('Collection aggregations tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('supports the right stages for the environment', async function () {
    // sanity check to make sure there's only one
    const stageContainers = await browser.$$(Selectors.StageContainer);
    expect(stageContainers).to.have.lengthOf(1);

    await browser.focusStageOperator(0);

    const stageOperatorOptionsElements = await browser.$$(
      Selectors.stageOperatorOptions(0)
    );
    const options = await Promise.all(
      stageOperatorOptionsElements.map((element) => element.getText())
    );

    /*
    TODO: The expected options depend on the mongodb version and probably type
    (ie. atlas or data lake could have different options). Right now there isn't
    a reliable way for the tests to know which version of mongodb it is expected
    to be connected to, but soon when we add tests for all current versions of
    mongodb we'll deal with that and then we can determine the correct expected
    options.

    In the meantime this is just checking the subset of options that appear on
    all supported mongodb versions this test might run against.
    */
    expect(_.without(options, '$setWindowFields')).to.deep.equal([
      '$addFields',
      '$bucket',
      '$bucketAuto',
      '$collStats',
      '$count',
      '$documents',
      '$facet',
      '$geoNear',
      '$graphLookup',
      '$group',
      '$indexStats',
      '$limit',
      '$lookup',
      '$match',
      '$merge',
      '$out',
      '$project',
      '$redact',
      '$replaceWith',
      '$replaceRoot',
      '$sample',
      '$search',
      '$searchMeta',
      '$set',
      //'$setWindowFields', // New in version 5.0.
      '$skip',
      '$sort',
      '$sortByCount',
      '$unionWith',
      '$unset',
      '$unwind',
    ]);
  });

  // the aggregation runs and the preview is shown
  it('supports creating an aggregation', async function () {
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$match');
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: 0 }');

    await browser.waitUntil(async function () {
      const textElement = await browser.$(
        Selectors.stagePreviewToolbarTooltip(0)
      );
      const text = await textElement.getText();
      return text === '(Sample of 1 document)';
    });
  });

  it('shows atlas only stage preview', async function () {
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$search');

    await browser.waitUntil(async function () {
      const textElement = await browser.$(
        Selectors.atlasOnlyStagePreviewSection(0)
      );
      const text = await textElement.getText();
      return text.includes('This stage is only available with MongoDB Atlas.');
    });
  });

  it('shows empty preview', async function () {
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$addFields');

    await browser.waitUntil(async function () {
      const textElement = await browser.$(Selectors.stagePreviewEmpty(0));
      const text = await textElement.getText();
      return text === 'No Preview Documents';
    });
  });

  // comment mode
  // number of preview documents
  // max time
  // limit
  // sample mode
  // auto preview
  it('supports tweaking settings of an aggregation');

  // the result is stored in the destination collection
  it('supports aggregations that end in $out and $merge');

  // stages can be re-arranged and the preview is refreshed after rearranging them
  it('supports drag and drop of stages');

  // stages can be disabled and the preview is refreshed after disabling them
  it('allows stages to be disabled');

  // stages can be deleted and the preview is refreshed after disabling them
  it('allows stages to be deleted');

  // this requires closing compass and opening it again..
  it('allows pipelines to be saved and loaded');

  it('supports creating a view');

  // different languages, with and without imports, with and without driver usage
  it('can export to language');

  it('supports specifying collation');
});
