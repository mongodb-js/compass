var helpers = require('./helpers');

if (process.env.EVERGREEN) {
  helpers.warnEvergreen();
} else {
  describe('Schema Window', function() {
    this.slow(10000);
    this.timeout(30000);

    beforeEach(function() {
      helpers.startApplication().then(function() {
        return this.app.client.gotoSchemaWindow();
      });
    });
    afterEach(helpers.stopApplication);

    context('when no databases exist', function() {

    });

    context('when databases exist', function() {
      context('when no collections exist', function() {

      });

      context('when collections exist', function() {
        context('when selecting a collection', function() {
          it('displays the schema sample for the collection');

          it('displays the documents in the collection');

          context('when the schema contains nested documents', function() {
            it('allows expanding the nested content');
          });
        });
      });
    });
  });
}
