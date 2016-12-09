process.env.NODE_ENV = 'testing';

const { launchCompass, quitCompass, isIndexUsageEnabled } = require('./support/spectron-support');

describe('Compass Functional Test Suite #spectron', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

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

    context('when launching the application', function() {
      it('displays the feature tour modal', function() {
        return client
          .waitForFeatureTourModal()
          .getText('h2[data-hook=title]')
          .should.eventually.equal('Welcome to MongoDB Compass');
      });

      context('when closing the feature tour modal', function() {
        it('displays the privacy settings', function() {
          return client
            .clickCloseFeatureTourButton()
            .waitForPrivacySettingsModal()
            .getModalTitle()
            .should.eventually.equal('Privacy Settings');
        });

        context('when closing the privacy settings modal', function() {
          it('renders the connect screen', function() {
            return client
              .clickClosePrivacySettingsButton()
              .waitForConnectView()
              .getTitle().should.eventually.be.equal('MongoDB Compass - Connect');
          });

          it('allows favorites to be saved', function() {

          });

          it('allows favorites to be edited', function() {

          });
        });
      });
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

        it('displays the instance details', function() {
          return client
            .getSidebarInstanceDetails()
            .should.eventually.equal('localhost:27018');
        });

        it('displays the server version', function() {
          return client
            .getSidebarInstanceVersion()
            .should.eventually.include('Community version');
        });
      });
    });

    context('when entering a filter in the sidebar', function() {
      context('when entering a plain string', function() {
        it('filters the list', function() {

        });
      });

      context('when entering a regex', function() {
        it('filters the list', function() {

        });
      });
    });

    context('when creating a database', function() {
      let dbCount;

      before(function(done) {
        client.getSidebarDatabaseCount().then(function(value) {
          dbCount = parseInt(value, 10);
          done();
        });
      });

      context('when the database name is invalid', function() {
        it('displays the error message', function() {
          return client
            .clickCreateDatabaseButton()
            .waitForCreateDatabaseModal()
            .inputCreateDatabaseDetails({ name: '$test', collectionName: 'test' })
            .clickCreateDatabaseModalButton()
            .waitForModalError()
            .getModalErrorMessage()
            .should.eventually.equal("database names cannot contain the character '$'");
        });
      });

      context('when the database name is valid', function() {
        it('creates the database', function() {
          return client
            .inputCreateDatabaseDetails({ name: 'music', collectionName: 'artists' })
            .clickCreateDatabaseModalButton()
            .waitForDatabaseCreation('music')
            .getHomeViewDatabaseNames()
            .should.eventually.include('music');
        });

        it('adds the database to the sidebar', function() {
          return client
            .getSidebarDatabaseNames()
            .should.eventually.include('music');
        });

        it('updates the database count', function() {
          return client
            .getSidebarDatabaseCount()
            .should.eventually.equal(String(dbCount + 1));
        });
      });
    });

    context('when deleting a database', function() {
      let dbCount;

      before(function(done) {
        client.getSidebarDatabaseCount().then(function(value) {
          dbCount = parseInt(value, 10);
          done();
        });
      });

      it('requires database name confirmation', function() {
        return client
          .clickCreateDatabaseButton()
          .waitForCreateDatabaseModal()
          .inputCreateDatabaseDetails({ name: 'temp', collectionName: 'temp' })
          .clickCreateDatabaseModalButton()
          .waitForDatabaseCreation('temp')
          .clickDeleteDatabaseButton('temp')
          .waitForDropDatabaseModal()
          .inputDropDatabaseName('temp')
          .clickDropDatabaseModalButton()
          .waitForDatabaseDeletion('temp')
          .getHomeViewDatabaseNames()
          .should.not.eventually.include('temp');
      });

      it('removes the database from the sidebar', function() {
        return client
          .getSidebarDatabaseNames()
          .should.not.eventually.include('temp');
      });

      it('reduces the database count', function() {
        return client
          .getSidebarDatabaseCount()
          .should.eventually.equal(String(dbCount));
      });
    });

    context('when viewing the database', function() {
      it('lists the collections in the database', function() {
        return client
          .clickDatabaseInSidebar('music')
          .waitForDatabaseView()
          .getDatabaseViewCollectionNames()
          .should.eventually.include('artists');
      });

      context('when creating a collection', function() {
        let collCount;

        before(function(done) {
          client.getSidebarCollectionCount().then(function(value) {
            collCount = parseInt(value, 10);
            done();
          });
        });

        context('when the collection name is invalid', function() {
          it('displays the error message', function() {
            return client
              .clickCreateCollectionButton()
              .waitForCreateCollectionModal()
              .inputCreateCollectionDetails({ name: '$test' })
              .clickCreateCollectionModalButton()
              .waitForModalError()
              .getModalErrorMessage()
              .should.eventually.equal('invalid collection name');
          });
        });

        context('when the collection name is valid', function() {
          it('creates the collection', function() {
            return client
              .inputCreateCollectionDetails({ name: 'labels' })
              .clickCreateCollectionModalButton()
              .waitForCollectionCreation('labels')
              .getDatabaseViewCollectionNames()
              .should.eventually.include('labels');
          });

          it('adds the collection to the sidebar', function() {
            return client
              .getSidebarCollectionNames()
              .should.eventually.include('music.labels');
          });

          it('updates the collection count', function() {
            return client
              .getSidebarCollectionCount()
              .should.eventually.equal(String(collCount + 1));
          });
        });

        context('when deleting a collection', function() {
          it('requires confirmation of the collection name', function() {
            return client
              .clickDeleteCollectionButton('labels')
              .waitForDropCollectionModal()
              .inputDropCollectionName('labels')
              .clickDropCollectionModalButton()
              .waitForCollectionDeletion('labels')
              .getDatabaseViewCollectionNames()
              .should.not.eventually.include('labels');
          });

          it('removes the collection from the sidebar', function() {
            return client
              .getSidebarCollectionNames()
              .should.not.eventually.include('music.labels');
          });

          it('updates the collection count', function() {
            return client
              .getSidebarCollectionCount()
              .should.eventually.equal(String(collCount));
          });
        });
      });
    });

    context('when viewing a collection', function() {
      let serverVersion;

      before(function(done) {
        client.getSidebarInstanceVersion().then(function(value) {
          serverVersion = value.replace('Community version ', '');
          done();
        });
      });

      it('displays the collection view', function() {
        return client
          .clickCollectionInSidebar('music.artists')
          .waitForStatusBar()
          .getTitle().should.eventually.equal(
            'MongoDB Compass - localhost:27018/music.artists'
          );
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
              .should.eventually.include('Aphex Twin');
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
            .should.eventually.include('Aphex Twin (edited)');
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
            .should.eventually.include('Essex');
        });
      });

      context('when deleting a document', function() {
        it('deletes upon confirmation', function() {
          return client
            .clickDeleteDocumentButton(2)
            .clickConfirmDeleteDocumentButton(2)
            .waitForDocumentDeletionToComplete(2)
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.equal('Query returned 1 document.');
        });
      });

      context('when applying a filter', function() {
        const filter = '{"name":"Bonobo"}';
        it('updates the document list', function() {
          return client
            .inputFilterFromDocumentsTab(filter)
            .clickApplyFilterButtonFromDocumentsTab()
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.equal('Query returned 0 documents.');
        });

        it('updates the schema view', function() {
          const expected = 'This report is based on a sample of 0 documents (0.00%).';
          return client
            .clickSchemaTab()
            .getSamplingMessageFromSchemaTab()
            .should.eventually.include(expected);
        });

        it('checks the collections table', function() {
          return client
            .clickDatabaseInSidebar('music')
            .waitForDatabaseView()
            .getDatabaseViewCollectionNames()
            .should.eventually.include('artists');
        });

        it('applies the filter again while on schema tab', function() {
          return client
          .clickCollectionInSidebar('music.artists')
          .inputFilterFromSchemaTab(filter)
          .clickApplyFilterButtonFromSchemaTab()
          .getSamplingMessageFromSchemaTab()
          .should.eventually
            .equal('Query returned 0 documents. This report is based on a sample of 0 documents (0.00%).');
        });

        context('when viewing the explain plan view', function() {
          it('updates the documents returned', function() {
            return client
              .clickExplainPlanTab()
              .waitForStatusBar()
              .getExplainDocumentsReturned()
              .should.eventually.equal('0');
          });

          it('updates the documents examined', function() {
            return client
              .getExplainDocumentsExamined()
              .should.eventually.equal('2');
          });
        });
      });

      context('when resetting a filter', function() {
        it('updates the explain plan', function() {
          return client
            .clickResetFilterButtonFromExplainPlanTab()
            .waitForStatusBar()
            .getExplainPlanStatusMessage()
            .should.eventually.include('To prevent unintended collection scans');
        });

        it('updates the document list', function() {
          return client
            .clickDocumentsTab()
            .getSamplingMessageFromDocumentsTab()
            .should.eventually.equal('Query returned 2 documents.');
        });

        it('updates the schema view', function() {
          const expected = 'This report is based on a sample of 2 documents (100.00%).';
          return client
            .clickSchemaTab()
            .getSamplingMessageFromSchemaTab()
            .should.eventually.include(expected);
        });
      });

      context('when navigating to the indexes tab', function() {
        it('renders the indexes table', function() {
          return client
            .clickIndexesTab()
            .getIndexNames()
            .should.eventually.equal('_id_');
        });

        it('renders the index types', function() {
          return client
            .getIndexTypes()
            .should.eventually.equal('REGULAR');
        });

        it('renders the index usages', function() {
          return client
            .getIndexUsages()
            .should
            .eventually
            .equal(isIndexUsageEnabled(serverVersion) ? '8' : '0');
        });

        it('renders the index properties', function() {
          return client
            .getIndexProperties()
            .should.eventually.equal('UNIQUE');
        });

        context('when creating an index', function() {
          context('when the type is missing', function() {
            it('displays an error message', function() {
              return client
                .clickCreateIndexButton()
                .waitForCreateIndexModal()
                .clickCreateIndexModalButton()
                .waitForModalError()
                .getModalErrorMessage()
                .should.eventually.equal('You must select a field name and type');
            });
          });

          context('when the field name is missing', function() {
            it('displays an error message', function() {
              return client
                .inputCreateIndexDetails({ type: '1 (asc)' })
                .clickCreateIndexModalButton()
                .waitForModalError()
                .getModalErrorMessage()
                .should.eventually.equal('You must select a field name and type');
            });
          });

          context('when the index is valid', function() {
            it('adds the index to the list', function() {
              return client
                .inputCreateIndexDetails({ name: 'name_1', field: 'name' })
                .clickCreateIndexModalButton()
                .waitForIndexCreation('name_1')
                .getIndexNames()
                .should.eventually.deep.equal([ 'name_1', '_id_' ]);
            });
          });
        });

        context('when sorting the index list', function() {
          context('when clicking on the name header', function() {
            it('sorts the indexes by name', function() {
              return client
                .clickIndexTableNameHeader()
                .getIndexNames()
                .should.eventually.deep.equal([ '_id_', 'name_1' ]);
            });
          });
        });

        context('when dropping an index', function() {
          it('requires confirmation of the index name', function() {
            // return client
              // .clickDeleteIndexButton()
              // .waitForDropIndexModal()
              // .inputDropIndexName('name_1')
              // .clickDropIndexModalButton()
              // .waitForIndexDrop('name_1')
              // .getIndexNames()
              // .should.not.eventually.include('name_1');
          });
        });
      });

      context('when creating a validation rule', function() {

      });

      context('when deleting a validation rule', function() {

      });
    });
  });
});
