const { launchCompass, quitCompass} = require('../support/spectron-support');
const debug = require('debug')('mongodb-compass:spectron-support');

describe('Validation', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    debug('before hook for validation.test.js');
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    debug('after hook for validation.test.js');
    quitCompass(app, done);
  });

  context('when viewing the validation tab', function() {
    before(function(done) {
      debug('before hook for validation');
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .createDatabaseCollection('music', 'artists')
        .goToCollection('music', 'artists')
        .then(() => {
          done();
        });
    });

    after(function(done) {
      debug('after hook for validation');
      client
        .teardownTest('music').then(() => {
          done();
        });
    });

    context('when creating a validation rule', function() {

    });

    context('when deleting a validation rule', function() {

    });
  });
});
