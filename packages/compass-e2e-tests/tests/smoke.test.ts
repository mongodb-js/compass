import path from 'path';
import { promises as fs } from 'fs';
import _ from 'lodash';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import type { Browser } from 'webdriverio';
import { startTelemetryServer, Telemetry } from '../helpers/telemetry';
import {
  beforeTests,
  afterTests,
  afterTest,
  outputFilename,
  Compass,
} from '../helpers/compass';
import * as Commands from '../helpers/commands';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

chai.use(chaiAsPromised);

const NO_PREVIEW_DOCUMENTS = 'No Preview Documents';

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Smoke tests', function () {
  let compass: Compass;
  let browser: Browser<'async'>;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;

    await Commands.connectWithConnectionString(
      browser,
      'mongodb://localhost:27018/test'
    );
  });

  after(async function () {
    await afterTests(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  describe('Sidebar', function () {
    it('contains cluster info', async function () {
      const topologySingleHostAddressElement = await browser.$(
        Selectors.TopologySingleHostAddress
      );

      const topologySingleHostAddress =
        await topologySingleHostAddressElement.getText();
      expect(topologySingleHostAddress).to.equal('localhost:27018');

      const singleClusterTypeElement = await browser.$(
        Selectors.SingleClusterType
      );

      const singleClusterType = await singleClusterTypeElement.getText();
      expect(singleClusterType).to.equal('Standalone');

      const serverVersionTextElement = await browser.$(
        Selectors.ServerVersionText
      );

      const serverVersionText = await serverVersionTextElement.getText(); // the version number changes constantly and is different in CI
      expect(serverVersionText).to.include('MongoDB');
      expect(serverVersionText).to.include('Community');
    });

    it('contains a dbs/collections tree view');
    it('can search for a collection');
    it('can create a database and drop it');
    it('can create a collection and drop it');
    it('can edit a favourite');
  });

  describe('Databases tab', function () {
    before(async function () {
      await Commands.navigateToInstanceTab(browser, 'Databases');
    });

    it('contains a list of databases', async function () {
      const dbSelectors = ['admin', 'config', 'local', 'test'].map(
        Selectors.databaseCard
      );

      for (const dbSelector of dbSelectors) {
        const dbElement = await browser.$(dbSelector);
        await dbElement.waitForExist();
        // TODO: Storage Size, Collections, Indexes, Drop button
      }
    });

    it('can create a database and drop it');
    it('can kill slow queries via the performance tab');
  });

  describe('Collections tab', function () {
    before(async function () {
      await Commands.navigateToDatabaseTab(browser, 'test', 'Collections');
    });

    it('contains a list of collections', async function () {
      expect(
        await Commands.existsEventually(browser, Selectors.CollectionsGrid)
      ).to.eq(true);
    });

    // capped and not capped
    it('can create a collection and drop it');
  });

  describe('Collection screen', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Documents'
      );
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

  describe('Documents tab', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Documents'
      );
    });

    it('supports simple find operations', async function () {
      const telemetryEntry = Commands.listenForTelemetryEvents(
        browser,
        telemetry
      );
      await Commands.runFindOperation(browser, 'Documents', '{ i: 5 }');

      const documentListActionBarMessageElement = await browser.$(
        Selectors.DocumentListActionBarMessage
      );
      const text = await documentListActionBarMessageElement.getText();
      expect(text).to.equal('Displaying documents 1 - 1 of 1');
      const queryExecutedEvent = await telemetryEntry('Query Executed');
      expect(queryExecutedEvent).to.deep.equal({
        changed_maxtimems: false,
        collection_type: 'collection',
        has_collation: false,
        has_limit: false,
        has_projection: false,
        has_skip: false,
        used_regex: false,
      });
    });

    it('supports advanced find operations', async function () {
      const telemetryEntry = Commands.listenForTelemetryEvents(
        browser,
        telemetry
      );
      await Commands.runFindOperation(
        browser,
        'Documents',
        '{ i: { $gt: 5 } }',
        {
          project: '{ _id: 0 }',
          sort: '{ i: -1 }',
          skip: '5',
          limit: '50',
        }
      );

      const documentListActionBarMessageElement = await browser.$(
        Selectors.DocumentListActionBarMessage
      );
      const text = await documentListActionBarMessageElement.getText();
      expect(text).to.equal('Displaying documents 1 - 20 of 50');
      const queryExecutedEvent = await telemetryEntry('Query Executed');
      expect(queryExecutedEvent).to.deep.equal({
        changed_maxtimems: false,
        collection_type: 'collection',
        has_collation: false,
        has_limit: true,
        has_projection: true,
        has_skip: true,
        used_regex: false,
      });
    });

    it('supports cancelling a find and then running another query', async function () {
      // execute a query that will take a long time
      await Commands.runFindOperation(
        browser,
        'Documents',
        '{ $where: function() { return sleep(10000) || true; } }',
        {
          // Clearing out input fields has no effect for some reason so just set
          // it to something else. Otherwise setOrClearValue clears it but the
          // moment the field blurs it just goes back to what it was before
          skip: '0',
          waitForResult: false,
        }
      );

      // stop it
      const documentListFetchingElement = await browser.$(
        Selectors.DocumentListFetching
      );
      await documentListFetchingElement.waitForDisplayed();

      await Commands.clickVisible(
        browser,
        Selectors.DocumentListFetchingStopButton
      );

      const documentListErrorElement = await browser.$(
        Selectors.DocumentListError
      );
      await documentListErrorElement.waitForDisplayed();

      const errorText = await documentListErrorElement.getText();
      expect(errorText).to.equal('The operation was cancelled.');

      // execute another (small, fast) query
      await Commands.runFindOperation(browser, 'Documents', '{ i: 5 }');
      const documentListActionBarMessageElement = await browser.$(
        Selectors.DocumentListActionBarMessage
      );

      const displayText = await documentListActionBarMessageElement.getText();
      expect(displayText).to.equal('Displaying documents 1 - 1 of 1');
    });

    it('supports view/edit via list view');
    it('supports view/edit via json view');
    it('supports view/edit via table view');
    it('supports maxTimeMS');
    it('can reset query');
    // different languages, with and without imports, with and without driver usage
    it('can export to language');
    // JSON mode
    // field by field mode
    // array of JSON docs
    it('can insert document');
    // behaviour with multiple tabs
    it('can view query history');
    it('keeps the query when navigating to schema and explain');
    it('can copy/clone/delete a document from contextual toolbar');
  });

  describe('Aggregations tab', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Aggregations'
      );
    });

    // TODO
    it.skip('supports the right stages for the environment', async function () {
      // sanity check to make sure there's only one
      const stageContainers = await browser.$$(Selectors.StageContainer);
      expect(stageContainers).to.have.lengthOf(1);

      await Commands.focusStageOperator(browser, 0);

      const stageOperatorOptionsElement = await browser.$(
        Selectors.stageOperatorOptions(0)
      );
      const options = await stageOperatorOptionsElement.getText(0);
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
      await Commands.focusStageOperator(browser, 0);
      await Commands.selectStageOperator(browser, 0, '$match');
      await Commands.setAceValue(browser, Selectors.stageEditor(0), '{ i: 0 }');

      await browser.waitUntil(async function () {
        const textElement = await browser.$(
          Selectors.stagePreviewToolbarTooltip(0)
        );
        const text = await textElement.getText();
        return text === '(Sample of 1 document)';
      });
    });

    it('shows atlas only stage preview', async function () {
      await Commands.focusStageOperator(browser, 0);
      await Commands.selectStageOperator(browser, 0, '$search');

      await browser.waitUntil(async function () {
        const textElement = await browser.$(
          Selectors.atlasOnlyStagePreviewSection(0)
        );
        const text = await textElement.getText();
        return text.includes(
          'This stage is only available with MongoDB Atlas.'
        );
      });
    });

    it('shows empty preview', async function () {
      await Commands.focusStageOperator(browser, 0);
      await Commands.selectStageOperator(browser, 0, '$addFields');

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

  describe('Schema tab', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Schema'
      );
    });

    it('analyzes a schema', async function () {
      await Commands.clickVisible(browser, Selectors.AnalyzeSchemaButton);

      const element = await browser.$(Selectors.SchemaFieldList);
      await element.waitForDisplayed();
      const analysisMessageElement = await browser.$(Selectors.AnalysisMessage);
      const message = await analysisMessageElement.getText();
      // message contains non-breaking spaces
      expect(message.replace(/\s/g, ' ')).to.equal(
        'This report is based on a sample of 1000 documents.'
      );

      const fields = await browser.$$(Selectors.SchemaField);
      expect(fields).to.have.lengthOf(2);

      const schemaFieldNameElement = await browser.$$(
        Selectors.SchemaFieldName
      );
      const fieldNames = await Promise.all(
        schemaFieldNameElement.map((el) => el.getText())
      );
      expect(fieldNames).to.deep.equal(['_id', 'i']);

      const schemaFieldTypeListElement = await browser.$$(
        Selectors.SchemaFieldTypeList
      );
      const fieldTypes = await Promise.all(
        schemaFieldTypeListElement.map((el) => el.getText())
      );
      expect(fieldTypes).to.deep.equal(['objectid', 'int32']);
    });

    it('analyzes the schema with a query');
    it('can reset the query');
    it('can create a geoquery from a map');
    it('can create a geoquery from the charts');
    it('supports maxTimeMS');
  });

  describe('Explain Plan tab', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Explain Plan'
      );
    });

    it('supports queries not covered by an index', async function () {
      await Commands.clickVisible(browser, Selectors.ExecuteExplainButton);

      const element = await browser.$(Selectors.ExplainSummary);
      await element.waitForDisplayed();
      const stages = await browser.$$(Selectors.ExplainStage);
      expect(stages).to.have.lengthOf(1);
    });

    it('supports queries covered by an index');
    it('supports queries with a sort covered by an index');
    it('supports maxTimeMS');
    it('shows a visual explain plan for queries that result in a tree');
  });

  describe('Indexes tab', function () {
    // eslint-disable-next-line mocha/no-hooks-for-single-case
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Indexes'
      );
    });

    it('lists indexes', async function () {
      const element = await browser.$(Selectors.IndexList);
      await element.waitForDisplayed();

      const indexes = await browser.$$(Selectors.IndexComponent);
      expect(indexes).to.have.lengthOf(1);

      const nameColumnNameElement = await browser.$(Selectors.NameColumnName);
      expect(await nameColumnNameElement.getText()).to.equal('_id_');
    });

    it('supports creating and dropping indexes');
  });

  describe('Validation tab', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Validation'
      );
    });

    it('supports rules in JSON schema', async function () {
      await Commands.clickVisible(browser, Selectors.AddRuleButton);
      const element = await browser.$(Selectors.ValidationEditor);
      await element.waitForDisplayed();

      // Add validation that makes everything invalid

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await Commands.setValidation(
        browser,
        '{ $jsonSchema: { bsonType: "object", required: [ "phone" ] } }'
      );

      // nothing passed, everything failed
      await browser.waitUntil(async () => {
        const matchTextElement = await browser.$(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const matchText = await matchTextElement.getText();
        const notMatchingTextElement = await browser.$(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        const notMatchingText = await notMatchingTextElement.getText();
        return (
          matchText === NO_PREVIEW_DOCUMENTS &&
          notMatchingText !== NO_PREVIEW_DOCUMENTS
        );
      });

      // Reset the validation again to make everything valid for future tests

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await Commands.setValidation(browser, '{}');

      // nothing failed, everything passed
      await browser.waitUntil(async () => {
        const matchTextElement = await browser.$(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const matchText = await matchTextElement.getText();
        const notMatchingTextElement = await browser.$(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        const notMatchingText = await notMatchingTextElement.getText();
        return (
          matchText !== NO_PREVIEW_DOCUMENTS &&
          notMatchingText === NO_PREVIEW_DOCUMENTS
        );
      });
    });

    it('supports rules in MQL');
    it('does not allow invalid documents to be inserted');
  });

  describe('Import', function () {
    it('supports JSON arrays', async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'json-array',
        'Documents'
      );

      const array = [];
      for (let i = 0; i < 1000; ++i) {
        array.push({ n: i, n_square: i * i });
      }
      const json = JSON.stringify(array);

      await Commands.clickVisible(browser, Selectors.AddDataButton);
      const insertDocumentOption = await browser.$(
        Selectors.InsertDocumentOption
      );
      await insertDocumentOption.waitForDisplayed();
      await Commands.clickVisible(browser, Selectors.InsertDocumentOption);

      const insertDialog = await browser.$(Selectors.InsertDialog);
      await insertDialog.waitForDisplayed();
      await Commands.setAceValue(browser, Selectors.InsertJSONEditor, json);

      const insertConfirm = await browser.$(Selectors.InsertConfirm);
      // this selector is very brittle, so just make sure it works
      expect(await insertConfirm.isDisplayed()).to.be.true;
      expect(await insertConfirm.getText()).to.equal('Insert');
      await insertConfirm.waitForEnabled();
      await Commands.clickVisible(browser, Selectors.InsertConfirm);

      await insertDialog.waitForDisplayed({ reverse: true });
      const messageElement = await browser.$(
        Selectors.DocumentListActionBarMessage
      );
      await browser.waitUntil(async () => {
        const text = await messageElement.getText();
        return text === 'Displaying documents 1 - 20 of 1000';
      });
    });

    it('supports JSON files', async function () {
      const jsonPath = path.resolve(
        __dirname,
        '..',
        'fixtures',
        'listings.json'
      );

      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'json-file',
        'Documents'
      );

      // open the import modal
      await Commands.clickVisible(browser, Selectors.AddDataButton);
      const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
      await insertDocumentOption.waitForDisplayed();
      await Commands.clickVisible(browser, Selectors.ImportFileOption);

      // wait for the modal to appear and select the file
      const importModal = await browser.$(Selectors.ImportModal);
      await importModal.waitForDisplayed({ timeout: 10_000 });
      await Commands.selectFile(browser, Selectors.ImportFileInput, jsonPath);

      // make sure it auto-selected JSON and then confirm
      const fileTypeJSON = await browser.$(Selectors.FileTypeJSON);
      await browser.waitUntil(async () => {
        const selected = await fileTypeJSON.getAttribute('aria-selected');
        return selected === 'true';
      });
      await Commands.clickVisible(browser, Selectors.ImportConfirm);

      // wait for the done button to appear and then click it
      const doneButton = await browser.$(Selectors.ImportDone);
      await doneButton.waitForDisplayed({ timeout: 60_000 });
      await Commands.clickVisible(browser, Selectors.ImportDone);

      // wait for the modal to go away
      await importModal.waitForDisplayed({ reverse: false });
      const messageElement = await browser.$(
        Selectors.DocumentListActionBarMessage
      );
      const text = await messageElement.getText();
      expect(text).to.equal('Displaying documents 1 - 20 of 16116');
    });

    it('supports JSON files with select fields');
    it('supports JSON files with set field types');
    it('supports JSON files with extended json');
    it('supports malformed JSON array');
    it('supports malformed JSON lines file');
    it('supports CSV files with comma separator');
    it('supports CSV files with tab separator');
    it('supports CSV files with semicolon separator');
    it('supports CSV files with select fields');
    it('supports CSV files with set field types');
    it('supports malformed CSV file');
  });

  describe('Export', function () {
    before(async function () {
      await Commands.navigateToCollectionTab(
        browser,
        'test',
        'numbers',
        'Documents'
      );
    });

    it('supports collection to CSV with a query filter', async function () {
      const telemetryEntry = Commands.listenForTelemetryEvents(
        browser,
        telemetry
      );
      await Commands.runFindOperation(browser, 'Documents', '{ i: 5 }');
      await Commands.clickVisible(browser, Selectors.ExportCollectionButton);
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      const exportModalQueryTextElement = await browser.$(
        Selectors.ExportModalQueryText
      );
      expect(await exportModalQueryTextElement.getText()).to
        .equal(`db.numbers.find(
  {i: 5}
)`);

      await Commands.clickVisible(
        browser,
        Selectors.ExportModalSelectFieldsButton
      );

      // don't change any field selections for now
      await Commands.clickVisible(
        browser,
        Selectors.ExportModalSelectOutputButton
      );

      // select csv (unselected at first, selected by the end)
      await Commands.clickVisible(
        browser,
        Selectors.selectExportFileTypeButton('csv', false)
      );
      const selectExportFileTypeButtonElement = await browser.$(
        Selectors.selectExportFileTypeButton('csv', true)
      );
      await selectExportFileTypeButtonElement.waitForDisplayed();

      const filename = outputFilename('filtered-numbers.csv');

      await expect(fs.stat(filename)).to.be.rejected;

      // this is cheating a bit, but we cannot interact with the native dialog
      // it pops up from webdriver and writing to the readonly text field
      // doesn't help either.
      await browser.execute(function (f) {
        // eslint-disable-next-line no-undef
        document.dispatchEvent(
          // eslint-disable-next-line no-undef
          new CustomEvent('selectExportFileName', { detail: f })
        );
      }, filename);

      await browser.waitUntil(async () => {
        const exportModalFileText = await browser.$(
          Selectors.ExportModalFileText
        );
        const value = await exportModalFileText.getValue();
        if (value !== filename) {
          console.log(value, '!==', filename);
        }
        return value === filename;
      });

      await Commands.clickVisible(browser, Selectors.ExportModalExportButton);

      const exportModalShowFileButtonElement = await browser.$(
        Selectors.ExportModalShowFileButton
      );
      await exportModalShowFileButtonElement.waitForDisplayed();

      // clicking the button would open the file in finder/explorer/whatever
      // which is probably not something we can check with webdriver. But we can
      // check that the file exists.

      await Commands.clickVisible(browser, Selectors.ExportModalCloseButton);

      // the modal should go away
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
        timeout: 30_000, // Fixes flaky macOS CI.
      });

      const text = await fs.readFile(filename, 'utf-8');
      //  example:'_id,i\n6154788cc5f1fd4544fcedb1,5'
      const lines = text.split(/\r?\n/);
      expect(lines[0]).to.equal('_id,i');
      const fields = lines[1].split(',');
      // first field is an id, so always different
      expect(fields[1]).to.equal('5');

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'csv',
        all_fields: true,
        number_of_docs: 1,
        success: true,
      });
      expect(telemetry.screens()).to.include('export_modal');
    });

    it('supports full collection to CSV');
    it('supports collection to CSV with all fields');
    it('supports collection to CSV with a subset of fields');
    it('supports collection to JSON with a query filter');
    it('supports full collection to JSON');
    it('supports collection to JSON with all fields');
    it('supports collection to JSON with a subset of fields');
  });

  describe('Shell', function () {
    it('can be opened, collapsed and resized');
    it('supports running commands');
  });
});
