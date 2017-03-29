const { launchCompass, quitCompass} = require('../support/spectron-support');
const debug = require('debug')('mongodb-compass:spectron-support');

describe('Explain', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    debug('before hook for explain.test.js');
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    debug('after hook for explain.test.js');
    quitCompass(app, done);
  });

  context('when viewing the explain plan tab', function() {
    before(function(done) {
      debug('before hook for explain');
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .createDatabaseCollection('music', 'artists')
        .goToCollection('music', 'artists')
        .then(() => {
          done();
        });
    });

    after(function(done) {
      debug('after hook for explain');
      client
        .teardownTest('music').then(() => {
          done();
        });
    });

    context('when applying a filter', function() {
      const filter = '{"name":"Bonobo"}';

      before(function(done) {
        debug('before hook for explain inserting a doc');
        client
          .insertDocument({
            'name': 'Aphex Twin',
            'genre': 'Electronic',
            'location': 'London'
          }, 1)
          .then(() => {
            done();
          });
      });

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
});
