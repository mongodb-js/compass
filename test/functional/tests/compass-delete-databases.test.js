const { launchCompass, quitCompass} = require('../spectron-support');


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

  context.skip('when deleting a database', function() {
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
});
