process.env.NODE_ENV = 'testing';

var SpectronSupport = require('./support/spectron-support');
var CrudSupport = require('./support/crud-support');
var Connection = require('mongodb-connection-model');

var DATABASE = 'compass-test';
var COLLECTION = 'bands';
var CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: DATABASE });

/**
 * Test documents to sample with a local server.
 */
var DOCUMENTS = [
  { 'name': 'Aphex Twin' },
  { 'name': 'Bonobo' },
  { 'name': 'Arca' },
  { 'name': 'Beacon' }
];

describe('Compass #spectron', function() {
  this.slow(30000);
  this.timeout(60000);
  var app = null;
  var client = null;

  before(function(done) {
    SpectronSupport.startApplication().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    SpectronSupport.stopApplication(app);
    done();
  });

  context('when working with the application', function() {
    before(require('mongodb-runner/mocha/before')({ port: 27018 }));
    after(require('mongodb-runner/mocha/after')());

    context('when opening the application', function() {
      it('renders the connect window', function() {
        return client.
          waitForVisible('select[name=authentication]', 60000).
          getTitle().should.eventually.be.equal('MongoDB Compass - Connect');
      });
    });

    context('when connecting to a server', function() {
      context('when the server exists', function() {
        it('opens the instance window', function() {
          return client
            .fillOutForm({ hostname: 'localhost', port: 27018 })
            .clickConnect()
            .waitForSchemaWindow()
            .getTitle().should.eventually.be.equal('MongoDB Compass');
        });
      });
    });

    context('when working with collections', function() {
      before(function(done) {
        CrudSupport.insertMany(CONNECTION, COLLECTION, DOCUMENTS, done);
      });

      after(function(done) {
        CrudSupport.removeAll(CONNECTION, COLLECTION, done);
      });

      context('when selecting a collection', function() {
        it('renders the sample collection in the title', function() {
          return client
            .startUsingCompass()
            .selectCollection('compass-test.bands')
            .getTitle().should.eventually.be.equal(
            'MongoDB Compass - localhost:27018/compass-test.bands'
          );
        });

        context('when applying a filter', function() {
          it('samples the matching documents', function() {
            return client
              .waitForStatusBar()
              .refineSample('{ "name":"Arca" }')
              .waitForStatusBar()
              .getText('div.sampling-message b').should.eventually.include('1');
          });
        });

        context('when resetting the filter', function() {
          it('resets the sample to the original', function() {
            return client
              .resetSample()
              .waitForStatusBar()
              .getText('div.sampling-message b').should.eventually.include('4');
          });
        });
      });

      context('when working in the documents tab', function() {
        context('when viewing documents', function() {
          it('renders the documents in the list', function() {
            return client
              .gotoDocumentsTab()
              .getText('div.element-value-is-string')
              .should
              .eventually
              .include('Aphex Twin');
          });
        });
      });
    });
  });
});
