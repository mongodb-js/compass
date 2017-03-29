const { launchCompass, quitCompass} = require('./support/spectron-support');

context('#connect Connecting to an Instance', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass()
      .then(function(application) {
        app = application;
        client = application.client;
      });
  });

  after(function() {
    return quitCompass(app);
  });

  context('when connecting to a server', function() {
    context('when the server exists', function() {
      it('renders the home screen', function() {
        return client
          .inputConnectionDetails({ hostname: 'localhost', port: 27018 })
          .clickConnectButton()
          .waitForStatusBar()
          .waitForWindowTitle('MongoDB Compass - localhost:27018')
          .getTitle().should.eventually.equal('MongoDB Compass - localhost:27018');
      });

      it('displays the instance details', function() {
        return client
          .getInstanceHeaderDetails().should.eventually.equal('localhost:27018');
      });
    });
  });
});
