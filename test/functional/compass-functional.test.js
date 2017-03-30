const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass, isIndexUsageEnabled } = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

describe('Compass Main Functional Test Suite #spectron', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    /* Force the node env to testing */
    process.env.NODE_ENV = 'testing';
  });

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
            .clickEnableProductFeedbackCheckbox()
            .clickEnableCrashReportsCheckbox()
            .clickEnableUsageStatsCheckbox()
            .clickEnableAutoUpdatesCheckbox()
            .getModalTitle()
            .should.eventually.equal('Privacy Settings');
        });

        context('when closing the privacy settings modal', function() {
          it('renders the connect screen', function() {
            return client
              .clickClosePrivacySettingsButton()
              .waitForConnectView()
              .waitForWindowTitle('MongoDB Compass - Connect')
              .getTitle().should.eventually.be.equal('MongoDB Compass - Connect');
          });

          it('allows favorites to be saved');
          it('allows favorites to be edited');
        });
      });
    });

    context('when connecting to a server', function() {
      context('when the server exists', function() {
        it('renders the home screen', function() {
          return client
            .inputConnectionDetails({ hostname: 'localhost', port: 27018 })
            .clickConnectButton()
            .waitForStatusBar()
            .waitForWindowTitle('MongoDB Compass - localhost:27018')
            .getTitle().should.eventually.equal('MongoDB Compass - localhost:27018');
        });

        it('displays the instance details', function() {
          return client
            .getInstanceHeaderDetails().should.eventually.equal('localhost:27018');
        });
      });
    });

    context('when viewing the performance view', function() {
      it('renders the operations graph inserts', function() {
        return client
          .clickPerformanceTab()
          .getOperationsInserts()
          .should.eventually.equal('0');
      });

      it('renders the operations graph queries', function() {
        return client
          .getOperationsQueries()
          .should.eventually.equal('0');
      });

      it('renders the operations graph updates', function() {
        return client
          .getOperationsUpdates()
          .should.eventually.equal('0');
      });

      it('renders the operations graph deletes', function() {
        return client
          .getOperationsDeletes()
          .should.eventually.equal('0');
      });

      it('renders the operations graph deletes', function() {
        return client
          .getOperationsCommands()
          .should.eventually.not.equal(null);
      });

      it('renders the operations graph getmores', function() {
        return client
          .getOperationsGetMores()
          .should.eventually.equal('0');
      });

      it('renders the read/write active reads', function() {
        return client
          .getReadWriteActiveReads()
          .should.eventually.equal('0');
      });

      it('renders the read/write active writes', function() {
        return client
          .getReadWriteActiveWrites()
          .should.eventually.equal('0');
      });

      it('renders the read/write queued reads', function() {
        return client
          .getReadWriteQueuedReads()
          .should.eventually.equal('0');
      });

      it('renders the read/write queued writes', function() {
        return client
          .getReadWriteQueuedWrites()
          .should.eventually.equal('0');
      });

      it('renders the network bytes in', function() {
        return client
          .getNetworkBytesIn()
          .should.eventually.not.equal(null);
      });

      it('renders the network bytes out', function() {
        return client
          .getNetworkBytesOut()
          .should.eventually.not.equal(null);
      });

      it('renders the network connections', function() {
        return client
          .getNetworkConnections()
          .should.eventually.equal('3');
      });

      it('renders the memory vsize', function() {
        return client
          .getMemoryVSize()
          .should.eventually.not.equal(null);
      });

      it('renders the memory resident size', function() {
        return client
          .getMemoryResident()
          .should.eventually.not.equal(null);
      });

      it('renders the memory mapped size', function() {
        return client
          .getMemoryMapped()
          .should.eventually.not.equal(null);
      });

      it.skip('renders the slow operations #race', function() {
        return client
          .getSlowestOperations()
          .should.eventually.include('No Slow Operations');
      });

      context.skip('when pausing the performance tab #race', function() {
        it('pauses the performance tab', function() {
          return client
            .clickPerformancePauseButton()
            .getSlowestOperations()
            .should.eventually.include('No Slow Operations');
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

      context('when the escape key is pressed', function() {
        it('closes the create databases modal', function() {
          return client
            .clickDatabasesTab()
            .clickCreateDatabaseButton()
            .waitForCreateDatabaseModal()
            .pressEscape()
            .waitForCreateDatabasesModalHidden()
            .should.eventually.be.true;
        });
      });

      context('when the database name is invalid', function() {
        it('displays the error message', function() {
          return client
            .clickDatabasesTab()
            .clickCreateDatabaseButton()
            .waitForCreateDatabaseModal()
            .inputCreateDatabaseDetails({ name: '$test', collectionName: 'test' })
            .clickCreateDatabaseModalButton()
            .waitForModalError()
            .getModalErrorMessage()
            .should.eventually.equal("database names cannot contain the character '$'");
        });

        after(function() {
          return client.pressEscape()
            .waitForCreateDatabasesModalHidden();
        });
      });

      context('when the database name is valid', function() {
        it('creates the database', function() {
          return client
            .clickDatabasesTab()
            .clickCreateDatabaseButton()
            .waitForCreateDatabaseModal()
            .inputCreateDatabaseDetails({ name: 'music', collectionName: 'artists' })
            .clickCreateDatabaseModalButton()
            .waitForDatabaseCreation('music')
            .getDatabasesTabDatabaseNames()
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

    context('when entering a filter in the sidebar', function() {
      let dbCount;

      before(function(done) {
        client.getSidebarDatabaseNames().then(function(names) {
          dbCount = names.length;
          done();
        });
      });

      context('when entering a plain string', function() {
        it('filters the list', function() {
          return client
            .inputSidebarFilter('mus')
            .getSidebarDatabaseNames()
            .should.eventually.include('music');
        });
      });

      context('when entering a regex', function() {
        it('filters the list', function() {
          return client
            .inputSidebarFilter('ad|al')
            .getSidebarDatabaseNames()
            .should.eventually.include('local');
        });
      });

      context('when entering a blank regex', function() {
        it('restores the sidebar', function() {
          return client
            .inputSidebarFilter('(?:)')
            .getSidebarDatabaseNames()
            .should.eventually.have.length(dbCount);
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

      context('when the escape key is pressed', function() {
        it('closes the drop databases modal', function() {
          return client
            .clickDeleteDatabaseButton('music')
            .waitForDropDatabaseModal()
            .pressEscape()
            .waitForDropDatabasesModalHidden()
            .should.eventually.be.true;
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
          .getDatabasesTabDatabaseNames()
          .should.not.eventually.include('temp');
      });

      context('when enter key is pressed on drop database dialog', function() {
        it('does nothing when incorrect database name is entered', function() {
          return client
          .clickCreateDatabaseButton()
          .waitForCreateDatabaseModal()
          .inputCreateDatabaseDetails({ name: 'temp', collectionName: 'temp' })
          .clickCreateDatabaseModalButton()
          .waitForDatabaseCreation('temp')
          .clickDeleteDatabaseButton('temp')
          .waitForDropDatabaseModal()
          .inputDropDatabaseName('xkcd')
          .pressEnter()
          .waitForDropDatabaseModal()
          .should.eventually.be.true;
        });

        it('removes the database on press', function() {
          return client
          .inputDropDatabaseName('temp')
          .pressEnter()
          .waitForDatabaseDeletion('temp')
          .getDatabasesTabDatabaseNames()
          .should.not.eventually.include('temp');
        });
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
          .getCollectionsTabCollectionNames()
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

        context.skip('when the collection name is invalid #race', function() {
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

          it('closes create collection dialog on escape press', function() {
            return client
              .pressEscape()
              .waitForCreateCollectionModalHidden()
              .should.eventually.be.true;
          });

          it('displays error on enter press', function() {
            return client
              .clickCreateCollectionButton()
              .waitForCreateCollectionModal()
              .inputCreateCollectionDetails({ name: '$test' })
              .pressEnter()
              .waitForModalError()
              .getModalErrorMessage()
              .should.eventually.equal('invalid collection name');
          });

          after(function() {
            return client
              .pressEscape()
              .waitForCreateCollectionModalHidden();
          });
        });

        context('when the collection name is valid', function() {
          it('creates the collection', function() {
            return client
              .clickCreateCollectionButton()
              .waitForCreateCollectionModal()
              .inputCreateCollectionDetails({name: 'labels'})
              .clickCreateCollectionModalButton()
              .waitForCollectionCreation('labels')
              .getCollectionsTabCollectionNames()
              .should.eventually.include('labels');
          });

          it('adds the collection to the sidebar', function() {
            return client
              .waitForInstanceRefresh()
              .getSidebarCollectionNames()
              .should.eventually.include('music.labels');
          });

          it('updates the collection count', function() {
            return client
              .getSidebarCollectionCount()
              .should.eventually.equal(String(collCount + 1));
          });

          it('creates a collection with enter press', function() {
            return client
              .clickCreateCollectionButton()
              .waitForCreateCollectionModal()
              .inputCreateCollectionDetails({name: 'bands' })
              .pressEnter()
              .waitForCollectionCreation('bands')
              .getCollectionsTabCollectionNames()
              .should.eventually.include('bands');
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
              .getCollectionsTabCollectionNames()
              .should.not.eventually.include('labels');
          });

          it('pressing enter on incorrect collection name does nothing', function() {
            return client
            .clickDeleteCollectionButton('bands')
            .waitForDropCollectionModal()
            .inputDropCollectionName('robot-hugs')
            .pressEnter()
            .waitForDropCollectionModal()
            .should.eventually.be.true;
          });

          it('pressing enter on correct collection name removes collection', function() {
            return client
            .inputDropCollectionName('bands')
            .pressEnter()
            .waitForDropCollectionModal()
            .waitForCollectionDeletion('bands')
            .getCollectionsTabCollectionNames()
            .should.not.eventually.include('bands');
          });

          it('removes the collection from the sidebar', function() {
            return client
              .waitForInstanceRefresh()
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
        client.getInstanceHeaderVersion().then(function(value) {
          serverVersion = value.replace(/MongoDB ([0-9.]+) Community/, '$1');
          done();
        });
      });

      it('displays the collection view', function() {
        return client
          .clickCollectionInSidebar('music.artists')
          .waitForStatusBar()
          .waitForWindowTitle('MongoDB Compass - localhost:27018/music.artists')
          .getTitle().should.eventually.equal(
            'MongoDB Compass - localhost:27018/music.artists'
          );
      });

      context('when inserting a document', function() {
        context('when the document is valid', function() {
          it('creates the document #race', function() {
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
              .clickDocumentsTab()
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
        it.skip('saves the changes to the document #race', function() {
          return client
            .clickDocumentsTab()
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
            .getCollectionsTabCollectionNames()
            .should.eventually.include('artists');
        });

        it('applies the filter again while on schema tab', function() {
          return client
            .waitForStatusBar()
            .clickCollectionInSidebar('music.artists')
            .waitForStatusBar()
            .inputFilterFromSchemaTab(filter)
            .waitForStatusBar()
            .clickApplyFilterButtonFromSchemaTab()
            .getSamplingMessageFromSchemaTab()
            .should
            .eventually
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
              .should.eventually.equal('1');
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
            .should.eventually.include('Query returned 1 document.');
        });

        it('updates the schema view', function() {
          const expected = 'This report is based on a sample of 1 document (100.00%).';
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
            .clickIndexTableHeader('index-header-name')
            .getIndexNames()
            .should.eventually.equal('_id_');
        });

        it('renders the index types', function() {
          return client
            .getIndexTypes()
            .should.eventually.equal('REGULAR');
        });

        it('renders the index usages', function() {
          return isIndexUsageEnabled(serverVersion) ?
            client.getIndexUsages().should.eventually.be.at.least('1') :
            client.getIndexUsages().should.eventually.be.equal('0');
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
                .inputCreateIndexDetails({ typeIndex: 1 })
                .clickCreateIndexModalButton()
                .waitForModalError()
                .getModalErrorMessage()
                .should.eventually.equal('You must select a field name and type');
            });
          });

          context('when the index is valid', function() {
            context('when the indexes are sorted', function() {
              it('adds the index to the list', function() {
                return client
                  .inputCreateIndexDetails({ name: 'name_1', field: 'name' })
                  .clickCreateIndexModalButton()
                  .waitForIndexCreation('name_1')
                  .waitForVisibleInCompass('create-index-modal', true)
                  .getIndexNames()
                  .should.eventually.include('name_1');
              });

              it('retains the previous sorting of the list', function() {
                return client
                  .getIndexNames()
                  .should.eventually.deep.equal([ 'name_1', '_id_' ]);
              });
            });

            context.skip('when adding another index #race', function() {
              it('allows another index to be added', function() {
                return client
                  .clickCreateIndexButton()
                  .waitForCreateIndexModal()
                  .inputCreateIndexDetails({ name: 'name_-1', field: 'name', typeIndex: 2 })
                  .clickCreateIndexModalButton()
                  .waitForIndexCreation('name_-1')
                  .getIndexNames()
                  .should.eventually.include('name_-1');
              });
              it('retains the current index table sort order', function() {
                return client
                  .getIndexNames()
                  .should.eventually.deep.equal([ 'name_1', 'name_-1', '_id_' ]);
              });
              context('when sorting the index list', function() {
                context('when clicking on the name header', function() {
                  it('sorts the indexes by name', function() {
                    return client
                      .clickIndexTableHeader('index-header-name')
                      .getIndexNames()
                      .should.eventually.deep.equal([ '_id_', 'name_-1', 'name_1' ]);
                  });
                });
              });
            });
          });
        });

        context('when creating an index not part of the schema fields', function() {
          it.skip('adds a new field #race', function() {
            return client
              .clickCreateIndexButton()
              .waitForCreateIndexModal()
              .inputCreateIndexDetails({ name: 'foo-index', field: 'foo', typeIndex: 3 })
              .clickCreateIndexModalButton()
              .waitForIndexCreation('foo-index')
              .getIndexNames()
              .should.eventually.include('foo-index');
          });
        });

        context('when dropping an index', function() {
          it('requires confirmation of the index name');
        });
      });

      context('when creating a validation rule', function() {

      });

      context('when deleting a validation rule', function() {

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

        context.skip('when the new document does not match the filter #race', function() {
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
});
