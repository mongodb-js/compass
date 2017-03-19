const { launchCompass, quitCompass} = require('../support/spectron-support');

context('Creating & Deleting Collections', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;
  before(function(done) {
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .createDatabaseCollection('music', 'artists')
        .then(() => {
          done();
        });
    });
  });

  after(function(done) {
    quitCompass(app, done);
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
      });

      context('when the collection name is valid', function() {
        it('creates the collection', function() {
          return client
            .inputCreateCollectionDetails({ name: 'labels' })
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

      context('when viewing a collection', function() {
        it('displays the collection view', function() {
          return client
            .clickCollectionInSidebar('music.artists')
            .waitForStatusBar()
            .getTitle().should.eventually.equal(
              'MongoDB Compass - localhost:27018/music.artists'
            );
        });
      });
    });
  });
});
