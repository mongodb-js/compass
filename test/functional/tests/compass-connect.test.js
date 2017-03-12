const { launchCompass, quitCompass} = require('../spectron-support');

context('when a MongoDB instance is running', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;
  before(function(done) {
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    quitCompass(app, done);
  });

  context('when connecting to a server', function() {
    context('when the server exists', function() {
      it('renders the home screen', function() {
        return client
          .inputConnectionDetails({ hostname: 'localhost', port: 27018 })
          .clickConnectButton()
          .waitForStatusBar()
          .waitForHomeView()
          .getTitle().should.eventually.equal('MongoDB Compass - localhost:27018');
      });

      it('displays the instance details', function() {
        return client
          .getInstanceHeaderDetails().should.eventually.equal('localhost:27018');
      });
    });
  });
});
