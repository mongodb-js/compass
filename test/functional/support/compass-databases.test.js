const { launchCompass, quitCompass} = require('./spectron-support');

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
        client.connectToCompass({ hostname: 'localhost', port: 27018 });
        done();
      });
    });

    after(function(done) {
      quitCompass(app, done);
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
            // .clickDatabasesTab()
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
  });
});
