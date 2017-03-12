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

  context('when applying a filter', function() {
    const filter = '{"name":"Bonobo"}';

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
  });
});
