const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { launchCompass, quitCompass} = require('./support/spectron-support');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'music' });

describe.skip('#validation', function() {
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

  context('when viewing the validation tab', function() {
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

    context('when creating a validation rule', function() {

    });

    context('when deleting a validation rule', function() {

    });
  });
});
