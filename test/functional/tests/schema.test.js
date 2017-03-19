const { launchCompass, quitCompass} = require('../support/spectron-support');

context('Schema', function() {
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
        .waitForWindowTitle('MongoDB Compass - localhost:27018')
        .createDatabaseCollection('music', 'artists')
        .goToCollection('music', 'artists')
        .insertDocument({
          'name': 'Aphex Twin',
          'genre': 'Electronic',
          'location': 'London'
        }, 1)
        .then(() => {
          done();
        });
    });
  });

  after(function(done) {
    quitCompass(app, done);
  });

  context('when applying a filter', function() {
    const filter = '{"name":"Bonobo"}';
    const expectedZeroDoc = 'Query returned 0 documents.';
    const expectedOneDoc = 'Query returned 1 document.';
    const expectedZeroReport = 'This report is based on a sample of 0 documents (0.00%).';

    it('shows a blank schema view', function() {
      return client
        .clickSchemaTab()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.include(`${expectedOneDoc}`);
    });

    it('shows a schema on refresh', function() {
      return client
        .clickDatabaseInSidebar('music')
        .waitForDatabaseView()
        .goToCollection('music', 'artists')
        .getSamplingMessageFromSchemaTab()
        .should
        .eventually
        .include(`${expectedOneDoc} This report is based on a sample of 1 document (100.00%).`);
    });

    it('applies the filter from schema view', function() {
      return client
        .inputFilterFromSchemaTab(filter)
        .waitForStatusBar()
        .clickApplyFilterButtonFromSchemaTab()
        .waitForStatusBar()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.include(`${expectedZeroDoc} ${expectedZeroReport}`);
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
        .goToCollection('music', 'artists')
        .inputFilterFromSchemaTab(filter)
        .waitForStatusBar()
        .clickApplyFilterButtonFromSchemaTab()
        .waitForStatusBar()
        .getSamplingMessageFromSchemaTab()
        .should.eventually.equal(`${expectedZeroDoc} ${expectedZeroReport}`);
    });
  });
});
