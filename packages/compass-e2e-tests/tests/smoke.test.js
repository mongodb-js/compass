// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  afterTest,
} = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

async function disconnect(client) {
  try {
    await client.disconnect();
  } catch (err) {
    console.error('Error during disconnect:');
    console.error(err);
  }
}

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Compass', function () {
  this.timeout(1000 * 60 * 1);

  let keychain;
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let compass;
  let client;

  before(async function () {
    ({ keychain, compass } = await beforeTests());
    client = compass.client;
  });

  after(function () {
    return afterTests({ keychain, compass });
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  describe('Connect screen', function () {
    it('can connect using connection string', async function () {
      try {
        await client.connectWithConnectionString(
          'mongodb://localhost:27018/test'
        );
        const result = await client.shellEval(
          'db.runCommand({ connectionStatus: 1 })',
          true
        );
        expect(result).to.have.property('ok', 1);
      } finally {
        await disconnect();
      }
    });

    it('can connect using connection form', async function () {
      try {
        await client.connectWithConnectionForm({
          host: 'localhost',
          port: 27018,
        });
        const result = await client.shellEval(
          'db.runCommand({ connectionStatus: 1 })',
          true
        );
        expect(result).to.have.property('ok', 1);
      } finally {
        await disconnect();
      }
    });

    it('can connect to Atlas cluster', async function () {
      try {
        const atlasConnectionOptions = getAtlasConnectionOptions();
        if (!atlasConnectionOptions) {
          return this.skip();
        }
        await client.connectWithConnectionForm(atlasConnectionOptions, 30_000);
        const result = await client.shellEval(
          'db.runCommand({ connectionStatus: 1 })',
          true
        );
        expect(result).to.have.property('ok', 1);
      } finally {
        await disconnect();
      }
    });
  });

  describe.only('localhost:27018', () => {
    before(async () => {
      await client.connectWithConnectionString(
        'mongodb://localhost:27018/test'
      );
    });

    describe('Sidebar', () => {
      it('contains cluster info', async () => {
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
        expect(serverVersionText).to.equal('MongoDB 5.0.2 Community'); // this will fail every time we update
      });

      it('contains a dbs/collections tree view');
      it('can search for a collection');
      it('can create a database and drop it');
      it('can create a collection and drop it');
      it('can edit a favourite');
    });

    describe('Interface screen', () => {
      before(async () => {
        await client.navigateToInstanceTab('Databases');
      });

      it('contains a list of databases', async () => {
        const dbSelectors = ['admin', 'config', 'local', 'test'].map(
          (dbName) => {
            return `[data-test-id="databases-table-link-${dbName}"]`;
          }
        );

        for (const dbSelector of dbSelectors) {
          expect(await client.isExisting(dbSelector)).to.be.true;
        }
      });

      it('can create a database and drop it');
      it('can kill slow queries via the performance tab');
    });

    describe('Database screen', () => {
      before(async () => {
        await client.navigateToDatabaseTab('test', 'Collections');
      });

      it('contains a list of collections', async () => {
        const collectionSelector = `[data-test-id="collections-table-link-numbers"]`;
        expect(await client.isExisting(collectionSelector)).to.be.true;

        // TODO: Collections are listed with their stats and the button to delete them
      });

      // capped and not capped
      it('can create a collection and drop it');
    });

    describe('Collection screen', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Documents');
      });

      it('contains the collection tabs', async () => {
        const tabSelectors = [
          'Documents',
          'Aggregations',
          'Schema',
          'Explain Plan',
          'Indexes',
          'Validation',
        ].map((tabName) => {
          return `${Selectors.InstanceTab}[name="${tabName}"]`;
        });

        for (const tabSelector of tabSelectors) {
          expect(await client.isExisting(tabSelector), tabSelector).to.be.true;
        }
      });

      it('contains the collection stats', async () => {
        expect(
          await client.getText('[data-test-id="document-count-value"]')
        ).to.equal('1k');
        expect(
          await client.getText('[data-test-id="total-document-size-value"]')
        ).to.equal('29.0KB');
        expect(
          await client.getText('[data-test-id="avg-document-size-value"]')
        ).to.equal('29B');

        expect(
          await client.getText('[data-test-id="index-count-value"]')
        ).to.equal('1');
        expect(
          await client.getText('[data-test-id="total-index-size-value"]')
        ).to.equal('4.1KB');
        expect(
          await client.getText('[data-test-id="avg-index-size-value"]')
        ).to.equal('4.1KB');
      });
    });

    describe('Documents tab', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Documents');
      });

      it('supports simple find operations', async () => {
        await client.runFindOperation({
          filter: '{ i: 5 }',
        });

        const text = await client.getText('.document-list-action-bar-message');
        expect(text).to.equal('Displaying documents 1 - 1 of 1');
      });

      it('supports advanced find operations', async () => {
        await client.runFindOperation({
          filter: '{ i: { $gt: 5 } }',
          project: '{ _id: 0 }',
          sort: '{ i: -1 }',
          skip: '5',
          limit: '50',
        });

        const text = await client.getText('.document-list-action-bar-message');
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

    describe('Aggregations tab', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Aggregations');
      });

      it('supports the right stages for the environment', async () => {
        // sanity check to make sure there's only one
        const stageContainers = await client.$$(
          '[data-test-id="stage-container"]'
        );
        expect(stageContainers).to.have.lengthOf(1);

        await client.focusStageOperator(0);

        const options = await client.getText(
          '[data-stage-index="0"] [role="option"]'
        );
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
      it('supports creating an aggregation', async () => {
        await client.focusStageOperator(0);
        await client.selectStageOperator(0, '$match');
        await client.setAceValue('#aggregations-stage-editor-0', '{ i: 0 }');

        await client.waitUntil(async () => {
          const text = await client.getText(
            '[data-stage-index="0"] [data-test-id="stage-preview-toolbar-tooltip"]'
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

    describe('Schema tab', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Schema');
      });

      it('analyzes a schema', async () => {
        const buttonSelector = '[data-test-id="analyze-schema-button"]';
        await client.clickVisible(buttonSelector);

        await client.waitForVisible('.schema-field-list');
        const message = await client.getText('.analysis-message');
        expect(message).to.equal(
          'This report is based on a sample of 1000 documents.'
        );

        const fields = await client.$$('.schema-field');
        expect(fields).to.have.lengthOf(2);

        const fieldNames = await client.getText('.schema-field-name');
        expect(fieldNames).to.deep.equal(['_id', 'i']);

        const fieldTypes = await client.getText('.schema-field-type-list');
        expect(fieldTypes).to.deep.equal(['objectid', 'int32']);
      });

      it('analyzes the schema with a query');
      it('can reset the query');
      it('can create a geoquery from a map');
      it('can create a geoquery from the charts');
      it('supports maxTimeMS');
    });

    describe('Explain Plan tab', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Explain Plan');
      });

      it('supports queries not covered by an index', async () => {
        const buttonSelector = '[data-test-id="execute-explain-button"]';
        await client.clickVisible(buttonSelector);

        await client.waitForVisible('[data-test-id="explain-summary"]');
        const stages = await client.$$('[data-test-id="explain-stage"]');
        expect(stages).to.have.lengthOf(1);
      });

      it('supports queries covered by an index');
      it('supports queries with a sort covered by an index');
      it('supports maxTimeMS');
      it('shows a visual explain plan for queries that result in a tree');
    });

    describe('Indexes tab', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Indexes');
      });

      it('lists indexes', async () => {
        await client.waitForVisible('[data-test-id="index-list"]');

        const indexes = await client.$$('[data-test-id="index-component"]');
        expect(indexes).to.have.lengthOf(1);

        expect(
          await client.getText('[data-test-id="name-column-name"]')
        ).to.equal('_id_');
      });
    });

    describe('Validation tab', () => {
      before(async () => {
        await client.navigateToCollectionTab('test', 'numbers', 'Validation');
      });

      it('allows rules to be added', async () => {
        const buttonSelector = '[data-test-id="add-rule-button"]';
        await client.clickVisible(buttonSelector);

        await client.waitForVisible('[data-test-id="validation-editor"]');

        // TODO: how do you write validation rules again?
      });

      it('supports rules in MQL');
      it('supports rules in JSON Schema');
      it('does not allow invalid documents to be inserted');
    });

    describe('Import', () => {});

    describe('Export', () => {});

    describe('Compass Shell', () => {});
  });
});
