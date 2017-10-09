const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass} = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27017, ns: 'music' });

describe('#schema', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass()
      .then(function(application) {
        app = application;
        client = application.client;
        return client.connectToCompass({ hostname: 'localhost', port: 27018 });
      });
  });

  after(function() {
    return quitCompass(app);
  });

  context('when applying a filter in the schema tab', function() {
    const filter = '{"name":"Bonobo"}';
    const expectedOneDoc = 'Query returned 1 document. This report is based on a sample of 1 document (100.00%).';
    const expectedZeroDoc = 'Query returned 0 documents. This report is based on a sample of 0 documents (0.00%).';
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      const doc = {'name': 'Aphex Twin', 'genre': 'Electronic', 'location': 'London'};
      dataService.connect(function() {
        dataService.insertOne('music.artists', doc, function() {
          return client
          .goToCollection('music', 'artists').then(function() {
            done();
          });
        });
      });
    });

    after(function(done) {
      dataService.dropDatabase('music', function() {
        dataService.disconnect();
        done();
      });
    });

    it('shows schema view', function() {
      return client
        .clickSchemaTab()
        .clickApplyFilterButtonFromSchemaTab()
        .waitForStatusBar()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.include(expectedOneDoc);
    });

    it('shows a schema on refresh', function() {
      return client
        .goToCollection('music', 'artists')
        .clickApplyFilterButtonFromSchemaTab()
        .waitForStatusBar()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.include(expectedOneDoc);
    });

    it('applies the filter from schema view', function() {
      return client
        .inputFilterFromSchemaTab(filter)
        .clickApplyFilterButtonFromSchemaTab()
        .waitForStatusBar()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.include(expectedZeroDoc);
    });

    it('checks the collections table', function() {
      return client
        .waitForStatusBar()
        .clickDatabaseInSidebar('music')
        .waitForDatabaseView()
        .getCollectionsTabCollectionNames()
        .should.eventually.include('artists');
    });

    it('applies the filter again while on schema tab', function() {
      return client
        .goToCollection('music', 'artists')
        .waitForStatusBar()
        .inputFilterFromSchemaTab(filter)
        .clickApplyFilterButtonFromSchemaTab()
        .waitForStatusBar()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.equal(expectedZeroDoc);
    });
  });
});
