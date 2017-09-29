const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass, isIndexUsageEnabled } = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

describe('#indexes', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;
  let serverVersion;

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

  context('when navigating to the indexes tab', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      const doc = {'name': 'Aphex Twin', 'genre': 'Electronic', 'location': 'London'};
      dataService.connect(function() {
        dataService.insertOne('music.artists', doc, function() {
          return client
            .goToCollection('music', 'artists')
            .getServerVersion().then(function(value) {
              serverVersion = value.replace(/MongoDB ([0-9.]+) Community/, '$1');
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
        client.getIndexUsages().should.eventually.be.at.least('0') :
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
});
