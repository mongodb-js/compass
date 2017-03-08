const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const _ = require('lodash');
const mgenerate = require('mgeneratejs');
const fanclubTemplate = require('./support/fanclub-template.json');
const { launchCompass, quitCompass } = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'mongodb' });

describe('Compass Functional Tests for QueryBar #spectron', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    /* Force the node env to testing */
    process.env.NODE_ENV = 'testing';
  });

  /*
   * This assumes that the main functional tests (./compass-functiona.test.js)
   * has already been run, and that the feature tour window and opt-in privacy
   * settings do not need to be dismissed anymore.
   */
  context('when a MongoDB instance is running', function() {
    before(function(done) {
      launchCompass().then(function(application) {
        app = application;
        client = application.client;
        client
          .inputConnectionDetails({ hostname: 'localhost', port: 27018 })
          .clickConnectButton()
          .waitForStatusBar()
          .waitForHomeView()
          .then(() => {
            done();
          });
      });
    });

    after(function(done) {
      quitCompass(app, done);
    });

    context('when using advanced query options', function() {
      const dataService = new DataService(CONNECTION);

      before(function(done) {
        dataService.connect(function() {
          const docs = _.map(_.range(100), mgenerate.bind(null, fanclubTemplate));
          dataService.insertMany('mongodb.fanclub', docs, {}, function() {
            done();
          });
        });
      });

      after(function() {
        dataService.disconnect();
      });

      context('when using the fanclub collection with 100 docs', function() {
        it('edit mode is enabled by default', function() {
          return client
            .getDocumentReadonlyStatus(1)
            .should.eventually.be.false;
        });

        it('finds all 100 documents in the collection', function() {
          return client
            .waitForStatusBar()
            .clickInstanceRefreshIcon()
            .waitForInstanceRefresh()
            .clickDatabaseInSidebar('mongodb')
            .clickCollectionInSidebar('mongodb.fanclub')
            .waitForStatusBar()
            .getTitle().should.eventually.equal(
              'MongoDB Compass - localhost:27018/mongodb.fanclub'
            );
        });

        it('goes to the index tab and creates an index', function() {
          return client
            .clickIndexesTab()
            .clickCreateIndexButton()
            .waitForCreateIndexModal()
            .inputCreateIndexDetails({name: 'age_1', field: 'age', typeIndex: 1 })
            .clickCreateIndexModalButton()
            .waitForIndexCreation('age_1')
            .waitForVisibleInCompass('create-index-modal', true)
            .getIndexNames()
            .should.eventually.include('age_1');
        });
      });

      context('when applying queries from the schema tab', function() {
        it('shows the sampling message', function() {
          return client
            .clickSchemaTab()
            .getSamplingMessageFromSchemaTab()
            .should.eventually.include('Query returned 100 documents.');
        });
        it('toggles the query bar', function() {
          return client
          .waitForStatusBar()
          .clickQueryBarOptionsToggle();
        });
        context('when applying a projection', function() {
          it('returns some of the fields', function() {
            return client
              .inputProjectFromSchemaTab('{age: 1, address: 1}')
              .clickApplyFilterButtonFromSchemaTab()
              .waitForStatusBar()
              .getSchemaFieldNames()
              .should.eventually.deep.equal(['_id', 'address', 'age']);
          });
          it('shows the sampling message', function() {
            return client
              .waitForStatusBar()
              .getSamplingMessageFromSchemaTab()
              .should.eventually.include('Query returned 100 documents.');
          });
        });
        context('when applying a limit', function() {
          it('runs schema analysis on some of the documents', function() {
            return client
              .inputLimitFromSchemaTab('5')
              .clickApplyFilterButtonFromSchemaTab()
              .waitForStatusBar()
              .getSamplingMessageFromSchemaTab()
              .should.eventually.include('Query returned 5 documents.');
          });
        });
      });

      context('when applying queries from the documents tab', function() {
        it('goes to the documents tab', function() {
          return client
            .clickResetFilterButtonFromSchemaTab()
            .waitForStatusBar()
            .clickDocumentsTab()
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.include('Query returned 100 documents. Displaying documents 1-20');
        });

        context('when applying a sort', function() {
          it('returns the documents in the specified sort order', function() {
            return client
              .inputSortFromDocumentsTab('{member_id: -1}')
              .clickApplyFilterButtonFromDocumentsTab()
              .waitForStatusBar()
              .getDocumentAtIndex(1)
              .should.eventually.have.property('member_id', '99');
          });

          it('skips the right number of documents when using skip', function() {
            return client
              .inputSkipFromDocumentsTab('10')
              .clickApplyFilterButtonFromDocumentsTab()
              .waitForStatusBar()
              .getDocumentAtIndex(1)
              .should.eventually.have.property('member_id', '89');
          });
        });

        context('when applying a projection', function() {
          it('returns only the fields included in the project plus _id', function() {
            return client
              .inputProjectFromDocumentsTab('{member_id: 1, name: 1}')
              .clickApplyFilterButtonFromDocumentsTab()
              .waitForStatusBar()
              .getDocumentAtIndex(1)
              .then(function(obj) {
                return _.keys(obj);
              })
              .should.eventually.deep.equal(['_id', 'member_id', 'name']);
          });
          it('disables editing mode for documents', function() {
            return client
              .getDocumentReadonlyStatus(1)
              .should.eventually.be.true;
          });
        });

        context('when applying a limit', function() {
          it('only returns the number of documents specified by limit', function() {
            return client
              .waitForStatusBar()
              .inputLimitFromDocumentsTab(5)
              .clickApplyFilterButtonFromDocumentsTab()
              .waitForStatusBar()
              .getSamplingMessageFromDocumentsTab()
              .should.eventually.include('Query returned 5 documents');
          });
        });
      });

      context('when applying queries to the explain tab', function() {
        it('goes to the explain plan tab', function() {
          return client
            .clickResetFilterButtonFromDocumentsTab()
            .waitForStatusBar()
            .clickExplainPlanTab()
            .getExplainPlanStatusMessage()
            .should.eventually.include('please enter your query first before applying and viewing your explain plan.');
        });

        context('when applying a projection', function() {
          it('includes projection in the winning plan', function() {
            return client
              .waitForStatusBar()
              .inputProjectFromExplainPlanTab('{age: 1}')
              .clickApplyFilterButtonFromExplainPlanTab()
              .waitForStatusBar()
              .clickExplainViewDetails('raw-json')
              .waitForStatusBar()
              .getExplainRawJSONDocument()
              .should.eventually.include('PROJECTION');
          });
        });

        context('when applying a sort', function() {
          it('includes fetch in the winning plan', function() {
            return client
              .waitForStatusBar()
              .inputSortFromExplainPlanTab('{name: 1}')
              .clickApplyFilterButtonFromExplainPlanTab()
              .waitForStatusBar()
              .clickExplainViewDetails('raw-json')
              .waitForStatusBar()
              .getExplainRawJSONDocument()
              .should.eventually.include('SORT');
          });

          it('reduces the number of documents returned', function() {
            return client
              .inputSkipFromExplainPlanTab('10')
              .clickApplyFilterButtonFromExplainPlanTab()
              .waitForStatusBar()
              .getExplainDocumentsReturned()
              .should.eventually.equal('90');
          });
        });

        context('when applying a limit', function() {
          it('only returns the number of documents specified by limit', function() {
            return client
              .inputLimitFromExplainPlanTab(5)
              .clickApplyFilterButtonFromExplainPlanTab()
              .waitForStatusBar()
              .getExplainDocumentsReturned()
              .should.eventually.equal('5');
          });
        });
      });
    });
  });
});
