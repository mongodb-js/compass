var helpers = require('./helpers');

describe('Help Dialog #spectron', function() {
  this.slow(10000);
  this.timeout(30000);

  before(helpers.startApplication);
  after(helpers.stopApplication);

  context('when selecting a topic', function() {
    it('displays the help contents', function() {
      return this.app.client
        .waitForVisible('i.help')
        .click('i.help')
        .waitForHelpDialog(30000)
        .getText('div.content h1.help-entry-title').should.eventually.be.equal('Favorite Name');
    });
  });

  context('when filtering topics', function() {
    it('displays the matching topics', function() {
      return this.app.client
        .filterHelpTopics('Sampling Results')
        .getText('li.list-group-item span').should.eventually.be.equal('Sampling Results');
    });
  });
});
