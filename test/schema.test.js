var helpers = require('./helpers');

if (process.env.EVERGREEN) {
  helpers.warnEvergreen();
} else {
  describe('Schema Window', function() {
    this.slow(10000);
    this.timeout(30000);

    beforeEach(helpers.startApplication);
    afterEach(helpers.stopApplication);

    context('when no databases exist', function() {

    });

    context('when databases exist', function() {
      context('when no collections exist', function() {

      });

      context('when collections exist', function() {
        before(require('mongodb-runner/mocha/before')({ port: 27018 }));
        after(require('mongodb-runner/mocha/after')());

        context('when selecting a collection', function() {
          beforeEach(helpers.insertTestDocuments);
          afterEach(helpers.removeTestDocuments);

          it('displays the schema sample for the collection', function() {
            return this.app.client
              .gotoSchemaWindow({ port: 27018 })
              .waitForVisible('span[title="compass-test.bands"]')
              .click('span[title="compass-test.bands"]')
              .waitForVisible('div.schema-field-list')
              .getTitle().should.eventually.be.equal(
                'MongoDB Compass - Schema - localhost:27018/compass-test.bands'
              );
          });

          it('displays the documents in the collection', function() {
            return this.app.client
              .gotoSchemaWindow({ port: 27018 })
              .waitForVisible('span[title="compass-test.bands"]')
              .click('span[title="compass-test.bands"]')
              .waitForVisible('div.schema-field-list')
              .getTitle().should.eventually.be.equal(
                'MongoDB Compass - Schema - localhost:27018/compass-test.bands'
              );
          });

          context('when the schema contains nested documents', function() {
            it('allows expanding the nested content');
          });
        });
      });
    });
  });
}
