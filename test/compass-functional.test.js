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

  context('when working with the application', function() {
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

    context('when opening the application', function() {
      before(function(done) {
        CrudSupport.insertMany(CONNECTION, COLLECTION, DOCUMENTS, done);
      });

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
            .getTitle().should.eventually.be.equal('MongoDB Compass - localhost:27018');
        });
      });
    });

    context('when working with collections', function() {
      context('when selecting a collection', function() {
        it('renders the sample collection in the title', function() {
          return client
            .startUsingCompass()
            .selectCollection('compass-test.bands')
            .getTitle().should.eventually.be.equal(
            'MongoDB Compass - localhost:27018/compass-test.bands'
          );
        });

        it('renders the schema tab', function() {
          return client
            .waitForStatusBar()
            .gotoTab('SCHEMA')
            .getText('li.bubble code.selectable')
            .should
            .eventually
            .include
            .members([ 'Arca', 'Bonobo', 'Aphex Twin', 'Beacon' ]);
        });

        context('when applying a filter', function() {
          it('the text in refine bar matches query', function() {
            const query = '{ "name":"Arca" }';
            return client
              .waitForStatusBar()
              .refineSample(query)
              .getValue('input#refine_input').should.eventually.include(query);
          });

          it('samples the matching documents', function() {
            return client
              .waitForStatusBar()
              .applySample()
              .getText('div.sampling-message b').should.eventually.include('1');
          });

          it('updates the schema view', function() {
            return client
              .getText('li.bubble code.selectable')
              .should
              .eventually
              .equal('Arca');
          });

          it('filters out non-matches from the document list', function() {
            return client
              .gotoTab('DOCUMENTS')
              .getText('div.element-value-is-string')
              .should
              .not
              .eventually
              .include('Aphex Twin');
          });

          it('includes documents that match the filter', function() {
            return client
              .getText('div.element-value-is-string')
              .should
              .eventually
              .include('Arca');
          });
        });

        // context('when resetting the filter', function() {
        //   it('resets the sample to the original', function() {
        //     return client
        //       .waitForStatusBar()
        //       .resetSample()
        //       .getText('div.sampling-message b').should.eventually.include('4');
        //   });
        // });
      });

      // context('when working in the documents tab', function() {
      //   context('when viewing documents', function() {
      //     it('renders the documents in the list', function() {
      //       return client
      //         .gotoDocumentsTab()
      //         .getText('div.element-value-is-string')
      //         .should
      //         .eventually
      //         .include('Aphex Twin');
      //     });
      //   });
      // });

      // context('when working in the explain tab', function() {
      //   context('when viewing the explain tab', function() {
      //     it('renders the stages', function() {
      //       return client
      //         .gotoExplainPlanTab()
      //         .getText('h3.stage-header')
      //         .should
      //         .eventually
      //         .include('COLLSCAN');
      //     });
      //   });
      // });

      // context('when working in the indexes tab', function() {
      //   context('when viewing the indexes tab', function() {
      //     it('renders the indexes', function() {
      //       return client
      //         .gotoIndexesTab()
      //         .getText('div.index-definition div.name')
      //         .should
      //         .eventually
      //         .include('_id_');
      //     });
      //   });
      // });
    });
  });
});
