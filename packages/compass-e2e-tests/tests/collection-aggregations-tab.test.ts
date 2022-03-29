import chai from 'chai';
import semver from 'semver';
import type { Element } from 'webdriverio';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

// mongodb-runner defaults to stable if the env var isn't there
const MONGODB_VERSION = (process.env.MONGODB_VERSION || '5.0.6')
  // semver interprets these suffixes like a prerelease (ie. alpha or rc) and it
  // is irrelevant for our version comparisons anyway
  .replace('-community', '')
  // comparisons don't allow X-Ranges
  .replace(/x/g, '0');

async function waitForAnyText(
  browser: CompassBrowser,
  element: Element<'async'>
) {
  await browser.waitUntil(async () => {
    const text = await element.getText();
    return text !== '';
  });
}

describe('Collection aggregations tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  beforeEach(async function () {
    // Some tests navigate away from the numbers collection aggregations tab
    await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    // Get us back to the empty stage every time. Also test the Create New
    // Pipeline flow while at it.
    await browser.clickVisible(Selectors.CreateNewPipelineButton);
    const modalElement = await browser.$(Selectors.ConfirmNewPipelineModal);
    await modalElement.waitForDisplayed();
    await browser.clickVisible(Selectors.ConfirmNewPipelineModalConfirmButton);
    await modalElement.waitForDisplayed({ reverse: true });
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

    options.sort();

    const expectedAggregations = [
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
      '$out',
      '$project',
      '$redact',
      '$replaceRoot',
      '$sample',
      '$search',
      '$searchMeta',
      '$skip',
      '$sort',
      '$sortByCount',
      '$unwind',
    ];

    if (semver.gte(MONGODB_VERSION, '4.2.0')) {
      expectedAggregations.push('$merge', '$replaceWith', '$set', '$unset');
    }
    if (semver.gte(MONGODB_VERSION, '4.4.0')) {
      expectedAggregations.push('$unionWith');
    }
    if (semver.gte(MONGODB_VERSION, '5.0.0')) {
      expectedAggregations.push('$setWindowFields');
    }
    if (semver.gte(MONGODB_VERSION, '5.1.0')) {
      expectedAggregations.push('$densify');
    }

    expectedAggregations.sort();

    expect(options).to.deep.equal(expectedAggregations);
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

  it('supports tweaking settings of an aggregation and saving aggregation as a view', async function () {
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

    // It starts out empty
    await waitForAnyText(browser, contentElement0);

    expect(await contentElement0.getText()).to.equal(`/**
 * query: The query in MQL.
 */
{
  query
}`);

    //change $match
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: { $gt: 5 } }');

    // TODO: click collapse and then expand again

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

    // starts empty
    await waitForAnyText(browser, contentElement1);

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

    // open actions
    await browser.clickVisible(Selectors.SavePipelineActions);

    // select create view
    await browser.clickVisible(Selectors.SavePipelineActionsCreateView);

    // wait for the modal to appear
    const createViewModal = await browser.$(Selectors.CreateViewModal);
    await createViewModal.waitForDisplayed();

    // set view name
    await browser.waitForAnimations(Selectors.CreateViewNameInput);
    const viewNameInput = await browser.$(Selectors.CreateViewNameInput);
    await viewNameInput.setValue('my-view-from-pipeline');

    // click create button
    const createButton = await browser
      .$(Selectors.CreateViewModal)
      .$('button=Create');

    await createButton.click();

    // wait until the active tab is the view that we just created
    await browser.waitUntil(
      async function () {
        const ns = await browser.getActiveTabNamespace();
        return ns === 'test.my-view-from-pipeline';
      },
      {
        timeoutMsg:
          'Expected `test.my-view-from-pipeline` namespace tab to be visible',
      }
    );
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
    const messageElement = await browser.$(
      Selectors.stageEditorErrorMessage(0)
    );
    await messageElement.waitForDisplayed();
    // The exact error we get depends on the version of mongodb
    /*
    expect(await messageElement.getText()).to.include(
      'operation exceeded time limit'
    );
    */
  });

  it('supports $out as the last stage', async function () {
    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$out');
    await browser.setAceValue(Selectors.stageEditor(0), "'my-out-collection'");

    await waitForAnyText(browser, await browser.$(Selectors.stageContent(0)));

    await browser.clickVisible(Selectors.AddStageButton);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setAceValue(Selectors.stageEditor(1), `{ i: 5 }`);

    await waitForAnyText(browser, await browser.$(Selectors.stageContent(1)));

    // make sure it complains that it must be the last stage
    await browser.waitUntil(
      async () => {
        const messageElement = await browser.$(
          Selectors.stageEditorErrorMessage(1)
        );
        await messageElement.waitForDisplayed();
        const text = await messageElement.getText();
        return text === '$out can only be the final stage in the pipeline';
      },
      {
        timeoutMsg:
          'Waited for the error "$out can only be the final stage in the pipeline"',
      }
    );

    // delete the stage after $out
    await browser.clickVisible(Selectors.stageDelete(1));

    // run the $out stage
    await browser.clickVisible(Selectors.stageOutSaveButton(0));

    // go to the new collection
    await browser.clickVisible(Selectors.stageOutCollectionLink(0));

    await browser.waitUntil(
      async function () {
        const ns = await browser.getActiveTabNamespace();
        return ns === 'test.my-out-collection';
      },
      {
        timeoutMsg:
          'Expected `test.my-out-collection` namespace tab to be visible',
      }
    );
  });

  it('supports $merge as the last stage', async function () {
    if (semver.lt(MONGODB_VERSION, '4.2.0')) {
      return this.skip();
    }

    await browser.focusStageOperator(0);
    await browser.selectStageOperator(0, '$merge');
    await browser.setAceValue(
      Selectors.stageEditor(0),
      `{
  into: 'my-merge-collection'
}`
    );

    await waitForAnyText(browser, await browser.$(Selectors.stageContent(0)));

    await browser.clickVisible(Selectors.AddStageButton);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setAceValue(Selectors.stageEditor(1), `{ i: 5 }`);

    await waitForAnyText(browser, await browser.$(Selectors.stageContent(1)));

    // make sure it complains that it must be the last stage
    await browser.waitUntil(
      async () => {
        const messageElement = await browser.$(
          Selectors.stageEditorErrorMessage(1)
        );
        await messageElement.waitForDisplayed();
        const text = await messageElement.getText();
        return text === '$merge can only be the final stage in the pipeline';
      },
      {
        timeoutMsg:
          'Waited for the error "$merge can only be the final stage in the pipeline"',
      }
    );

    // delete the stage after $out
    await browser.clickVisible(Selectors.stageDelete(1));

    // run the $out stage
    await browser.clickVisible(Selectors.stageMergeSaveButton(0));

    // go to the new collection
    await browser.clickVisible(Selectors.stageMergeCollectionLink(0));

    await browser.waitUntil(
      async function () {
        const ns = await browser.getActiveTabNamespace();
        return ns === 'test.my-merge-collection';
      },
      {
        timeoutMsg:
          'Expected `test.my-merge-collection` namespace tab to be visible',
      }
    );
  });

  it('allows creating a new pipeline from text', async function () {
    await browser.clickVisible(Selectors.NewPipelineActions);
    const menuElement = await browser.$(Selectors.NewPipelineActionsMenu);
    await menuElement.waitForDisplayed();
    const linkElement = await menuElement.$('a=New Pipeline From Text');
    await linkElement.click();

    const createModal = await browser.$(Selectors.NewPipelineFromTextModal);
    await createModal.waitForDisplayed();

    await browser.setAceValue(
      Selectors.NewPipelineFromTextEditor,
      `[
  { $match: { i: 5 } }
]`
    );

    const confirmButton = await browser.$(
      Selectors.NewPipelineFromTextConfirmButton
    );
    await confirmButton.waitForEnabled();
    await confirmButton.click();

    await createModal.waitForDisplayed({ reverse: true });

    const confirmModal = await browser.$(Selectors.ConfirmImportPipelineModal);
    await confirmModal.waitForDisplayed();
    await browser.clickVisible(
      Selectors.ConfirmImportPipelineModalConfirmButton
    );
    await confirmModal.waitForDisplayed({ reverse: true });

    const contentElement = await browser.$(Selectors.stageContent(0));
    expect(await contentElement.getText()).to.equal(`{
  i: 5
}`);

    await browser.waitUntil(async function () {
      const textElement = await browser.$(
        Selectors.stagePreviewToolbarTooltip(0)
      );
      const text = await textElement.getText();
      return text === '(Sample of 1 document)';
    });
  });

  // TODO: stages can be re-arranged by drag and drop and the preview is refreshed after rearranging them
  // TODO: test auto-preview and limit
  // TODO: save a pipeline, close compass, re-open compass, load the pipeline
  // TODO: test Collapse/Expand all stages button (currently broken)
});
