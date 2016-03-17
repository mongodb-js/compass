var helpers = require('./helpers');

describe('Schema Window #spectron', function() {
  this.slow(10000);
  this.timeout(30000);

  before(helpers.startApplication);
  after(helpers.stopApplication);

  context('when databases exist', function() {
    context('when collections exist', function() {
      before(require('mongodb-runner/mocha/before')({ port: 27018 }));
      after(require('mongodb-runner/mocha/after')());

      context('when selecting a collection', function() {
        before(function(done) {
          helpers.insertTestDocuments(done);
        });

        after(function(done) {
          helpers.removeTestDocuments(done);
        });

        it('renders the sample collection in the title', function() {
          return this.app.client
            .gotoSchemaWindow({ port: 27018 }, 30000)
            .startUsingCompass()
            .selectCollection('compass-test.bands')
            .getTitle().should.eventually.be.equal(
            'MongoDB Compass - Schema - localhost:27018/compass-test.bands'
          );
        });

        it('displays the schema sample for the collection', function() {
          return this.app.client
            .getText('div#document_count').should.eventually.be.equal('4')
            .getText('div#index_count').should.eventually.be.equal('1');
        });

        context('when selecting the sampled documents', function() {
          it('displays the documents in the sidebar', function() {
            return this.app.client
              .viewSampleDocuments()
              .getText('div#sample_documents ol.document-list li.string div.document-property-key')
              .should.eventually.exist;
          });
        });

        context('when refining the sample', function() {
          it('displays the matching documents', function() {
            return this.app.client
              .refineSample('{ "name":"Arca" }')
              .waitForStatusBar()
              .getText('div.sampling-message b').should.eventually.be.equal('1');
          });
        });

        context('when resetting a sample refinement', function() {
          it('resets the sample to the original', function() {
            return this.app.client
              .resetSample()
              .waitForStatusBar()
              .getText('div.sampling-message b').should.eventually.be.equal('4');
          });
        });
      });
    });
  });
});
