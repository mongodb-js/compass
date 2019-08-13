const { launchCompass, quitCompass} = require('./support/spectron-support');

describe('#launch', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass().then(function(application) {
      app = application;
      client = application.client;
    });
  });

  after(function() {
    return quitCompass(app);
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
            .waitForConnectView()
            .getLinkToFormViewText()
            .should.eventually.be.equal('Fill in connection fields individually');
        });

        it('allows favorites to be saved');
        it('allows favorites to be edited');
      });
    });
  });
});
