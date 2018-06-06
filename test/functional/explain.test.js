const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass} = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27017, ns: 'music' });

describe.skip('#explain', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass()
      .then(function(application) {
        app = application;
        client = application.client;
        return client.connectToCompass({ hostname: 'localhost', port: 27018 });
      });
  });

  after(function() {
    return quitCompass(app);
  });

  context('when running queries on the explain plan', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      const doc = {'name': 'Aphex Twin', 'genre': 'Electronic', 'location': 'London'};
      dataService.connect(function() {
        dataService.insertOne('music.artists', doc, function() {
          return client
            .goToCollection('music', 'artists').then(function() {
              done();
            });
        });
      });
    });

    after(function(done) {
      dataService.dropDatabase('music', function() {
        dataService.disconnect();
        done();
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
          .should.eventually.include('Evaluate the performance of your query');
      });

      it('updates the document list', function() {
        return client
          .clickDocumentsTab()
          .getSamplingMessageFromDocumentsTab()
          .should.eventually.include('of 1');
      });

      it('updates the schema view', function() {
        const expected = 'This report is based on a sample of 1 document (100.00%).';
        return client
          .clickSchemaTab()
          .clickApplyFilterButtonFromSchemaTab()
          .waitForStatusBar()
          .getSamplingMessageFromSchemaTab()
          .should.eventually.include(expected);
      });
    });
  });
});
