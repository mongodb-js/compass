'use strict';

process.env.NODE_ENV = 'testing';

const SpectronSupport = require('./support/spectron-support');
const CrudSupport = require('./support/crud-support');
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

describe('Compass', function() {
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

  after(function() {
    SpectronSupport.stopApplication(app);
  });

  context('when working with the appication', function() {
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
              .getText('li.document-property.string div.document-property-value')
              .should
              .eventually
              .include('Aphex Twin');
          });
        });

        context('when editing a document', function() {

        });

        context('when inserting a document', function() {

        });

        context('when deleting a document', function() {

        });

        context('when cloning a document', function() {

        });
      });

      context('when viewing indexes', function() {
        it('renders the index view', function() {
          return client
            .gotoIndexesTab()
            .getText('td.name-column div.name')
            .should
            .eventually
            .equal('_id_');
        });
      });

      context('when viewing the explain plan', function() {
        it('renders the explain plan view', function() {
          return client
            .gotoExplainPlanTab()
            .getText('div.nReturned span.stat-value')
            .should
            .eventually
            .equal('4');
        });
      });
    });
  // context('when selecting a topic', function() {
    // it('displays the help contents', function() {
      // return app.client
        // .waitForVisible('i.help', 30000)
        // .click('i.help')
        // .waitForHelpDialog(30000)
        // .getText('div.content h1.help-entry-title').should.eventually.be.equal('Favorite Name');
    // });
  // });

  // context('when filtering topics', function() {
    // it('displays the matching topics', function() {
      // return app.client
        // .filterHelpTopics('Sampling Results')
        // .getText('li.list-group-item span').should.eventually.be.equal('Sampling Results');
    // });
  // });
  });
});
