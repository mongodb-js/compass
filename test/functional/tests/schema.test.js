const { launchCompass, quitCompass} = require('../support/spectron-support');
const debug = require('debug')('mongodb-compass:spectron-support');

describe('Schema', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    debug('before hook for schema.test.js');
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    debug('after hook for schema.test.js');
    quitCompass(app, done);
  });

  context('when viewing the schema tab', function() {
    before(function(done) {
      debug('before hook for schema');
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .createDatabaseCollection('music', 'artists')
        .goToCollection('music', 'artists')
        .then(() => {
          done();
        });
    });

    after(function(done) {
      debug('after hook for schema');
      client
        .teardownTest('music').then(() => {
          done();
        });
    });

    context('when applying a filter', function() {
      const filter = '{"name":"Bonobo"}';
      const expectedZeroDoc = 'Query returned 0 documents.';
      const expectedOneDoc = 'Query returned 1 document.';
      const expectedZeroReport = 'This report is based on a sample of 0 documents (0.00%).';

      before(function(done) {
        debug('before hook for schema inserting a doc');
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
});
