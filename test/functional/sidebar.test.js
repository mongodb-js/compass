const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass} = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

describe('#sidebar', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    this.timeout(300000); // 5 minutes
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

  context('when entering filters in the sidebar', function() {
    const dataService = new DataService(CONNECTION);
    let dbCount;

    before(function(done) {
      dataService.connect(function() {
        dataService.createCollection('music.artists', {}, function() {
          return client
            .clickInstanceRefreshIcon()
            .waitForInstanceRefresh()
            .getSidebarDatabaseNames().then(function(names) {
              dbCount = names.length;
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

    context('when entering a plain string', function() {
      it('filters the list', function() {
        return client
          .inputSidebarFilter('mus')
          .getSidebarDatabaseNames()
          .should.eventually.include('music');
      });
    });

    context('when entering a regex', function() {
      it('filters the list', function() {
        return client
          .inputSidebarFilter('ad|al')
          .getSidebarDatabaseNames()
          .should.eventually.include('local');
      });
    });

    context.skip('when entering a blank regex #race', function() {
      it('restores the sidebar', function() {
        return client
          .inputSidebarFilter('(?:)')
          .getSidebarDatabaseNames()
          .should.eventually.have.length(dbCount);
      });
    });
  });
});
