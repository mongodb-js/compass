const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass} = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

describe('#crud', function() {
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

  context('CRUD', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      dataService.connect(function() {
        dataService.createCollection('music.artists', {}, function() {
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

    context('when inserting a document', function() {
      context('when the document is valid', function() {
        it('creates the document', function() {
          return client
            .clickDocumentsTab()
            .clickInsertDocumentButton()
            .waitForInsertDocumentModal()
            .inputNewDocumentDetails({
              'name': 'Aphex Twin',
              'genre': 'Electronic',
              'location': 'London'
            })
            .clickInsertDocumentModalButton()
            .waitForDocumentInsert(1)
            .getDocumentValues(1)
            .should.eventually.include('\"Aphex Twin\"');
        });
      });

      context('when pressing escape key twice', function() {
        it('does not close the insert documents modal on first press', function() {
          return client
            .clickInsertDocumentButton()
            .waitForInsertDocumentModal()
            .pressEscape()
            .waitForInsertDocumentModal()
            .should.eventually.be.true;
        });
        it('closes the insert documents modal on second press', function() {
          return client
            .pressEscape()
            .waitForInsertDocumentModalHidden()
            .should.eventually.be.true;
        });
      });
    });

    context('when editing a document', function() {
      it('saves the changes to the document', function() {
        return client
          .clickEditDocumentButton(1)
          .inputDocumentValueChange(1, 'Aphex Twin', 'Aphex Twin (edited)')
          .clickUpdateDocumentButton(1)
          .waitForDocumentUpdate(1)
          .getDocumentValues(1)
          .should.eventually.include('\"Aphex Twin (edited)\"');
      });
    });

    context('when cloning a document', function() {
      it('creates the cloned document', function() {
        return client
          .clickCloneDocumentButton(1)
          .waitForInsertDocumentModal()
          .inputClonedDocumentValueChange(1, 'London', 'Essex')
          .clickInsertDocumentModalButton()
          .waitForDocumentInsert(2)
          .getDocumentValues(2)
          .should.eventually.include('\"Essex\"');
      });
    });

    context('when double clicking a field', function() {
      it('opens document edit dialog and focuses cursor on the field', function() {
        return client
          .doubleClickDocumentField(2, 2)
          .inputDocumentFieldChange(2, 'genre', 'category')
          .clickUpdateDocumentButton(2)
          .waitForDocumentUpdate(2)
          .getDocumentFields(2)
          .should.eventually.include('category');
      });

      it('opens document edit dialog and focuses cursor on the value', function() {
        return client
          .doubleClickDocumentValue(2, 2)
          .inputDocumentValueChange(2, 'Electronic', 'ska')
          .clickUpdateDocumentButton(2)
          .waitForDocumentUpdate(2)
          .getDocumentValues(2)
          .should.eventually.include('\"ska\"');
      });
    });

    context('when deleting a document', function() {
      it('deletes upon confirmation', function() {
        return client
          .clickDeleteDocumentButton(2)
          .clickConfirmDeleteDocumentButton(2)
          .waitForDocumentDeletionToComplete(2)
          .getSamplingMessageFromDocumentsTab()
          .should.eventually.include('Query returned 1 document.');
      });
    });

    context('when applying a filter', function() {
      const filter = '{"name":"Bonobo"}';
      it('updates the document list', function() {
        return client
          .inputFilterFromDocumentsTab(filter)
          .clickApplyFilterButtonFromDocumentsTab()
          .getSamplingMessageFromDocumentsTab()
          .should.eventually.include('Query returned 0 documents.');
      });
    });
  });
});
