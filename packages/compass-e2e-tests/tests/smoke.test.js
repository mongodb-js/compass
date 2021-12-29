// @ts-check
const path = require('path');
const { promises: fs } = require('fs');
const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { startTelemetryServer } = require('../helpers/telemetry');

const { expect } = chai;

chai.use(chaiAsPromised);

const {
  beforeTests,
  afterTests,
  afterTest,
  outputFilename,
} = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

const NO_PREVIEW_DOCUMENTS = 'No Preview Documents';

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Smoke tests', function () {
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let app;
  let page;
  let commands;
  let telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    ({ app, page, commands } = await beforeTests());

    await commands.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  after(async function () {
    await afterTests(app, page);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(app, page, this.currentTest);
  });

  describe('Sidebar', function () {
    it('contains cluster info', async function () {
      const topologySingleHostAddress = await page.textContent(
        Selectors.TopologySingleHostAddress
      );

      expect(topologySingleHostAddress).to.equal('localhost:27018');

      const singleClusterType = await page.textContent(
        Selectors.SingleClusterType
      );

      expect(singleClusterType).to.equal('Standalone');

      const serverVersionText = await page.textContent(
        Selectors.ServerVersionText
      );

      // the version number changes constantly and is different in CI
      expect(serverVersionText).to.include('MongoDB');
      expect(serverVersionText).to.include('Community');
    });

    it('contains a dbs/collections tree view');
    it('can search for a collection');
    it('can create a database and drop it');
    it('can create a collection and drop it');
    it('can edit a favourite');
  });

  describe('Interface screen', function () {
    before(async function () {
      await commands.navigateToInstanceTab('Databases');
    });

    it('contains a list of databases', async function () {
      const dbSelectors = ['admin', 'config', 'local', 'test'].map(
        Selectors.databaseCard
      );

      for (const dbSelector of dbSelectors) {
        expect(await page.isVisible(dbSelector)).to.be.true;
        // TODO: Storage Size, Collections, Indexes, Drop button
      }
    });

    it('can create a database and drop it');
    it('can kill slow queries via the performance tab');
  });

  describe('Database screen', function () {
    before(async function () {
      await commands.navigateToDatabaseTab('test', 'Collections');
    });

    it('contains a list of collections', async function () {
      expect(
        await commands.existsEventually(Selectors.CollectionsGrid)
      ).to.eq(true);
    });

    // capped and not capped
    it('can create a collection and drop it');
  });

  describe('Collection screen', function () {
    before(async function () {
      await commands.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('contains the collection tabs', async function () {
      const tabSelectors = [
        'Documents',
        'Aggregations',
        'Schema',
        'Explain Plan',
        'Indexes',
        'Validation',
      ].map(Selectors.collectionTab);

      for (const tabSelector of tabSelectors) {
        expect(await page.isVisible(tabSelector)).to.be.true;
      }
    });

    it('contains the collection stats', async function () {
      const documentCount = await page.textContent(Selectors.DocumentCountValue);
      expect(documentCount).to.equal('1k');
      const indexCount = await page.textContent(Selectors.IndexCountValue);
      expect(indexCount).to.equal('1');

      // all of these unfortunately differ slightly between different versions of mongodb
      const totalDocuments = await page.textContent(
        Selectors.StorageSizeValue
      );
      expect(totalDocuments).to.include('KB');
      const avgDocumentSize = await page.textContent(
        Selectors.AvgDocumentSizeValue
      );
      expect(avgDocumentSize).to.include('B');
      const totalIndexSize = await page.textContent(
        Selectors.TotalIndexSizeValue
      );
      expect(totalIndexSize).to.include('KB');
      const avgIndexSize = await page.textContent(
        Selectors.AvgIndexSizeValue
      );
      expect(avgIndexSize).to.include('KB');
    });
  });

  describe('Documents tab', function () {
    before(async function () {
      await commands.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('supports simple find operations', async function () {
      const telemetryEntry = await commands.listenForTelemetryEvents(telemetry);
      await commands.runFindOperation('Documents', '{ i: 5 }');

      const text = await page.textContent(
        Selectors.DocumentListActionBarMessage
      );
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
      const telemetryEntry = await commands.listenForTelemetryEvents(telemetry);
      await commands.runFindOperation('Documents', '{ i: { $gt: 5 } }', {
        project: '{ _id: 0 }',
        sort: '{ i: -1 }',
        skip: '5',
        limit: '50',
      });

      const text = await page.textContent(
        Selectors.DocumentListActionBarMessage
      );
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
      await commands.runFindOperation(
        'Documents',
        '{ $where: function() { return sleep(10000) || true; } }',
        { waitForResult: false }
      );

      // stop it
      await page.waitForSelector(
        Selectors.DocumentListFetching
      );

      await page.click(Selectors.DocumentListFetchingStopButton);

      await page.waitForSelector(
        Selectors.DocumentListError
      );

      const errorText = await page.textContent(Selectors.DocumentListError);
      expect(errorText).to.equal('The operation was cancelled.');

      // execute another (small, fast) query
      await commands.runFindOperation('Documents', '{ i: 5 }');
      const displayText = await page.textContent(
        Selectors.DocumentListActionBarMessage
      );
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
      await commands.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    });

    // TODO: This seems to crash chromedriver on windows and I have no idea why.
    // _something_ throws "Error: connect ECONNREFUSED 127.0.0.1:9515"
    it.skip('supports the right stages for the environment', async function () {
      // sanity check to make sure there's only one
      const stageContainers = await page.$$(Selectors.StageContainer);
      expect(stageContainers).to.have.lengthOf(1);

      await commands.focusStageOperator(0);

      const options = await page.textContent(
        Selectors.stageOperatorOptions
      );
      // TODO: we need an array of bits of text
      console.log({ options });
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
      await commands.focusStageOperator(0);
      await commands.selectStageOperator(0, '$match');
      await commands.setAceValue(Selectors.stageEditor(0), '{ i: 0 }');

      await commands.waitUntil(async function () {
        const text = await page.textContent(
          Selectors.stagePreviewToolbarTooltip(0)
        );
        return text === '(Sample of 1 document)';
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
      await commands.navigateToCollectionTab('test', 'numbers', 'Schema');
    });

    it('analyzes a schema', async function () {
      await page.click(Selectors.AnalyzeSchemaButton);

      await page.waitForSelector(Selectors.SchemaFieldList);
      const message = await page.textContent(Selectors.AnalysisMessage);
      // message contains non-breaking spaces
      expect(message.replace(/\s/g, ' ')).to.equal(
        'This report is based on a sample of 1000 documents.'
      );

      const fields = await page.$$(Selectors.SchemaField);
      expect(fields).to.have.lengthOf(2);

      const schemaFieldNameElements = await page.$$(Selectors.SchemaFieldName);
      const fieldNames = await Promise.all(
        schemaFieldNameElements.map((el) => el.textContent())
      );
      expect(fieldNames).to.deep.equal(['_id', 'i']);

      const schemaFieldTypeListElements = await page.$$(
        Selectors.SchemaFieldTypeList
      );
      const fieldTypes = await Promise.all(
        schemaFieldTypeListElements.map((el) => el.textContent())
      );
      expect(fieldTypes).to.deep.equal(['ObjectID', 'Int32']);
    });

    it('analyzes the schema with a query');
    it('can reset the query');
    it('can create a geoquery from a map');
    it('can create a geoquery from the charts');
    it('supports maxTimeMS');
  });

  describe('Explain Plan tab', function () {
    before(async function () {
      await commands.navigateToCollectionTab('test', 'numbers', 'Explain Plan');
    });

    it('supports queries not covered by an index', async function () {
      await page.click(Selectors.ExecuteExplainButton);

      await page.waitForSelector(Selectors.ExplainSummary);
      const stages = await page.$$(Selectors.ExplainStage);
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
      await commands.navigateToCollectionTab('test', 'numbers', 'Indexes');
    });

    it('lists indexes', async function () {
      await page.waitForSelector(Selectors.IndexList);

      const indexes = await page.$$(Selectors.IndexComponent);
      expect(indexes).to.have.lengthOf(1);

      const text = await page.textContent(Selectors.NameColumnName);
      expect(text).to.equal('_id_');
    });

    it('supports creating and dropping indexes');
  });

  describe('Validation tab', function () {
    before(async function () {
      await commands.navigateToCollectionTab('test', 'numbers', 'Validation');
    });

    it('supports rules in JSON schema', async function () {
      await page.click(Selectors.AddRuleButton);
      await page.waitForSelector(Selectors.ValidationEditor);

      // Add validation that makes everything invalid

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await commands.setValidation(
        '{ $jsonSchema: { bsonType: "object", required: [ "phone" ] } }'
      );

      // nothing passed, everything failed
      await commands.waitUntil(async () => {
        const matchText = await page.textContent(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const notMatchingText = await page.textContent(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        return (
          matchText === NO_PREVIEW_DOCUMENTS &&
          notMatchingText !== NO_PREVIEW_DOCUMENTS
        );
      });

      // Reset the validation again to make everything valid for future tests

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await commands.setValidation('{}');

      // nothing failed, everything passed
      await commands.waitUntil(async () => {
        const matchText = await page.textContent(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const notMatchingText = await page.textContent(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        return (
          matchText !== NO_PREVIEW_DOCUMENTS &&
          notMatchingText === NO_PREVIEW_DOCUMENTS
        );
      });
    });

    it('supports rules in MQL');
    it('does not allow invalid documents to be inserted');
  });

  // TODO: we need to find a new way to paste in the json to import because
  // "typing" it into the ace editor doesn't work.
  describe.skip('Import', function () {
    it('supports JSON arrays', async function () {
      await commands.navigateToCollectionTab('test', 'json-array', 'Documents');

      const array = [];
      for (let i = 0; i < 1000; ++i) {
        array.push({ n: i, n_square: i * i });
      }
      const json = JSON.stringify(array);

      await page.click(Selectors.AddDataButton);
      await page.waitForSelector(
        Selectors.InsertDocumentOption
      );
      await page.click(Selectors.InsertDocumentOption);

      await page.waitForSelector(Selectors.InsertDialog);
      await commands.setAceValue(Selectors.InsertJSONEditor, json);

      const insertConfirm = page.locator(Selectors.InsertConfirm);
      // this selector is very brittle, so just make sure it works
      expect(await insertConfirm.isVisible()).to.be.true;
      expect(await insertConfirm.textContent()).to.equal('Insert');
      commands.waitUntil(() => insertConfirm.isEnabled());
      await page.click(Selectors.InsertConfirm);

      await page.waitForSelector(Selectors.InsertDialog, { state: 'hidden' });
      const messageElement = page.locator(
        Selectors.DocumentListActionBarMessage
      );
      await commands.waitUntil(async () => {
        const text = await messageElement.textContent();
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

      await commands.navigateToCollectionTab('test', 'json-file', 'Documents');

      // open the import modal
      await page.click(Selectors.AddDataButton);
       await page.waitForSelector(Selectors.ImportFileOption);
      await page.click(Selectors.ImportFileOption);

      // wait for the modal to appear and select the file
      const importModal = page.locator(Selectors.ImportModal);
      await importModal.waitFor({ timeout: 10_000 });
      await commands.selectFile(Selectors.ImportFileInput, jsonPath);

      // make sure it auto-selected JSON and then confirm
      const fileTypeJSON = page.locator(Selectors.FileTypeJSON);
      await commands.waitUntil(async () => {
        const selected = await fileTypeJSON.getAttribute('aria-selected');
        return selected === 'true';
      });
      await page.click(Selectors.ImportConfirm);

      // wait for the done button to appear and then click it
      await page.waitForSelector(Selectors.ImportDone, { timeout: 60_000 });
      await page.click(Selectors.ImportDone);

      // wait for the modal to go away
      await importModal.waitForSelector({ state: 'hidden' });
      const text = await page.textContent(
        Selectors.DocumentListActionBarMessage
      );
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

  describe.only('Export', function () {
    before(async function () {
      await commands.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('supports collection to CSV with a query filter', async function () {
      const telemetryEntry = await commands.listenForTelemetryEvents(telemetry);
      await commands.runFindOperation('Documents', '{ i: 5 }');
      await page.click(Selectors.ExportCollectionButton);
      await page.waitForSelector(Selectors.ExportModal);

      const queryText = await page.textContent(
        Selectors.ExportModalQueryText
      );
      expect(queryText).to.equal(`db.numbers.find(  {i: 5})`);

      await page.click(Selectors.ExportModalSelectFieldsButton);

      // don't change any field selections for now
      await page.click(Selectors.ExportModalSelectOutputButton);

      // select csv (unselected at first, selected by the end)
      await page.click(
        Selectors.selectExportFileTypeButton('csv', false)
      );
      await page.waitForSelector(
        Selectors.selectExportFileTypeButton('csv', true)
      );

      const filename = outputFilename('filtered-numbers.csv');

      await expect(fs.stat(filename)).to.be.rejected;

      // this is cheating a bit, but we cannot interact with the native dialog
      // it pops up from webdriver and writing to the readonly text field
      // doesn't help either.
      await page.evaluate(function (f) {
        // eslint-disable-next-line no-undef
        document.dispatchEvent(
          // eslint-disable-next-line no-undef
          new CustomEvent('selectExportFileName', { detail: f })
        );
      }, filename);

      await commands.waitUntil(async () => {
        const value = await page.getAttribute(
          Selectors.ExportModalFileText,
          'value'
        );
        return value === filename;
      });

      await page.click(Selectors.ExportModalExportButton);

      await page.waitForSelector(
        Selectors.ExportModalShowFileButton
      );

      // clicking the button would open the file in finder/explorer/whatever
      // which is probably not something we can check with webdriver. But we can
      // check that the file exists.

      await page.click(Selectors.ExportModalCloseButton);

      // the modal should go away
      await page.waitForSelector(Selectors.ExportModal, {
        state: 'hidden',
        timeout: 30_000, // Fixes flaky macOS CI.
      });

      const fileText = await fs.readFile(filename, 'utf-8');
      //  example:'_id,i\n6154788cc5f1fd4544fcedb1,5'
      const lines = fileText.split(/\r?\n/);
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
