const { launchCompass, quitCompass} = require('../support/spectron-support');

context('Validation', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .waitForWindowTitle('MongoDB Compass - localhost:27018')
        .createDatabaseCollection('music', 'artists')
        .goToCollection('music', 'artists')
        .insertDocument({
          'name': 'Aphex Twin',
          'genre': 'Electronic',
          'location': 'London'
        }, 1)
        .then(() => {
          done();
        });
    });
  });

  after(function(done) {
    client
      .teardownTest('music').then(() => {
        quitCompass(app, done);
      });
  });

  context('when creating a validation rule', function() {

  });

  context('when deleting a validation rule', function() {

  });
});
