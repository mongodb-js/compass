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
    // const filter = '{"name":"Bonobo"}';

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
});
