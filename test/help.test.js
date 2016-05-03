var SpectronSupport = require('hadron-test-utils').SpectronSupport;
var path = require('path');
var dist = path.join(__dirname, '..', 'dist');

describe('Help Dialog #spectron', function() {
  this.slow(10000);
  this.timeout(30000);
  var app = null;

  before(function(done) {
    SpectronSupport.startApplication(dist).then(function(application) {
      app = application;
      done();
    });
  });

  after(function(done) {
    SpectronSupport.stopApplication(app).then(done);
  });

  context('when selecting a topic', function() {
    it('displays the help contents', function() {
      return app.client
        .waitForVisible('i.help', 30000)
        .click('i.help')
        .waitForHelpDialog(30000)
        .getText('div.content h1.help-entry-title').should.eventually.be.equal('Favorite Name');
    });
  });

  context('when filtering topics', function() {
    it('displays the matching topics', function() {
      return app.client
        .filterHelpTopics('Sampling Results')
        .getText('li.list-group-item span').should.eventually.be.equal('Sampling Results');
    });
  });
});
