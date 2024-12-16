import chai from 'chai';
import { promises as fs } from 'fs';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  outputFilename,
  serverSatisfies,
  skipForWeb,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createNestedDocumentsCollection,
  createNumbersCollection,
} from '../helpers/insert-data';
import { saveAggregationPipeline } from '../helpers/commands/save-aggregation-pipeline';
import { Key } from 'webdriverio';
import type { ChainablePromiseElement } from 'webdriverio';

const { expect } = chai;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OUT_STAGE_PREVIEW_TEXT =
  'The $out operator will cause the pipeline to persist the results to the specified location (collection, S3, or Atlas). If the collection exists it will be replaced.';
const MERGE_STAGE_PREVIEW_TEXT =
  'The $merge operator will cause the pipeline to persist the results to the specified location.';
const STAGE_WIZARD_GUIDE_CUE_STORAGE_KEY = 'has_seen_stage_wizard_guide_cue';

async function waitForAnyText(
  browser: CompassBrowser,
  element: ChainablePromiseElement
) {
  await browser.waitUntil(async () => {
    const text = await element.getText();
    return text !== '';
  });
}

async function goToRunAggregation(browser: CompassBrowser) {
  if (await browser.$(Selectors.AggregationBuilderWorkspace).isDisplayed()) {
    await browser.clickVisible(Selectors.RunPipelineButton);
  }
  const resultsWorkspace = browser.$(Selectors.AggregationResultsWorkspace);
  await resultsWorkspace.waitForDisplayed();
}

async function goToEditPipeline(browser: CompassBrowser) {
  if (await browser.$(Selectors.AggregationResultsWorkspace).isDisplayed()) {
    await browser.clickVisible(Selectors.EditPipelineButton);
  }
  const builderWorkspace = browser.$(Selectors.AggregationBuilderWorkspace);
  await builderWorkspace.waitForDisplayed();
}

async function getDocuments(browser: CompassBrowser) {
  // Switch to JSON view so it's easier to get document value
  await browser.clickVisible(Selectors.AggregationResultsJSONListSwitchButton);

  const documents = await browser.getCodemirrorEditorTextAll(
    Selectors.DocumentJSONEntry
  );

  return documents.map((text) => {
    return JSON.parse(text);
  });
}

async function waitForTab(browser: CompassBrowser, namespace: string) {
  await browser.waitUntil(
    async function () {
      const ns = await browser.getActiveTabNamespace();
      return ns === namespace;
    },
    {
      timeoutMsg: `Expected \`${namespace}\` namespace tab to be visible`,
    }
  );
}

async function switchPipelineMode(
  browser: CompassBrowser,
  mode: 'as-text' | 'builder-ui'
) {
  await browser.clickVisible(Selectors.aggregationPipelineModeToggle(mode));
  await browser.waitForAnimations(Selectors.AggregationBuilderWorkspace);
}

async function deleteStage(
  browser: CompassBrowser,
  index: number
): Promise<void> {
  await browser.clickVisible(Selectors.stageMoreOptions(index));
  const menuElement = browser.$(Selectors.StageMoreOptionsContent);
  await menuElement.waitForDisplayed();
  await browser.clickVisible(Selectors.StageDelete);
}

function getStageContainers(browser: CompassBrowser) {
  return browser.$$(Selectors.StageCard);
}

async function addStage(browser: CompassBrowser, expectedStages: number) {
  expect(await getStageContainers(browser).length).to.equal(expectedStages - 1);

  await browser.clickVisible(Selectors.AddStageButton);
  await browser.$(Selectors.stageEditor(expectedStages - 1)).waitForDisplayed();

  expect(await getStageContainers(browser).length).to.equal(expectedStages);
}

