import _ from 'lodash';
import chai from 'chai';
import clipboard from 'clipboardy';
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
    await browser.clickVisible('[data-test-id="toggle-collation"]');
    const collationInput = await browser.$('[data-test-id="collation-string"]');
    await collationInput.waitForDisplayed();
    await collationInput.setValue('{ locale: "af" }');

    // select $match
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$match');
    // check that it included the comment by default
    const contentElement = await browser.$(Selectors.stageContent(0));
    expect(await contentElement.getText()).to.equal(`/**
 * query: The query in MQL.
 */
{
  query
}`);

    //change $match
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: 0 }');

    // open settings
    await browser.clickVisible('[data-test-id="aggregation-settings"]');

    // turn off comment mode
    await browser.clickVisible('#aggregation-comment-mode');

    // set number of preview documents to 100
    const sampleSizeElement = await browser.$('#aggregation-sample-size');
    await sampleSizeElement.setValue('100');

    // apply settings
    await browser.clickVisible('#aggregation-settings-apply');

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
    // TODO: check that it has no comment
    await browser.setAceValue(Selectors.stageEditor(1), '{ _id: 0 }');

    // disable it
    await browser.clickVisible(Selectors.stageToggle(1));

    // export to language
    // TODO: select some stuff?
    // TODO: also factor out the selectors in collection-documents-tab. Or maybe the code as well.
    await browser.clickVisible(Selectors.ExportAggregationToLanguage);
    const exportModal = await browser.$(
      '[data-test-id="export-to-lang-modal"]'
    );
    await exportModal.waitForDisplayed();
    await browser.clickVisible('[data-test-id="export-to-lang-copy-output"]');
    expect(await clipboard.read()).to.equal(`[
    {
        '$match': {
            'i': 0
        }
    }
]`);

    // close the modal again
    await browser.clickVisible(
      '[data-test-id="export-to-lang-modal"] .modal-footer .btn-default'
    );
    await exportModal.waitForDisplayed({ reverse: true });

    // TODO: check that the preview is using 100 docs

    // save as a view
    // TODO

    // browse to the view
    // TODO
  });

  // TODO: test $out
  // TODO: test $merge
  // TODO: test max time
  // TODO: stages can be re-arranged by drag and drop and the preview is refreshed after rearranging them
  // TODO: test auto-preview and limit
  // TODO: save a pipeline, close compass, re-open compass, load the pipeline
});
