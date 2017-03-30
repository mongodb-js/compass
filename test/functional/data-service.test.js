const { launchCompass, quitCompass} = require('./support/spectron-support');
const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

describe('#data-service', function() {
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

  context('when running data service tests', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {'name': 'Aphex Twin', 'genre': 'Electronic', 'location': 'London'},
          { name: 'Bauhaus' }
        ];
        dataService.insertMany('music.artists', docs, {}, function() {
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

    context('when refreshing the documents list', function() {
      it('resets the documents in the list', function() {
        return client
          .clickDocumentsTab()
          .clickRefreshDocumentsButton()
          .getSamplingMessageFromDocumentsTab()
          .should.eventually.include('Query returned 2 documents.');
      });
    });

    context('when inserting a document when a filter is applied', function() {
      const filter = '{"name":"Bauhaus"}';

      context('when the new document does not match the filter', function() {
        it('does not render the document in the list', function() {
          return client
            .inputFilterFromDocumentsTab(filter)
            .clickApplyFilterButtonFromDocumentsTab()
            .waitForStatusBar()
            .clickInsertDocumentButton()
            .waitForInsertDocumentModal()
            .inputNewDocumentDetails({
              'name': 'George Michael'
            })
            .clickInsertDocumentModalButton()
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.include('Query returned 1 document.');
        });

        it('does not update the schema count', function() {
          const expected = 'This report is based on a sample of 1 document (100.00%).';
          return client
            .clickSchemaTab()
            .getSamplingMessageFromSchemaTab()
            .should.eventually.include(expected);
        });

        it('inserts the document', function() {
          return client
            .clickDocumentsTab()
            .clickResetFilterButtonFromDocumentsTab()
            .waitForStatusBar()
            .getDocumentValues(3)
            .should.eventually.include('\"George Michael\"');
        });
      });
    });
  });
});
