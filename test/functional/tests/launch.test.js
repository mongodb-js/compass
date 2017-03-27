const { launchCompass, quitCompass} = require('../support/spectron-support');
const debug = require('debug')('mongodb-compass:spectron-support');

describe('Application Launch', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function(done) {
    debug('before hook for launch.test.js');
    launchCompass().then(function(application) {
      app = application;
      client = application.client;
      done();
    });
  });

  after(function(done) {
    debug('after hook for launch.test.js');
    quitCompass(app, done);
  });

  context('when launching the application', function() {
    it('displays the feature tour modal', function() {
      return client
        .waitForFeatureTourModal()
        .getText('h2[data-hook=title]')
        .should.eventually.equal('Welcome to MongoDB Compass');
    });

    context('when closing the feature tour modal', function() {
      it('displays the privacy settings', function() {
        return client
          .clickCloseFeatureTourButton()
          .waitForPrivacySettingsModal()
          .clickEnableProductFeedbackCheckbox()
          .clickEnableCrashReportsCheckbox()
          .clickEnableUsageStatsCheckbox()
          .clickEnableAutoUpdatesCheckbox()
          .getModalTitle()
          .should.eventually.equal('Privacy Settings');
      });

      context('when closing the privacy settings modal', function() {
        it('renders the connect screen', function() {
          return client
            .clickClosePrivacySettingsButton()
            .waitForWindowTitle('MongoDB Compass - Connect')
            .getTitle().should.eventually.be.equal('MongoDB Compass - Connect');
        });

        it('allows favorites to be saved');
        it('allows favorites to be edited');
      });
    });
  });
});
