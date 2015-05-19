var assert = require('assert'),
  helpers = require('./helpers');

describe('Instance', function() {
  before(helpers.before);
  after(helpers.after);
  it('should return details', function(done) {
    helpers.client.instance(function(err, res) {
      assert.ifError(err);
      assert(Array.isArray(res.databases));
      done();
    });
  });
  it.skip('should return a full fetch of top', function(done) {
    helpers.client.top(function(err, res) {
      assert.ifError(err);
      assert(Array.isArray(res.namespaces));
      done();
    });
  });
  it.skip('should return some logs', function(done) {
    helpers.client.log(function(err, res) {
      assert.ifError(err);

      assert(Array.isArray(res));
      done();
    });
  });
  it('should have the instance in the deployment list', function(done) {
    helpers.client.deployments(function(err, res) {
      assert.ifError(err);
      assert(Array.isArray(res), 'Deployments list should be an array');
      assert(res.length > 0, 'no deployments? ' + JSON.stringify(res));
      done();
    });
  });
});
