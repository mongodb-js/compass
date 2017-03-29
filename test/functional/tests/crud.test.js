const { launchCompass, quitCompass} = require('../support/spectron-support');
const debug = require('debug')('mongodb-compass:spectron-support');

describe('CRUD', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    debug('before hook for crud.test.js');
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    debug('after hook for crud.test.js');
    quitCompass(app, done);
  });

  context('when viewing the crud tab', function() {
    before(function(done) {
      debug('before hook for crud');
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .createDatabaseCollection('music', 'artists')
        .goToCollection('music', 'artists')
        .then(() => {
          done();
        });
    });

    after(function(done) {
      debug('after hook for crud');
      client
        .teardownTest('music').then(() => {
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
