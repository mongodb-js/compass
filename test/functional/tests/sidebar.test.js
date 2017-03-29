const { launchCompass, quitCompass} = require('../support/spectron-support');
const debug = require('debug')('mongodb-compass:spectron-support');

describe('Sidebar', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    debug('before hook for sidebar.test.js');
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    debug('after hook for sidebar.test.js');
    quitCompass(app, done);
  });

  context('when viewing the sidebar', function() {
    before(function(done) {
      debug('before hook for sidebar');
      client
        .connectToCompass({ hostname: 'localhost', port: 27018 })
        .createDatabaseCollection('music', 'artists')
        .then(() => {
          done();
        });
    });

    after(function(done) {
      debug('after hook for sidebar');
      client
        .teardownTest('music').then(() => {
          done();
        });
    });

    context('when entering a filter in the sidebar', function() {
      let dbCount;

      before(function(done) {
        client.getSidebarDatabaseNames().then(function(names) {
          dbCount = names.length;
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

      context('when entering a blank regex', function() {
        it('restores the sidebar', function() {
          return client
            .inputSidebarFilter('(?:)')
            .getSidebarDatabaseNames()
            .should.eventually.have.length(dbCount);
        });
      });
    });
  });
});
