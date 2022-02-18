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

  // TODO: we can probably remove this one now that there is a more advanced one. or merge that into here?
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

  it('supports tweaking settings of an aggregation', async function () {
    // set a collation
    await browser.clickVisible(Selectors.ToggleAggregationCollation);
    const collationInput = await browser.$(Selectors.AggregationCollationInput);
    await collationInput.waitForDisplayed();
    await collationInput.setValue('{ locale: "af" }');

    // select $match
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$match');
    // check that it included the comment by default
    const contentElement0 = await browser.$(Selectors.stageContent(0));
    expect(await contentElement0.getText()).to.equal(`/**
 * query: The query in MQL.
 */
{
  query
}`);

    //change $match
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: { $gt: 5 } }');

    // open settings
    await browser.clickVisible(Selectors.AggregationSettingsButton);

    // turn off comment mode
    await browser.clickVisible(Selectors.AggregationCommentModeCheckbox);

    // set number of preview documents to 100
    const sampleSizeElement = await browser.$(
      Selectors.AggregationSampleSizeInput
    );
    await sampleSizeElement.setValue('100');

    // apply settings
    await browser.clickVisible(Selectors.AggregationSettingsApplyButton);

    // add a $project
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$project');

    // delete it
    await browser.clickVisible(Selectors.stageDelete(1));

    // add a $project
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$project');

    // check that it has no comment
    const contentElement1 = await browser.$(Selectors.stageContent(1));
    expect(await contentElement1.getText()).to.equal(`{
  specification(s)
}`);
    await browser.setAceValue(Selectors.stageEditor(1), '{ _id: 0 }');

    // disable it
    await browser.clickVisible(Selectors.stageToggle(1));

    // export to language
    await browser.clickVisible(Selectors.ExportAggregationToLanguage);
    const text = await browser.exportToLanguage('Ruby');
    expect(text).to.equal(`[
  {
    '$match' => {
      'i' => {
        '$gt' => 5
      }
    }
  }
]`);

    // check that the preview is using 100 docs
    await browser.waitUntil(async function () {
      const textElement = await browser.$(
        Selectors.stagePreviewToolbarTooltip(0)
      );
      const text = await textElement.getText();
      return text === '(Sample of 100 documents)';
    });

    // save as a view
    // TODO: This is currently broken, so will have to test at a later stage
    /*
    //#save-pipeline-actions
    //a=Create a view'
    '[trackingid="create_view_modal"]'
    '#create-view-name'
    '[trackingid="create_view_modal"] [role=dialog] > div:nth-child(2) button:first-child'
    */

    // browse to the view
    // TODO
  });

  it('supports maxTimeMS', async function () {
    // open settings
    await browser.clickVisible(Selectors.AggregationSettingsButton);

    // set maxTimeMS
    const sampleSizeElement = await browser.$(Selectors.AggregationMaxTimeMS);
    await sampleSizeElement.setValue('1');

    // apply settings
    await browser.clickVisible(Selectors.AggregationSettingsApplyButton);

    // run a projection that will take lots of time
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$project');
    await browser.setAceValue(
      Selectors.stageEditor(0),
      `{
      foo: {
        $function: {
          body: 'function() { sleep(1000) }',
          args: [],
          lang: 'js'
        }
      }
    }`
    );

    // make sure we got the timeout error
    const messageElement = await browser.$(Selectors.StageEditorErrorMessage);
    await messageElement.waitForDisplayed();
    expect(await messageElement.getText()).to.include(
      'operation exceeded time limit'
    );
  });

  // TODO: test $out
  // TODO: test $merge
  // TODO: test max time
  // TODO: stages can be re-arranged by drag and drop and the preview is refreshed after rearranging them
  // TODO: test auto-preview and limit
  // TODO: save a pipeline, close compass, re-open compass, load the pipeline
});
