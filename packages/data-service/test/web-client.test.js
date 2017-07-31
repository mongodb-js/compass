var helper = require('./helper');

var expect = helper.expect;

var WebClient = require('../lib/web-client');

/**
 * @note: Durran: Skipped for now until we find a better way to automate this on Travis.
 */
describe('WebClient', function() {
  this.slow(10000);
  this.timeout(20000);
  let userId;
  var client = new WebClient(helper.stitchConnection);

  describe.skip('#connect', function() {
    it('yields a Stitch Client', function(done) {
      client.connect(function(error, stitchClient) {
        expect(error).to.equal(null);
        expect(stitchClient.authedId()).to.not.equal(undefined);
        userId = stitchClient.authedId();
        done();
      });
    });
  });

  describe.skip('#insertOne', function() {
    after(function(done) {
      client.deleteOne('data-service.test', { owner_id: userId }, {}, function() {
        done();
      });
    });

    it('inserts the document into the collection', function(done) {
      client.insertOne('data-service.test', { owner_id: userId, a: 1 }, {}, function(error, result) {
        expect(error).to.equal(null);
        expect(result.insertedIds).to.have.length(1);
        done();
      });
    });
  });

  describe.skip('#count', function() {
    before(function(done) {
      client.insertOne('data-service.test', { owner_id: userId, a: 1 }, {}, function() {
        done();
      });
    });

    after(function(done) {
      client.deleteOne('data-service.test', { owner_id: userId }, {}, function() {
        done();
      });
    });

    it('yields the error and the count', function(done) {
      client.count('data-service.test', { owner_id: userId }, {}, function(error, count) {
        expect(error).to.equal(null);
        expect(count).to.equal(1);
        done();
      });
    });
  });

  describe.skip('#find', function() {
    before(function(done) {
      client.insertOne('data-service.test', { owner_id: userId, a: 1 }, {}, function() {
        done();
      });
    });

    after(function(done) {
      client.deleteOne('data-service.test', { owner_id: userId }, {}, function() {
        done();
      });
    });

    it('yields the error and the results to the callback', function(done) {
      client.find('data-service.test', { owner_id: userId }, {}, function(error, results) {
        expect(error).to.equal(null);
        expect(results.length).to.equal(1);
        done();
      });
    });
  });

  describe.skip('#aggregate', function() {
    before(function(done) {
      client.insertOne('data-service.test', { owner_id: userId, a: 1 }, {}, function() {
        done();
      });
    });

    after(function(done) {
      client.deleteOne('data-service.test', { owner_id: userId }, {}, function() {
        done();
      });
    });

    it('yields the error and the results to the callback', function(done) {
      client.aggregate('data-service.test', [{ '$match': { owner_id: userId, a: 1 }}], {}, function(error, results) {
        expect(error).to.equal(null);
        expect(results.length).to.equal(1);
        done();
      });
    });
  });
});
