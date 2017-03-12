const { launchCompass, quitCompass} = require('../spectron-support');
const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

context('when a MongoDB instance is running', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      client.connectToCompass({ hostname: 'localhost', port: 27018 });
      done();
    });
  });

  after(function(done) {
    quitCompass(app, done);
  });

  context('when refreshing the documents list', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      dataService.connect(function() {
        dataService.insertOne('music.artists', { name: 'Bauhaus' }, {}, function() {
          done();
        });
      });
    });

    after(function() {
      dataService.disconnect();
    });

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
