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
        done();
      });
    });

    after(function(done) {
      quitCompass(app, done);
    });

    context('when connecting to a server', function() {
      context('when the server exists', function() {
        it('renders the home screen', function() {
          return client
            .inputConnectionDetails({ hostname: 'localhost', port: 27018 })
            .clickConnectButton()
            .waitForHomeView()
            .getTitle().should.eventually.equal('MongoDB Compass - localhost:27018');
        });
      });
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

      context('when using the fanclub collection with 100 docs', function() {
        it('finds all 100 documents in the collection', function() {
          return client
            .waitForStatusBar()
            .clickInstanceRefreshIcon()
            .waitForInstanceRefresh()
            .clickDatabaseInSidebar('mongodb')
            .clickCollectionInSidebar('mongodb.fanclub')
            .waitForStatusBar()
            .clickDocumentsTab()
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.include('Query returned 100 documents. Displaying documents 1-20');
        });

        context('when applying a sort', function() {
          it('returns the documents in the specified sort order', function() {
            return client
              .clickQueryBarOptionsToggle()
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
      });

      context('when applying a limit', function() {
        it('only returns the number of documents specified by limit', function() {
          return client
            .inputLimitFromDocumentsTab(5)
            .clickApplyFilterButtonFromDocumentsTab()
            .waitForStatusBar()
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.include('Query returned 5 documents');
        });
      });
    });
  });
});
