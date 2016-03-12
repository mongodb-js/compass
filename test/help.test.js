var helpers = require('./helpers');

describe('Help Dialog #spectron', function() {
  this.slow(10000);
  this.timeout(30000);

  beforeEach(helpers.startApplication);
  afterEach(helpers.stopApplication);
  /**
   * TODO (imlucas) Failing on travis...
   * `undefined: element (div.content h1.help-entry-title)
   * still not visible after 5000ms`
   * @see https://travis-ci.com/10gen/compass/builds/22388525
   */
  context.skip('when selecting a topic', function() {
    it('displays the help contents', function() {
      return this.app.client
        .waitForVisible('i.help')
        .click('i.help')
        .waitForHelpDialog()
        .getText('div.content h1.help-entry-title').should.eventually.be.equal('Favorite Name');
    });
  });

  context('when filtering topics', function() {
    it('displays the matching topics', function() {
      return this.app.client
        .waitForVisible('i.help')
        .click('i.help')
        .waitForHelpDialog()
        .filterHelpTopics('Sampling Results')
        .getText('li.list-group-item span').should.eventually.be.equal('Sampling Results');
    });
  });
});
