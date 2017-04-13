const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass } = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  ns: 'music',
  port: 27018
});

describe('#charts', function() {
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

  context('when manipulating documents in the crud view', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      dataService.connect(function() {
        const docs = [
          { name: 'Bauhaus', location: {city: 'Dessau-Roßlau'} },
          { name: 'Coldplay', genre: 'Electronic', location: {city: 'London'} }
        ];
        dataService.insertMany('music.artists', docs, {}, function() {
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

    // Expected to become redundant when moved into its own product or distro
    context('when typing to enable via the query bar', function() {
      it('allows "enable chartView" feature flag', function() {
        return client
          .waitForStatusBar()
          .inputFilterFromSchemaTab('enable chartView')
          .clickApplyFilterButtonFromSchemaTab()
          .waitForStatusBar()
          .goToCollection('music', 'artists')
          .getChartsTabText().should.eventually.equal('CHARTS');
      });
    });

    context('in the default state', function() {
      it('displays a <FieldPanel> of <DraggableField> components', function() {
        return client
          .clickChartsTab()
          .getFieldPanelItemTitles()
          .should.eventually.be.deep.equal([
            '_id',
            'genre',
            'location.city',
            'name'
          ]);
      });
    });

    // Expected to become redundant when moved into its own product or distro
    context('when typing to disable via the query bar', function() {
      it('allows "disable chartView" feature flag', function() {
        return client
          // Explicitly clean up so it does not leak into any downstream tests
          .inputFilterFromChartsTab('disable chartView')
          .clickApplyFilterButtonFromChartsTab()
          .waitForStatusBar();
      });
    });
  });
});
