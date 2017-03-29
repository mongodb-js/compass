const { launchCompass, quitCompass} = require('./support/spectron-support');

context('#databases Creating & Deleting Databases', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass().then(function(application) {
      app = application;
      client = application.client;
      return client;
    }).then(function() {
      return client
        .connectToCompass({ hostname: 'localhost', port: 27018 });
    });
  });

  after(function() {
    return client
    .teardownTest('music').then(() => {
      return quitCompass(app);
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
        .waitUntilDatabaseDeletion('temp')
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
        .waitUntilDatabaseDeletion('temp')
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
