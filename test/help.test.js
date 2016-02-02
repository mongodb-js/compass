var helpers = require('./helpers');

if (process.env.EVERGREEN) {
  helpers.warnEvergreen();
} else {
  describe('Help Dialog', function() {
    this.slow(10000);
    this.timeout(30000);

    beforeEach(helpers.startApplication);
    afterEach(helpers.stopApplication);

    context('when selecting a topic', function() {
      it('displays the help contents');
    });

    context('when filtering topics', function() {
      it('displays the matching topics');
    });
  });
}
