'use strict';

const utils = require('mongodb-test-utils')
const SpectronSupport = utils.SpectronSupport;
const CrudSupport = utils.CrudSupport;
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const Connection = require('mongodb-connection-model');

const DATABASE = 'compass-test';
const COLLECTION = 'bands';
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: DATABASE });

/**
 * Test documents to sample with a local server.
 */
var DOCUMENTS = [
  { 'name': 'Aphex Twin' },
  { 'name': 'Bonobo' },
  { 'name': 'Arca' },
  { 'name': 'Beacon' }
];

describe('Schema Window #spectron', function() {
  this.slow(10000);
  this.timeout(30000);
  var app = null;

  before(function(done) {
    SpectronSupport.startApplication(dist).then(function(application) {
      app = application;
      done();
    });
  });

  after(function(done) {
    SpectronSupport.stopApplication(app).then(done);
  });

  context('when databases exist', function() {
    context('when collections exist', function() {
      before(require('mongodb-runner/mocha/before')({ port: 27018 }));
      after(require('mongodb-runner/mocha/after')());

      context('when selecting a collection', function() {
        before(function(done) {
          CrudSupport.insertMany(CONNECTION, COLLECTION, DOCUMENTS, done);
        });

        after(function(done) {
          CrudSupport.removeAll(CONNECTION, COLLECTION, done);
        });

        it('renders the sample collection in the title', function() {
          return app.client
            .gotoSchemaWindow({ port: 27018 }, 30000)
            .startUsingCompass()
            .selectCollection('compass-test.bands')
            .getTitle().should.eventually.be.equal(
            'MongoDB Compass - Schema - localhost:27018/compass-test.bands'
          );
        });

        it('displays the schema sample for the collection', function() {
          return app.client
            .getText('div#document_count').should.eventually.be.equal('4')
            .getText('div#index_count').should.eventually.be.equal('1');
        });

        context('when selecting the sampled documents', function() {
          it('displays the documents in the sidebar', function() {
            return app.client
              .viewSampleDocuments()
              .getText('div#sample_documents ol.document-list li.string div.document-property-key')
              .should.eventually.exist;
          });
        });

        context('when refining the sample', function() {
          it('displays the matching documents', function() {
            return app.client
              .refineSample('{ "name":"Arca" }')
              .waitForStatusBar()
              .getText('div.sampling-message b').should.eventually.be.equal('1');
          });
        });

        context('when resetting a sample refinement', function() {
          it('resets the sample to the original', function() {
            return app.client
              .resetSample()
              .waitForStatusBar()
              .getText('div.sampling-message b').should.eventually.be.equal('4');
          });
        });
      });
    });
  });
});
