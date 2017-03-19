const { launchCompass, quitCompass} = require('../support/spectron-support');

context('Explain', function() {
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
    client
      .teardownTest('music').then(() => {
        quitCompass(app, done);
      });
  });

  context('when applying a filter', function() {
    const filter = '{"name":"Bonobo"}';

    context('when viewing the explain plan view', function() {
      it('applies the filter in the explain plan tab', function() {
        return client
          .clickExplainPlanTab()
          .inputFilterFromExplainPlanTab(filter)
          .clickApplyFilterButtonFromExplainPlanTab()
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
});
