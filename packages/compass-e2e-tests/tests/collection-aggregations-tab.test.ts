import chai from 'chai';
import type { Element } from 'webdriverio';
import { promises as fs } from 'fs';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  afterTest,
  outputFilename,
  serverSatisfies,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { getStageOperators } from '../helpers/read-stage-operators';

const { expect } = chai;

async function waitForAnyText(
  browser: CompassBrowser,
  element: Element<'async'>
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
  const resultsWorkspace = await browser.$(
    Selectors.AggregationResultsWorkspace
  );
  await resultsWorkspace.waitForDisplayed();
}

async function goToEditPipeline(browser: CompassBrowser) {
  if (await browser.$(Selectors.AggregationResultsWorkspace).isDisplayed()) {
    await browser.clickVisible(Selectors.EditPipelineButton);
  }
  const builderWorkspace = await browser.$(
    Selectors.AggregationBuilderWorkspace
  );
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

async function chooseCollectionAction(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string,
  actionName: string
) {
  // search for the view in the sidebar
  await browser.clickVisible(Selectors.SidebarFilterInput);
  const sidebarFilterInputElement = await browser.$(
    Selectors.SidebarFilterInput
  );
  await sidebarFilterInputElement.setValue(collectionName);

  const collectionSelector = Selectors.sidebarCollection(
    dbName,
    collectionName
  );

  // scroll to the collection if necessary
  await browser.scrollToVirtualItem(
    Selectors.SidebarDatabaseAndCollectionList,
    collectionSelector,
    'tree'
  );

  const collectionElement = await browser.$(collectionSelector);
  await collectionElement.waitForDisplayed();

  // hover over the collection
  await browser.hover(collectionSelector);

  // click the show collections button
  // NOTE: This assumes it is currently closed
  await browser.clickVisible(Selectors.CollectionShowActionsButton);

  const actionSelector = `[role="menuitem"][data-action="${actionName}"]`;

  const actionButton = await browser.$(actionSelector);

  // click the action
  await browser.clickVisible(actionSelector);

  // make sure the menu closed
  await actionButton.waitForDisplayed({ reverse: true });
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

async function saveAggregation(
  browser: CompassBrowser,
  aggregationName: string,
  pipeline: Record<string, any>[]
) {
  for (let index = 0; index < pipeline.length; index++) {
    const stage = pipeline[index];
    const stageOperator = Object.keys(stage)[0];
    const stageValue = stage[stageOperator];

    // add stage
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(index)).waitForDisplayed();

    await browser.focusStageOperator(index);
    await browser.selectStageOperator(index, stageOperator);
    await browser.setAceValue(Selectors.stageEditor(index), stageValue);
  }

  await browser.clickVisible(Selectors.SavePipelineMenuButton);
  const menuElement = await browser.$(Selectors.SavePipelineMenuContent);
  await menuElement.waitForDisplayed();
  await browser.clickVisible(Selectors.SavePipelineSaveAsAction);

  // wait for the modal to appear
  const savePipelineModal = await browser.$(Selectors.SavePipelineModal);
  await savePipelineModal.waitForDisplayed();

  // set aggregation name
  await browser.waitForAnimations(Selectors.SavePipelineNameInput);
  const pipelineNameInput = await browser.$(Selectors.SavePipelineNameInput);
  await pipelineNameInput.setValue(aggregationName);

  const createButton = await browser
    .$(Selectors.SavePipelineModal)
    .$('button=Save');

  await createButton.click();
}

async function deleteStage(
  browser: CompassBrowser,
  index: number
): Promise<void> {
  await browser.clickVisible(Selectors.stageMoreOptions(index));
  const menuElement = await browser.$(Selectors.StageMoreOptionsContent);
  await menuElement.waitForDisplayed();
  await browser.clickVisible(Selectors.StageDelete);
}

describe('Collection aggregations tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
    // Some tests navigate away from the numbers collection aggregations tab
    await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    // Get us back to the empty stage every time. Also test the Create New
    // Pipeline flow while at it.
    await browser.clickVisible(Selectors.CreateNewPipelineButton);
    const modalElement = await browser.$(Selectors.ConfirmNewPipelineModal);
    await modalElement.waitForDisplayed();

    await browser.screenshot('confirm-new-pipeline-modal.png');

    await browser.clickVisible(Selectors.ConfirmNewPipelineModalConfirmButton);
    await modalElement.waitForDisplayed({ reverse: true });

    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(0)).waitForDisplayed();
    // sanity check to make sure there's only one stage
    const stageContainers = await browser.$$(Selectors.StageCard);
    expect(stageContainers).to.have.lengthOf(1);
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('supports the right stages for the environment', async function () {
    const options = await getStageOperators(browser, 0);

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

    expectedAggregations.sort();

    expect(options).to.deep.equal(expectedAggregations);
  });

  // TODO: we can probably remove this one now that there is a more advanced one. or merge that into here?
  it('supports creating an aggregation', async function () {
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
    if (serverSatisfies('< 4.1.11')) {
      this.skip();
    }

    await browser.selectStageOperator(0, '$search');

    await browser.waitUntil(async function () {
      const textElement = await browser.$(Selectors.stagePreview(0));
      const text = await textElement.getText();
      return text.includes(
        'The $search stage is only available with MongoDB Atlas.'
      );
    });
  });

  it('shows $out stage preview', async function () {
    await browser.selectStageOperator(0, '$out');
    await browser.setAceValue(Selectors.stageEditor(0), '"listings"');

    const preview = await browser.$(Selectors.stagePreview(0));
    const text = await preview.getText();

    expect(text).to.include('Documents will be saved to test.listings.');
    expect(text).to.include(
      'The $out operator will cause the pipeline to persist the results to the specified location (collection, S3, or Atlas). If the collection exists it will be replaced.'
    );
  });

  it('shows $merge stage preview', async function () {
    // $merge operator is supported from 4.2.0
    if (serverSatisfies('< 4.2.0')) {
      return this.skip();
    }

    await browser.selectStageOperator(0, '$merge');
    await browser.setAceValue(Selectors.stageEditor(0), '"listings"');

    const preview = await browser.$(Selectors.stagePreview(0));
    const text = await preview.getText();

    expect(text).to.include('Documents will be saved to test.listings.');
    expect(text).to.include(
      'The $merge operator will cause the pipeline to persist the results to the specified location.'
    );
  });

  it('shows empty preview', async function () {
    await browser.selectStageOperator(0, '$addFields');

    await browser.waitUntil(async function () {
      const textElement = await browser.$(Selectors.stagePreviewEmpty(0));
      const text = await textElement.getText();
      return text === 'No Preview Documents';
    });
  });

  it('supports tweaking settings of an aggregation and saving aggregation as a view', async function () {
    // set a collation
    await browser.clickVisible(Selectors.AggregationAdditionalOptionsButton);
    const collationInput = await browser.$(Selectors.AggregationCollationInput);
    await collationInput.waitForDisplayed();
    await collationInput.setValue('{ locale: "af" }');

    // select $match
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
    await browser.clickParent(Selectors.AggregationCommentModeCheckbox);

    // set number of preview documents to 100
    const sampleSizeElement = await browser.$(
      Selectors.AggregationSampleSizeInput
    );
    await sampleSizeElement.setValue('100');

    // apply settings
    await browser.clickVisible(Selectors.AggregationSettingsApplyButton);

    // add a $project
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.selectStageOperator(1, '$project');

    // delete it
    await deleteStage(browser, 1);

    // add a $project
    await browser.clickVisible(Selectors.AddStageButton);
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

    await browser.waitUntil(
      async () => {
        const stageToggle = await browser.$(Selectors.stageToggle(1));
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
      const textElement = await browser.$(
        Selectors.stagePreviewToolbarTooltip(0)
      );
      const text = await textElement.getText();
      return text === '(Sample of 100 documents)';
    });

    // Wait until the isCreateViewAvailable prop is changed
    // and the "Create view" action is available in the Save button menu.
    await browser.waitUntil(async () => {
      await browser.clickVisible(Selectors.SavePipelineMenuButton);
      const savePipelineCreateViewAction = await browser.$(
        Selectors.SavePipelineCreateViewAction
      );
      const savePipelineCreateViewActionExisting =
        await savePipelineCreateViewAction.isExisting();

      return savePipelineCreateViewActionExisting;
    });

    await browser.clickVisible(Selectors.SavePipelineCreateViewAction);

    // wait for the modal to appear
    const createViewModal = await browser.$(Selectors.CreateViewModal);
    await createViewModal.waitForDisplayed();

    // set view name
    await browser.waitForAnimations(Selectors.CreateViewNameInput);
    const viewNameInput = await browser.$(Selectors.CreateViewNameInput);
    await viewNameInput.setValue('my-view-from-pipeline');

    await browser.screenshot('create-view-modal.png');

    // click create button
    const createButton = await browser
      .$(Selectors.CreateViewModal)
      .$('button=Create');

    await createButton.click();

    // wait until the active tab is the view that we just created
    await waitForTab(browser, 'test.my-view-from-pipeline');

    // choose Duplicate view
    await chooseCollectionAction(
      browser,
      'test',
      'my-view-from-pipeline',
      'duplicate-view'
    );
    const duplicateModal = await browser.$(Selectors.DuplicateViewModal);

    // wait for the modal, fill out the modal, confirm
    await duplicateModal.waitForDisplayed();
    await browser
      .$(Selectors.DuplicateViewModalTextInput)
      .setValue('duplicated-view');
    const confirmDuplicateButton = await browser.$(
      Selectors.DuplicateViewModalConfirmButton
    );
    confirmDuplicateButton.waitForEnabled();

    await browser.screenshot('duplicate-view-modal.png');

    await confirmDuplicateButton.click();
    await duplicateModal.waitForDisplayed({ reverse: true });

    // wait for the active tab to become the newly duplicated view
    await waitForTab(browser, 'test.duplicated-view');

    // now select modify view of the non-duplicate
    await chooseCollectionAction(
      browser,
      'test',
      'my-view-from-pipeline',
      'modify-view'
    );

    // wait for the active tab to become the numbers collection (because that's what the pipeline representing the view is for)
    await waitForTab(browser, 'test.numbers');

    // make sure we're on the aggregations tab, in edit mode
    const modifyBanner = await browser.$(Selectors.ModifySourceBanner);
    await modifyBanner.waitForDisplayed();
    expect(await modifyBanner.getText()).to.equal(
      'MODIFYING PIPELINE BACKING "TEST.MY-VIEW-FROM-PIPELINE"'
    );
  });

  describe('maxTimeMS', function () {
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
          const maxTimeMSElement = await browser.$(
            Selectors.AggregationMaxTimeMSInput
          );
          await maxTimeMSElement.setValue('100');
        }

        if (maxTimeMSMode === 'preference') {
          await browser.openSettingsModal();
          const settingsModal = await browser.$(Selectors.SettingsModal);
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
          const textElement = await browser.$(
            Selectors.stagePreviewToolbarTooltip(0)
          );
          const text = await textElement.getText();
          return text === '(Sample of 0 documents)';
        });

        const syntaxMessageElement = await browser.$(
          Selectors.stageEditorSyntaxErrorMessage(0)
        );
        await syntaxMessageElement.waitForDisplayed();

        // 100 x sleep(100) = 10s total execution time
        // This works better than a $project with sleep(10000),
        // where the DB may not interrupt the sleep() call if it
        // has already started.
        await browser.setAceValue(
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
    }
  });

  it('supports $out as the last stage', async function () {
    await browser.selectStageOperator(0, '$out');
    await browser.setAceValue(Selectors.stageEditor(0), "'my-out-collection'");

    await waitForAnyText(browser, await browser.$(Selectors.stageContent(0)));

    await browser.clickVisible(Selectors.AddStageButton);

    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$match');
    await browser.setAceValue(Selectors.stageEditor(1), `{ i: 5 }`);

    await waitForAnyText(browser, await browser.$(Selectors.stageContent(1)));

    // delete the stage after $out
    await deleteStage(browser, 1);

    // run the $out stage
    await browser.clickVisible(Selectors.RunPipelineButton);
    const goToCollectionButton = await browser.$(
      Selectors.GoToCollectionButton
    );
    await goToCollectionButton.waitForDisplayed();
    // go to the new collection
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

  it('supports $merge as the last stage', async function () {
    if (serverSatisfies('< 4.2.0')) {
      return this.skip();
    }

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

    // delete the stage after $out
    await deleteStage(browser, 1);

    // run the $merge stage
    await browser.clickVisible(Selectors.RunPipelineButton);
    const goToCollectionButton = await browser.$(
      Selectors.GoToCollectionButton
    );
    await goToCollectionButton.waitForDisplayed();
    // go to the new collection
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

  it('supports running and editing aggregation', async function () {
    // Set first stage to match
    await browser.selectStageOperator(0, '$match');
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');

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
    await browser.setAceValue(
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
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: { $gte: 5 } }');

    // Add second $limit stage
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.focusStageOperator(1);
    await browser.selectStageOperator(1, '$limit');
    await browser.setAceValue(Selectors.stageEditor(1), '25');

    // Run and wait for results
    await goToRunAggregation(browser);

    const page1 = await getDocuments(browser);
    expect(page1).to.have.lengthOf(20);
    expect(page1[0]).to.have.property('i', 5);

    await browser.clickVisible(Selectors.AggregationRestultsNextPageButton);
    await browser.waitUntil(async () => {
      const paginationDescription = await browser.$(
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
    await browser.setAceValue(Selectors.stageEditor(0), slowQuery);

    // Run and wait for results
    await goToRunAggregation(browser);

    // Cancel aggregation run
    await browser.clickVisible(Selectors.AggregationResultsCancelButton);
    // Wait for the empty results banner (this is our indicator that we didn't
    // load anything and dismissed "Loading" banner)
    const emptyResultsBanner = await browser.$(
      Selectors.AggregationEmptyResults
    );
    await emptyResultsBanner.waitForDisplayed();
  });

  it('handles errors in aggregations', async function () {
    // Disable autopreview so we can run an aggregation that will cause an error
    await browser.clickVisible(Selectors.AggregationAutoPreviewToggle);

    // Set first stage to an invalid $project stage to trigger server error
    await browser.selectStageOperator(0, '$project');
    await browser.setAceValue(Selectors.stageEditor(0), '{}');

    // Run and wait for results
    await goToRunAggregation(browser);

    const errorBanner = await browser.$(Selectors.AggregationErrorBanner);
    await errorBanner.waitForDisplayed();
    const errorText = await errorBanner.getText();

    expect(errorText).to.match(
      /(\$project )?specification must have at least one field/
    );
  });

  it('supports exporting aggregation results', async function () {
    // Set first stage to $match
    await browser.selectStageOperator(0, '$match');
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');

    // Open the modal
    await browser.clickVisible(Selectors.ExportAggregationResultsButton);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // Set filename
    const filename = outputFilename('aggregated-numbers.json');
    await browser.setExportFilename(filename);

    // Start export and wait for results
    await browser.clickVisible(Selectors.ExportModalExportButton);
    const exportModalShowFileButtonElement = await browser.$(
      Selectors.ExportModalShowFileButton
    );
    await exportModalShowFileButtonElement.waitForDisplayed();

    await browser.screenshot('export-modal.png');

    // Close modal
    await browser.clickVisible(Selectors.ExportModalCloseButton);
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({ reverse: true });

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
    await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');

    await browser.clickVisible(Selectors.AggregationExplainButton);
    await browser.waitForAnimations(Selectors.AggregationExplainModal);

    const modal = await browser.$(Selectors.AggregationExplainModal);
    await modal.waitForDisplayed();
    await browser.waitForAnimations(Selectors.AggregationExplainModal);

    expect(await modal.getText()).to.contain('Query Performance Summary');

    await browser.screenshot('aggregation-explain-modal.png');

    await browser.clickVisible(Selectors.AggregationExplainModalCloseButton);
    await modal.waitForDisplayed({ reverse: true });
  });

  describe('aggregation builder in text mode', function () {
    it('toggles pipeline mode', async function () {
      // Select operator
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');

      await switchPipelineMode(browser, 'as-text');
      const textContent = await browser.$(Selectors.AggregationAsTextEditor);
      expect(await textContent.getText()).to.contain(`[
  {
    $match: {
      i: 5,
    },
  },
]`);

      await switchPipelineMode(browser, 'builder-ui');
      const stageContent = await browser.$(Selectors.stageContent(0));
      expect(await stageContent.getText()).to.equal(`{
  i: 5,
}`);
    });

    it('runs pipeline in text mode when changed', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$count: "count"}]'
      );

      const docsPreview = await browser.$(
        Selectors.AggregationAsTextPreviewDocument
      );
      await docsPreview.waitForDisplayed();
      const text = (await docsPreview.getText())
        .replace(/\n/g, ' ')
        .replace(/\s+?:/g, ':')
        .replace(/\s+/g, ' ');
      expect(text).to.contain('count: 1000');
    });

    it('previews $out stage', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$out: "somewhere"}]'
      );

      const preview = await browser.$(Selectors.AggregationAsTextPreviewOut);
      await preview.waitForDisplayed();
      const text = await preview.getText();
      expect(text).to.contain(
        'The $out operator will cause the pipeline to persist the results to the specified location'
      );
    });

    it('previews $merge stage', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$merge: "somewhere"}]'
      );

      const preview = await browser.$(Selectors.AggregationAsTextPreviewMerge);
      await preview.waitForDisplayed();
      const text = await preview.getText();
      expect(text).to.contain(
        'The $merge operator will cause the pipeline to persist the results to the specified location'
      );
    });

    it('previews atlas operators - $search', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$search: {}}]'
      );

      const preview = await browser.$(
        Selectors.AggregationAsTextPreviewAtlasOperator
      );
      await preview.waitForDisplayed();
      expect(await preview.getText()).to.include(
        'The $search stage is only available with MongoDB Atlas'
      );
    });

    it('previews atlas operators - $searchMeta', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$searchMeta: {}}]'
      );

      const preview = await browser.$(
        Selectors.AggregationAsTextPreviewAtlasOperator
      );
      await preview.waitForDisplayed();
      expect(await preview.getText()).to.include(
        'The $searchMeta stage is only available with MongoDB Atlas'
      );
    });

    it('shows syntax error when pipeline is invalid', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$out: "somewhere"]'
      );

      const errors = await browser.$(Selectors.AggregationAsTextErrorContainer);
      expect(await errors.getText()).to.include('Unexpected token');
    });

    it('disables mode toggle when pipeline is invalid', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      await browser.setAceValue(
        Selectors.AggregationAsTextEditor,
        '[{$out: "somewhere"]'
      );
      const toggle = await browser.$(
        Selectors.aggregationPipelineModeToggle('builder-ui')
      );
      await toggle.waitForEnabled({ reverse: true });
    });

    it('hides preview when disabled', async function () {
      await browser.selectStageOperator(0, '$match');
      await browser.setAceValue(Selectors.stageEditor(0), '{ i: 5 }');
      await switchPipelineMode(browser, 'as-text');

      const preview = await browser.$(Selectors.AggregationAsTextPreview);
      await preview.waitForDisplayed();

      await browser.clickVisible(Selectors.AggregationAutoPreviewToggle);

      await preview.waitForDisplayed({ reverse: true });
    });
  });

  describe('saving pipelines', function () {
    const name = 'test agg 1';
    beforeEach(async function () {
      await saveAggregation(browser, name, [
        {
          $match: '{ i: 0 }',
        },
      ]);
      await browser.waitForAnimations(
        Selectors.AggregationOpenSavedPipelinesButton
      );
      await browser.clickVisible(Selectors.AggregationOpenSavedPipelinesButton);
      await browser.waitForAnimations(
        Selectors.AggregationSavedPipelinesPopover
      );
      await browser.hover(Selectors.AggregationSavedPipelineCard(name));
    });

    it('opens an aggregation', async function () {
      await browser.clickVisible(
        Selectors.AggregationSavedPipelineCardOpenButton(name)
      );

      const confirmOpenModal = await browser.$(
        Selectors.AggregationSavedPipelineConfirmOpenModal
      );
      await confirmOpenModal.waitForDisplayed();
      const openButton = await browser
        .$(Selectors.AggregationSavedPipelineConfirmOpenModal)
        .$('button=Open Pipeline');

      await openButton.click();
      await confirmOpenModal.waitForDisplayed({ reverse: true });
    });

    it('deletes an aggregation', async function () {
      await browser.clickVisible(
        Selectors.AggregationSavedPipelineCardDeleteButton(name)
      );

      const confirmDeleteModal = await browser.$(
        Selectors.AggregationSavedPipelineConfirmDeleteModal
      );
      await confirmDeleteModal.waitForDisplayed();
      const deleteButton = await browser
        .$(Selectors.AggregationSavedPipelineConfirmDeleteModal)
        .$('button=Delete Pipeline');

      await deleteButton.click();
      await confirmDeleteModal.waitForDisplayed({ reverse: true });
    });
  });

  // TODO: stages can be re-arranged by drag and drop and the preview is refreshed after rearranging them
  // TODO: test auto-preview and limit
  // TODO: save a pipeline, close compass, re-open compass, load the pipeline
  // TODO: test Collapse/Expand all stages button (currently broken)
});
