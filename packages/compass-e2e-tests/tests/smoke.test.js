// @ts-check
const { promises: fs } = require('fs');
const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

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
  let compass;
  let client;

  before(async function () {
    compass = await beforeTests();
    client = compass.client;

    await client.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  after(function () {
    return afterTests(compass);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  describe('Sidebar', function () {
    it('contains cluster info', async function () {
      const topologySingleHostAddress = await client.getText(
        Selectors.TopologySingleHostAddress
      );
      expect(topologySingleHostAddress).to.equal('localhost:27018');

      const singleClusterType = await client.getText(
        Selectors.SingleClusterType
      );
      expect(singleClusterType).to.equal('Standalone');

      const serverVersionText = await client.getText(
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
      await client.navigateToInstanceTab('Databases');
    });

    it('contains a list of databases', async function () {
      const dbSelectors = ['admin', 'config', 'local', 'test'].map(
        Selectors.databaseTableLink
      );

      for (const dbSelector of dbSelectors) {
        expect(await client.isExisting(dbSelector)).to.be.true;
        // TODO: Storage Size, Collections, Indexes, Drop button
      }
    });

    it('can create a database and drop it');
    it('can kill slow queries via the performance tab');
  });

  describe('Database screen', function () {
    before(async function () {
      await client.navigateToDatabaseTab('test', 'Collections');
    });

    it('contains a list of collections', async function () {
      expect(await client.isExisting(Selectors.CollectionsTableLinkNumbers)).to
        .be.true;

      // TODO: Collections are listed with their stats and the button to delete them
    });

    // capped and not capped
    it('can create a collection and drop it');
  });

  describe('Collection screen', function () {
    before(async function () {
      await client.navigateToCollectionTab('test', 'numbers', 'Documents');
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
        expect(await client.isExisting(tabSelector), tabSelector).to.be.true;
      }
    });

    it('contains the collection stats', async function () {
      expect(await client.getText(Selectors.DocumentCountValue)).to.equal('1k');
      expect(await client.getText(Selectors.IndexCountValue)).to.equal('1');

      // all of these unfortunately differ slightly between different versions of mongodb
      expect(await client.getText(Selectors.TotalDocumentSizeValue)).to.include(
        'KB'
      );
      expect(await client.getText(Selectors.AvgDocumentSizeValue)).to.include(
        'B'
      );
      expect(await client.getText(Selectors.TotalIndexSizeValue)).to.include(
        'KB'
      );
      expect(await client.getText(Selectors.AvgIndexSizeValue)).to.include(
        'KB'
      );
    });
  });

  describe('Documents tab', function () {
    before(async function () {
      await client.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('supports simple find operations', async function () {
      await client.runFindOperation('Documents', '{ i: 5 }');

      const text = await client.getText(Selectors.DocumentListActionBarMessage);
      expect(text).to.equal('Displaying documents 1 - 1 of 1');
    });

    it('supports advanced find operations', async function () {
      await client.runFindOperation('Documents', '{ i: { $gt: 5 } }', {
        project: '{ _id: 0 }',
        sort: '{ i: -1 }',
        skip: '5',
        limit: '50',
      });

      const text = await client.getText(Selectors.DocumentListActionBarMessage);
      expect(text).to.equal('Displaying documents 1 - 20 of 50');
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
      await client.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    });

    // TODO: This seems to crash chromedriver on windows and I have no idea why.
    // _something_ throws "Error: connect ECONNREFUSED 127.0.0.1:9515"
    it.skip('supports the right stages for the environment', async function () {
      // sanity check to make sure there's only one
      const stageContainers = await client.$$(Selectors.StageContainer);
      expect(stageContainers).to.have.lengthOf(1);

      await client.focusStageOperator(0);

      const options = await client.getText(Selectors.stageOperatorOptions(0));
      expect(_.without(options, '$setWindowFields')).to.deep.equal([
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
        '$merge',
        '$out',
        '$project',
        '$redact',
        '$replaceWith',
        '$replaceRoot',
        '$sample',
        '$search',
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
      await client.focusStageOperator(0);
      await client.selectStageOperator(0, '$match');
      await client.setAceValue(Selectors.stageEditor(0), '{ i: 0 }');

      await client.waitUntil(async function () {
        const text = await client.getText(
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
      await client.navigateToCollectionTab('test', 'numbers', 'Schema');
    });

    it('analyzes a schema', async function () {
      await client.clickVisible(Selectors.AnalyzeSchemaButton);

      const element = await client.$(Selectors.SchemaFieldList);
      await element.waitForDisplayed();
      const message = await client.getText(Selectors.AnalysisMessage);
      expect(message).to.equal(
        'This report is based on a sample of 1000 documents.'
      );

      const fields = await client.$$(Selectors.SchemaField);
      expect(fields).to.have.lengthOf(2);

      const fieldNames = await client.getText(Selectors.SchemaFieldName);
      expect(fieldNames).to.deep.equal(['_id', 'i']);

      const fieldTypes = await client.getText(Selectors.SchemaFieldTypeList);
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
      await client.navigateToCollectionTab('test', 'numbers', 'Explain Plan');
    });

    it('supports queries not covered by an index', async function () {
      await client.clickVisible(Selectors.ExecuteExplainButton);

      const element = await client.$(Selectors.ExplainSummary);
      await element.waitForDisplayed();
      const stages = await client.$$(Selectors.ExplainStage);
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
      await client.navigateToCollectionTab('test', 'numbers', 'Indexes');
    });

    it('lists indexes', async function () {
      const element = await client.$(Selectors.IndexList);
      await element.waitForDisplayed();

      const indexes = await client.$$(Selectors.IndexComponent);
      expect(indexes).to.have.lengthOf(1);

      expect(await client.getText(Selectors.NameColumnName)).to.equal('_id_');
    });

    it('supports creating and dropping indexes');
  });

  describe('Validation tab', function () {
    before(async function () {
      await client.navigateToCollectionTab('test', 'numbers', 'Validation');
    });

    it('supports rules in JSON schema', async function () {
      await client.clickVisible(Selectors.AddRuleButton);
      const element = await client.$(Selectors.ValidationEditor);
      await element.waitForDisplayed();

      // Add validation that makes everything invalid

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await client.setValidation(
        '{ $jsonSchema: { bsonType: "object", required: [ "phone" ] } }'
      );

      // nothing passed, everything failed
      await client.waitUntil(async () => {
        const matchText = await client.getText(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const notMatchingText = await client.getText(
          Selectors.ValidationNotMatchingDocumentsPreview
        );
        return (
          matchText === NO_PREVIEW_DOCUMENTS &&
          notMatchingText !== NO_PREVIEW_DOCUMENTS
        );
      });

      // Reset the validation again to make everything valid for future tests

      // the automatic indentation and brackets makes multi-line values very fiddly here
      await client.setValidation('{}');

      // nothing failed, everything passed
      await client.waitUntil(async () => {
        const matchText = await client.getText(
          Selectors.ValidationMatchingDocumentsPreview
        );
        const notMatchingText = await client.getText(
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

  describe('Import', function () {
    it('supports JSON arrays');
    it('supports JSON files');
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
      await client.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('supports collection to CSV with a query filter', async function () {
      await client.runFindOperation('Documents', '{ i: 5 }');
      await client.clickVisible(Selectors.ExportCollectionButton);
      const exportModal = await client.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      expect(await client.getText(Selectors.ExportModalQueryText)).to
        .equal(`db.numbers.find(
  {i: 5}
)`);

      await client.clickVisible(Selectors.ExportModalSelectFieldsButton);

      // don't change any field selections for now
      await client.clickVisible(Selectors.ExportModalSelectOutputButton);

      // select csv (unselected at first, selected by the end)
      await client.clickVisible(
        Selectors.selectExportFileTypeButton('csv', false)
      );
      const selectExportFileTypeButtonElement = await client.$(
        Selectors.selectExportFileTypeButton('csv', true)
      );
      await selectExportFileTypeButtonElement.waitForDisplayed();

      const filename = outputFilename('filtered-numbers.csv');

      await expect(fs.stat(filename)).to.be.rejected;

      // this is cheating a bit, but we cannot interact with the native dialog
      // it pops up from webdriver and writing to the readonly text field
      // doesn't help either.
      await client.execute(function (f) {
        // eslint-disable-next-line no-undef
        document.dispatchEvent(
          // eslint-disable-next-line no-undef
          new CustomEvent('selectExportFileName', { detail: f })
        );
      }, filename);

      await client.waitUntil(async () => {
        const value = await client.getAttribute(
          Selectors.ExportModalFileText,
          'value'
        );
        return value === filename;
      });

      await client.clickVisible(Selectors.ExportModalExportButton);

      const exportModalShowFileButtonElement = await client.$(
        Selectors.ExportModalShowFileButton
      );
      await exportModalShowFileButtonElement.waitForDisplayed();

      // clicking the button would open the file in finder/explorer/whatever
      // which is probably not something we can check with webdriver. But we can
      // check that the file exists.

      await client.clickVisible(Selectors.ExportModalCloseButton);

      // the modal should go away
      const exportModalElement = await client.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
        timeout: 2000,
      });
      
      const text = await fs.readFile(filename, 'utf-8');
      //  example:'_id,i\n6154788cc5f1fd4544fcedb1,5'
      const lines = text.split(/\r?\n/);
      expect(lines[0]).to.equal('_id,i');
      const fields = lines[1].split(',');
      // first field is an id, so always different
      expect(fields[1]).to.equal('5');
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