describe('Collection aggregations tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createNestedDocumentsCollection('nestedDocs', 10);
    await browser.disconnectAll();
    await browser.connectToDefaults();
    // set guide cue to not show up
    await browser.execute((key) => {
      localStorage.setItem(key, 'true');
    }, STAGE_WIZARD_GUIDE_CUE_STORAGE_KEY);

    // Some tests navigate away from the numbers collection aggregations tab
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Aggregations'
    );
    // Get us back to the empty stage every time. Also test the Create New
    // Pipeline flow while at it.
    await browser.clickVisible(Selectors.CreateNewPipelineButton);

    // This is kinda superfluous for the nested beforeEach hooks below where we
    // immediately navigate away anyway, but most tests expect there to already
    // be one stage.
    await addStage(browser, 1);
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('supports the right stages for the environment', async function () {
    const options = await browser.getStageOperators(0);

    const expectedAggregations = [
      '$addFields',
      '$bucket',
      '$bucketAuto',
      '$collStats',
      '$count',
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
      '$skip',
      '$sort',
      '$sortByCount',
      '$unwind',
    ];

    if (serverSatisfies('>= 4.1.11')) {
      expectedAggregations.push('$search');
    }
    if (serverSatisfies('>= 4.2.0')) {
      expectedAggregations.push('$merge', '$replaceWith', '$set', '$unset');
    }
    if (serverSatisfies('>= 4.4.0')) {
      expectedAggregations.push('$unionWith');
    }
    if (serverSatisfies('>= 4.4.9')) {
      expectedAggregations.push('$searchMeta');
    }
    if (serverSatisfies('>= 5.0.0')) {
      expectedAggregations.push('$setWindowFields');
    }
    if (serverSatisfies('>= 5.1.0')) {
      expectedAggregations.push('$densify');
    }
    if (serverSatisfies('>= 5.3.0')) {
      expectedAggregations.push('$fill');
    }
    if (serverSatisfies('>=6.0.10 <7.0.0 || >=7.0.2')) {
      expectedAggregations.push('$vectorSearch');
    }

    expectedAggregations.sort();

    expect(options).to.deep.equal(expectedAggregations);
  });

  // TODO: we can probably remove this one now that there is a more advanced one. or merge that into here?
  it('supports creating an aggregation', async function () {
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: 0 }'
    );

    await browser.waitUntil(async function () {
      const textElement = browser.$(Selectors.stagePreviewToolbarTooltip(0));
      const text = await textElement.getText();
      return text === '(Sample of 1 document)';
    });
  });

  it('shows atlas only stage preview', async function () {
    if (serverSatisfies('< 4.1.11')) {
      this.skip();
    }

    await browser.selectStageOperator(0, '$search');

    await browser.waitUntil(async function () {
      const textElement = browser.$(Selectors.stagePreview(0));
      const text = await textElement.getText();
      return text.includes(
        'The $search stage is only available with MongoDB Atlas.'
      );
    });
  });

  it('shows $out stage preview', async function () {
    await browser.selectStageOperator(0, '$out');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '"listings"'
    );

    const preview = browser.$(Selectors.stagePreview(0));
    const text = await preview.getText();

    expect(text).to.include('Documents will be saved to test.listings.');
    expect(text).to.include(OUT_STAGE_PREVIEW_TEXT);
  });

  it('shows $merge stage preview', async function () {
    // $merge operator is supported from 4.2.0
    if (serverSatisfies('< 4.2.0')) {
      return this.skip();
    }

    await browser.selectStageOperator(0, '$merge');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '"listings"'
    );

    const preview = browser.$(Selectors.stagePreview(0));
    const text = await preview.getText();

    expect(text).to.include('Documents will be saved to test.listings.');
    expect(text).to.include(MERGE_STAGE_PREVIEW_TEXT);
  });

  it('shows empty preview', async function () {
    await browser.selectStageOperator(0, '$addFields');

    await browser.waitUntil(async function () {
      const textElement = browser.$(Selectors.stagePreviewEmpty(0));
      const text = await textElement.getText();
      return text === 'No Preview Documents';
    });
  });

  it('supports tweaking settings of an aggregation and saving aggregation as a view', async function () {
    // set a collation
    await browser.clickVisible(Selectors.AggregationAdditionalOptionsButton);
    await browser.setValueVisible(
      Selectors.AggregationCollationInput,
      '{ locale: "af" }'
    );

    // select $match
    await browser.selectStageOperator(0, '$match');
    // check that it included the comment by default
    const contentElement0 = browser.$(Selectors.stageContent(0));

    // It starts out empty
    await waitForAnyText(browser, contentElement0);

    expect(await contentElement0.getText()).to.equal(`/**
 * query: The query in MQL.
 */
{
  query
}`);

    //change $match
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: { $gt: 5 } }'
    );

    // TODO: click collapse and then expand again

    // open settings
    await browser.clickVisible(Selectors.AggregationSettingsButton);

    // turn off comment mode
    await browser.clickParent(Selectors.AggregationCommentModeCheckbox);

    // set number of preview documents to 100
    await browser.setValueVisible(Selectors.AggregationSampleSizeInput, '100');

    // apply settings
    await browser.clickVisible(Selectors.AggregationSettingsApplyButton);

    // add a $project
    await addStage(browser, 2);
    await browser.selectStageOperator(1, '$project');

    // delete it
    await deleteStage(browser, 1);

    // add a $project
    await addStage(browser, 2);
    await browser.selectStageOperator(1, '$project');

    // check that it has no comment
    const contentElement1 = browser.$(Selectors.stageContent(1));

    // starts empty
    await waitForAnyText(browser, contentElement1);

    expect(await contentElement1.getText()).to.equal(`{
  specification(s)
}`);
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(1),
      '{ _id: 0 }'
    );

    // disable it
    await browser.clickVisible(Selectors.stageToggle(1));

    await browser.waitUntil(
      async () => {
        const stageToggle = browser.$(Selectors.stageToggle(1));
        return (await stageToggle.getAttribute('aria-checked')) === 'false';
      },
      { timeoutMsg: 'Expected stage toggle to be turned off' }
    );

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
      const textElement = browser.$(Selectors.stagePreviewToolbarTooltip(0));
      const text = await textElement.getText();
      return text === '(Sample of 100 documents)';
    });

    // Wait until the isCreateViewAvailable prop is changed
    // and the "Create view" action is available in the Save button menu.
    await browser.waitUntil(async () => {
      await browser.clickVisible(Selectors.SavePipelineMenuButton);
      const savePipelineCreateViewAction = browser.$(
        Selectors.SavePipelineCreateViewAction
      );
      const savePipelineCreateViewActionExisting =
        await savePipelineCreateViewAction.isExisting();

      return savePipelineCreateViewActionExisting;
    });

    await browser.clickVisible(Selectors.SavePipelineCreateViewAction);

    // wait for the modal to appear
    const createViewModal = browser.$(Selectors.CreateViewModal);
    await createViewModal.waitForDisplayed();

    // set view name
    await browser.setValueVisible(
      Selectors.CreateViewNameInput,
      'my-view-from-pipeline'
    );

    // click create button
    const createButton = browser
      .$(Selectors.CreateViewModal)
      .$('button=Create');

    await createButton.click();

    // wait until the active tab is the view that we just created
    await waitForTab(browser, 'test.my-view-from-pipeline');

    // choose Duplicate view
    await browser.selectCollectionMenuItem(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'my-view-from-pipeline',
      'duplicate-view'
    );
    const duplicateModal = browser.$(Selectors.DuplicateViewModal);

    // wait for the modal, fill out the modal, confirm
    await duplicateModal.waitForDisplayed();
    await browser.setValueVisible(
      Selectors.DuplicateViewModalTextInput,
      'duplicated-view'
    );
    const confirmDuplicateButton = browser.$(
      Selectors.DuplicateViewModalConfirmButton
    );
    await confirmDuplicateButton.waitForEnabled();

    await confirmDuplicateButton.click();
    await duplicateModal.waitForDisplayed({ reverse: true });

    // wait for the active tab to become the newly duplicated view
    await waitForTab(browser, 'test.duplicated-view');

    // now select modify view of the non-duplicate
    await browser.selectCollectionMenuItem(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'my-view-from-pipeline',
      'modify-view'
    );

    // wait for the active tab to become the numbers collection (because that's what the pipeline representing the view is for)
    await waitForTab(browser, 'test.numbers');

    // make sure we're on the aggregations tab, in edit mode
    const modifyBanner = browser.$(Selectors.ModifySourceBanner);
    await modifyBanner.waitForDisplayed();

    expect(await modifyBanner.getText()).to.equal(
      'MODIFYING PIPELINE BACKING "TEST.MY-VIEW-FROM-PIPELINE"'
    );
  });

  describe('maxTimeMS', function () {
    before(function () {
      skipForWeb(
        this,
        "we don't support getFeature() and setFeature() in compass-web yet"
      );
    });

    let maxTimeMSBefore: any;

    beforeEach(async function () {
      maxTimeMSBefore = await browser.getFeature('maxTimeMS');
    });

    afterEach(async function () {
      await browser.setFeature('maxTimeMS', maxTimeMSBefore);
    });

    for (const maxTimeMSMode of ['ui', 'preference'] as const) {
      it(`supports maxTimeMS (set via ${maxTimeMSMode})`, async function () {
        if (maxTimeMSMode === 'ui') {
          // open settings
          await browser.clickVisible(
            Selectors.AggregationAdditionalOptionsButton
          );

          // set maxTimeMS
          await browser.setValueVisible(
            Selectors.AggregationMaxTimeMSInput,
            '100'
          );
        }

        if (maxTimeMSMode === 'preference') {
          await browser.openSettingsModal();
          const settingsModal = browser.$(Selectors.SettingsModal);
          await settingsModal.waitForDisplayed();
          await browser.clickVisible(Selectors.GeneralSettingsButton);

          await browser.setValueVisible(
            Selectors.SettingsInputElement('maxTimeMS'),
            '1'
          );
          await browser.clickVisible(Selectors.SaveSettingsButton);
        }

        // run a projection that will take lots of time
        await browser.selectStageOperator(0, '$match');

        await browser.waitUntil(async function () {
          const textElement = browser.$(
            Selectors.stagePreviewToolbarTooltip(0)
          );
          const text = await textElement.getText();
          return text === '(Sample of 0 documents)';
        });

        const syntaxMessageElement = browser.$(
          Selectors.stageEditorSyntaxErrorMessage(0)
        );
        await syntaxMessageElement.waitForDisplayed();

        // 100 x sleep(100) = 10s total execution time
        // This works better than a $project with sleep(10000),
        // where the DB may not interrupt the sleep() call if it
        // has already started.
        await browser.setCodemirrorEditorValue(
          Selectors.stageEditor(0),
          `{
        $expr: {
          $and: [${[...Array(100).keys()]
            .map(
              () =>
                `{ $function: { body: 'function() { sleep(100) }', args: [], lang: 'js' } }`
            )
            .join(',')}]
        }
      }`
        );

        // make sure we got the timeout error
        const messageElement = browser.$(Selectors.stageEditorErrorMessage(0));
        await messageElement.waitForDisplayed();
        // The exact error we get depends on the version of mongodb
        /*
        expect(await messageElement.getText()).to.include(
          'operation exceeded time limit'
        );
        */
      });
    }
  });

  it('supports $out as the last stage', async function () {
    await browser.selectStageOperator(0, '$out');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      "'my-out-collection'"
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(0)));

    await addStage(browser, 2);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(1),
      `{ i: 5 }`
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(1)));

    // delete the stage after $out
    await deleteStage(browser, 1);

    // run the $out stage
    await browser.clickVisible(Selectors.RunPipelineButton);

    // confirm the write operation
    const writeOperationConfirmationModal = browser.$(
      Selectors.AggregationWriteOperationConfirmationModal
    );
    await writeOperationConfirmationModal.waitForDisplayed();

    const description = await browser
      .$(Selectors.AggregationWriteOperationConfirmationModalDescription)
      .getText();

    expect(description).to.contain('creating');
    expect(description).to.contain('test.my-out-collection');

    await browser.clickVisible(
      Selectors.AggregationWriteOperationConfirmButton
    );

    await writeOperationConfirmationModal.waitForDisplayed({ reverse: true });

    // go to the new collection
    const goToCollectionButton = browser.$(Selectors.GoToCollectionButton);
    await goToCollectionButton.waitForDisplayed();
    await browser.clickVisible(Selectors.GoToCollectionButton);

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

  it('cancels pipeline with $out as the last stage', async function () {
    await browser.selectStageOperator(0, '$out');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      "'numbers'"
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(0)));

    await addStage(browser, 2);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(1),
      `{ i: 5 }`
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(1)));

    // delete the stage after $out
    await deleteStage(browser, 1);

    // run the $out stage
    await browser.clickVisible(Selectors.RunPipelineButton);

    // confirm the write operation
    const writeOperationConfirmationModal = browser.$(
      Selectors.AggregationWriteOperationConfirmationModal
    );
    await writeOperationConfirmationModal.waitForDisplayed();

    const description = await browser
      .$(Selectors.AggregationWriteOperationConfirmationModalDescription)
      .getText();

    expect(description).to.contain('overwriting');
    expect(description).to.contain('test.numbers');

    await browser.clickVisible(Selectors.AggregationWriteOperationCancelButton);
    await writeOperationConfirmationModal.waitForDisplayed({ reverse: true });

    // the pipeline can be futher edited
    await waitForAnyText(browser, browser.$(Selectors.stageContent(0)));
  });

  it('supports $merge as the last stage', async function () {
    if (serverSatisfies('< 4.2.0')) {
      return this.skip();
    }

    await browser.selectStageOperator(0, '$merge');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      `{
  into: 'my-merge-collection'
}`
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(0)));

    await browser.clickVisible(Selectors.AddStageButton);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(1),
      `{ i: 5 }`
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(1)));

    // delete the stage after $out
    await deleteStage(browser, 1);

    // run the $merge stage
    await browser.clickVisible(Selectors.RunPipelineButton);

    // confirm the write operation
    const writeOperationConfirmationModal = browser.$(
      Selectors.AggregationWriteOperationConfirmationModal
    );
    await writeOperationConfirmationModal.waitForDisplayed();

    const description = await browser
      .$(Selectors.AggregationWriteOperationConfirmationModalDescription)
      .getText();

    expect(description).to.contain('altering');
    expect(description).to.contain('test.my-merge-collection');

    await browser.clickVisible(
      Selectors.AggregationWriteOperationConfirmButton
    );

    await writeOperationConfirmationModal.waitForDisplayed({ reverse: true });

    // go to the new collection
    const goToCollectionButton = browser.$(Selectors.GoToCollectionButton);
    await goToCollectionButton.waitForDisplayed();
    await browser.clickVisible(Selectors.GoToCollectionButton);

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

  it('cancels pipeline with $merge as the last stage', async function () {
    if (serverSatisfies('< 4.2.0')) {
      return this.skip();
    }

    await browser.selectStageOperator(0, '$merge');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      "'numbers'"
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(0)));

    await browser.clickVisible(Selectors.AddStageButton);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(1),
      `{ i: 5 }`
    );

    await waitForAnyText(browser, browser.$(Selectors.stageContent(1)));

    // delete the stage after $out
    await deleteStage(browser, 1);

    // run the $out stage
    await browser.clickVisible(Selectors.RunPipelineButton);

    // confirm the write operation
    const writeOperationConfirmationModal = browser.$(
      Selectors.AggregationWriteOperationConfirmationModal
    );
    await writeOperationConfirmationModal.waitForDisplayed();

    const description = await browser
      .$(Selectors.AggregationWriteOperationConfirmationModalDescription)
      .getText();

    expect(description).to.contain('altering');
    expect(description).to.contain('test.numbers');

    await browser.clickVisible(Selectors.AggregationWriteOperationCancelButton);
    await writeOperationConfirmationModal.waitForDisplayed({ reverse: true });

    // the pipeline can be futher edited
    await waitForAnyText(browser, browser.$(Selectors.stageContent(0)));
  });

  it('supports running and editing aggregation', async function () {
    // Set first stage to match
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: 5 }'
    );

    // Run and wait for results
    await goToRunAggregation(browser);

    // Get all documents from the current results page
    const docs = await getDocuments(browser);

    expect(docs).to.have.lengthOf(1);
    expect(docs[0]).to.have.property('_id');
    expect(docs[0]).to.have.property('i', 5);
    expect(docs[0]).to.have.property('j', 0);

    // Go back to the pipeline builder
    await goToEditPipeline(browser);

    // Change match filter
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: { $gte: 5, $lte: 10 } }'
    );

    // Run and wait for results
    await goToRunAggregation(browser);

    // Get all documents from the current results page
    const updatedDocs = await getDocuments(browser);

    // Check that the documents are matching pipeline
    expect(updatedDocs).to.have.lengthOf(6);
    expect(updatedDocs[0]).to.have.property('i', 5);
    expect(updatedDocs[1]).to.have.property('i', 6);
    expect(updatedDocs[2]).to.have.property('i', 7);
    expect(updatedDocs[3]).to.have.property('i', 8);
    expect(updatedDocs[4]).to.have.property('i', 9);
    expect(updatedDocs[5]).to.have.property('i', 10);
  });

  it('supports paginating aggregation results', async function () {
    // Set first stage to $match
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: { $gte: 5 } }'
    );

    // Add second $limit stage
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$limit');
    await browser.setCodemirrorEditorValue(Selectors.stageEditor(1), '25');

    // Run and wait for results
    await goToRunAggregation(browser);

    const page1 = await getDocuments(browser);
    expect(page1).to.have.lengthOf(20);
    expect(page1[0]).to.have.property('i', 5);

    await browser.clickVisible(Selectors.AggregationRestultsNextPageButton);
    await browser.waitUntil(async () => {
      const paginationDescription = browser.$(
        Selectors.AggregationRestultsPaginationDescription
      );
      return (await paginationDescription.getText()) === 'Showing 21 – 25';
    });

    const page2 = await getDocuments(browser);
    expect(page2).to.have.lengthOf(5);
    expect(page2[0]).to.have.property('i', 25);
  });

  it('supports cancelling long-running aggregations', async function () {
    if (serverSatisfies('< 4.4.0')) {
      // $function expression that we use to simulate slow aggregation is only
      // supported since server 4.4
      this.skip();
    }

    const slowQuery = `{
      sleep: {
        $function: {
          body: function () {
            return sleep(10000) || true;
          },
          args: [],
          lang: "js",
        },
      },
    }`;

    // Set first stage to a very slow $addFields
    await browser.selectStageOperator(0, '$addFields');
    await browser.setCodemirrorEditorValue(Selectors.stageEditor(0), slowQuery);

    // Run and wait for results
    await goToRunAggregation(browser);

    // Cancel aggregation run
    await browser.clickVisible(Selectors.AggregationResultsCancelButton);
    // Wait for the empty results banner (this is our indicator that we didn't
    // load anything and dismissed "Loading" banner)
    const emptyResultsBanner = browser.$(Selectors.AggregationEmptyResults);
    await emptyResultsBanner.waitForDisplayed();
  });

  it('handles errors in aggregations', async function () {
    // Disable autopreview so we can run an aggregation that will cause an error
    await browser.clickVisible(Selectors.AggregationAutoPreviewToggle);

    // Set first stage to an invalid $project stage to trigger server error
    await browser.selectStageOperator(0, '$project');
    await browser.setCodemirrorEditorValue(Selectors.stageEditor(0), '{}');

    // Run and wait for results
    await goToRunAggregation(browser);

    const errorBanner = browser.$(Selectors.AggregationErrorBanner);
    await errorBanner.waitForDisplayed();
    const errorText = await errorBanner.getText();

    expect(errorText).to.match(
      /(\$project )?specification must have at least one field/
    );
  });

  it('supports exporting aggregation results', async function () {
    skipForWeb(this, 'export is not yet available in compass-web');

    // Set first stage to $match.
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: 5 }'
    );

    // Open the modal.
    await browser.clickVisible(Selectors.ExportAggregationResultsButton);
    const exportModal = browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // Make sure the aggregation is shown in the modal.
    const exportModalAggregationTextElement = browser.$(
      Selectors.ExportModalCodePreview
    );
    expect(await exportModalAggregationTextElement.getText()).to
      .equal(`db.getCollection('numbers').aggregate(
  [{ $match: { i: 5 } }],
  { maxTimeMS: 60000, allowDiskUse: true }
);`);

    await browser.clickVisible(Selectors.ExportModalExportButton);

    // Set the filename.
    const filename = outputFilename('aggregated-numbers.json');
    await browser.setExportFilename(filename);

    // Wait for the modal to go away.
    const exportModalElement = browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    await browser.waitForExportToFinishAndCloseToast();

    // Confirm that we exported what we expected to export
    const text = await fs.readFile(filename, 'utf-8');
    const docs = JSON.parse(text);

    expect(docs).to.have.lengthOf(1);
    expect(docs[0]).to.have.property('_id');
    expect(docs[0]).to.have.property('i', 5);
    expect(docs[0]).to.have.property('j', 0);
  });

  it('shows the explain for a pipeline', async function () {
    // Set first stage to $match
    await browser.selectStageOperator(0, '$match');
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(0),
      '{ i: 5 }'
    );

    await browser.clickVisible(Selectors.AggregationExplainButton);
    await browser.waitForAnimations(Selectors.AggregationExplainModal);

    const modal = browser.$(Selectors.AggregationExplainModal);
    await modal.waitForDisplayed();
    await browser.waitForAnimations(Selectors.AggregationExplainModal);

    expect(await modal.getText()).to.contain('Query Performance Summary');

    await browser.clickVisible(Selectors.AggregationExplainModalCloseButton);
    await modal.waitForDisplayed({ reverse: true });
  });

  it('shows confirmation modal when create new pipeline is clicked and aggregation is modified', async function () {
    await browser.selectStageOperator(0, '$match');
    await browser.clickConfirmationAction(Selectors.CreateNewPipelineButton);
  });

  describe('aggregation builder in text mode', function () {
    it('toggles pipeline mode', async function () {
      // Select operator
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );

      await switchPipelineMode(browser, 'as-text');
      const textContent = browser.$(Selectors.AggregationAsTextEditor);
      expect(await textContent.getText()).to.contain(`[
  {
    $match: {
      i: 5
    }
  }
]`);

      await switchPipelineMode(browser, 'builder-ui');
      const stageContent = browser.$(Selectors.stageContent(0));
      expect(await stageContent.getText()).to.equal(`{
  i: 5
}`);
    });

    it('runs pipeline in text mode when changed', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$count: "count"}]'
      );

      const docsPreview = browser.$(Selectors.AggregationAsTextPreviewDocument);
      await docsPreview.waitForDisplayed();
      const text = (await docsPreview.getText())
        .replace(/\n/g, ' ')
        .replace(/\s+?:/g, ':')
        .replace(/\s+/g, ' ');
      expect(text).to.contain('count: 1000');
    });

    it('previews $out stage', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$out: "somewhere"}]'
      );

      const preview = browser.$(Selectors.AggregationAsTextPreviewOut);
      await preview.waitForDisplayed();
      const text = await preview.getText();
      expect(text).to.contain(
        'The $out operator will cause the pipeline to persist the results to the specified location'
      );
    });

    it('previews $merge stage', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$merge: "somewhere"}]'
      );

      const preview = browser.$(Selectors.AggregationAsTextPreviewMerge);
      await preview.waitForDisplayed();
      const text = await preview.getText();
      expect(text).to.contain(
        'The $merge operator will cause the pipeline to persist the results to the specified location'
      );
    });

    it('previews atlas operators - $search', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$search: {}}]'
      );

      const preview = browser.$(
        Selectors.AggregationAsTextPreviewAtlasOperator
      );
      await preview.waitForDisplayed();
      expect(await preview.getText()).to.include(
        'The $search stage is only available with MongoDB Atlas'
      );
    });

    it('previews atlas operators - $searchMeta', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$searchMeta: {}}]'
      );

      const preview = browser.$(
        Selectors.AggregationAsTextPreviewAtlasOperator
      );
      await preview.waitForDisplayed();
      expect(await preview.getText()).to.include(
        'The $searchMeta stage is only available with MongoDB Atlas'
      );
    });

    it('shows syntax error when pipeline is invalid', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$out: "somewhere"]'
      );

      const errors = browser.$(Selectors.AggregationAsTextErrorContainer);
      expect(await errors.getText()).to.include('Unexpected token');
    });

    it('disables mode toggle when pipeline is invalid', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      await browser.setCodemirrorEditorValue(
        Selectors.AggregationAsTextEditor,
        '[{$out: "somewhere"]'
      );
      const toggle = browser.$(
        Selectors.aggregationPipelineModeToggle('builder-ui')
      );
      await toggle.waitForEnabled({ reverse: true });
    });

    it('hides preview when disabled', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await switchPipelineMode(browser, 'as-text');

      const preview = browser.$(Selectors.AggregationAsTextPreview);
      await preview.waitForDisplayed();

      await browser.clickVisible(Selectors.AggregationAutoPreviewToggle);

      await preview.waitForDisplayed({ reverse: true });
    });
  });

  describe('saving pipelines', function () {
    before(function () {
      skipForWeb(this, 'saved pipelines not yet available in compass-web');
    });

    const name = 'test agg 1';
    beforeEach(async function () {
      await saveAggregationPipeline(browser, name, [
        {
          $match: '{ i: 0 }',
        },
      ]);
      // create a new pipeline to make sure we don't have anything open
      await browser.clickVisible(Selectors.CreateNewPipelineButton);
    });

    it('opens an aggregation without confirmation when its not modified', async function () {
      await browser.waitForAnimations(
        Selectors.AggregationOpenSavedPipelinesButton
      );
      await browser.clickVisible(Selectors.AggregationOpenSavedPipelinesButton);
      await browser.waitForAnimations(
        Selectors.AggregationSavedPipelinesPopover
      );
      await browser.hover(Selectors.AggregationSavedPipelineCard(name));

      await browser.clickVisible(
        Selectors.AggregationSavedPipelineCardOpenButton(name)
      );

      const content = browser.$(Selectors.stageContent(0));
      await waitForAnyText(browser, content);
      expect(await content.getText()).to.equal(`{
  i: 0
}`);
    });

    it('opens an aggregation with confirmation when its modified', async function () {
      await addStage(browser, 1);
      await browser.selectStageOperator(0, '$match');

      await browser.waitForAnimations(
        Selectors.AggregationOpenSavedPipelinesButton
      );
      await browser.clickVisible(Selectors.AggregationOpenSavedPipelinesButton);
      await browser.waitForAnimations(
        Selectors.AggregationSavedPipelinesPopover
      );
      await browser.hover(Selectors.AggregationSavedPipelineCard(name));

      await browser.clickConfirmationAction(
        Selectors.AggregationSavedPipelineCardOpenButton(name)
      );
    });

    it('deletes an aggregation', async function () {
      await browser.waitForAnimations(
        Selectors.AggregationOpenSavedPipelinesButton
      );
      await browser.clickVisible(Selectors.AggregationOpenSavedPipelinesButton);
      await browser.waitForAnimations(
        Selectors.AggregationSavedPipelinesPopover
      );
      await browser.hover(Selectors.AggregationSavedPipelineCard(name));

      await browser.clickConfirmationAction(
        Selectors.AggregationSavedPipelineCardDeleteButton(name)
      );
    });
  });

  describe('focus mode', function () {
    it('opens and closes the modal', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );
      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      await browser.$(Selectors.FocusModeStageInput).waitForDisplayed();
      await browser.$(Selectors.FocusModeStageEditor).waitForDisplayed();
      await browser.$(Selectors.FocusModeStageOutput).waitForDisplayed();

      await browser.clickVisible(Selectors.FocusModeCloseModalButton);

      await modal.waitForDisplayed({ reverse: true });
    });

    it('navigates between stages', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );

      await browser.clickVisible(Selectors.AddStageButton);
      await browser.$(Selectors.stageEditor(1)).waitForDisplayed();
      await browser.selectStageOperator(1, '$limit');
      await browser.setCodemirrorEditorValue(Selectors.stageEditor(1), '10');

      await browser.clickVisible(Selectors.AddStageButton);
      await browser.$(Selectors.stageEditor(2)).waitForDisplayed();
      await browser.selectStageOperator(2, '$sort');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(2),
        '{ i: -1 }'
      );

      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      const nextButton = browser.$(Selectors.FocusModeNextStageButton);
      const previousButton = browser.$(Selectors.FocusModePreviousStageButton);

      await nextButton.waitForDisplayed();
      await previousButton.waitForDisplayed();

      await browser.waitForAriaDisabled(previousButton, true);

      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 1: $match';
      });

      await nextButton.click();
      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 2: $limit';
      });

      await nextButton.click();
      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 3: $sort';
      });

      await browser.waitForAriaDisabled(nextButton, true);

      await previousButton.click();
      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 2: $limit';
      });

      await previousButton.click();
      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 1: $match';
      });
      await browser.waitForAriaDisabled(previousButton, true);

      // previousButton has a tooltip, to close it we press Escape
      // and wait a bit (for the debounced close to kick in)
      await browser.keys([Key.Escape]);
      await sleep(50);

      // the next Escape is for the modal to close
      await browser.keys([Key.Escape]);

      await modal.waitForDisplayed({ reverse: true });
    });

    it('adds a new stage before or after current stage', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );

      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 1: $match';
      });

      const addStageMenu = browser.$(Selectors.FocusModeAddStageMenuButton);
      await addStageMenu.waitForDisplayed();

      // Add a stage before the current stage.
      await addStageMenu.click();

      const addStageBeforeButton = browser.$(
        Selectors.FocusModeAddStageBeforeMenuItem
      );
      await addStageBeforeButton.waitForDisplayed();
      await addStageBeforeButton.click();

      await browser.waitUntil(async () => {
        const labelElem = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await labelElem.getText()) === 'Stage 1: select';
      });

      // Add a stage after the current stage.
      await addStageMenu.click();

      const addStageAfterButton = browser.$(
        Selectors.FocusModeAddStageAfterMenuItem
      );
      await addStageAfterButton.waitForDisplayed();
      await addStageAfterButton.click();

      await browser.waitUntil(async () => {
        const activeStage = browser.$(Selectors.FocusModeActiveStageLabel);
        return (await activeStage.getText()) === 'Stage 2: select';
      });

      await browser.clickVisible(Selectors.FocusModeCloseModalButton);

      await modal.waitForDisplayed({ reverse: true });
    });

    it('hides stage input and output when preview is disabled', async function () {
      await browser.clickVisible(Selectors.AggregationAutoPreviewToggle);

      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 5 }'
      );

      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      await browser
        .$(Selectors.FocusModeStageInput)
        .waitForDisplayed({ reverse: true });
      await browser.$(Selectors.FocusModeStageEditor).waitForDisplayed();
      await browser
        .$(Selectors.FocusModeStageOutput)
        .waitForDisplayed({ reverse: true });
    });

    it('handles $out stage operators', async function () {
      await browser.selectStageOperator(0, '$out');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '"test"'
      );

      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      await browser.waitUntil(async () => {
        const outputElem = browser.$(Selectors.FocusModeStageOutput);
        const text = await outputElem.getText();
        return text.includes(OUT_STAGE_PREVIEW_TEXT);
      });
    });

    it('handles $merge stage operators', async function () {
      if (serverSatisfies('< 4.2.0')) {
        return this.skip();
      }

      await browser.selectStageOperator(0, '$merge');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '"test"'
      );

      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      await browser.waitUntil(async () => {
        const outputElem = browser.$(Selectors.FocusModeStageOutput);
        const text = await outputElem.getText();
        return text.includes(MERGE_STAGE_PREVIEW_TEXT);
      });
    });

    it('handles atlas only operator', async function () {
      if (serverSatisfies('< 4.1.11')) {
        this.skip();
      }

      await browser.selectStageOperator(0, '$search');
      await browser.setCodemirrorEditorValue(Selectors.stageEditor(0), '{}');

      await browser.clickVisible(Selectors.stageFocusModeButton(0));
      const modal = browser.$(Selectors.FocusModeModal);
      await modal.waitForDisplayed();

      await browser.waitUntil(async () => {
        const outputElem = browser.$(Selectors.FocusModeStageOutput);
        const text = await outputElem.getText();
        return text.includes(
          'The $search stage is only available with MongoDB Atlas.'
        );
      });
    });
  });

  describe('aggregation wizard', function () {
    it('should toggle the aggregation side panel', async function () {
      await browser.toggleAggregationSidePanel('opened');
      const numUseCases = await browser.$$(Selectors.AggregationWizardUseCases)
        .length;
      expect(numUseCases).to.be.greaterThan(0);
      await browser.toggleAggregationSidePanel('closed');
    });

    it('should add a stage wizard in the end of the list of the stages when a usecase is clicked in the aggregation side panel', async function () {
      const numStages = await browser.$$(Selectors.StageCard).length;
      await browser.addWizard('sort', numStages);
    });

    it('should dismiss the stage wizard when clicked on "Cancel" button on stage wizard', async function () {
      const numStages = await browser.$$(Selectors.StageCard).length;
      await browser.addWizard('sort', numStages);
      const wizardCard = browser.$(
        Selectors.AggregationWizardCardAtIndex(numStages)
      );

      await browser.clickVisible(Selectors.AggregationWizardDismissButton);
      await wizardCard.waitForDisplayed({ reverse: true });
    });

    it("should be able to convert a wizard ($sort wizard) to a stage, inserted at the wizard's index", async function () {
      const oldLength = await browser.$$(Selectors.StageCard).length;
      await browser.addWizard('sort', oldLength);

      await browser.setComboBoxValue(
        // 0 because at this point we only have one row of fields to be selected
        Selectors.AggregationWizardSortFormField(0),
        'name'
      );

      await browser.selectOption(
        `${Selectors.AggregationWizardSortFormDirectionSelect(0)} button`,
        'Ascending'
      );

      await browser.clickVisible(Selectors.AggregationWizardApplyButton);

      const stageCard = browser.$(Selectors.StageCardAtIndex(oldLength));
      await stageCard.waitForDisplayed();

      const stageContent = await browser
        .$(Selectors.stageContent(oldLength))
        .getText();
      expect(stageContent).to.equal(`{
  name: 1
}`);
    });
  });

  describe('expanding and collapsing of documents', function () {
    beforeEach(async function () {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'nestedDocs',
        'Aggregations'
      );

      await addStage(browser, 1);
    });

    context('when on stage builder mode', function () {
      it('should expand/collapse all the docs for a stage when "Expand documents" / "Collapse documents" menu option is clicked', async function () {
        await browser.selectStageOperator(0, '$match');
        await browser.setCodemirrorEditorValue(
          Selectors.stageEditor(0),
          '{ "names.firstName": "1-firstName" }'
        );

        const previewDocument = browser.$(
          `${Selectors.stagePreview(0)} ${Selectors.HadronDocument}`
        );
        await previewDocument.waitForDisplayed();

        await browser.selectStageMenuOption(
          0,
          Selectors.StagePreviewDocsExpand
        );
        const numExpandedHadronElements = await browser.$$(
          `${Selectors.stagePreview(0)} ${Selectors.HadronDocument} ${
            Selectors.HadronDocumentElement
          }`
        ).length;
        expect(numExpandedHadronElements).to.equal(14);

        await browser.selectStageMenuOption(
          0,
          Selectors.StagePreviewDocsCollapse
        );
        const numCollapsedHadronElements = await browser.$$(
          `${Selectors.stagePreview(0)} ${Selectors.HadronDocument} ${
            Selectors.HadronDocumentElement
          }`
        ).length;
        expect(numCollapsedHadronElements).to.equal(4);
      });

      it('should retain the docs expanded / collapsed state even after switching tabs', async function () {
        await browser.selectStageOperator(0, '$match');
        await browser.setCodemirrorEditorValue(
          Selectors.stageEditor(0),
          '{ "names.firstName": "1-firstName" }'
        );

        const previewDocument = browser.$(
          `${Selectors.stagePreview(0)} ${Selectors.HadronDocument}`
        );
        await previewDocument.waitForDisplayed();

        await browser.selectStageMenuOption(
          0,
          Selectors.StagePreviewDocsExpand
        );
        const numExpandedHadronElements = await browser.$$(
          `${Selectors.stagePreview(0)} ${Selectors.HadronDocument} ${
            Selectors.HadronDocumentElement
          }`
        ).length;
        expect(numExpandedHadronElements).to.equal(14);

        await browser.navigateWithinCurrentCollectionTabs('Documents');
        await browser.navigateWithinCurrentCollectionTabs('Aggregations');
        const numExpandedHadronElementsPostSwitch = await browser.$$(
          `${Selectors.stagePreview(0)} ${Selectors.HadronDocument} ${
            Selectors.HadronDocumentElement
          }`
        ).length;
        expect(numExpandedHadronElementsPostSwitch).to.equal(14);
      });
    });

    context('when on text mode', function () {
      beforeEach(async function () {
        await switchPipelineMode(browser, 'as-text');
        await browser.setCodemirrorEditorValue(
          Selectors.AggregationAsTextEditor,
          '[{$match: { "names.firstName": "1-firstName" }}]'
        );
        const docsPreview = browser.$(
          Selectors.AggregationAsTextPreviewDocument
        );
        await docsPreview.waitForDisplayed();
      });

      it('should be able to expand / collapse all the preview documents for the pipeline', async function () {
        await browser.selectTextPipelineOutputOption('expand');
        const numExpandedHadronElements = await browser.$$(
          `${Selectors.AggregationAsTextPreview} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedHadronElements).to.equal(14);

        await browser.selectTextPipelineOutputOption('collapse');
        const numCollapsedHadronElements = await browser.$$(
          `${Selectors.AggregationAsTextPreview} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numCollapsedHadronElements).to.equal(4);
      });

      it('should be able to retain the expanded / collapsed state when switching between views', async function () {
        await browser.selectTextPipelineOutputOption('expand');
        const numExpandedHadronElements = await browser.$$(
          `${Selectors.AggregationAsTextPreview} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedHadronElements).to.equal(14);

        await browser.navigateWithinCurrentCollectionTabs('Documents');
        await browser.navigateWithinCurrentCollectionTabs('Aggregations');
        const numExpandedHadronElementsPostSwitch = await browser.$$(
          `${Selectors.AggregationAsTextPreview} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedHadronElementsPostSwitch).to.equal(14);
      });
    });

    context('when in focus mode', function () {
      beforeEach(async function () {
        await browser.$(Selectors.stageEditor(0)).waitForDisplayed();
        await browser.selectStageOperator(0, '$match');
        await browser.setCodemirrorEditorValue(
          Selectors.stageEditor(0),
          '{ "names.firstName": "1-firstName" }'
        );

        await addStage(browser, 2);
        await browser.selectStageOperator(1, '$limit');
        await browser.setCodemirrorEditorValue(Selectors.stageEditor(1), '1');

        await browser.clickVisible(Selectors.stageFocusModeButton(0));
        const modal = browser.$(Selectors.FocusModeModal);
        await modal.waitForDisplayed();

        await browser.$(Selectors.FocusModeStageInput).waitForDisplayed();
        await browser.$(Selectors.FocusModeStageEditor).waitForDisplayed();
        await browser.$(Selectors.FocusModeStageOutput).waitForDisplayed();
      });

      it('should be able to expand/collapse input preview', async function () {
        await browser.selectFocusModeStageOutputOption('stage-input', 'expand');
        const numExpandedInputElements = await browser.$$(
          `${Selectors.FocusModeStageInput} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedInputElements).to.equal(140); // We insert 10 docs and each has 14 hadron elements

        await browser.selectFocusModeStageOutputOption(
          'stage-input',
          'collapse'
        );
        const numCollapsedInputElements = await browser.$$(
          `${Selectors.FocusModeStageInput} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numCollapsedInputElements).to.equal(40);

        await browser.selectFocusModeStageOutputOption(
          'stage-output',
          'expand'
        );
        const numExpandedOutputElements = await browser.$$(
          `${Selectors.FocusModeStageOutput} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedOutputElements).to.equal(14); // There's only doc as output from the stage

        await browser.selectFocusModeStageOutputOption(
          'stage-output',
          'collapse'
        );
        const numCollapsedOutputElements = await browser.$$(
          `${Selectors.FocusModeStageOutput} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numCollapsedOutputElements).to.equal(4);
      });

      it('should be able to retain the expanded/collapsed even after stage switch', async function () {
        await browser.selectFocusModeStageOutputOption('stage-input', 'expand');
        const numExpandedInputElements = await browser.$$(
          `${Selectors.FocusModeStageInput} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedInputElements).to.equal(140);

        await browser.clickVisible(Selectors.FocusModeNextStageButton);
        await browser.clickVisible(Selectors.FocusModePreviousStageButton);

        const numExpandedInputElementsPostSwitch = await browser.$$(
          `${Selectors.FocusModeStageInput} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedInputElementsPostSwitch).to.equal(140);
      });
    });

    context('when on pipeline results', function () {
      beforeEach(async function () {
        expect(await getStageContainers(browser).length).to.equal(1);

        await browser.selectStageOperator(0, '$match');
        await browser.setCodemirrorEditorValue(
          Selectors.stageEditor(0),
          '{ "names.firstName": "1-firstName" }'
        );

        await goToRunAggregation(browser);
      });

      it('should be able to expand / collapse pipeline results', async function () {
        await browser.selectPipelineResultsOutputOption('expand');
        const numExpandedHadronElements = await browser.$$(
          `${Selectors.HadronDocument} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedHadronElements).to.equal(14);

        await browser.selectPipelineResultsOutputOption('collapse');
        const numCollapsedHadronElements = await browser.$$(
          `${Selectors.HadronDocument} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numCollapsedHadronElements).to.equal(4);
      });

      it('should retain the expanded / collapsed state even after switching tabs', async function () {
        await browser.selectPipelineResultsOutputOption('expand');
        const numExpandedHadronElements = await browser.$$(
          `${Selectors.HadronDocument} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedHadronElements).to.equal(14);

        await browser.navigateWithinCurrentCollectionTabs('Documents');
        await browser.navigateWithinCurrentCollectionTabs('Aggregations');

        const numExpandedHadronElementsPostSwitch = await browser.$$(
          `${Selectors.HadronDocument} ${Selectors.HadronDocumentElement}`
        ).length;
        expect(numExpandedHadronElementsPostSwitch).to.equal(14);
      });
    });
  });

  // TODO: stages can be re-arranged by drag and drop and the preview is refreshed after rearranging them
  // TODO: test auto-preview and limit
  // TODO: save a pipeline, close compass, re-open compass, load the pipeline
});
