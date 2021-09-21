// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests, afterTest } = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Smoke tests', function () {
  this.timeout(1000 * 60 * 1);

  let keychain;
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let compass;
  let client;

  before(async function () {
    ({ keychain, compass } = await beforeTests());
    client = compass.client;

    await client.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  after(function () {
    return afterTests({ keychain, compass });
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
      expect(serverVersionText).to.equal('MongoDB 5.0.3 Community'); // this will fail every time we update
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
      expect(await client.getText(Selectors.TotalDocumentSizeValue)).to.equal(
        '29.0KB'
      );
      expect(await client.getText(Selectors.AvgDocumentSizeValue)).to.equal(
        '29B'
      );

      expect(await client.getText(Selectors.IndexCountValue)).to.equal('1');
      expect(await client.getText(Selectors.TotalIndexSizeValue)).to.equal(
        '4.1KB'
      );
      expect(await client.getText(Selectors.AvgIndexSizeValue)).to.equal(
        '4.1KB'
      );
    });
  });

  describe('Documents tab', function () {
    before(async function () {
      await client.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('supports simple find operations', async function () {
      await client.runFindOperation({
        filter: '{ i: 5 }',
      });

      const text = await client.getText(Selectors.DocumentListActionBarMessage);
      expect(text).to.equal('Displaying documents 1 - 1 of 1');
    });

    it('supports advanced find operations', async function () {
      await client.runFindOperation({
        filter: '{ i: { $gt: 5 } }',
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

    it('supports the right stages for the environment', async function () {
      // sanity check to make sure there's only one
      const stageContainers = await client.$$(Selectors.StageContainer);
      expect(stageContainers).to.have.lengthOf(1);

      await client.focusStageOperator(0);

      const options = await client.getText(Selectors.stageOperatorOptions(0));
      expect(options).to.deep.equal([
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
        '$setWindowFields',
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

      await client.waitForVisible(Selectors.SchemaFieldList);
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

      await client.waitForVisible(Selectors.ExplainSummary);
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
      await client.waitForVisible(Selectors.IndexList);

      const indexes = await client.$$(Selectors.IndexComponent);
      expect(indexes).to.have.lengthOf(1);

      expect(await client.getText(Selectors.NameColumnName)).to.equal('_id_');
    });
  });

  describe('Validation tab', function () {
    before(async function () {
      await client.navigateToCollectionTab('test', 'numbers', 'Validation');
    });

    it('allows rules to be added', async function () {
      await client.clickVisible(Selectors.AddRuleButton);
      await client.waitForVisible(Selectors.ValidationEditor);

      // TODO: how do you write validation rules again?
    });

    it('supports rules in MQL');
    it('supports rules in JSON Schema');
    it('does not allow invalid documents to be inserted');
  });

  describe('Import', function () {});

  describe('Export', function () {});

  describe('Compass Shell', function () {});
});
